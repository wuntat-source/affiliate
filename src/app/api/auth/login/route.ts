import { NextRequest, NextResponse } from "next/server";
import { SystemUser } from "@/app/api/users/route";

const globalUsers = globalThis as unknown as {
  __systemUsers?: SystemUser[];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const users = globalUsers.__systemUsers || [
      {
        id: "usr_admin_kenzie",
        username: "kenzieganteng",
        password: "AmeeraKenzie190613",
        name: "Kenzie Ganteng",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
    ];

    const matched = users.find(
      (u) =>
        u.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        u.password.trim() === password.trim()
    );

    if (matched) {
      return NextResponse.json({
        success: true,
        user: {
          id: matched.id,
          username: matched.username,
          name: matched.name,
          role: matched.role,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Username atau password salah. Silakan periksa kembali." },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan autentikasi." },
      { status: 500 }
    );
  }
}
