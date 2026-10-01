import { NextRequest, NextResponse } from "next/server";
import { generateSocialContent } from "@/lib/ai/content-generator";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, category, painPoints, usps, affiliateUrl, tone, productId, saveDraft } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const generated = await generateSocialContent({
      productName,
      category,
      painPoints,
      usps,
      affiliateUrl,
      tone,
    });

    let draftId: string | undefined;

    if (saveDraft) {
      try {
        const draft = await prisma.aIContentDraft.create({
          data: {
            productId: productId || undefined,
            tone: tone || "CASUAL_CURHAT",
            mainPost: generated.mainPost,
            replyPost: generated.replyPost,
            characterCount: generated.characterCount,
            modelName: generated.modelUsed,
          },
        });
        draftId = draft.id;
      } catch (e) {
        console.warn("[Draft Save Warning]:", e);
      }
    }

    return NextResponse.json({
      success: true,
      draftId,
      data: generated,
    });
  } catch (error: any) {
    console.error("[API AI Generate Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI content" },
      { status: 500 }
    );
  }
}
