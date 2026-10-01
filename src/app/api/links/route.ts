import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrUpdateAffiliateLink } from "@/lib/links/link-service";
import { mockStore, MockLink } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    try {
      const links = await prisma.affiliateLink.findMany({
        include: {
          product: { select: { id: true, name: true, category: true } },
          _count: { select: { clicks: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: links });
    } catch {
      return NextResponse.json({ success: true, data: mockStore.links });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch affiliate links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, originalUrl, platform, customSlug, utmSource, utmMedium, utmCampaign } = body;

    if (!productId || !originalUrl) {
      return NextResponse.json(
        { error: "Product ID and Original URL are required." },
        { status: 400 }
      );
    }

    try {
      const link = await createOrUpdateAffiliateLink({
        productId,
        originalUrl,
        platform,
        customSlug,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      return NextResponse.json({ success: true, data: link });
    } catch {
      const shortCode = customSlug?.trim() || nanoid(7);
      const product = mockStore.products.find((p) => p.id === productId) || {
        id: productId,
        name: "General Product",
        category: "General",
      };

      const newLink: MockLink = {
        id: `link_${nanoid(6)}`,
        productId,
        product: { id: product.id, name: product.name, category: product.category },
        originalUrl,
        shortCode,
        platform: platform || "SHOPEE",
        utmSource: utmSource || "threads_curhat",
        totalClicks: 0,
        _count: { clicks: 0, posts: 0 },
        createdAt: new Date(),
      };

      mockStore.links.unshift(newLink);
      return NextResponse.json({ success: true, data: newLink });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create affiliate link" },
      { status: 500 }
    );
  }
}
