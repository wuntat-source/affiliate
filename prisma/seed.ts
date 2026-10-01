import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial data for AffiliatePost AI...");

  // 1. Seed Account
  const account = await prisma.account.upsert({
    where: {
      platform_username: {
        platform: "THREADS",
        username: "curhat_gadget_daily",
      },
    },
    update: {},
    create: {
      platform: "THREADS",
      accountName: "Curhat Daily & WFC Hacks",
      username: "curhat_gadget_daily",
      accessToken: "sandbox_mock_token_threads_v1",
      status: "ACTIVE",
    },
  });

  // 2. Seed Product
  const product = await prisma.product.create({
    data: {
      name: "Botol Minum Motivasi 2L",
      brand: "HydraVibe",
      category: "Home & Living",
      price: 89000,
      currency: "IDR",
      painPoints: "Sering lupa minum pas kerja di depan laptop sampai pusing dan dehidrasi",
      usps: "Ada penanda waktu jam, kapasitas besar 2L gak perlu bolak-balik isi ulang",
      description: "Botol minum motivasi dengan penanda jam transparan.",
      tags: ["wfc", "lifestyle", "hydration"],
    },
  });

  // 3. Seed Affiliate Link
  const link = await prisma.affiliateLink.create({
    data: {
      productId: product.id,
      platform: "SHOPEE",
      originalUrl: "https://s.shopee.co.id/contohlink123",
      shortCode: "botol-2l",
      utmSource: "threads_curhat",
      utmMedium: "social",
      utmCampaign: "curhat_dehidrasi",
      totalClicks: 42,
    },
  });

  // 4. Seed Post in Queue
  await prisma.post.create({
    data: {
      accountId: account.id,
      productId: product.id,
      affiliateLinkId: link.id,
      mainContent:
        "Tiap sore kepala suka kliyengan, kukira stres kerjaan, ternyata cuma dehidrasi gara-gara mager bolak-balik ngisi air. Akhirnya naruh botol 2 liter yang ada penanda jamnya di meja kerja. Tiap lirik jam jadi auto kesentil buat minum. Sekarang pusing hilang, target air harian kelar tanpa drama.",
      replyContent:
        "Yang suka lupa minum pas lagi fokus kerja kayak aku, botolnya bisa cek di sini ya 👉 http://localhost:3000/r/botol-2l",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
