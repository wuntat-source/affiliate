import { postThreadViaPlaywright } from "@/lib/playwright/browser-session";

export interface PublishPayload {
  accountId: string;
  platform: "THREADS" | "TWITTER" | "INSTAGRAM" | "TIKTOK" | "THREADS_BROWSER" | "TWITTER_BROWSER";
  accessToken: string;
  username?: string;
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
  const { platform, accessToken, username, mainContent, replyContent, isSandbox } = payload;

  // 1. Sandbox Mode Simulation
  if (isSandbox || accessToken === "sandbox_mode_mock_token") {
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

  // 2. Platform Adapters
  switch (platform) {
    case "THREADS":
    case "THREADS_BROWSER":
      return publishToThreads(payload);
    case "TWITTER":
    case "TWITTER_BROWSER":
      return publishToTwitter(payload);
    default:
      return {
        success: false,
        error: `Platform ${platform} publisher adapter is not yet configured.`,
      };
  }
}

/**
 * Threads Publisher (Direct Browser Automation via Playwright)
 * Posts directly without requiring Meta Developer API App or Tokens.
 */
async function publishToThreads(payload: PublishPayload): Promise<PublishResult> {
  const { username, mainContent, replyContent } = payload;

  if (!username) {
    return {
      success: false,
      error: "Username Threads diperlukan untuk browser automation.",
    };
  }

  // Parse multi-part replies if chained
  const replyParts = replyContent
    ? replyContent
        .split(/\n\s*---\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const result = await postThreadViaPlaywright({
    username,
    mainText: mainContent,
    replyParts,
    headless: true,
  });

  if (result.success) {
    return {
      success: true,
      externalMainId: `pw_threads_${Date.now()}`,
      externalReplyId: replyParts.length > 0 ? `pw_reply_${Date.now()}` : undefined,
      details: { engine: "playwright_browser", message: result.message },
    };
  }

  return {
    success: false,
    error: result.error || "Gagal memposting ke Threads via Browser Playwright.",
  };
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
