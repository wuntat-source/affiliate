// In-Memory store initialized to clean fresh state

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

// Global in-memory cache - Reset to clean initial arrays
const globalStore = globalThis as unknown as {
  __mockProducts?: MockProduct[];
  __mockAccounts?: MockAccount[];
  __mockLinks?: MockLink[];
  __mockPosts?: MockPost[];
};

globalStore.__mockProducts = [];
globalStore.__mockAccounts = [];
globalStore.__mockLinks = [];
globalStore.__mockPosts = [];

export const mockStore = {
  products: globalStore.__mockProducts,
  accounts: globalStore.__mockAccounts,
  links: globalStore.__mockLinks,
  posts: globalStore.__mockPosts,
};
