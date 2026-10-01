import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockStore, MockProduct } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";

    try {
      const products = await prisma.product.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
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
      // Fallback to mock store
      const filtered = search
        ? mockStore.products.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.category.toLowerCase().includes(search.toLowerCase())
          )
        : mockStore.products;

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
    const { name, brand, category, price, currency, painPoints, usps, description, targetAudience, tags } = body;

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    try {
      const product = await prisma.product.create({
        data: {
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
      const newMockProd: MockProduct = {
        id: `prod_${nanoid(6)}`,
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
        createdAt: new Date(),
      };

      mockStore.products.unshift(newMockProd);
      return NextResponse.json({ success: true, data: newMockProd });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
