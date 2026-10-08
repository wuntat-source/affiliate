import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockProduct } from "@/lib/mock-store";
import { getUserContext } from "@/lib/server-auth";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const userCtx = getUserContext(request);

    try {
      const userFilter = userCtx.isAdmin ? {} : { userId: userCtx.userId };
      const products = await prisma.product.findMany({
        where: {
          ...userFilter,
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { category: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          affiliateLinks: true,
          _count: {
            select: {
              posts: true,
              aiDrafts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: products });
    } catch {
      // Admin can see all products across all users; Members only see their own
      let filtered = userCtx.isAdmin
        ? mockStore.products
        : mockStore.products.filter(
            (p) => (p.userId || "usr_admin_kenzie") === userCtx.userId
          );

      if (search) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        );
      }

      return NextResponse.json({ success: true, data: filtered });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userCtx = getUserContext(request);
    const { name, brand, category, price, currency, painPoints, usps, description, targetAudience, tags } = body;

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    try {
      const product = await prisma.product.create({
        data: {
          userId: userCtx.userId,
          name,
          brand: brand || null,
          category: category || "General",
          price: price ? parseFloat(price) : null,
          currency: currency || "IDR",
          painPoints: painPoints || null,
          usps: usps || null,
          description: description || null,
          targetAudience: targetAudience || null,
          tags: Array.isArray(tags) ? tags : [],
        },
      });

      return NextResponse.json({ success: true, data: product });
    } catch {
      const current = [...mockStore.products];
      const newMockProd: MockProduct = {
        id: `prod_${nanoid(6)}`,
        userId: userCtx.userId,
        name,
        brand: brand || null,
        category: category || "General",
        price: price ? parseFloat(price) : null,
        currency: currency || "IDR",
        painPoints: painPoints || null,
        usps: usps || null,
        description: description || null,
        affiliateLinks: [],
        _count: { posts: 0, aiDrafts: 0 },
        createdAt: new Date().toISOString(),
      };

      mockStore.products = [newMockProd, ...current];
      return NextResponse.json({ success: true, data: newMockProd });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    try {
      await prisma.product.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    } catch {
      const currentProducts = [...mockStore.products];
      const index = currentProducts.findIndex(
        (p) => p.id === id && (userCtx.isAdmin || (p.userId || "usr_admin_kenzie") === userCtx.userId)
      );
      if (index !== -1) {
        currentProducts.splice(index, 1);
        mockStore.products = currentProducts;

        // Also remove associated links
        const currentLinks = mockStore.links.filter((l) => l.productId !== id);
        mockStore.links = currentLinks;
      }
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
