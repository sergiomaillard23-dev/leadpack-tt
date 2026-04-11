# LeadPack T&T — Handoff Document
**Last updated:** 2026-04-10  
**Branch:** `master` (deployed to Vercel)  
**Status:** ✅ All 10 stages complete — full Pro feature set shipped: KYC AI, upgrade flow, pipeline kanban, WhatsApp connector, analytics, CSV export, subscriptions cron, Pro badge.

---

## Project Overview

Gamified insurance lead marketplace for T&T agents. Agents buy packs of 20 leads tiered by exclusivity and income segment. Experience is designed to feel like opening a trading card pack. Full spec in `CLAUDE.md`.

---

## Current Stack

| Layer | Service | Status |
|---|---|---|
| Frontend | Next.js 14 App Router (`web/`) | ✅ Live |
| Auth | Supabase Auth cloud (free tier) | ✅ Wired |
| Database | PostgreSQL via Supabase cloud | ✅ Migrations 001–010 applied; 011–012 pending |
| Cache/Timers | Upstash Redis | ❌ Not started (using DB-based timers for now) |
| Background Jobs | n8n (local) | ✅ Lead intake pipeline live |
| Payments | WiPay / FAC | ✅ Mock mode live (Pro upgrade flow); live stub ready |
| Messaging | WhatsApp | ✅ wa.me connector (no API — opens agent's own WhatsApp) |
| AI | Claude Haiku (Anthropic) | ✅ KYC document auto-verification |
| Deployment | Vercel (frontend) | ✅ Live on Vercel |

---

## Current File Structure

```
leadpack-tt/
├── CLAUDE.md                          ← Full product spec — read before touching anything
├── handoff.md                         ← This file
├── migrations/
│   ├── 001_core_schema.sql
│   ├── 002_add_lead_batches.sql
│   ├── 003_pack_fields.sql
│   ├── 004_pack_timers.sql
│   ├── 005_drop_broken_trigger.sql
│   ├── 006_agent_kyc.sql
│   ├── 007_add_pack_cracks_and_wallet.sql
│   ├── 008_rename_agents_name_to_full_name.sql
│   ├── 009_pack_name_constraint.sql
│   ├── 010_lead_stats_ovr.sql
│   ├── 011_outreach_logs.sql          ← outreach_logs table (IF NOT EXISTS guards added)
│   └── 012_legendary_pro.sql          ← is_legendary_pro, pro_membership_expires_at,
│                                         pro_applications, whatsapp_templates, lead_notes,
│                                         pack_subscriptions, pipeline_status on leads,
│                                         release_at/pro_early_access_at on packs
└── web/
    ├── vercel.json                    ← Cron: /api/cron/deliver-subscriptions daily 08:00 AST
    ├── app/
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx             ← KYC gate + Header (isPro passed) + Sidebar
    │   │   ├── marketplace/page.tsx   ← Pack grid; Legendary packs locked for non-Pro
    │   │   ├── wallet/page.tsx
    │   │   ├── journal/
    │   │   │   ├── page.tsx
    │   │   │   └── [packId]/page.tsx  ← Lead table with WhatsApp button (Pro-gated)
    │   │   └── error.tsx
    │   ├── (pro)/                     ← Route group — layout redirects non-Pro to /pro/upgrade
    │   │   ├── layout.tsx             ← Pro gate (server component DB check)
    │   │   └── pro/
    │   │       ├── pipeline/page.tsx      ← Kanban board + Export CSV button
    │   │       ├── analytics/page.tsx     ← Metrics tiles + charts + Export CSV button
    │   │       ├── templates/page.tsx     ← WhatsApp template CRUD
    │   │       └── subscriptions/page.tsx ← Auto-delivery subscription management
    │   ├── pro/
    │   │   └── upgrade/
    │   │       ├── page.tsx           ← 4-step upgrade form (outside (pro) group)
    │   │       └── success/page.tsx
    │   ├── admin/
    │   │   └── kyc/page.tsx
    │   ├── onboarding/
    │   │   └── kyc/page.tsx
    │   └── api/
    │       ├── packs/
    │       │   ├── crack/route.ts
    │       │   ├── purchase/route.ts
    │       │   └── [id]/timer/route.ts
    │       ├── kyc/
    │       │   └── submit/route.ts        ← Uploads + Claude Haiku vision → APPROVED/REJECTED/PENDING
    │       ├── pro/
    │       │   ├── apply/route.ts         ← POST: create pro_application + WiPay checkout
    │       │   ├── export-csv/route.ts    ← GET: stream CSV of all agent leads
    │       │   ├── leads/[leadId]/
    │       │   │   ├── pipeline/route.ts  ← PATCH: update pipeline_status
    │       │   │   └── notes/route.ts     ← GET + POST: lead notes per agent
    │       │   ├── templates/
    │       │   │   ├── route.ts           ← GET list + POST create
    │       │   │   └── [id]/route.ts      ← PATCH (update/setDefault) + DELETE
    │       │   └── subscriptions/
    │       │       ├── route.ts           ← GET list + POST create
    │       │       └── [id]/route.ts      ← PATCH (toggle active) + DELETE
    │       ├── cron/
    │       │   └── deliver-subscriptions/route.ts  ← GET: advance due subscriptions
    │       ├── payments/
    │       │   ├── wipay/callback/route.ts
    │       │   └── mock-success/route.ts
    │       ├── admin/
    │       │   └── kyc/[agentId]/route.ts
    │       └── auth/callback/route.ts
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx             ← Shows ProBadge next to email for Pro members
    │   │   └── Sidebar.tsx            ← Free links (indigo); Pro links (amber gold border-l)
    │   ├── packs/
    │   │   ├── PackCard.tsx           ← Legendary Pro lock overlay + early-access countdown
    │   │   └── PackReveal.tsx
    │   ├── leads/
    │   │   ├── LeadCard.tsx
    │   │   └── StatBar.tsx
    │   ├── dashboard/
    │   │   ├── MarketTicker.tsx
    │   │   ├── NextDropTimer.tsx
    │   │   ├── WalletCard.tsx
    │   │   ├── InventoryCard.tsx
    │   │   └── KYCBanner.tsx
    │   ├── marketplace/
    │   │   └── FreemiumHeatMap.tsx
    │   ├── journal/
    │   │   └── WhatsAppButton.tsx     ← Opens WhatsAppModal for Pro; "WA ↑Pro" for free
    │   ├── pro/
    │   │   ├── ProBadge.tsx           ← Gold foil pill + SVG crown with jewels (size sm/md)
    │   │   ├── ScoutFilters.tsx
    │   │   ├── UpgradeForm.tsx        ← 4-step client form (account → KYC → billing → review)
    │   │   ├── PipelineBoard.tsx      ← dnd-kit kanban, optimistic updates
    │   │   ├── LeadSidePanel.tsx      ← Slide-over: details + notes + WhatsApp button
    │   │   ├── TemplatesManager.tsx   ← Template list with inline edit/delete/set-default
    │   │   ├── WhatsAppModal.tsx      ← Template picker → interpolation → wa.me link
    │   │   ├── AnalyticsDashboard.tsx ← Recharts: funnel bar + OVR histogram + detail table
    │   │   ├── ExportCsvButton.tsx    ← Client button: fetch → blob → browser download
    │   │   └── SubscriptionsManager.tsx ← Create/pause/resume/delete recurring subscriptions
    │   └── kyc/
    │       └── KycUploadForm.tsx      ← AI verdict phases: approved / pending / rejected + retry
    ├── lib/
    │   ├── constants.ts
    │   ├── utils.ts                   ← formatCurrency() + phoneToWaMe()
    │   ├── ai/
    │   │   └── kycVerify.ts           ← Claude Haiku vision → KycVerdict
    │   ├── payments/
    │   │   └── wipay.ts               ← WiPayService interface; Mock + Live implementations
    │   ├── types/leads.ts
    │   ├── utils/scoring.ts
    │   ├── mock/leads.ts
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   ├── server.ts
    │   │   └── storage.ts
    │   └── db/
    │       ├── client.ts
    │       ├── agents.ts              ← isActivePro(); is_legendary_pro, pro_membership_expires_at
    │       ├── packs.ts               ← release_at, pro_early_access_at; Legendary gate in WHERE
    │       ├── cracks.ts
    │       ├── wallet.ts
    │       ├── journal.ts
    │       ├── kyc.ts
    │       ├── timers.ts              ← Legacy
    │       ├── pro.ts                 ← upsertProApplication(), activateProApplication()
    │       ├── pipeline.ts            ← getPipelineLeads(), updatePipelineStatus(), notes
    │       ├── templates.ts           ← full CRUD + setDefaultTemplate()
    │       ├── subscriptions.ts       ← getSubscriptions(), createSubscription(), claimDueSubscriptions()
    │       └── analytics.ts           ← getAnalytics() → funnel, OVR buckets, spend, close rate
    ├── middleware.ts
    ├── tests/
    │   ├── setup.ts
    │   ├── lib/utils.test.ts
    │   ├── lib/utils/scoring.test.ts
    │   └── lib/db/packs.test.ts
    ├── .env.local
    ├── .env.local.example
    └── next.config.mjs
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
| `(pro)` route group layout for Pro gating | Server component DB check — same pattern as dashboard KYC gate; no Edge middleware |
| `isActivePro(agent)` single source of truth | `is_legendary_pro === true AND pro_membership_expires_at > now()` — checked everywhere |
| Separate WiPay credentials for Pro vs wallet top-up | `WIPAY_PRO_*` env vars — keeps subscription income separate from credit top-up income |
| wa.me connector, no WhatsApp Cloud API | Opens agent's own WhatsApp; zero API cost, zero Meta approval process needed |
| `PIPELINE_STATUSES` defined locally in PipelineBoard | Importing from `lib/db/pipeline.ts` pulls `pg` into client bundle (Node.js `net`/`tls` unavailable in browser) |
| `import type` for DB layer types in client components | Type imports erased at compile time; value imports are not — avoids bundling Node.js modules |
| Vercel cron via `vercel.json` | `0 12 * * *` UTC = 08:00 AST; protected by `CRON_SECRET` env var injected by Vercel |

---

## Database

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
| 009 three pack tiers | ✅ |
| 010 lead_stats JSONB + calculated_ovr | ✅ |
| 011 outreach_logs table | ⬜ Pending apply |
| 012 Legendary Pro (is_legendary_pro, pro_applications, whatsapp_templates, lead_notes, pipeline_status, pack_subscriptions) | ⬜ Pending apply |

### Test Data (Supabase)
- Dev agent: `volatusfinancial33@gmail.com` — APPROVED, wallet TT$10,000
- 3 packs seeded AVAILABLE: STANDARD (5 leads, TT$150), PREMIUM (20 leads, TT$600), LEGENDARY (20 leads, TT$2,000)
- 45 leads with `fact_find` JSONB + OVR scoring; 8 LEGENDARY-income leads

---

## Auth + KYC Flow

```
Register → Supabase email verification
  → /auth/callback → provisionAgent() → agents row (PENDING)
  → Redirect to /onboarding/kyc
    → Upload 3 docs → POST /api/kyc/submit
      → Claude Haiku vision (maxDuration=60s)
        → APPROVED  → kyc_status = APPROVED, redirect to /marketplace
        → REJECTED  → AI reason shown inline, agent can retry
        → PENDING   → falls back to manual admin review at /admin/kyc
```

**Admin access:** `ADMIN_EMAILS=email@example.com` in `.env.local`

---

## Pro Upgrade Flow

```
/pro/upgrade (4-step form)
  Step 1: Account details (prefilled)
  Step 2: KYC check (must be APPROVED — links to /onboarding/kyc if not)
  Step 3: Billing address
  Step 4: Review (TT$5,000/yr) → "Pay with WiPay"
    → POST /api/pro/apply → upsertProApplication() → WiPay checkout URL
    → Agent completes payment
    → POST /api/payments/wipay/callback → activateProApplication()
        → is_legendary_pro = true, pro_membership_expires_at = now() + 1 year
        → Seeds default WhatsApp template
    → Redirect to /pro/upgrade/success

Dev shortcut: WIPAY_MODE=mock → /api/payments/mock-success activates instantly
```

---

## Pack Crack / Purchase Flow

```
Agent clicks "Crack Pack"
  → POST /api/packs/crack → pack_cracks row (5-min window) → CRACKED status

GET /api/packs/[id]/timer → get_crack_remaining_seconds() DB function

Agent clicks "Purchase"
  → POST /api/packs/purchase
    → Validates crack window + wallet balance
    → DB transaction: debit wallet, insert pack_purchase, increment buyer_count
```

---

## Subscription Cron

```
vercel.json: "0 12 * * *" UTC (08:00 AST daily)
  → GET /api/cron/deliver-subscriptions
    → claimDueSubscriptions(): UPDATE pack_subscriptions
        SET next_delivery_at = next_delivery_at + cycle_days
        WHERE active = true AND next_delivery_at <= now()
    → Returns fired count + summary grouped by agent
```

Set `CRON_SECRET` in Vercel env vars — Vercel injects it as `Authorization: Bearer <secret>` automatically.

---

## Lead Intake Pipeline (n8n + Python)

```
POST /webhook/lead-intake → processor.py → pack_engine.py (at 20 leads)
  → Creates lead_batches + 3 packs (A/B/C) + pack_leads join rows
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # ✅ set
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # ✅ set
SUPABASE_SERVICE_ROLE_KEY=         # ✅ set

# Direct Postgres (Supabase transaction pooler)
DATABASE_URL=postgresql://...@aws-1-us-west-2.pooler.supabase.com:6543/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=volatusfinancial33@gmail.com

# AI
ANTHROPIC_API_KEY=                 # ✅ set

# WiPay — wallet top-up
WIPAY_ACCOUNT_NUMBER=
WIPAY_API_KEY=
WIPAY_CALLBACK_SECRET=

# WiPay — Pro subscription (separate account)
WIPAY_PRO_ACCOUNT_NUMBER=
WIPAY_PRO_API_KEY=
WIPAY_PRO_CALLBACK_SECRET=
WIPAY_MODE=mock                    # 'mock' | 'live'

# Cron
CRON_SECRET=                       # set in Vercel — auto-injected into cron requests

# Not yet wired
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Running Locally

```bash
cd web && npm run dev      # http://localhost:3000
cd web && npm test
```

**If you get "missing required components" on next dev:** stale build cache.
```bash
taskkill //F //IM node.exe
rm -rf web/.next
cd web && npm run dev
```

---

## Immediate Next Steps

### Must-do before production
1. **Apply migrations 011 + 012** to Supabase
2. **Set `CRON_SECRET`** in Vercel environment variables
3. **Wire LiveWiPayService** in `lib/payments/wipay.ts` (TODO stubs) + set `WIPAY_MODE=live`
4. **Wallet top-up** — WiPay integration for credit purchases (`POST /api/wallet/topup` + callback)

### Backlog
- **Upstash Redis timers** — replace DB-based `pack_cracks` expiry for true serverless compatibility
- **Subscription pack delivery** — cron currently only advances timestamps; actual pack assignment to agent on delivery still needs wiring to `pack_purchases`
- **Dispute system** — `POST /api/disputes`, admin review, `DISPUTE_REFUND` wallet transaction
- **WhatsApp outreach logging** — `outreach_logs` table exists (migration 011); log every wa.me open event

---

## Session History

### Session 8 (2026-04-10): Analytics + CSV Export + Subscriptions Cron + Pro Badge (Stages 7–10)

**Stage 7 — Analytics dashboard (`/pro/analytics`):**
- `lib/db/analytics.ts` — 4 parallel queries: spend/leads, pipeline funnel (zero-filled), OVR buckets, closed-won commission
- `AnalyticsDashboard.tsx` — Recharts `BarChart`: horizontal funnel (colour-coded per status), vertical OVR histogram (green ≥80, yellow ≥60, indigo below); 4 metric tiles (total leads, spend, revenue + ROI%, close rate with colour threshold)
- Recharts added to `package.json`

**Stage 8 — CSV export:**
- `GET /api/pro/export-csv` — single query with `DISTINCT ON`, proper CSV escaping, `Content-Disposition: attachment` header
- `ExportCsvButton.tsx` — fetch → `URL.createObjectURL` → programmatic `<a>` click → revoke
- Button added to pipeline and analytics page headers

**Stage 9 — Auto-subscription packs + Vercel cron:**
- `lib/db/subscriptions.ts` — `createSubscription()`, `toggleSubscription()`, `deleteSubscription()`, `claimDueSubscriptions()` (atomic UPDATE RETURNING)
- `GET|POST /api/pro/subscriptions` + `PATCH|DELETE /api/pro/subscriptions/[id]`
- `GET /api/cron/deliver-subscriptions` — advances `next_delivery_at` for all due rows; protected by `CRON_SECRET`
- `web/vercel.json` — `"0 12 * * *"` cron schedule
- `SubscriptionsManager.tsx` — create (tier + qty + cycle days), pause/resume toggle, delete
- `/pro/subscriptions` page added; sidebar updated

**Stage 10 — Pro badge + gold sidebar:**
- `ProBadge.tsx` — SVG crown with 3 jewels + linearGradient fill; dark pill with gold foil gradient text, amber glow shadow; `size="sm"` for header, `size="md"` for larger contexts
- `Header.tsx` — renders `<ProBadge size="sm" />` left of agent email when `isPro`; `isPro` passed from dashboard layout via `isActivePro(agent)`
- `Sidebar.tsx` — Pro links (Pipeline/Analytics/Templates/Subscriptions) styled with `border-l-2 border-amber-400` when active, warm amber hover states; free links retain indigo treatment

### Session 7 (2026-04-10): Legendary Pro + KYC AI + Pipeline Kanban + WhatsApp Connector (Stages 1–6)

**Stage 1 — Schema (migration 012):** `is_legendary_pro`, `pro_activated_at`, `pro_membership_expires_at` on agents; `pro_applications`, `whatsapp_templates`, `lead_notes`, `pack_subscriptions` tables; `pipeline_status` on leads; `release_at`/`pro_early_access_at` on packs.

**Stage 2 — Pro gating + upgrade flow:** `isActivePro()`, `(pro)` route group layout, `lib/payments/wipay.ts` (Mock + Live), `lib/db/pro.ts`, `/api/pro/apply` + `/api/payments/wipay/callback` + `/api/payments/mock-success`, 4-step `/pro/upgrade` form.

**Stage 3 — AI KYC:** `lib/ai/kycVerify.ts` (Claude Haiku vision), `KycUploadForm.tsx` rewritten with 5 phases.

**Stage 4 — Legendary pack gating:** `PackCard.tsx` lock overlay + early-access countdown; WHERE clause in `packs.ts`.

**Stage 5 — Pipeline kanban:** `lib/db/pipeline.ts`, `PipelineBoard.tsx` (dnd-kit), `LeadSidePanel.tsx`, pipeline + notes API routes.

**Stage 6 — WhatsApp wa.me connector:** `lib/db/templates.ts`, templates API, `TemplatesManager.tsx`, `WhatsAppModal.tsx` (interpolation → wa.me), `WhatsAppButton.tsx`, `phoneToWaMe()`.

### Session 6 (2026-04-10): Vercel Fix + Marketplace Redesign + Landing Page Update
- `next` downgraded to `14.2.20` (Edge Runtime `async_hooks` crash)
- Marketplace: 3 fixed tier slots, per-tier visual design (cyan/violet/amber)
- PackReveal bug fixes: double-flip, stale closure in reveal-all
- Landing page updated to match 3-tier product

### Session 5 (2026-04-09): Pack Reveal UX Redesign
- PackReveal two-mode redesign: `preview` (pre-purchase) + `full` (post-purchase)
- Fixed `router.refresh()` inside `setInterval` remounting PackCard every tick

### Session 4 (2026-04-09): OVR Scoring + Dashboard + Pro Tools
- Migration 010: `lead_stats` JSONB + `calculated_ovr`
- OVR engine, FIFA-style LeadCard, Dashboard lobby components, Pro Tools page

### Session 3 (2026-04-09): Pack Crack/Purchase Flow + Wallet & Journal
- Migration 007: `pack_cracks` + 3 DB functions; full crack/timer/purchase API

### Session 2 (2026-04-09): Marketplace Auth + KYC
- Migration 006: KYC; registration + auth callback; admin KYC review; dashboard gate

### Session 1 (pre-2026-04-09): Foundation
- Core DB schema (001–005); n8n lead intake pipeline; Next.js scaffold
