import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrUpdateAffiliateLink } from "@/lib/links/link-service";
import { mockStore, MockLink } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const userCtx = getUserContext(request);

    try {
      const userFilter = userCtx.isAdmin ? {} : { userId: userCtx.userId };
      const links = await prisma.affiliateLink.findMany({
        where: userFilter,
        include: {
          product: { select: { id: true, name: true, category: true } },
          _count: { select: { clicks: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: links });
    } catch {
      // Admin sees all links; Members only see their own
      const allLinks = mockStore.links;
      const filtered = userCtx.isAdmin
        ? allLinks
        : allLinks.filter(
            (l) => (l.userId || "usr_admin_kenzie") === userCtx.userId
          );
      return NextResponse.json({ success: true, data: filtered });
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
        userId: userCtx.userId,
      });

      return NextResponse.json({ success: true, data: link });
    } catch {
      const shortCode = customSlug?.trim() || nanoid(7);
      const allProducts = mockStore.products;
      const product = allProducts.find(
        (p) => p.id === productId && (userCtx.isAdmin || (p.userId || "usr_admin_kenzie") === userCtx.userId)
      ) || {
        id: productId,
        name: "Produk Affiliate",
        category: "General",
      };

      const newLink: MockLink = {
        id: `link_${nanoid(6)}`,
        userId: userCtx.userId,
        productId,
        product: { id: product.id, name: product.name, category: product.category },
        originalUrl,
        shortCode,
        platform: platform || "SHOPEE",
        utmSource: utmSource || "threads_curhat",
        totalClicks: 0,
        _count: { clicks: 0, posts: 0 },
        createdAt: new Date().toISOString(),
      };

      const currentLinks = [...mockStore.links];
      mockStore.links = [newLink, ...currentLinks];

      // Attach link to product object
      const currentProducts = [...mockStore.products];
      const targetProd = currentProducts.find((p) => p.id === productId);
      if (targetProd) {
        if (!targetProd.affiliateLinks) targetProd.affiliateLinks = [];
        targetProd.affiliateLinks.unshift({
          id: newLink.id,
          shortCode: newLink.shortCode,
          originalUrl: newLink.originalUrl,
          platform: newLink.platform,
        });
        mockStore.products = currentProducts;
      }

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
    const userCtx = getUserContext(request);

    if (!id) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
    }

    try {
      await prisma.affiliateLink.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch {
      const currentLinks = [...mockStore.links];
      const index = currentLinks.findIndex(
        (l) => l.id === id && (userCtx.isAdmin || (l.userId || "usr_admin_kenzie") === userCtx.userId)
      );
      if (index !== -1) {
        const deletedLink = currentLinks[index];
        currentLinks.splice(index, 1);
        mockStore.links = currentLinks;

        // Remove from product's affiliateLinks array too
        const currentProducts = [...mockStore.products];
        const targetProd = currentProducts.find((p) => p.id === deletedLink.productId);
        if (targetProd && targetProd.affiliateLinks) {
          targetProd.affiliateLinks = targetProd.affiliateLinks.filter((l) => l.id !== id);
          mockStore.products = currentProducts;
        }
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
