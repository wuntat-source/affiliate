import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/server-auth";
import { mockStore, saveStoreToDisk } from "@/lib/mock-store";

/** Update postingan (edit konten/jadwal) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userCtx = getUserContext(request);
    const body = await request.json();
    const { mainContent, replyContent, scheduledAt, status } = body;

    // Coba update di database dulu
    try {
      const existing = await prisma.post.findUnique({ where: { id } });
      if (existing) {
        if (!userCtx.isAdmin && existing.userId && existing.userId !== userCtx.userId) {
          return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
        }
        if (existing.status === "PUBLISHED") {
          return NextResponse.json(
            { error: "Postingan yang sudah terbit tidak bisa diedit." },
            { status: 400 }
          );
        }

        const data: any = {};
        if (mainContent !== undefined) data.mainContent = mainContent;
        if (replyContent !== undefined) data.replyContent = replyContent || null;
        if (scheduledAt !== undefined) {
          data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
          if (!status) data.status = scheduledAt ? "SCHEDULED" : "DRAFT";
        }
        if (status && ["DRAFT", "SCHEDULED"].includes(status)) data.status = status;

        const updated = await prisma.post.update({
          where: { id },
          data,
          include: { account: true, product: true },
        });
        return NextResponse.json({ success: true, data: updated });
      }
    } catch (e) {
      // Lanjut ke mockStore jika DB gagal
    }

    // Fallback: update di mockStore
    // PENTING: mockStore.posts adalah getter yang baca dari disk setiap diakses
    const posts = mockStore.posts;
    const mockPost = posts.find((p) => p.id === id);
    if (!mockPost) {
      return NextResponse.json({ error: "Postingan tidak ditemukan." }, { status: 404 });
    }
    if (!userCtx.isAdmin && mockPost.userId && mockPost.userId !== userCtx.userId) {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    if (mockPost.status === "PUBLISHED") {
      return NextResponse.json(
        { error: "Postingan yang sudah terbit tidak bisa diedit." },
        { status: 400 }
      );
    }
    if (mainContent !== undefined) mockPost.mainContent = mainContent;
    if (replyContent !== undefined) mockPost.replyContent = replyContent || "";
    if (scheduledAt !== undefined) {
      mockPost.scheduledAt = scheduledAt || undefined;
      if (!status) mockPost.status = scheduledAt ? "SCHEDULED" : "DRAFT";
    }
    if (status && ["DRAFT", "SCHEDULED"].includes(status)) mockPost.status = status as any;
    saveStoreToDisk({ posts });

    return NextResponse.json({ success: true, data: mockPost });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengupdate postingan." },
      { status: 500 }
    );
  }
}

/** Hapus postingan dari antrean */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userCtx = getUserContext(request);

    // Coba hapus dari database dulu
    try {
      const existing = await prisma.post.findUnique({ where: { id } });
      if (existing) {
        if (!userCtx.isAdmin && existing.userId && existing.userId !== userCtx.userId) {
          return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
        }
        await prisma.post.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Postingan dihapus dari antrean." });
      }
    } catch (e) {
      // Lanjut ke mockStore jika DB gagal
    }

    // Fallback: hapus dari mockStore
    // PENTING: mockStore.posts adalah getter yang baca dari disk setiap diakses,
    // jadi harus simpan ke variabel dulu agar splice tersimpan
    const posts = mockStore.posts;
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Postingan tidak ditemukan." }, { status: 404 });
    }
    const mockPost = posts[idx];
    if (!userCtx.isAdmin && mockPost.userId && mockPost.userId !== userCtx.userId) {
      return NextResponse.json({ error: "Tidak punya akses." }, { status: 403 });
    }
    posts.splice(idx, 1);
    saveStoreToDisk({ posts });

    return NextResponse.json({ success: true, message: "Postingan dihapus dari antrean." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal menghapus postingan." },
      { status: 500 }
    );
  }
}
