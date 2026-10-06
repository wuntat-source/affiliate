import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, saveStoreToDisk } from "@/lib/mock-store";
import { saveUsersToDisk } from "@/app/api/users/route";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), ".sessions/database.json");

export async function POST(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    if (!userCtx.isAdmin && userCtx.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya ADMIN yang memiliki izin untuk me-restore database." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "File backup tidak valid (bukan format JSON yang benar)." },
        { status: 400 }
      );
    }

    const { products, links, accounts, posts, users } = body;

    let restoredProductsCount = 0;
    let restoredLinksCount = 0;
    let restoredAccountsCount = 0;
    let restoredPostsCount = 0;
    let restoredUsersCount = 0;

    if (Array.isArray(products)) {
      mockStore.products = products;
      restoredProductsCount = products.length;
    }

    if (Array.isArray(links)) {
      mockStore.links = links;
      restoredLinksCount = links.length;
    }

    if (Array.isArray(accounts)) {
      mockStore.accounts = accounts;
      restoredAccountsCount = accounts.length;
    }

    if (Array.isArray(posts)) {
      mockStore.posts = posts;
      restoredPostsCount = posts.length;
    }

    if (Array.isArray(users) && users.length > 0) {
      saveUsersToDisk(users);
      restoredUsersCount = users.length;
    }

    saveStoreToDisk();

    return NextResponse.json({
      success: true,
      message: "Database berhasil di-restore dengan sukses!",
      stats: {
        products: restoredProductsCount,
        links: restoredLinksCount,
        accounts: restoredAccountsCount,
        posts: restoredPostsCount,
        users: restoredUsersCount,
      },
    });
  } catch (error: any) {
    console.error("[Database Restore Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal melakukan restore database." },
      { status: 500 }
    );
  }
}
