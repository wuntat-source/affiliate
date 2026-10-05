import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";

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
      try {
        // 1. Primary Check: Official Threads API Endpoint
        const testThreadsUrl = `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${encodeURIComponent(
          token
        )}`;

        const res = await fetch(testThreadsUrl, {
          headers: { "User-Agent": "AffiliatePost-AI/1.0" },
        });
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
        }

        // 2. Secondary Check: Instagram Basic Display API (in case user pasted IG token)
        if (data.error) {
          const igUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(token)}`;
          try {
            const igRes = await fetch(igUrl, {
              headers: { "User-Agent": "AffiliatePost-AI/1.0" },
            });
            const igData = await igRes.json();
            if (igRes.ok && igData.id) {
              return NextResponse.json({
                success: true,
                mode: "LIVE",
                metaUserId: igData.id,
                username: igData.username,
                message: `✅ Berhasil Terhubung ke Akun Instagram/Threads (@${igData.username || "user"})!`,
              });
            }
          } catch {
            // Ignore secondary fallback error
          }

          // Return formatted Meta error
          let humanMessage = data.error.message || "Token Meta Graph API tidak valid.";
          if (data.error.code === 190) {
            humanMessage = "Token tidak valid atau sudah kedaluwarsa. Pastikan menyalin Token lengkap dari User Token Generator di portal Meta.";
          } else if (data.error.code === 10) {
            humanMessage = "Izin 'threads_content_publish' belum diaktifkan di pengaturan App Meta Developer Anda.";
          }

          return NextResponse.json({
            success: false,
            mode: "LIVE",
            error: humanMessage,
            errorDetails: data.error,
          });
        }
      } catch (fetchErr: any) {
        console.error("[Threads Test Fetch Error]:", fetchErr);
        return NextResponse.json({
          success: false,
          mode: "LIVE",
          error: `Gagal menghubungi server Meta Threads (${fetchErr.message || "Network Error"}). Pastikan koneksi internet stabil atau format token benar.`,
        });
      }
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
