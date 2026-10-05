import { NextRequest, NextResponse } from "next/server";
import { extractProductInfo } from "@/lib/ai/content-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Teks deskripsi produk wajib diisi." },
        { status: 400 }
      );
    }

    const extracted = await extractProductInfo(rawText);

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (error: any) {
    console.error("[API AI Extract Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengekstrak info produk." },
      { status: 500 }
    );
  }
}
