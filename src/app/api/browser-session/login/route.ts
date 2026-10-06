import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform = "THREADS", username = "" } = body;

    if (!username.trim()) {
      return NextResponse.json({ error: "Username akun wajib diisi." }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");
    const scriptPath = path.resolve(process.cwd(), "scripts", "login-browser-auto.mjs");

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: "Script login-browser-auto.mjs tidak ditemukan." }, { status: 500 });
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
      message: "Jendela browser sedang dibuka di layar komputer Anda. Silakan login ke Threads di jendela yang muncul.",
    });
  } catch (error: any) {
    console.error("[Browser Login API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuka jendela browser." },
      { status: 500 }
    );
  }
}
