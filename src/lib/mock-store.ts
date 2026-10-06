import fs from "fs";
import path from "path";

export interface MockProduct {
  id: string;
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  userId?: string;
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
  externalMainId?: string;
  externalReplyId?: string;
  lastError?: string | null;
  createdAt: Date;
}

const DB_PATH = path.resolve(process.cwd(), ".sessions/database.json");

function ensureDirExists() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

const DEFAULT_PRODUCTS: MockProduct[] = [
  {
    id: "prod_labore_sunscreen",
    userId: "usr_admin_default",
    name: "NEW! LABORÉ ACNE & OIL CORRECT PHYSICAL SUNSCREEN SPF 50+/PA",
    brand: "LABORÉ",
    category: "Health & Beauty",
    price: 169000,
    currency: "IDR",
    painPoints: "Kulit berjerawat & sensitif sering breakout atau komedoan tiap pakai sunscreen biasa",
    usps: "BiomeProtect™ Technology, tekstur seringan air tanpa whitecast, kontrol minyak berlebih hingga 8 jam",
    description: "Sunscreen khusus acne-prone skin dengan perlindungan SPF 50+/PA++++ dan formula ringan.",
    affiliateLinks: [
      {
        id: "link_labore_01",
        shortCode: "labore-acne-sunscreen",
        originalUrl: "https://s.shopee.co.id/6L4zmgfyxp",
        platform: "SHOPEE",
      },
    ],
    _count: { posts: 1, aiDrafts: 0 },
    createdAt: new Date(),
  },
  {
    id: "prod_botol_2l",
    userId: "usr_admin_default",
    name: "Botol Minum Motivasi 2L Time Marker",
    brand: "Quifit",
    category: "Home & Living",
    price: 65000,
    currency: "IDR",
    painPoints: "Sering lupa minum saat kerja sampai pusing/dehidrasi dan malas bolak-balik isi air",
    usps: "Kapasitas besar 2 Liter, ada penanda waktu jam motivasi, bahan BPA Free anti tumpah",
    description: "Botol minum viral motivasi dengan sedotan dan penanda waktu.",
    affiliateLinks: [
      {
        id: "link_botol_01",
        shortCode: "botol-2l-viral",
        originalUrl: "https://s.shopee.co.id/botol2L",
        platform: "SHOPEE",
      },
    ],
    _count: { posts: 0, aiDrafts: 0 },
    createdAt: new Date(),
  },
  {
    id: "prod_laptop_stand",
    userId: "usr_admin_default",
    name: "Stand Laptop Ergonomis Aluminium Lipat",
    brand: "Orico",
    category: "Gadget & Tech",
    price: 125000,
    currency: "IDR",
    painPoints: "Leher dan punggung sering pegal karena posisi laptop terlalu rendah saat kerja seharian",
    usps: "Material aluminium solid kokoh, 6 tingkat ketinggian adjustable, sirkulasi udara laptop dingin",
    description: "Stand laptop portabel yang dapat dilipat dan mudah dibawa ke mana saja.",
    affiliateLinks: [
      {
        id: "link_laptop_01",
        shortCode: "stand-laptop-alu",
        originalUrl: "https://s.shopee.co.id/laptopstand",
        platform: "SHOPEE",
      },
    ],
    _count: { posts: 0, aiDrafts: 0 },
    createdAt: new Date(),
  },
];

const DEFAULT_LINKS: MockLink[] = [
  {
    id: "link_labore_01",
    userId: "usr_admin_default",
    productId: "prod_labore_sunscreen",
    product: {
      id: "prod_labore_sunscreen",
      name: "NEW! LABORÉ ACNE & OIL CORRECT PHYSICAL SUNSCREEN SPF 50+/PA",
      category: "Health & Beauty",
    },
    originalUrl: "https://s.shopee.co.id/6L4zmgfyxp",
    shortCode: "labore-acne-sunscreen",
    platform: "SHOPEE",
    utmSource: "threads_curhat",
    totalClicks: 24,
    _count: { clicks: 24, posts: 1 },
    createdAt: new Date(),
  },
  {
    id: "link_botol_01",
    userId: "usr_admin_default",
    productId: "prod_botol_2l",
    product: {
      id: "prod_botol_2l",
      name: "Botol Minum Motivasi 2L Time Marker",
      category: "Home & Living",
    },
    originalUrl: "https://s.shopee.co.id/botol2L",
    shortCode: "botol-2l-viral",
    platform: "SHOPEE",
    utmSource: "threads_curhat",
    totalClicks: 12,
    _count: { clicks: 12, posts: 0 },
    createdAt: new Date(),
  },
  {
    id: "link_laptop_01",
    userId: "usr_admin_default",
    productId: "prod_laptop_stand",
    product: {
      id: "prod_laptop_stand",
      name: "Stand Laptop Ergonomis Aluminium Lipat",
      category: "Gadget & Tech",
    },
    originalUrl: "https://s.shopee.co.id/laptopstand",
    shortCode: "stand-laptop-alu",
    platform: "SHOPEE",
    utmSource: "threads_curhat",
    totalClicks: 8,
    _count: { clicks: 8, posts: 0 },
    createdAt: new Date(),
  },
];

const DEFAULT_ACCOUNTS: MockAccount[] = [
  {
    id: "acc_pintulangitketujuh",
    userId: "usr_admin_default",
    platform: "THREADS",
    accountName: "@pintulangitketujuh (Browser Session)",
    username: "pintulangitketujuh",
    status: "ACTIVE",
    accessToken: "browser_session_auth",
    _count: { posts: 1 },
    createdAt: new Date(),
  },
];

function loadFromDisk(): {
  products: MockProduct[];
  accounts: MockAccount[];
  links: MockLink[];
  posts: MockPost[];
} {
  ensureDirExists();
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      return {
        products: Array.isArray(raw.products) && raw.products.length > 0 ? raw.products : DEFAULT_PRODUCTS,
        accounts: Array.isArray(raw.accounts) && raw.accounts.length > 0 ? raw.accounts : DEFAULT_ACCOUNTS,
        links: Array.isArray(raw.links) && raw.links.length > 0 ? raw.links : DEFAULT_LINKS,
        posts: Array.isArray(raw.posts) ? raw.posts : [],
      };
    } catch {}
  }

  // Save default data initially
  const initial = {
    products: DEFAULT_PRODUCTS,
    accounts: DEFAULT_ACCOUNTS,
    links: DEFAULT_LINKS,
    posts: [],
  };
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  } catch {}
  return initial;
}

export function saveStoreToDisk() {
  ensureDirExists();
  try {
    const data = {
      products: mockStore.products,
      accounts: mockStore.accounts,
      links: mockStore.links,
      posts: mockStore.posts,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[Store Persistence Error]:", e);
  }
}

// Global in-memory cache initialized from disk
const globalStore = globalThis as unknown as {
  __mockProducts?: MockProduct[];
  __mockAccounts?: MockAccount[];
  __mockLinks?: MockLink[];
  __mockPosts?: MockPost[];
};

if (!globalStore.__mockProducts || globalStore.__mockProducts.length === 0) {
  const diskData = loadFromDisk();
  globalStore.__mockProducts = diskData.products;
  globalStore.__mockAccounts = diskData.accounts;
  globalStore.__mockLinks = diskData.links;
  globalStore.__mockPosts = diskData.posts;
}

export const mockStore = {
  get products(): MockProduct[] {
    return globalStore.__mockProducts!;
  },
  set products(val: MockProduct[]) {
    globalStore.__mockProducts = val;
    saveStoreToDisk();
  },

  get accounts(): MockAccount[] {
    return globalStore.__mockAccounts!;
  },
  set accounts(val: MockAccount[]) {
    globalStore.__mockAccounts = val;
    saveStoreToDisk();
  },

  get links(): MockLink[] {
    return globalStore.__mockLinks!;
  },
  set links(val: MockLink[]) {
    globalStore.__mockLinks = val;
    saveStoreToDisk();
  },

  get posts(): MockPost[] {
    return globalStore.__mockPosts!;
  },
  set posts(val: MockPost[]) {
    globalStore.__mockPosts = val;
    saveStoreToDisk();
  },
};
