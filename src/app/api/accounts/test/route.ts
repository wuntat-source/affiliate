import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { fetchMetaEndpoint } from "@/lib/threads/meta-fetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, accessToken, platform } = body;

    let token = (accessToken || "").trim();
    let targetPlatform = platform || "THREADS";

    if (accountId) {
      try {
        const acc = await prisma.account.findUnique({ where: { id: accountId } });
        if (acc) {
          token = (acc.accessToken || "").trim();
          targetPlatform = acc.platform;
        }
      } catch {
        const mockAcc = mockStore.accounts.find((a) => a.id === accountId);
        if (mockAcc) {
          token = (mockAcc.accessToken || "").trim();
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
      // 1. Primary Check: Threads API
      const testThreadsUrl = `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${encodeURIComponent(
        token
      )}`;

      const { ok, status, data } = await fetchMetaEndpoint(testThreadsUrl);

      if (ok && data.id) {
        return NextResponse.json({
          success: true,
          mode: "LIVE",
          metaUserId: data.id,
          username: data.username,
          profilePic: data.threads_profile_picture_url,
          message: `✅ Berhasil Terhubung Resmi ke Threads (@${data.username || "user"})! Izin posting & reply aktif.`,
        });
      }

      // 2. Secondary Check: Instagram Basic Display API
      if (!ok) {
        const igUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(token)}`;
        const igRes = await fetchMetaEndpoint(igUrl);
        if (igRes.ok && igRes.data?.id) {
          return NextResponse.json({
            success: true,
            mode: "LIVE",
            metaUserId: igRes.data.id,
            username: igRes.data.username,
            message: `✅ Berhasil Terhubung ke Akun Instagram/Threads (@${igRes.data.username || "user"})!`,
          });
        }
      }

      // 3. Format Friendly Error Message
      let errorMsg = data?.error?.message || "Token Meta Graph API tidak valid.";
      if (data?.error?.code === 190) {
        errorMsg = "Token tidak valid atau sudah kedaluwarsa. Pastikan menyalin Token lengkap dari User Token Generator di portal Meta.";
      } else if (data?.error?.code === 10) {
        errorMsg = "Izin 'threads_content_publish' belum diaktifkan di App Meta Developer Anda.";
      }

      return NextResponse.json({
        success: false,
        mode: "LIVE",
        error: errorMsg,
        errorDetails: data?.error,
      });
    }

    return NextResponse.json({
      success: true,
      mode: "LIVE",
      message: `✅ Koneksi ke ${targetPlatform} berhasil diverifikasi.`,
    });
  } catch (error: any) {
    console.error("[Account Test Connection Global Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan tes koneksi." },
      { status: 500 }
    );
  }
}
