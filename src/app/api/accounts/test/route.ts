import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { checkLoginStatus } from "@/lib/playwright/browser-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, username, platform } = body;

    let targetPlatform = platform || "THREADS";
    let targetUsername = username || "";

    if (accountId) {
      try {
        const acc = await prisma.account.findUnique({ where: { id: accountId } });
        if (acc) {
          targetPlatform = acc.platform;
          targetUsername = acc.username;
        }
      } catch {
        const mockAcc = mockStore.accounts.find((a) => a.id === accountId);
        if (mockAcc) {
          targetPlatform = mockAcc.platform;
          targetUsername = mockAcc.username;
        }
      }
    }

    if (targetPlatform === "THREADS") {
      if (!targetUsername) {
        return NextResponse.json({
          success: false,
          error: "Username Threads diperlukan untuk memeriksa status sesi browser.",
        });
      }

      const status = await checkLoginStatus("THREADS", targetUsername);
      if (status.loggedIn) {
        return NextResponse.json({
          success: true,
          mode: "BROWSER_AUTOMATION",
          username: targetUsername,
          message: `✅ Sesi browser Chromium untuk @${targetUsername} AKTIF dan siap auto-posting!`,
        });
      } else {
        return NextResponse.json({
          success: false,
          mode: "BROWSER_AUTOMATION",
          error: `⚠️ Sesi browser untuk @${targetUsername} belum login atau telah berakhir. Silakan klik tombol 'Buka Browser Login Threads' di atas untuk login.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: "SANDBOX",
      message: `🟢 Akun ${targetPlatform} (@${targetUsername || "user"}) siap digunakan (Sandbox Mode).`,
    });
  } catch (error: any) {
    console.error("[Account Test Connection Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan tes sesi browser." },
      { status: 500 }
    );
  }
}
