import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, MockAccount, saveStoreToDisk } from "@/lib/mock-store";
import { getStateJsonPath } from "@/lib/playwright/browser-session";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);
    const body = await request.json();
    const { platform = "THREADS", username = "", sessionId = "" } = body;

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun wajib diisi." }, { status: 400 });
    }

    if (!sessionId.trim()) {
      return NextResponse.json({ error: "Session ID / Cookie wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const cleanSessionId = sessionId.trim().replace(/^sessionid=/, "");
    const statePath = getStateJsonPath(platform, cleanUsername);

    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const oneYearLater = nowSeconds + 365 * 24 * 3600;

    const cookies = [
      {
        name: "sessionid",
        value: cleanSessionId,
        domain: ".threads.net",
        path: "/",
        expires: oneYearLater,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      },
      {
        name: "sessionid",
        value: cleanSessionId,
        domain: ".threads.com",
        path: "/",
        expires: oneYearLater,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      },
      {
        name: "sessionid",
        value: cleanSessionId,
        domain: ".instagram.com",
        path: "/",
        expires: oneYearLater,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      },
    ];

    const storageData = {
      cookies,
      origins: [
        {
          origin: "https://www.threads.com",
          localStorage: [
            { name: "hb_timestamp", value: String(Date.now()) },
          ],
        },
      ],
    };

    fs.writeFileSync(statePath, JSON.stringify(storageData, null, 2));

    // Also write login_status.json for consistency
    const statusPath = path.join(dir, "login_status.json");
    fs.writeFileSync(
      statusPath,
      JSON.stringify(
        {
          state: "success",
          message: `Sesi login aktif untuk @${cleanUsername}`,
          timestamp: new Date().toISOString(),
          username: cleanUsername,
        },
        null,
        2
      )
    );

    // Register / update account in mockStore
    const existing = mockStore.accounts.find(
      (a) =>
        a.platform === platform &&
        a.username.toLowerCase() === cleanUsername.toLowerCase() &&
        (userCtx.isAdmin || (a.userId || "usr_admin_kenzie") === userCtx.userId)
    );

    if (!existing) {
      const newAcc: MockAccount = {
        id: `acc_browser_${nanoid(6)}`,
        userId: userCtx.userId,
        platform: platform,
        accountName: `@${cleanUsername}`,
        username: cleanUsername,
        accessToken: "browser_session_auth",
        status: "ACTIVE",
        _count: { posts: 0 },
        createdAt: new Date(),
      };
      mockStore.accounts.unshift(newAcc);
    } else {
      existing.status = "ACTIVE";
    }
    saveStoreToDisk();

    return NextResponse.json({
      success: true,
      message: `✅ Sesi cookie untuk @${cleanUsername} berhasil disimpan dan akun langsung aktif!`,
    });
  } catch (error: any) {
    console.error("[Save Cookie Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan cookie sesi." },
      { status: 500 }
    );
  }
}
