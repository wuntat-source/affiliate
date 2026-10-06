import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, MockAccount } from "@/lib/mock-store";
import { nanoid } from "nanoid";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { platform = "THREADS", username = "" } = body;

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const scriptPath = path.resolve(process.cwd(), "scripts", "login-browser-auto.mjs");

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: "Script login-browser-auto.mjs tidak ditemukan." }, { status: 500 });
    }

    // Register account in mock store immediately if not exists
    const existing = mockStore.accounts.find(
      (a) => a.platform === platform && a.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!existing) {
      const newAcc: MockAccount = {
        id: `acc_browser_${nanoid(6)}`,
        userId: userCtx.userId,
        platform: platform,
        accountName: `@${cleanUsername} (Browser Session)`,
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

    // Launch visible cmd window on Windows
    const cmd = `start "Threads Login - @${cleanUsername}" cmd.exe /c node scripts\\login-browser-auto.mjs ${cleanUsername} ${platform}`;

    exec(cmd, { cwd: process.cwd() }, (error) => {
      if (error) {
        console.error("[Browser Login spawn error]:", error);
      }
    });

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      message: "Jendela browser sedang dibuka. Silakan login ke Threads di jendela Chrome/Edge yang muncul.",
    });
  } catch (error: any) {
    console.error("[Browser Login API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuka jendela browser." },
      { status: 500 }
    );
  }
}
