import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { nanoid } from "nanoid";

export interface ViralReplyRequest {
  targetPostUrl?: string;
  targetPostContent?: string;
  productName: string;
  productCategory?: string;
  productUsp?: string;
  affiliateUrl?: string;
  replyStyle?: "RELATABLE_CURHAT" | "HELPFUL_HACK" | "HUMOROUS_CHILL" | "DIRECT_SPILL";
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ViralReplyRequest = await request.json();
    const {
      targetPostContent,
      productName,
      productCategory,
      productUsp,
      affiliateUrl,
      replyStyle,
    } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const link = affiliateUrl || "{link_afiliasi}";
    const style = replyStyle || "RELATABLE_CURHAT";

    const styleInstructions: Record<string, string> = {
      RELATABLE_CURHAT: `
Gaya: Komentar santai seolah kita sesama pengguna yang relate banget sama masalah di postingan itu.
Sudut pandang: Orang pertama ("aku" / "gue").
Panjang: 2-3 kalimat lengkap dan berbobot.
Format: Tanggapi postingannya dulu dengan ramah/relate, spill review jujur kenapa ${productName} (${productUsp || "ini"}) beneran ngebantu, info promo/toko official terpercaya, lalu sertakan link: ${link}.
`,
      HELPFUL_HACK: `
Gaya: Memberikan tips/lifehack bermanfaat terkait topik, lalu merekomendasikan ${productName} sebagai solusinya.
Panjang: 2-3 kalimat lengkap.
Sertakan tips praktis pemakaian dan link official: ${link}.
`,
      HUMOROUS_CHILL: `
Gaya: Santai, sedikit bercanda/meme relatable, tapi solutif dan meyakinkan.
Panjang: 2-3 kalimat lengkap.
Sertakan link promo official: ${link}.
`,
      DIRECT_SPILL: `
Gaya: Informatif, to-the-point, spill detail toko terpercaya & diskon aktif.
Panjang: 2-3 kalimat lengkap.
Sertakan link checkout resmi: ${link}.
`,
    };

    const systemPrompt = `Kamu adalah copywriter Threads & Twitter/X spesialis "Viral Thread Commenter / Hijack Reply".
Tugasmu: Menulis balasan komentar organik yang panjang, berbobot, dan meyakinkan ke postingan populer yang sedang viral agar audiens tertarik mengklik link afiliasi tanpa terkesan spam kaku.

${styleInstructions[style]}

Kembalikan respon HANYA dalam format JSON valid:
{
  "reply_text": "Teks komentar balasan yang panjang dan bernilai tambah",
  "hook_explanation": "Alasan kenapa komentar ini natural dan berpeluang dapat klik tinggi"
}`;

    const userPrompt = `Target Postingan Populer / Topik:
"${targetPostContent || "Postingan tentang capek kerja, lembur, dan butuh recharge / rutinitas sehat"}"

Produk Afiliasi yang Dipromosikan:
- Nama Produk: ${productName}
- Kategori: ${productCategory || "General"}
- Keunggulan Utama: ${productUsp || "Praktis dan fungsional"}
- Link Afiliasi: ${link}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let generatedReply = "";
    let hookExplanation = "";

    // 1. Try Gemini
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
          },
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        const parsed = JSON.parse(result.response.text());
        generatedReply = parsed.reply_text;
        hookExplanation = parsed.hook_explanation;
      } catch (err) {
        console.warn("[Viral Reply Engine] Gemini fallback trigger:", err);
      }
    }

    // 2. Try OpenAI fallback
    if (!generatedReply && openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.85,
        });
        const content = res.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          generatedReply = parsed.reply_text;
          hookExplanation = parsed.hook_explanation;
        }
      } catch (err) {
        console.warn("[Viral Reply Engine] OpenAI fallback trigger:", err);
      }
    }

    // 3. Fallback smart generator template
    if (!generatedReply) {
      if (style === "HELPFUL_HACK") {
        generatedReply = `Bener banget kak, kuncinya jangan nunggu burnout baru istirahat. Semenjak pake ${productName} (${productUsp || "ngebantu banget"}), ritme harian beneran jadi jauh lebih teratur dan efisien. Kalau ada yang butuh solusinya juga, aku ambil di toko official ini karena lagi promo gratis ongkir 👉 ${link}`;
        hookExplanation = "Memberikan validasi atas masalah yang dibahas sebelum merekomendasikan solusi.";
      } else if (style === "HUMOROUS_CHILL") {
        generatedReply = `Relate parah 😭 Dulu tiap sore lemes gak karuan, ternyata solusinya cuma modal naruh ${productName} ini di meja. Penyelamat hidup banget dan kualitasnya awet. Buat yang mau samaan mending langsung checkout di toko officialnya mumpung lagi diskon 👉 ${link}`;
        hookExplanation = "Memakai emoji dan gaya curhat ekspresif yang mengundang interaksi sesama audiens.";
      } else {
        generatedReply = `Sama banget kak, aku kemarin juga sempat ngalamin hal serupa sampai akhirnya nyobain ${productName}. Asli ngebantu banget pas lagi riweuh dan bikin semuanya lebih praktis. Belinya pastikan di toko official yang ini ya biar dapet barang ori dan garansi resmi 👉 ${link}`;
        hookExplanation = "Pendekatan sosial 'sama banget' menciptakan rasa senasib yang meningkatkan CTR.";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        replyText: generatedReply,
        hookExplanation,
        characterCount: generatedReply.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate viral reply" },
      { status: 500 }
    );
  }
}
