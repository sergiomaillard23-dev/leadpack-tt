# LeadPack T&T — Handoff Document
**Last updated:** 2026-04-10  
**Branch:** `master` (deployed to Vercel)  
**Status:** ✅ Full marketplace flow working — crack, preview reveal, purchase, full lead reveal, wallet, journal all live. Landing page updated. Vercel deployed and stable.

---

## Project Overview

Gamified insurance lead marketplace for T&T agents. Agents buy packs of 20 leads tiered by exclusivity and income segment. Experience is designed to feel like opening a trading card pack. Full spec in `CLAUDE.md`.

---

## Current Stack

| Layer | Service | Status |
|---|---|---|
| Frontend | Next.js 14 App Router (`web/`) | ✅ Live |
| Auth | Supabase Auth cloud (free tier) | ✅ Wired |
| Database | PostgreSQL local dev / Supabase cloud | ✅ Migrations applied |
| Cache/Timers | Upstash Redis | ❌ Not started (using DB-based timers for now) |
| Background Jobs | n8n (local) | ✅ Lead intake pipeline live |
| Payments | WiPay / FAC | ❌ Not started |
| Messaging | WhatsApp Cloud API | ❌ Not started |
| Deployment | Vercel (frontend) | ✅ Live on Vercel |

---

## Current File Structure

```
leadpack-tt/
├── CLAUDE.md                          ← Full product spec — read before touching anything
├── handoff.md                         ← This file
├── migrations/
│   ├── 001_core_schema.sql            ← All core tables, enums, triggers, indexes
│   ├── 002_add_lead_batches.sql       ← lead_batches table, lead_batch_id FK on leads+packs
│   ├── 003_pack_fields.sql            ← price_ttd, buyer_count, max_buyers on packs
│   ├── 004_pack_timers.sql            ← pack_timers table (superseded by 007)
│   ├── 005_drop_broken_trigger.sql    ← Removes a trigger that caused insert failures
│   ├── 006_agent_kyc.sql              ← kyc_status on agents, kyc_documents table
│   ├── 007_add_pack_cracks_and_wallet.sql  ← pack_cracks table + 3 DB functions + payment_type
│   └── 008_rename_agents_name_to_full_name.sql  ← agents.name → agents.full_name
└── web/
    ├── app/
    │   ├── (auth)/
    │   │   ├── layout.tsx             ← Centered card shell, no sidebar
    │   │   ├── login/page.tsx         ← Email/password + magic link tabs
    │   │   └── register/page.tsx      ← Name, phone (validated), email, password
    │   ├── (dashboard)/
    │   │   ├── layout.tsx             ← KYC gate + Header + Sidebar
    │   │   ├── marketplace/page.tsx   ← Pack grid — real data from DB
    │   │   ├── wallet/page.tsx        ← Balance + transaction history
    │   │   ├── journal/
    │   │   │   ├── page.tsx           ← Stats + purchased packs list
    │   │   │   └── [packId]/page.tsx  ← Full lead table for a pack (ownership-gated)
    │   │   └── error.tsx
    │   ├── admin/
    │   │   └── kyc/page.tsx           ← Admin reviews PENDING agents, approve/reject
    │   ├── onboarding/
    │   │   └── kyc/page.tsx           ← Upload form for PENDING agents
    │   ├── api/
    │   │   ├── packs/
    │   │   │   ├── crack/route.ts     ← POST: crack pack, start 5-min window
    │   │   │   ├── purchase/route.ts  ← POST: buy pack, debit wallet
    │   │   │   └── [id]/timer/route.ts ← GET: remaining seconds on crack window
    │   │   ├── kyc/
    │   │   │   └── submit/route.ts    ← POST: upload 3 KYC docs to Supabase Storage
    │   │   └── admin/
    │   │       └── kyc/[agentId]/route.ts  ← PATCH: approve or reject agent
    │   ├── auth/callback/route.ts     ← Magic link exchange → provisions agents row
    │   ├── layout.tsx                 ← Dark theme root, Inter font
    │   ├── globals.css
    │   └── page.tsx                   ← Redirects / → /marketplace
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx             ← Wallet balance badge, agent email, logout
    │   │   └── Sidebar.tsx            ← Marketplace / Journal / Wallet / Pro Tools nav
    │   ├── packs/
    │   │   ├── PackCard.tsx           ← Label, type badge, price, crack/purchase CTA, timer ring
    │   │   └── PackReveal.tsx         ← Two-mode modal: preview (1 card + purchase CTA) and full (all leads, flip/reveal-all)
    │   ├── leads/
    │   │   ├── LeadCard.tsx           ← FIFA-style portrait card, tier gradients, 6 StatBars, unrevealed "?" state
    │   │   └── StatBar.tsx            ← Labeled fill bar (green ≥90, yellow ≥70, red <70)
    │   ├── dashboard/
    │   │   ├── MarketTicker.tsx       ← CSS marquee ticker, LIVE dot
    │   │   ├── NextDropTimer.tsx      ← 9AM AST countdown
    │   │   ├── WalletCard.tsx         ← Slot-machine balance roll, Quick Add toast
    │   │   ├── InventoryCard.tsx      ← Mock pack inventory
    │   │   └── KYCBanner.tsx          ← Amber warning with progress bar
    │   ├── marketplace/
    │   │   └── FreemiumHeatMap.tsx    ← Parish heatmap — blurred for free tier, live for Pro
    │   ├── pro/
    │   │   └── ScoutFilters.tsx       ← OVR/income range sliders, locked for non-Pro
    │   └── kyc/
    │       └── KycUploadForm.tsx      ← File inputs, submit, idle/submitting/submitted states
    ├── lib/
    │   ├── constants.ts               ← All named constants (prices, timers, OVR thresholds, etc.)
    │   ├── utils.ts                   ← formatCurrency(cents) → "TT$X,XXX.XX"
    │   ├── types/
    │   │   └── leads.ts               ← LeadTier, LeadStats, ScoredLead interfaces
    │   ├── utils/
    │   │   └── scoring.ts             ← OVR engine: calcFRH/INT/LOC/FIN/STA/FIT, calculateLeadOVR, getLeadTier, scoreLead
    │   ├── mock/
    │   │   └── leads.ts               ← Client-safe mock ScoredLeads (no pg dependency) — used by PackCard/PackReveal
    │   ├── supabase/
    │   │   ├── client.ts              ← createClient() for browser components
    │   │   ├── server.ts              ← createClient() for RSC + route handlers
    │   │   └── storage.ts             ← Service-role upload + signed URL helpers
    │   └── db/
    │       ├── client.ts              ← pg Pool → Supabase transaction pooler (port 6543)
    │       ├── agents.ts              ← getAgentByEmail(), provisionAgent()
    │       ├── packs.ts               ← getAvailablePacks() — real DB query
    │       ├── cracks.ts              ← crackPack(), getActiveCrack(), markPurchased(), etc.
    │       ├── wallet.ts              ← getTransactions()
    │       ├── journal.ts             ← getPurchasedPacks(), getLeadsForPack(), getJournalStats()
    │       ├── kyc.ts                 ← upsertDocument(), getDocuments(), setKycStatus(), getPendingAgents()
    │       └── timers.ts              ← Legacy (pack_timers based) — superseded by cracks.ts
    ├── middleware.ts                  ← Protects all non-auth routes; admin gate via ADMIN_EMAILS
    ├── tests/
    │   ├── setup.ts
    │   ├── lib/utils.test.ts
    │   ├── lib/utils/scoring.test.ts  ← 5 OVR scoring tests (high-value, BRONZE, LEGENDARY gate, tier boundaries)
    │   └── lib/db/packs.test.ts
    ├── .env.local                     ← Gitignored — credentials here
    ├── .env.local.example             ← All 13+ required env vars documented
    └── next.config.mjs                ← Must stay .mjs — Next.js 14 does not support .ts config
```

---

## Key Architecture Decisions

| Decision | Reason |
|---|---|
| Supabase Auth cloud only — no Supabase DB | Avoid self-hosting Supabase; use direct pg Pool for all DB queries |
| `pack_leads` join table (not just `lead_batch_id`) | Accurate per-pack lead counts; batch has 60 leads across 3 packs, pack has 20 |
| `pack_cracks` table (not Redis timers) | Simpler for dev; Redis (Upstash) is the production target but not wired yet |
| Two-phase KYC upload | All Storage uploads before any DB writes — prevents partial state on failure |
| All monetary values stored in cents (integer) | Avoid float precision issues; display layer does `/ 100` |
| `next.config.mjs` not `.ts` | Next.js 14 does not support `.ts` config (added in Next.js 15) |
| All DB logic in `lib/db/` | No raw SQL in components or page files |

---

## Database

**Local:** `postgresql://postgres:postgresql1234@localhost:5432/leadpack_tt`

**Supabase:** credentials in `web/.env.local`

### Migration Status

| Migration | Supabase |
|---|---|
| 001 core schema | ✅ |
| 002 lead batches | ✅ |
| 003 pack fields | ✅ |
| 004 pack timers | ✅ |
| 005 drop broken trigger | ✅ |
| 006 agent KYC | ✅ |
| 007 pack cracks + wallet | ✅ |
| 008 rename agents.name → full_name | ✅ |
| 009 three pack tiers (STANDARD/PREMIUM/LEGENDARY pack_name constraint) | ✅ |
| 010 lead_stats JSONB + calculated_ovr on leads | ✅ |

### Test Data (Supabase)
- Dev agent: `volatusfinancial33@gmail.com` — APPROVED, wallet topped up to TT$10,000 (1,000,000 cents)
- 3 packs seeded AVAILABLE: 1 STANDARD (5 leads, TT$150), 1 PREMIUM (20 leads, TT$600), 1 LEGENDARY (20 leads, TT$2,000)
- 45 real leads inserted via `seed_test_data.sql` with `fact_find` JSONB — OVR scored dynamically at crack time
- LEGENDARY leads: 8 with monthly_income ≥ 25,000 TTD created within 1h (meet FIN+FRH gate)

---

## Auth + KYC Flow

```
Register → Supabase email verification
  → /auth/callback → provisionAgent() → agents row (PENDING)
  → Redirect to /onboarding/kyc
    → Upload 3 docs (insurance license + 2 IDs) → POST /api/kyc/submit
    → Status: PENDING (waiting admin review)
Admin at /admin/kyc → PATCH /api/admin/kyc/[agentId] → APPROVED or REJECTED
  → APPROVED → can access /marketplace, /wallet, /journal
  → REJECTED → back to /onboarding/kyc with rejection reason shown
```

**Admin access:** set `ADMIN_EMAILS=email@example.com` in `.env.local` (comma-separated for multiple)

---

## Pack Crack / Purchase Flow

```
Agent clicks "Crack Pack"
  → POST /api/packs/crack
    → Writes to pack_cracks (UNIQUE per agent+pack, 5-min expiry)
    → Sets pack status → CRACKED
    → Returns expires_at

GET /api/packs/[id]/timer
  → Calls get_crack_remaining_seconds() DB function
  → Returns seconds remaining (0 if expired/no crack)

Agent clicks "Purchase"
  → POST /api/packs/purchase
    → Validates active crack window
    → Checks wallet balance ≥ price
    → DB transaction: debit wallet, insert pack_purchase, increment buyer_count, set status PURCHASED
    → Calls markPurchased() to close crack record
```

**Lockout:** After a crack expires, the same agent cannot re-crack the same pack for 24h (returns 423). Other agents are unaffected.

---

## Lead Intake Pipeline (n8n + Python)

**n8n workflow:** `Lead Intake Pipeline` — live at `http://localhost:5678`

```
POST /webhook/lead-intake
  → processor.py (validate + insert lead)
    → pending_count >= 20? → pack_engine.py
      → Creates lead_batches record
      → Creates 3 packs (A, B, C) linked via lead_batch_id
      → Links leads via pack_leads join table
      → Updates leads status → 'in_pack'
```

**`src/processor.py`** — validates + inserts one lead, returns `{status, lead_id, pending_count}`  
**`src/pack_engine.py`** — fires at 20 leads, creates batch + 3 packs

---

## Environment Variables

```bash
# Supabase (auth only)
NEXT_PUBLIC_SUPABASE_URL=          # ✅ set
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # ✅ set
SUPABASE_SERVICE_ROLE_KEY=         # ✅ set (needed for KYC storage uploads)

# Direct Postgres (Supabase transaction pooler — no local Postgres needed)
DATABASE_URL=postgresql://postgres.yvuoeshdfvqmgeqwvvrw:postgresql1234@aws-1-us-west-2.pooler.supabase.com:6543/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=volatusfinancial33@gmail.com

# Not yet wired — documented in .env.local.example
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WIPAY_ACCOUNT_NUMBER=
WIPAY_API_KEY=
WIPAY_CALLBACK_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
```

---

## Running Locally

```bash
# Web app — uses Supabase cloud DB directly (no local Postgres needed)
cd web && npm run dev      # http://localhost:3000 (will try 3001, 3002... if occupied)

# Tests
cd web && npm test

# n8n (lead intake)
# http://localhost:5678 — runs separately
```

**DATABASE_URL** points to Supabase transaction pooler (`aws-1-us-west-2.pooler.supabase.com:6543`) — no local Postgres required.

**If you get "missing required components" on next dev:** stale build cache.
```bash
taskkill //F //IM node.exe   # Windows — kill any running node process
rm -rf web/.next
cd web && npm run dev
```

---

## Immediate Next Steps

1. **Wire real leads into PackReveal** — crack API already returns `leads` array; replace `getMockLeadsForPack()` in PackCard with the leads from the crack API response (requires `leads` to have `lead_stats` JSONB populated via `src/import_excel_leads.py`)

2. **Wallet top-up** — WiPay/FAC integration: `POST /api/wallet/topup` + `POST /api/wallet/topup/callback` webhook, idempotency via `gateway_ref`

4. **Upstash Redis timers** — replace `pack_cracks` DB-based expiry with Redis keys (`pack_timer:{pack_id}:{agent_id}`) for true serverless compatibility

5. **WhatsApp outreach** — `POST /api/outreach/whatsapp`, Pro-only gate, log all sends to DB (n8n workflow scaffolded at `workflows/.../whatsapp-first-contact.workflow.ts`)

6. **Pro subscription** — subscription purchase flow, `subscription_tier` gating on Legendary packs and AI outreach

---

## Session History

### Session 6 (2026-04-10): Vercel Fix + Marketplace Redesign + Landing Page Update

**Vercel middleware crash fixed:**
- Root cause: `next@14.2.35` bundles `node:async_hooks` into Edge Runtime middleware — Vercel rejects it at invocation (all routes returned `MIDDLEWARE_INVOCATION_FAILED`)
- Fix: downgraded `next` to `14.2.20` in `web/package.json` — all routes returned 200
- Also added `serverComponentsExternalPackages: ['pg']` to `next.config.mjs`

**Marketplace redesigned (always 3 fixed tier slots):**
- `marketplace/page.tsx`: uses `.find()` per `pack_name` and always renders all 3 `<PackCard>` slots (null-safe)
- `PackCard.tsx` fully rewritten with distinct per-tier visual design:
  - STANDARD: cyan border/glow, ⚡ icon, 5 leads, TT$150
  - PREMIUM: violet border/glow, 💎 icon, 20 leads, TT$600
  - LEGENDARY: amber border/glow, ★ icon, 20 leads, TT$2,000
- When no pack is available for a tier, shows a disabled "No packs available" slot

**PackReveal bug fixes:**
- Removed duplicate `onClick` on outer div causing double-flip in preview mode
- Fixed stale closure in `handleRevealAll` using `useRef` to track latest `revealed` state across async loop

**Test data seeded (`seed_test_data.sql`):**
- Wallet topped to TT$10,000; 3 lead batches + 3 packs + 45 leads + 45 `pack_leads` entries inserted
- STANDARD: 5 leads; PREMIUM: 20 leads; LEGENDARY: 20 leads (8 Legendary-gate, 12 Gold)

**Landing page updated (all components corrected to match 3-tier product):**
- `HeroSection.tsx`: decorative cards now show correct prices, lead counts, buyer slots
- `PricingTiers.tsx`: Standard 5 leads/cyan, Premium 3 buyers, Legendary amber; "Pro Required" badge removed
- `HowItWorks.tsx`: Step 2 now lists correct lead counts per tier
- `FAQ.tsx`: first answer lists all three tiers; Premium buyer count corrected to 3

**Codex CLI installed and authenticated** (OpenAI Codex v0.118.0 via ChatGPT login)

### Session 5 (2026-04-09): Pack Reveal UX Redesign
- **Root cause fixed:** `router.refresh()` inside the timer `setInterval` was remounting the entire PackCard on every expiry, resetting `showReveal` to false and closing the modal after ~5 seconds
- **PackReveal redesigned** with two distinct modes:
  - `preview` mode (pre-purchase): full-screen modal, 1 face-down lead card (tap to flip), timer ring, Purchase Pack CTA. Timer no longer triggers a page refresh.
  - `full` mode (post-purchase): scrollable grid of all leads face-down, flip individually or "Reveal All" with staggered animation + LEGENDARY gold flash. Sticky header/footer.
- **PackCard updated:** `showReveal: boolean` replaced with `revealMode: 'none' | 'preview' | 'full'`. `router.refresh()` now only fires when user explicitly closes the full reveal modal.
- If preview modal is dismissed without purchasing, pack card shows inline timer + "View Preview & Purchase" button to reopen.
- Seeded 6 new packs (2 STANDARD batches + 1 LEGENDARY batch) into Supabase for testing.

### Session 4 (2026-04-09): OVR Scoring + Dashboard + Pro Tools
- Migration 010: `lead_stats` JSONB + `calculated_ovr` INTEGER on leads
- OVR scoring engine (`lib/utils/scoring.ts`): 6 T&T-specific stat calculators (FRH, INT, LOC, FIN, STA, FIT), tier boundaries, LEGENDARY gate
- FIFA-style LeadCard component + StatBar, PackReveal modal (initial version) with staggered flip + gold flash
- Dashboard Lobby: MarketTicker (CSS marquee), NextDropTimer (9AM AST), WalletCard (slot-machine roll), InventoryCard, KYCBanner
- Pro Tools page: FreemiumHeatMap (parish dots, blurred for free tier) + ScoutFilters (OVR/income range sliders)
- n8nac workflows scaffolded: WhatsApp First Contact + CRM Export Google Sheets
- `src/import_excel_leads.py` — idempotent Excel import with OVR scoring, phone validation, dry-run mode
- Mock leads moved to `lib/mock/leads.ts` (no pg import) to fix client component SSR error

### Session 3 (2026-04-09): Pack Crack/Purchase Flow + Wallet & Journal
- Migration 007: `pack_cracks` table + 3 DB functions
- Migration 008: `agents.name` → `agents.full_name`
- Full crack/timer/purchase API flow using `lib/db/cracks.ts`
- Wallet page: real balance + transaction history
- Journal pages: stats, purchased packs list, per-pack lead detail table
- Fixed lead count bug (was counting all 60 batch leads, now counts 20 per pack via `pack_leads`)

### Session 2 (2026-04-09): Marketplace Authentication + KYC Verification
- Migration 006: `kyc_status` on agents, `kyc_documents` table
- Registration with name + phone validation, auth callback provisions agent
- KYC upload flow (3 docs → Supabase Storage → admin review)
- Admin KYC review page + approve/reject API
- Dashboard KYC gate, middleware admin protection

### Session 1 (pre-2026-04-09): Foundation
- Core DB schema (migrations 001–005)
- n8n lead intake pipeline + processor.py + pack_engine.py
- Next.js scaffold: auth pages, dashboard shell, marketplace, PackCard component
