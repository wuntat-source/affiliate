import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
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

    // Use Windows `start` command to spawn a NEW visible window on the user's desktop
    const cmd = `start "Threads Login" cmd /c "node "${scriptPath}" ${cleanUsername} ${platform}"`;

    exec(cmd, { cwd: process.cwd(), shell: "cmd.exe" }, (error) => {
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
