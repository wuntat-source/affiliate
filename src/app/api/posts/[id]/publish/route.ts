import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishPostToPlatform } from "@/lib/publisher/publisher";
import { mockStore } from "@/lib/mock-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          account: true,
          affiliateLink: true,
          media: { include: { mediaAsset: true } },
        },
      });

      if (post) {
        await prisma.post.update({
          where: { id },
          data: { status: "PROCESSING" },
        });

        const result = await publishPostToPlatform({
          accountId: post.account.id,
          platform: post.account.platform as any,
          accessToken: post.account.accessToken,
          username: post.account.username,
          platformUserId: post.account.platformUserId || undefined,
          mainContent: post.mainContent,
          replyContent: post.replyContent || undefined,
        });

        if (!result.success) {
          await prisma.post.update({
            where: { id },
            data: { status: "FAILED" },
          });
          return NextResponse.json({ success: false, error: result.error || "Gagal mempublikasikan postingan." }, { status: 400 });
        }

        const updated = await prisma.post.update({
          where: { id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            externalMainId: result.externalMainId,
            externalReplyId: result.externalReplyId,
          },
        });

        return NextResponse.json({ success: true, data: updated });
      }
    } catch {
      // Mock fallback
    }

    const mockPost = mockStore.posts.find((p) => p.id === id);
    if (mockPost) {
      const account = mockStore.accounts.find((a) => a.id === mockPost.accountId) || {
        id: mockPost.accountId,
        platform: mockPost.account?.platform || "THREADS",
        username: mockPost.account?.username || "pintulangitketujuh",
        accessToken: "browser_session_auth",
      };

      const result = await publishPostToPlatform({
        accountId: account.id,
        platform: (account.platform || "THREADS") as any,
        accessToken: account.accessToken || "browser_session_auth",
        username: account.username || mockPost.account?.username || "pintulangitketujuh",
        mainContent: mockPost.mainContent,
        replyContent: mockPost.replyContent,
        isSandbox: account.accessToken === "sandbox_mode_mock_token",
      });

      if (!result.success) {
        mockPost.status = "FAILED";
        return NextResponse.json(
          { success: false, error: result.error || "Gagal mempublikasikan postingan ke platform." },
          { status: 400 }
        );
      }

      mockPost.status = "PUBLISHED";
      mockPost.publishedAt = new Date();
      mockPost.externalMainId = result.externalMainId;
      mockPost.externalReplyId = result.externalReplyId;
      return NextResponse.json({ success: true, data: mockPost });
    }

    return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengeksekusi proses publikasi postingan." },
      { status: 500 }
    );
  }
}
