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
  createdAt: Date | string;
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
  createdAt: Date | string;
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
  createdAt: Date | string;
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
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string | null;
  externalMainId?: string;
  externalReplyId?: string;
  lastError?: string | null;
  createdAt: Date | string;
}

export interface MockClickLog {
  id: string;
  linkId: string;
  shortCode: string;
  clickedAt: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
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
    userId: "usr_admin_kenzie",
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
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_LINKS: MockLink[] = [
  {
    id: "link_labore_01",
    userId: "usr_admin_kenzie",
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
    totalClicks: 0,
    _count: { clicks: 0, posts: 1 },
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ACCOUNTS: MockAccount[] = [
  {
    id: "acc_pintulangitketujuh",
    userId: "usr_admin_kenzie",
    platform: "THREADS",
    accountName: "@pintulangitketujuh",
    username: "pintulangitketujuh",
    status: "ACTIVE",
    accessToken: "browser_session_auth",
    _count: { posts: 1 },
    createdAt: new Date().toISOString(),
  },
];

export function readStoreFromDisk(): {
  products: MockProduct[];
  accounts: MockAccount[];
  links: MockLink[];
  posts: MockPost[];
  clickLogs: MockClickLog[];
  users?: any[];
} {
  ensureDirExists();
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      return {
        products: Array.isArray(raw.products) ? raw.products : DEFAULT_PRODUCTS,
        accounts: Array.isArray(raw.accounts) ? raw.accounts : DEFAULT_ACCOUNTS,
        links: Array.isArray(raw.links) ? raw.links : DEFAULT_LINKS,
        posts: Array.isArray(raw.posts) ? raw.posts : [],
        clickLogs: Array.isArray(raw.clickLogs) ? raw.clickLogs : [],
        users: raw.users,
      };
    } catch {}
  }

  const initial = {
    products: DEFAULT_PRODUCTS,
    accounts: DEFAULT_ACCOUNTS,
    links: DEFAULT_LINKS,
    posts: [],
    clickLogs: [],
  };
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  } catch {}
  return initial;
}

export function saveStoreToDisk(partial?: {
  products?: MockProduct[];
  accounts?: MockAccount[];
  links?: MockLink[];
  posts?: MockPost[];
  clickLogs?: MockClickLog[];
}) {
  ensureDirExists();
  try {
    let raw: any = {};
    if (fs.existsSync(DB_PATH)) {
      try {
        raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      } catch {}
    }

    if (partial?.products !== undefined) raw.products = partial.products;
    if (partial?.accounts !== undefined) raw.accounts = partial.accounts;
    if (partial?.links !== undefined) raw.links = partial.links;
    if (partial?.posts !== undefined) raw.posts = partial.posts;
    if (partial?.clickLogs !== undefined) raw.clickLogs = partial.clickLogs;

    fs.writeFileSync(DB_PATH, JSON.stringify(raw, null, 2));
  } catch (e) {
    console.error("[Store Persistence Error]:", e);
  }
}

export const mockStore = {
  get products(): MockProduct[] {
    return readStoreFromDisk().products;
  },
  set products(val: MockProduct[]) {
    saveStoreToDisk({ products: val });
  },

  get accounts(): MockAccount[] {
    return readStoreFromDisk().accounts;
  },
  set accounts(val: MockAccount[]) {
    saveStoreToDisk({ accounts: val });
  },

  get links(): MockLink[] {
    return readStoreFromDisk().links;
  },
  set links(val: MockLink[]) {
    saveStoreToDisk({ links: val });
  },

  get posts(): MockPost[] {
    return readStoreFromDisk().posts;
  },
  set posts(val: MockPost[]) {
    saveStoreToDisk({ posts: val });
  },

  get clickLogs(): MockClickLog[] {
    return readStoreFromDisk().clickLogs;
  },
  set clickLogs(val: MockClickLog[]) {
    saveStoreToDisk({ clickLogs: val });
  },
};
