import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, saveStoreToDisk } from "@/lib/mock-store";

/**
 * Cron endpoint: publish semua postingan SCHEDULED yang sudah waktunya.
 * Dipanggil tiap menit via systemd timer.
 * Tidak butuh auth (dijalankan internal), tapi cek header rahasia sederhana.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: { id: string; status: string; error?: string }[] = [];

  // 1. Cek database
  try {
    const duePosts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      include: { account: true },
    });

    for (const post of duePosts) {
      try {
        const res = await fetch(
          `http://127.0.0.1:3000/api/posts/${post.id}/publish`,
          {
            method: "POST",
            headers: {
              "x-user-id": post.userId || "system",
              "x-user-role": "ADMIN",
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        results.push({
          id: post.id,
          status: data.success ? "PUBLISHED" : "FAILED",
          error: data.error,
        });
      } catch (e: any) {
        results.push({ id: post.id, status: "ERROR", error: e.message });
      }
    }
  } catch (e: any) {
    console.warn("[cron] DB check gagal:", e.message);
  }

  // 2. Cek mockStore
  try {
    const posts = mockStore.posts;
    let changed = false;
    for (const post of posts) {
      if (
        post.status === "SCHEDULED" &&
        post.scheduledAt &&
        new Date(post.scheduledAt) <= now
      ) {
        try {
          const res = await fetch(
            `http://127.0.0.1:3000/api/posts/${post.id}/publish`,
            {
              method: "POST",
              headers: {
                "x-user-id": post.userId || "system",
                "x-user-role": "ADMIN",
                "Content-Type": "application/json",
              },
            }
          );
          const data = await res.json();
          results.push({
            id: post.id,
            status: data.success ? "PUBLISHED" : "FAILED",
            error: data.error,
          });
        } catch (e: any) {
          results.push({ id: post.id, status: "ERROR", error: e.message });
        }
        changed = true;
      }
    }
    if (changed) saveStoreToDisk({ posts });
  } catch (e: any) {
    console.warn("[cron] mockStore check gagal:", e.message);
  }

  return NextResponse.json({
    success: true,
    checkedAt: now.toISOString(),
    processed: results.length,
    results,
  });
}
