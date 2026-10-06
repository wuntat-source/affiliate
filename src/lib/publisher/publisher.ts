export interface PublishPayload {
  accountId: string;
  platform: "THREADS" | "TWITTER" | "INSTAGRAM" | "TIKTOK";
  accessToken: string;
  platformUserId?: string;
  mainContent: string;
  replyContent?: string;
  mediaUrls?: string[];
  isSandbox?: boolean;
}

export interface PublishResult {
  success: boolean;
  externalMainId?: string;
  externalReplyId?: string;
  error?: string;
  details?: Record<string, any>;
}

export async function publishPostToPlatform(payload: PublishPayload): Promise<PublishResult> {
  const { platform, accessToken, mainContent, replyContent, isSandbox } = payload;

  // Sandbox Mode Simulation
  if (isSandbox || process.env.NODE_ENV === "development" && !accessToken) {
    console.log(`[Publisher Sandbox] Simulating post to ${platform}:`, {
      main: mainContent.slice(0, 60) + "...",
      reply: replyContent ? replyContent.slice(0, 60) + "..." : null,
    });

    const mockMainId = `mock_${platform.toLowerCase()}_${Date.now()}`;
    const mockReplyId = replyContent ? `mock_reply_${Date.now()}` : undefined;

    return {
      success: true,
      externalMainId: mockMainId,
      externalReplyId: mockReplyId,
      details: { mode: "sandbox", timestamp: new Date().toISOString() },
    };
  }

  switch (platform) {
    case "THREADS":
      return publishToThreads(payload);
    case "TWITTER":
      return publishToTwitter(payload);
    default:
      return {
        success: false,
        error: `Platform ${platform} publisher adapter is not yet configured.`,
      };
  }
}

import { postMetaEndpoint } from "@/lib/threads/meta-fetch";

/**
 * Threads API Publisher (Official Meta Graph API)
 * Flow:
 * 1. Create Threads Container for Main Post
 * 2. Publish Main Post
 * 3. Create Threads Container for Reply Post (with reply_to_id)
 * 4. Publish Reply Post
 */
async function publishToThreads(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, platformUserId, mainContent, replyContent } = payload;
  const userId = platformUserId || "me";

  try {
    // 1. Create Main Post Container
    const mainContainerUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    const mainContainerParams = new URLSearchParams({
      media_type: "TEXT",
      text: mainContent,
      access_token: accessToken,
    });

    const { ok: containerOk, data: mainContainerData } = await postMetaEndpoint(
      mainContainerUrl,
      mainContainerParams
    );

    if (!containerOk || !mainContainerData?.id) {
      return {
        success: false,
        error: mainContainerData?.error?.message || "Failed to create Threads main post container",
        details: mainContainerData,
      };
    }

    // 2. Publish Main Post
    const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mainContainerData.id,
      access_token: accessToken,
    });

    const { ok: publishOk, data: publishData } = await postMetaEndpoint(publishUrl, publishParams);

    if (!publishOk || !publishData?.id) {
      return {
        success: false,
        error: publishData?.error?.message || "Failed to publish Threads main post",
        details: publishData,
      };
    }

    const publishedMainId = publishData.id;
    let lastPublishedId = publishedMainId;
    let publishedReplyId: string | undefined;

    // 3. Publish Reply Post(s) in Sequence (Chained Thread)
    if (replyContent && replyContent.trim().length > 0) {
      // Split by multi-part delimiter or treat as single reply
      const replyParts = replyContent
        .split(/\n\s*---\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (let i = 0; i < replyParts.length; i++) {
        const partText = replyParts[i];
        if (!partText) continue;

        // Small delay between chained posts to respect platform rate limit
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 600));
        }

        const replyContainerParams = new URLSearchParams({
          media_type: "TEXT",
          text: partText,
          reply_to_id: lastPublishedId,
          access_token: accessToken,
        });

        const { ok: replyContainerOk, data: replyContainerData } = await postMetaEndpoint(
          mainContainerUrl,
          replyContainerParams
        );

        if (replyContainerOk && replyContainerData?.id) {
          const publishReplyParams = new URLSearchParams({
            creation_id: replyContainerData.id,
            access_token: accessToken,
          });

          const { ok: replyPublishOk, data: publishReplyData } = await postMetaEndpoint(
            publishUrl,
            publishReplyParams
          );

          if (replyPublishOk && publishReplyData?.id) {
            lastPublishedId = publishReplyData.id;
            if (!publishedReplyId) {
              publishedReplyId = publishReplyData.id;
            }
          }
        }
      }
    }

    return {
      success: true,
      externalMainId: publishedMainId,
      externalReplyId: publishedReplyId,
      details: { platform: "THREADS", main: publishData, lastId: lastPublishedId },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unexpected error publishing to Threads",
    };
  }
}

/**
 * Twitter/X API v2 Publisher
 */
async function publishToTwitter(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, mainContent, replyContent } = payload;

  try {
    // Post Main Tweet
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: mainContent }),
    });

    const tweetData = await tweetRes.json();
    if (!tweetRes.ok || !tweetData.data?.id) {
      return {
        success: false,
        error: tweetData.detail || tweetData.title || "Failed to post Tweet",
        details: tweetData,
      };
    }

    const mainTweetId = tweetData.data.id;
    let lastTweetId = mainTweetId;
    let firstReplyId: string | undefined;

    // Post Reply Tweet(s)
    if (replyContent && replyContent.trim().length > 0) {
      const replyParts = replyContent
        .split(/\n\s*---\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (let i = 0; i < replyParts.length; i++) {
        const partText = replyParts[i];
        if (!partText) continue;

        if (i > 0) {
          await new Promise((r) => setTimeout(r, 600));
        }

        const replyRes = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: partText,
            reply: { in_reply_to_tweet_id: lastTweetId },
          }),
        });

        const replyData = await replyRes.json();
        if (replyRes.ok && replyData.data?.id) {
          lastTweetId = replyData.data.id;
          if (!firstReplyId) {
            firstReplyId = replyData.data.id;
          }
        }
      }
    }

    return {
      success: true,
      externalMainId: mainTweetId,
      externalReplyId: firstReplyId,
      details: { platform: "TWITTER", tweetData },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unexpected error publishing to Twitter",
    };
  }
}
