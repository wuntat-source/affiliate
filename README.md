# 🚀 AFFILIATEPOST AI

**AffiliatePost AI** is a production-ready AI affiliate automation platform for social media (Threads, Twitter/X, Instagram, TikTok). It transforms raw product catalog data into high-converting organic soft-selling stories (*curhat harian*), schedules them at optimal engagement times, and automatically attaches reply comments containing tracked affiliate links.

---

## 🌟 Key Features & Modules

1. **AI Content Studio**:
   - Multi-persona generator (*Casual Curhat*, *Viral Story*, *Problem Solver*, *Honest Review*, *Urgent Deal*).
   - Dedicated **Threads Simulator** with real-time character limit guards ($\le 350$ chars).
   - Automated 1st-reply thread generator chaining with `{link_afiliasi}`.
   - Fallback engine supporting Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, and local smart NLP templates.

2. **Affiliate Link Engine & Click Telemetry**:
   - Short link generator with custom slugs (`/r/{code}`).
   - Automatic UTM tag injector (`utm_source`, `utm_medium`, `utm_campaign`).
   - Real-time click tracking with device & referer telemetry.

3. **Multi-Account Social Media Manager**:
   - Threads (Meta Graph API) & Twitter/X (API v2) integrations.
   - Built-in **Sandbox / Safe Test Mode** for developing and testing without API rate-limit bans.

4. **Queue & Background Worker Scheduler**:
   - Async background job processing using **BullMQ + Redis**.
   - Immediate dispatch, scheduled drops, and retry backoff on failure.

5. **Product Master Catalog**:
   - Map customer pain points, USPs, original pricing, and category tags to feed directly into the AI Studio.

6. **Analytics & Metrics**:
   - Track total clicks, conversions, published thread volume, and top-performing links.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Components & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL with Prisma ORM
- **Queue / Cache**: Redis with BullMQ
- **AI Models**: Google Gemini 1.5 Flash (`@google/generative-ai`), OpenAI GPT-4o-mini

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Create or edit `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/affiliatepost?schema=public"
REDIS_URL="redis://localhost:6379"

# AI Providers (Optional — Fallback engine will work if not provided)
GEMINI_API_KEY="your_gemini_api_key"
OPENAI_API_KEY="your_openai_api_key"
```

### 2. Run Database Migrations & Seed
```bash
npx prisma db push
npx prisma db seed
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints Overview

| Route | Method | Description |
|---|---|---|
| `/r/[code]` | `GET` | Shortlink redirect engine & click telemetry logger |
| `/api/ai/generate` | `POST` | AI copy generator for main story and reply link |
| `/api/products` | `GET`, `POST` | Product catalog CRUD |
| `/api/links` | `GET`, `POST` | Tracked affiliate link generator |
| `/api/posts` | `GET`, `POST` | Queue management & scheduling |
| `/api/posts/[id]/publish` | `POST` | Immediate manual dispatch trigger |
| `/api/accounts` | `GET`, `POST` | Social accounts & sandbox credentials |
| `/api/analytics` | `GET` | Real-time conversion metrics |

---

## 📄 License
MIT
