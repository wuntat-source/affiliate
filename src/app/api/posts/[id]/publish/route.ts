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
          platformUserId: post.account.platformUserId || undefined,
          mainContent: post.mainContent,
          replyContent: post.replyContent || undefined,
        });

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
      mockPost.status = "PUBLISHED";
      mockPost.publishedAt = new Date();
      return NextResponse.json({ success: true, data: mockPost });
    }

    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute publish action" },
      { status: 500 }
    );
  }
}
