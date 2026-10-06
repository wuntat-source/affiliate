import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "MEMBER";
  createdAt: string;
}

const DB_PATH = path.resolve(process.cwd(), ".sessions/database.json");

const DEFAULT_USERS: SystemUser[] = [
  {
    id: "usr_admin_kenzie",
    username: "kenzieganteng",
    password: "AmeeraKenzie190613",
    name: "Kenzie Ganteng",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_member_hafidi",
    username: "hafidi",
    password: "semogaberkah",
    name: "Hafidi",
    role: "MEMBER",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr_member_beruang",
    username: "Beruangmadu",
    password: "Beruang4321_",
    name: "Beruang Madu",
    role: "MEMBER",
    createdAt: new Date().toISOString(),
  },
];

export function loadUsersFromDisk(): SystemUser[] {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      if (Array.isArray(raw.users) && raw.users.length > 0) {
        // Ensure hafidi is present
        const hasHafidi = raw.users.some(
          (u: SystemUser) => u.username.toLowerCase() === "hafidi"
        );
        if (!hasHafidi) {
          raw.users.push({
            id: "usr_member_hafidi",
            username: "hafidi",
            password: "semogaberkah",
            name: "Hafidi",
            role: "MEMBER",
            createdAt: new Date().toISOString(),
          });
          saveUsersToDisk(raw.users);
        }
        return raw.users;
      }
    } catch {}
  }
  saveUsersToDisk(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveUsersToDisk(users: SystemUser[]) {
  try {
    let raw: any = {};
    if (fs.existsSync(DB_PATH)) {
      try {
        raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      } catch {}
    }
    raw.users = users;
    fs.writeFileSync(DB_PATH, JSON.stringify(raw, null, 2));
  } catch (e) {
    console.error("[Users Save Error]:", e);
  }
}

// Global in-memory user list
const globalUsers = globalThis as unknown as {
  __systemUsers?: SystemUser[];
};

if (!globalUsers.__systemUsers || globalUsers.__systemUsers.length === 0) {
  globalUsers.__systemUsers = loadUsersFromDisk();
}

export async function GET() {
  try {
    const users = loadUsersFromDisk();
    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    if (!globalUsers.__systemUsers) {
      globalUsers.__systemUsers = loadUsersFromDisk();
    }

    // Check duplicate username
    const exists = globalUsers.__systemUsers.some(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (exists) {
      return NextResponse.json(
        { error: `Username '${trimmedUsername}' sudah digunakan. Silakan gunakan username lain.` },
        { status: 400 }
      );
    }

    const newUser: SystemUser = {
      id: `usr_${nanoid(8)}`,
      username: trimmedUsername,
      password: password.trim(),
      name: (name || trimmedUsername).trim(),
      role: role || "MEMBER",
      createdAt: new Date().toISOString(),
    };

    globalUsers.__systemUsers.push(newUser);
    saveUsersToDisk(globalUsers.__systemUsers);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "User baru berhasil ditambahkan!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, name, role } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan." }, { status: 400 });
    }

    if (!globalUsers.__systemUsers) {
      globalUsers.__systemUsers = loadUsersFromDisk();
    }

    const userIndex = globalUsers.__systemUsers.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    const current = globalUsers.__systemUsers[userIndex];

    // Check duplicate username if changed
    if (username && username.trim().toLowerCase() !== current.username.toLowerCase()) {
      const exists = globalUsers.__systemUsers.some(
        (u) => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) {
        return NextResponse.json(
          { error: `Username '${username.trim()}' sudah digunakan oleh user lain.` },
          { status: 400 }
        );
      }
      current.username = username.trim();
    }

    if (name) current.name = name.trim();
    if (password && password.trim()) current.password = password.trim();
    if (role) current.role = role;

    saveUsersToDisk(globalUsers.__systemUsers);

    return NextResponse.json({
      success: true,
      data: current,
      message: "Data user berhasil diperbarui!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan." }, { status: 400 });
    }

    if (!globalUsers.__systemUsers) {
      globalUsers.__systemUsers = loadUsersFromDisk();
    }

    if (globalUsers.__systemUsers.length <= 1) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus satu-satunya user yang tersisa di sistem!" },
        { status: 400 }
      );
    }

    globalUsers.__systemUsers = globalUsers.__systemUsers.filter((u) => u.id !== id);
    saveUsersToDisk(globalUsers.__systemUsers);

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus dari sistem.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
