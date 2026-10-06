import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { mockStore } from "@/lib/mock-store";
import { loadUsersFromDisk } from "@/app/api/users/route";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), ".sessions/database.json");

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    if (!userCtx.isAdmin && userCtx.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya ADMIN yang memiliki izin untuk mendownload backup database." },
        { status: 403 }
      );
    }

    let databaseData: any = {
      version: "1.0.0",
      backupDate: new Date().toISOString(),
      backedUpBy: userCtx.username,
      products: mockStore.products,
      links: mockStore.links,
      accounts: mockStore.accounts,
      posts: mockStore.posts,
      users: loadUsersFromDisk(),
    };

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
        databaseData = {
          version: "1.0.0",
          backupDate: new Date().toISOString(),
          backedUpBy: userCtx.username,
          products: raw.products || mockStore.products,
          links: raw.links || mockStore.links,
          accounts: raw.accounts || mockStore.accounts,
          posts: raw.posts || mockStore.posts,
          users: raw.users || loadUsersFromDisk(),
        };
      } catch {}
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `affiliatepost-backup-${timestamp}.json`;

    return new NextResponse(JSON.stringify(databaseData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("[Database Backup Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat backup database." },
      { status: 500 }
    );
  }
}
