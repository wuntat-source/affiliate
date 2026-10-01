// In-Memory fallback store for immediate local development / testing when PostgreSQL is not yet started

export interface MockProduct {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  price?: number | null;
  currency: string;
  painPoints?: string | null;
  usps?: string | null;
  description?: string | null;
  affiliateLinks?: Array<{ id: string; shortCode: string; originalUrl: string; platform: string }>;
  _count?: { posts: number; aiDrafts: number };
  createdAt: Date;
}

export interface MockAccount {
  id: string;
  platform: string;
  accountName: string;
  username: string;
  status: "ACTIVE" | "EXPIRED" | "RATE_LIMITED" | "DISCONNECTED";
  accessToken: string;
  _count?: { posts: number };
  createdAt: Date;
}

export interface MockLink {
  id: string;
  productId: string;
  product: { id: string; name: string; category: string };
  originalUrl: string;
  shortCode: string;
  platform: string;
  utmSource?: string;
  totalClicks: number;
  _count?: { clicks: number; posts: number };
  createdAt: Date;
}

export interface MockPost {
  id: string;
  accountId: string;
  account: { platform: string; username: string };
  productId?: string;
  product?: { name: string };
  affiliateLinkId?: string;
  affiliateLink?: { shortCode: string; originalUrl: string };
  mainContent: string;
  replyContent?: string;
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "PROCESSING" | "PUBLISHED" | "FAILED";
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
}

// Global in-memory cache
const globalStore = globalThis as unknown as {
  __mockProducts?: MockProduct[];
  __mockAccounts?: MockAccount[];
  __mockLinks?: MockLink[];
  __mockPosts?: MockPost[];
};

if (!globalStore.__mockProducts) {
  globalStore.__mockProducts = [
    {
      id: "prod_1",
      name: "Botol Minum Motivasi 2L",
      brand: "HydraVibe",
      category: "Home & Living",
      price: 89000,
      currency: "IDR",
      painPoints: "Sering lupa minum pas kerja di depan laptop sampai pusing dan dehidrasi",
      usps: "Ada penanda waktu jam, kapasitas besar 2L gak perlu bolak-balik isi ulang",
      description: "Botol motivasi 2L dengan penanda waktu",
      affiliateLinks: [
        {
          id: "link_1",
          shortCode: "botol-2l",
          originalUrl: "https://s.shopee.co.id/contohlink123",
          platform: "SHOPEE",
        },
      ],
      _count: { posts: 1, aiDrafts: 1 },
      createdAt: new Date(),
    },
    {
      id: "prod_2",
      name: "Stand Laptop Ergonomis Aluminium",
      brand: "ErgoWork",
      category: "Work & Office",
      price: 145000,
      currency: "IDR",
      painPoints: "Leher pegel dan bungkuk tiap ngetik seharian",
      usps: "Bisa diatur 7 sudut ketinggian, bahan aluminium kokoh & dingin",
      description: "Stand laptop lipat portabel",
      affiliateLinks: [
        {
          id: "link_2",
          shortCode: "stand-ergo",
          originalUrl: "https://s.shopee.co.id/standlaptop123",
          platform: "SHOPEE",
        },
      ],
      _count: { posts: 0, aiDrafts: 0 },
      createdAt: new Date(),
    },
  ];
}

if (!globalStore.__mockAccounts) {
  globalStore.__mockAccounts = [
    {
      id: "acc_1",
      platform: "THREADS",
      accountName: "Curhat Daily & WFC Hacks",
      username: "curhat_gadget_daily",
      status: "ACTIVE",
      accessToken: "sandbox_mock_token",
      _count: { posts: 1 },
      createdAt: new Date(),
    },
  ];
}

if (!globalStore.__mockLinks) {
  globalStore.__mockLinks = [
    {
      id: "link_1",
      productId: "prod_1",
      product: { id: "prod_1", name: "Botol Minum Motivasi 2L", category: "Home & Living" },
      originalUrl: "https://s.shopee.co.id/contohlink123",
      shortCode: "botol-2l",
      platform: "SHOPEE",
      utmSource: "threads_curhat",
      totalClicks: 42,
      _count: { clicks: 42, posts: 1 },
      createdAt: new Date(),
    },
  ];
}

if (!globalStore.__mockPosts) {
  globalStore.__mockPosts = [
    {
      id: "post_1",
      accountId: "acc_1",
      account: { platform: "THREADS", username: "curhat_gadget_daily" },
      productId: "prod_1",
      product: { name: "Botol Minum Motivasi 2L" },
      mainContent:
        "Tiap sore kepala suka kliyengan, kukira stres kerjaan, ternyata cuma dehidrasi gara-gara mager bolak-balik ngisi air. Akhirnya naruh botol 2 liter yang ada penanda jamnya di meja kerja. Tiap lirik jam jadi auto kesentil buat minum. Sekarang pusing hilang, target air harian kelar tanpa drama.",
      replyContent:
        "Yang suka lupa minum pas lagi fokus kerja kayak aku, botolnya bisa cek di sini ya 👉 http://localhost:3000/r/botol-2l",
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdAt: new Date(),
    },
  ];
}

export const mockStore = {
  products: globalStore.__mockProducts!,
  accounts: globalStore.__mockAccounts!,
  links: globalStore.__mockLinks!,
  posts: globalStore.__mockPosts!,
};
