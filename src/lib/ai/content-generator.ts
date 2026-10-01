import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface AIContentRequest {
  productName: string;
  category?: string;
  painPoints?: string;
  usps?: string;
  affiliateUrl?: string;
  tone?: "CASUAL_CURHAT" | "VIRAL_STORY" | "PROBLEM_SOLVER" | "HONEST_REVIEW" | "URGENT_DEAL";
  targetPlatform?: "THREADS" | "TWITTER" | "INSTAGRAM";
  apiKey?: string;
  provider?: "gemini" | "openai";
}

export interface AIContentResponse {
  mainPost: string;
  replyPost: string;
  characterCount: number;
  modelUsed: string;
}

const TONE_PROMPTS: Record<string, string> = {
  CASUAL_CURHAT: `
Gaya: Soft-selling curhat Threads santai sehari-hari.
Sudut pandang: Orang pertama ("aku").
Struktur:
1. Awali dengan keresahan/kebiasaan sepele atau momen relatable.
2. Ceritakan bagaimana produk ini jadi solusi kecil yang bikin hidup lebih gampang.
3. Maksimal 350 karakter untuk postingan utama.
4. JANGAN sebut merk secara terang-terangan seperti iklan hard-selling.
5. Postingan balasan adalah komentar pertama yang menyematkan link affiliate {link_afiliasi} dengan santai (contoh: "banyak yang nanya", "yang mau samaan linknya ini ya").
`,
  VIRAL_STORY: `
Gaya: Hook kuat, storytelling cepat, dan emosional/penasaran.
Maksimal 320 karakter untuk postingan utama.
Postingan balasan memuat hook penutup dan {link_afiliasi}.
`,
  PROBLEM_SOLVER: `
Gaya: Problem-Agitate-Solution singkat. Fokus to-the-point pada solusi praktis.
Maksimal 300 karakter untuk postingan utama.
Postingan balasan memuat rekomendasi link {link_afiliasi}.
`,
  HONEST_REVIEW: `
Gaya: Review jujur setelah pemakaian beberapa minggu. Highlight plus & minus santai.
Maksimal 350 karakter untuk postingan utama.
Postingan balasan memuat tempat beli original {link_afiliasi}.
`,
  URGENT_DEAL: `
Gaya: Info diskon/promo kilat tanpa terlihat spammy.
Maksimal 280 karakter untuk postingan utama.
Postingan balasan memuat link checkout langsung {link_afiliasi}.
`,
};

export async function generateSocialContent(req: AIContentRequest): Promise<AIContentResponse> {
  const tone = req.tone || "CASUAL_CURHAT";
  const toneGuideline = TONE_PROMPTS[tone] || TONE_PROMPTS.CASUAL_CURHAT;
  const affiliateLink = req.affiliateUrl || "{link_afiliasi}";

  const systemInstruction = `Kamu adalah copywriter profesional spesialis social media marketing & affiliate conversion untuk platform Threads dan Twitter/X.
Tugasmu: Menghasilkan konten organik yang natural, sangat menarik, dan berkonversi tinggi tanpa terdengar seperti iklan kaku.

${toneGuideline}

Wajib berikan output HANYA dalam format JSON valid berikut tanpa markdown formatting tambahan:
{
  "post_utama": "Teks postingan utama",
  "post_balasan": "Teks komentar balasan dengan link ${affiliateLink}"
}`;

  const prompt = `Data Produk:
- Nama Produk: ${req.productName}
- Kategori: ${req.category || "General"}
- Masalah / Pain Points: ${req.painPoints || "Masalah sehari-hari"}
- Keunggulan / USPs: ${req.usps || "Praktis dan fungsional"}
- Link Afiliasi: ${affiliateLink}`;

  const geminiApiKey = req.apiKey || process.env.GEMINI_API_KEY;
  const openaiApiKey = req.apiKey || process.env.OPENAI_API_KEY;

  // 1. Try Gemini if configured
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return {
        mainPost: parsed.post_utama,
        replyPost: parsed.post_balasan,
        characterCount: (parsed.post_utama || "").length,
        modelUsed: "gemini-1.5-flash",
      };
    } catch (err: any) {
      console.warn("[AI Engine] Gemini generation error, attempting fallback:", err.message);
    }
  }

  // 2. Try OpenAI if configured
  if (openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          mainPost: parsed.post_utama,
          replyPost: parsed.post_balasan,
          characterCount: (parsed.post_utama || "").length,
          modelUsed: "gpt-4o-mini",
        };
      }
    } catch (err: any) {
      console.warn("[AI Engine] OpenAI generation error, using smart local template:", err.message);
    }
  }

  // 3. Fallback Smart Generator Engine (Local NLP Template)
  return generateFallbackContent(req);
}

function generateFallbackContent(req: AIContentRequest): AIContentResponse {
  const link = req.affiliateUrl || "{link_afiliasi}";
  const pain = req.painPoints || "Sering ngerasa ribet sama rutinitas harian";
  const usp = req.usps || "bikin semuanya jauh lebih simpel";

  let mainPost = "";
  let replyPost = "";

  if (req.tone === "VIRAL_STORY") {
    mainPost = `Kirain hal sepele, ternyata efeknya berasa banget pas nemu ${req.productName}. Awalnya kesel karena ${pain}, tapi pas nyoba yang punya ${usp}, langsung ngerasa terbantu parah. Kenapa gak tau dari dulu ya.`;
    replyPost = `Buat yang penasaran spill barangnya di mana, ini link officialnya ya 👉 ${link}`;
  } else if (req.tone === "HONEST_REVIEW") {
    mainPost = `Udah pake ${req.productName} sekitar semingguan. Jujur ngebantu banget terutama pas ${pain}. Nilai plusnya karena ${usp}. Buat harian ini worth it sih.`;
    replyPost = `Belinya di toko yang ini ya, biar dapet yang original 👉 ${link}`;
  } else {
    // CASUAL_CURHAT (Default Threads Style)
    mainPost = `Jujur baru sadar kalau masalah ${pain} tuh kelar cuma pake ini. Kemarin checkout ${req.productName} gara-gara ${usp}, ditaruh meja langsung ngebantu banget tanpa bikin ribet.`;
    replyPost = `Yang nanyain link belinya, aku taro di sini ya biar gampang checkout 👉 ${link}`;
  }

  return {
    mainPost,
    replyPost,
    characterCount: mainPost.length,
    modelUsed: "smart-template-engine-v1",
  };
}
