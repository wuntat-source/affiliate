import { NextRequest, NextResponse } from "next/server";
import { verifyAndSaveSession } from "@/lib/playwright/browser-session";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);
    const { searchParams } = new URL(request.url);
    const platform = (searchParams.get("platform") || "THREADS") as "THREADS" | "TWITTER";
    const username = (searchParams.get("username") || "").trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
    }

    const result = await verifyAndSaveSession(platform, username);

    if (result.loggedIn) {
      // Auto-save / link account in store
      const existing = mockStore.accounts.find(
        (a) => a.platform === platform && a.username.toLowerCase() === username.toLowerCase()
      );

      if (!existing) {
        const newAcc: MockAccount = {
          id: `acc_browser_${nanoid(6)}`,
          userId: userCtx.userId,
          platform: platform,
          accountName: `@${username} (Browser Session)`,
          username: username,
          accessToken: "browser_session_auth",
          status: "ACTIVE",
          _count: { posts: 0 },
          createdAt: new Date(),
        };
        mockStore.accounts.unshift(newAcc);
      } else {
        existing.status = "ACTIVE";
      }
    }

    return NextResponse.json({
      success: true,
      loggedIn: result.loggedIn,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Browser Status API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memeriksa status sesi browser" },
      { status: 500 }
    );
  }
}
