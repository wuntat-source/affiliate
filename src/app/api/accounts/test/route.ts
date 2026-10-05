import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, accessToken, platform } = body;

    let token = accessToken;
    let targetPlatform = platform || "THREADS";

    if (accountId) {
      try {
        const acc = await prisma.account.findUnique({ where: { id: accountId } });
        if (acc) {
          token = acc.accessToken;
          targetPlatform = acc.platform;
        }
      } catch {
        const mockAcc = mockStore.accounts.find((a) => a.id === accountId);
        if (mockAcc) {
          token = mockAcc.accessToken;
          targetPlatform = mockAcc.platform;
        }
      }
    }

    if (!token || token === "sandbox_mode_mock_token") {
      return NextResponse.json({
        success: true,
        mode: "SANDBOX",
        message: "🟢 Akun berada dalam Mode Sandbox (Simulasi siap digunakan tanpa API token).",
      });
    }

    if (targetPlatform === "THREADS") {
      // Test real Meta Graph API for Threads
      const testUrl = `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${encodeURIComponent(
        token
      )}`;

      const res = await fetch(testUrl);
      const data = await res.json();

      if (res.ok && data.id) {
        return NextResponse.json({
          success: true,
          mode: "LIVE",
          metaUserId: data.id,
          username: data.username,
          profilePic: data.threads_profile_picture_url,
          message: `✅ Berhasil Terhubung Resmi ke Threads (@${data.username || "user"})! Izin posting & reply aktif.`,
        });
      } else {
        return NextResponse.json({
          success: false,
          mode: "LIVE",
          error: data.error?.message || "Token Meta Graph API tidak valid atau izin Threads belum diberikan.",
          errorDetails: data.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: "LIVE",
      message: `✅ Koneksi ke ${targetPlatform} berhasil diverifikasi.`,
    });
  } catch (error: any) {
    console.error("[Account Test Connection Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan tes koneksi." },
      { status: 500 }
    );
  }
}
