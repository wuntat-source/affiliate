import { Queue, Worker, Job } from "bullmq";
import { getRedisClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { publishPostToPlatform } from "@/lib/publisher/publisher";

export const PUBLISH_QUEUE_NAME = "publish-social-post";

let publishQueue: Queue | null = null;

export function getPublishQueue(): Queue | null {
  try {
    if (!publishQueue) {
      const redis = getRedisClient();
      publishQueue = new Queue(PUBLISH_QUEUE_NAME, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });
    }
    return publishQueue;
  } catch (err: any) {
    console.warn("[BullMQ] Failed to initialize publish queue:", err.message);
    return null;
  }
}

export async function schedulePostJob(postId: string, scheduledAt?: Date) {
  const queue = getPublishQueue();
  const delay = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;

  if (queue) {
    await queue.add(
      "publish-job",
      { postId },
      {
        delay,
        jobId: `post_${postId}`,
      }
    );
  }

  // Update status in database
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: delay > 0 ? "SCHEDULED" : "QUEUED",
      scheduledAt: scheduledAt || new Date(),
    },
  });
}

/**
 * Worker handler for publishing jobs
 */
export async function processPublishJob(job: Job<{ postId: string }>) {
  const { postId } = job.data;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      account: true,
      affiliateLink: true,
      media: { include: { mediaAsset: true } },
    },
  });

  if (!post) {
    throw new Error(`Post with ID ${postId} not found.`);
  }

  if (post.status === "PUBLISHED" || post.status === "CANCELLED") {
    return { skipped: true, reason: `Post is already ${post.status}` };
  }

  // Update status to processing
  await prisma.post.update({
    where: { id: postId },
    data: { status: "PROCESSING" },
  });

  // Log queued step
  await prisma.postLog.create({
    data: {
      postId,
      action: "PROCESSING",
      message: `Starting publication to ${post.account.platform} for account @${post.account.username}`,
    },
  });

  const mediaUrls = post.media.map((m) => m.mediaAsset.fileUrl);

  const result = await publishPostToPlatform({
    accountId: post.account.id,
    platform: post.account.platform as any,
    accessToken: post.account.accessToken,
    platformUserId: post.account.platformUserId || undefined,
    mainContent: post.mainContent,
    replyContent: post.replyContent || undefined,
    mediaUrls,
  });

  if (!result.success) {
    const nextRetry = post.retryCount + 1;
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: nextRetry >= post.maxRetries ? "FAILED" : "QUEUED",
        retryCount: nextRetry,
        lastError: result.error,
      },
    });

    await prisma.postLog.create({
      data: {
        postId,
        action: "FAILED",
        message: result.error || "Publication failed",
        details: result.details || {},
      },
    });

    throw new Error(result.error || "Publication failed");
  }

  // Success
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      externalMainId: result.externalMainId,
      externalReplyId: result.externalReplyId,
      platformPayload: result.details || {},
    },
  });

  // Init analytics record
  await prisma.postAnalytics.upsert({
    where: { postId },
    create: { postId },
    update: {},
  });

  await prisma.postLog.create({
    data: {
      postId,
      action: "SUCCESS",
      message: `Successfully published to ${post.account.platform}`,
      details: {
        externalMainId: result.externalMainId,
        externalReplyId: result.externalReplyId,
      },
    },
  });

  return result;
}
