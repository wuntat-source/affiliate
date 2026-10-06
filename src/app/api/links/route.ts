import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrUpdateAffiliateLink } from "@/lib/links/link-service";
import { mockStore, MockLink, saveStoreToDisk } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

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
    const userCtx = getUserContext(request);
    const { productId, originalUrl, platform, customSlug, utmSource, utmMedium, utmCampaign, userId } = body;

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
        userId: userId || userCtx.userId,
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

      // Attach link to product object
      const targetProd = mockStore.products.find((p) => p.id === productId);
      if (targetProd) {
        if (!targetProd.affiliateLinks) targetProd.affiliateLinks = [];
        targetProd.affiliateLinks.unshift({
          id: newLink.id,
          shortCode: newLink.shortCode,
          originalUrl: newLink.originalUrl,
          platform: newLink.platform,
        });
      }

      saveStoreToDisk();
      return NextResponse.json({ success: true, data: newLink });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create affiliate link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
    }

    try {
      await prisma.affiliateLink.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch {
      const index = mockStore.links.findIndex((l) => l.id === id);
      if (index !== -1) {
        const deletedLink = mockStore.links[index];
        mockStore.links.splice(index, 1);

        // Remove from product's affiliateLinks array too
        const targetProd = mockStore.products.find((p) => p.id === deletedLink.productId);
        if (targetProd && targetProd.affiliateLinks) {
          targetProd.affiliateLinks = targetProd.affiliateLinks.filter((l) => l.id !== id);
        }

        saveStoreToDisk();
      }
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete affiliate link" },
      { status: 500 }
    );
  }
}
