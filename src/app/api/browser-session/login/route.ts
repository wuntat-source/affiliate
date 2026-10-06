import { NextRequest, NextResponse } from "next/server";
import { launchInteractiveLogin } from "@/lib/playwright/browser-session";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { platform = "THREADS", username = "my_threads_account" } = body;

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    // Launch visible interactive Chromium browser on this machine
    const result = await launchInteractiveLogin(platform as any, cleanUsername);

    if (result.success) {
      // Save or update account in account store
      const existing = mockStore.accounts.find(
        (a) => a.platform === `${platform}_BROWSER` && a.username === cleanUsername
      );

      if (!existing) {
        const newAcc: MockAccount = {
          id: `acc_browser_${nanoid(6)}`,
          userId: userCtx.userId,
          platform: `${platform}_BROWSER`,
          accountName: `@${cleanUsername} (Playwright Session)`,
          username: cleanUsername,
          accessToken: "playwright_browser_session",
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
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Browser Login API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menjalankan browser session" },
      { status: 500 }
    );
  }
}
