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

    const mainContainerRes = await fetch(mainContainerUrl, {
      method: "POST",
      body: mainContainerParams,
    });
    const mainContainerData = await mainContainerRes.json();

    if (!mainContainerRes.ok || !mainContainerData.id) {
      return {
        success: false,
        error: mainContainerData.error?.message || "Failed to create Threads main post container",
        details: mainContainerData,
      };
    }

    // 2. Publish Main Post
    const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish`;
    const publishParams = new URLSearchParams({
      creation_id: mainContainerData.id,
      access_token: accessToken,
    });

    const publishRes = await fetch(publishUrl, {
      method: "POST",
      body: publishParams,
    });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return {
        success: false,
        error: publishData.error?.message || "Failed to publish Threads main post",
        details: publishData,
      };
    }

    const publishedMainId = publishData.id;
    let publishedReplyId: string | undefined;

    // 3. Publish Reply Post (if exists)
    if (replyContent && replyContent.trim().length > 0) {
      // Create Reply Container
      const replyContainerParams = new URLSearchParams({
        media_type: "TEXT",
        text: replyContent,
        reply_to_id: publishedMainId,
        access_token: accessToken,
      });

      const replyContainerRes = await fetch(mainContainerUrl, {
        method: "POST",
        body: replyContainerParams,
      });
      const replyContainerData = await replyContainerRes.json();

      if (replyContainerRes.ok && replyContainerData.id) {
        // Publish Reply
        const publishReplyParams = new URLSearchParams({
          creation_id: replyContainerData.id,
          access_token: accessToken,
        });

        const publishReplyRes = await fetch(publishUrl, {
          method: "POST",
          body: publishReplyParams,
        });
        const publishReplyData = await publishReplyRes.json();

        if (publishReplyRes.ok && publishReplyData.id) {
          publishedReplyId = publishReplyData.id;
        }
      }
    }

    return {
      success: true,
      externalMainId: publishedMainId,
      externalReplyId: publishedReplyId,
      details: { platform: "THREADS", main: publishData },
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
    let replyTweetId: string | undefined;

    // Post Reply Tweet
    if (replyContent && replyContent.trim().length > 0) {
      const replyRes = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: replyContent,
          reply: { in_reply_to_tweet_id: mainTweetId },
        }),
      });

      const replyData = await replyRes.json();
      if (replyRes.ok && replyData.data?.id) {
        replyTweetId = replyData.data.id;
      }
    }

    return {
      success: true,
      externalMainId: mainTweetId,
      externalReplyId: replyTweetId,
      details: { platform: "TWITTER", tweetData },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unexpected error publishing to Twitter",
    };
  }
}
