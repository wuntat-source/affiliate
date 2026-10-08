import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { getStateJsonPath } from "@/lib/playwright/browser-session";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);
    const body = await request.json();
    const { platform = "THREADS", username = "", sessionId = "", cookieString = "" } = body;

    const rawInput = (sessionId || cookieString || "").trim();

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun Threads wajib diisi." }, { status: 400 });
    }

    if (!rawInput) {
      return NextResponse.json({ error: "Nilai cookie / sessionid wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const statePath = getStateJsonPath(platform, cleanUsername);

    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Extract sessionid, ds_user_id, csrftoken from any string format
    let cleanSessionId = rawInput;
    let dsUserId = "";
    let csrfToken = "";

    // If pasted full cookie header (e.g. sessionid=...; ds_user_id=...)
    if (rawInput.includes("=") || rawInput.includes(";")) {
      const parts = rawInput.split(";");
      for (const part of parts) {
        const [k, ...v] = part.trim().split("=");
        const val = v.join("=");
        if (k.toLowerCase() === "sessionid") cleanSessionId = decodeURIComponent(val);
        if (k.toLowerCase() === "ds_user_id") dsUserId = decodeURIComponent(val);
        if (k.toLowerCase() === "csrftoken") csrfToken = decodeURIComponent(val);
      }
    }

    cleanSessionId = cleanSessionId.replace(/^sessionid=/i, "").trim();

    const nowSeconds = Math.floor(Date.now() / 1000);
    const oneYearLater = nowSeconds + 365 * 24 * 3600;

    const domains = [".threads.net", ".threads.com", ".instagram.com"];
    const cookies: any[] = [];

    for (const dom of domains) {
      cookies.push({
        name: "sessionid",
        value: cleanSessionId,
        domain: dom,
        path: "/",
        expires: oneYearLater,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      if (dsUserId) {
        cookies.push({
          name: "ds_user_id",
          value: dsUserId,
          domain: dom,
          path: "/",
          expires: oneYearLater,
          httpOnly: false,
          secure: true,
          sameSite: "None",
        });
      }

      if (csrfToken) {
        cookies.push({
          name: "csrftoken",
          value: csrfToken,
          domain: dom,
          path: "/",
          expires: oneYearLater,
          httpOnly: false,
          secure: true,
          sameSite: "None",
        });
      }
    }

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

    // Write login status
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

    // Simpan ke database PostgreSQL
    const platformEnum = platform.toUpperCase() === "TWITTER" ? "TWITTER" : "THREADS";
    await prisma.account.upsert({
      where: {
        platform_username: {
          platform: platformEnum as any,
          username: cleanUsername,
        },
      },
      update: {
        userId: userCtx.userId,
        status: "ACTIVE",
        accessToken: "browser_session_auth",
        accountName: `@${cleanUsername}`,
      },
      create: {
        userId: userCtx.userId,
        platform: platformEnum as any,
        accountName: `@${cleanUsername}`,
        username: cleanUsername,
        accessToken: "browser_session_auth",
        status: "ACTIVE",
      },
    });

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
