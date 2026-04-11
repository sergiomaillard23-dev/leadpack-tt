# LeadPack T&T — Handoff Document
**Last updated:** 2026-04-10  
**Branch:** `master` (deployed to Vercel)  
**Status:** ✅ Stage 6 complete — Legendary Pro tier, KYC AI verification, WiPay Pro upgrade flow, pipeline kanban, WhatsApp wa.me connector with templates all live.

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
│   ├── 011_ai_kyc_fields.sql          ← kyc_ai_verdict, kyc_ai_reason on agents
│   └── 012_legendary_pro.sql          ← is_legendary_pro, pro_membership_expires_at, pro_applications,
│                                         whatsapp_templates, lead_notes, pack_subscriptions,
│                                         pipeline_status on leads, release_at/pro_early_access_at on packs
└── web/
    ├── app/
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx      ← Name, phone (validated), email, password
    │   ├── (dashboard)/
    │   │   ├── layout.tsx             ← KYC gate + Header + Sidebar
    │   │   ├── marketplace/page.tsx   ← Pack grid; Legendary packs locked for non-Pro
    │   │   ├── wallet/page.tsx
    │   │   ├── journal/
    │   │   │   ├── page.tsx
    │   │   │   └── [packId]/page.tsx  ← Lead table with WhatsApp button (Pro-gated)
    │   │   └── error.tsx
    │   ├── (pro)/                     ← Route group — layout redirects non-Pro to /pro/upgrade
    │   │   ├── layout.tsx             ← Pro gate (server component DB check)
    │   │   └── pro/
    │   │       ├── pipeline/page.tsx  ← Kanban board (NEW/CONTACTED/QUOTED/CLOSED_WON/CLOSED_LOST)
    │   │       └── templates/page.tsx ← WhatsApp template CRUD
    │   ├── pro/
    │   │   └── upgrade/
    │   │       ├── page.tsx           ← 4-step upgrade form (outside (pro) group — accessible to all)
    │   │       └── success/page.tsx   ← Post-payment success screen
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
    │       │   └── submit/route.ts    ← Uploads docs + calls Claude Haiku vision → auto APPROVED/REJECTED/PENDING
    │       ├── pro/
    │       │   ├── apply/route.ts     ← POST: create pro_application + WiPay checkout session
    │       │   ├── leads/
    │       │   │   └── [leadId]/
    │       │   │       ├── pipeline/route.ts  ← PATCH: update pipeline_status
    │       │   │       └── notes/route.ts     ← GET + POST: lead notes per agent
    │       │   └── templates/
    │       │       ├── route.ts       ← GET list + POST create
    │       │       └── [id]/route.ts  ← PATCH (update / setDefault) + DELETE
    │       ├── payments/
    │       │   ├── wipay/callback/route.ts    ← POST: WiPay webhook → activateProApplication()
    │       │   └── mock-success/route.ts      ← GET: dev-only instant activation + redirect
    │       ├── admin/
    │       │   └── kyc/[agentId]/route.ts
    │       └── auth/callback/route.ts
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   └── Sidebar.tsx            ← Now includes Pipeline + Templates links for Pro
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
    │   │   ├── ScoutFilters.tsx
    │   │   ├── UpgradeForm.tsx        ← 4-step client form (account → KYC check → billing → review)
    │   │   ├── PipelineBoard.tsx      ← Kanban with dnd-kit drag-and-drop, optimistic updates
    │   │   ├── LeadSidePanel.tsx      ← Slide-over: lead details + notes thread + WhatsApp button
    │   │   ├── TemplatesManager.tsx   ← Template list with inline edit/delete/set-default
    │   │   └── WhatsAppModal.tsx      ← Template picker → variable interpolation → wa.me link
    │   └── kyc/
    │       └── KycUploadForm.tsx      ← Shows AI verdict (approved/pending/rejected + reason + retry)
    ├── lib/
    │   ├── constants.ts               ← Includes LEGENDARY_PRO_ANNUAL_PRICE_CENTS, DEFAULT_WHATSAPP_TEMPLATE_BODY
    │   ├── utils.ts                   ← formatCurrency() + phoneToWaMe() (strips non-digits)
    │   ├── ai/
    │   │   └── kycVerify.ts           ← verifyKycDocuments() → KycVerdict via Claude Haiku vision
    │   ├── payments/
    │   │   └── wipay.ts               ← WiPayService interface; MockWiPayService (dev); LiveWiPayService (stub)
    │   ├── types/
    │   │   └── leads.ts
    │   ├── utils/
    │   │   └── scoring.ts
    │   ├── mock/
    │   │   └── leads.ts
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   ├── server.ts
    │   │   └── storage.ts
    │   └── db/
    │       ├── client.ts
    │       ├── agents.ts              ← Agent type includes is_legendary_pro, pro_membership_expires_at; isActivePro()
    │       ├── packs.ts               ← Pack type includes release_at, pro_early_access_at; Legendary gate in WHERE
    │       ├── cracks.ts
    │       ├── wallet.ts
    │       ├── journal.ts
    │       ├── kyc.ts
    │       ├── timers.ts              ← Legacy
    │       ├── pro.ts                 ← upsertProApplication(), activateProApplication(), getProApplication()
    │       ├── pipeline.ts            ← getPipelineLeads(), updatePipelineStatus(), getLeadNotes(), addLeadNote()
    │       └── templates.ts           ← getTemplates(), createTemplate(), updateTemplate(), deleteTemplate(), setDefaultTemplate()
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
| `isActivePro(agent)` single source of truth | `is_legendary_pro === true AND pro_membership_expires_at > now()` — checked everywhere Pro content is gated |
| Separate WiPay credentials for Pro vs wallet top-up | `WIPAY_PRO_*` env vars — keeps subscription income separate from credit top-up income |
| wa.me connector, no WhatsApp Cloud API | Opens agent's own WhatsApp; zero API cost, zero Meta approval process needed |
| `PIPELINE_STATUSES` defined locally in PipelineBoard | Importing from `lib/db/pipeline.ts` pulls `pg` into client bundle (Node.js `net`/`tls` not available in browser) |
| `import type` for DB layer types in client components | Same reason as above — type imports are erased at compile time, value imports are not |

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
| 009 three pack tiers | ✅ |
| 010 lead_stats JSONB + calculated_ovr | ✅ |
| 011 AI KYC fields (kyc_ai_verdict, kyc_ai_reason) | ⬜ Pending apply |
| 012 Legendary Pro (is_legendary_pro, pro_applications, whatsapp_templates, lead_notes, pipeline_status, pack_subscriptions) | ⬜ Pending apply |

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
      → Calls verifyKycDocuments() (Claude Haiku vision, maxDuration=60s)
        → APPROVED  → agent.kyc_status = APPROVED, redirect to /marketplace
        → REJECTED  → shows AI reason inline, agent can retry
        → PENDING   → uncertain case, falls back to manual admin review
Admin at /admin/kyc → PATCH /api/admin/kyc/[agentId] → APPROVED or REJECTED
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
SUPABASE_SERVICE_ROLE_KEY=         # ✅ set (KYC storage uploads)

# Direct Postgres (Supabase transaction pooler)
DATABASE_URL=postgresql://postgres.yvuoeshdfvqmgeqwvvrw:...@aws-1-us-west-2.pooler.supabase.com:6543/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=volatusfinancial33@gmail.com

# AI (KYC verification)
ANTHROPIC_API_KEY=                 # ✅ set — Claude Haiku vision

# WiPay — wallet top-up (existing)
WIPAY_ACCOUNT_NUMBER=
WIPAY_API_KEY=
WIPAY_CALLBACK_SECRET=

# WiPay — Pro subscription (separate account)
WIPAY_PRO_ACCOUNT_NUMBER=
WIPAY_PRO_API_KEY=
WIPAY_PRO_CALLBACK_SECRET=
WIPAY_MODE=mock                    # 'mock' (dev) | 'live' (prod)

# Not yet wired
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
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

### Stage 7 — Analytics Dashboard (`/pro/analytics`)
- 5 metric tiles: total leads, pipeline funnel, close rate, spend vs closed-won value, OVR distribution histogram
- Recharts (already in project)
- Server-side queries in `lib/db/analytics.ts`

### Stage 8 — CSV Export
- "Export CSV" button on pipeline + analytics pages
- `GET /api/pro/export-csv` route
- Columns: lead_id, first_name, last_name, phone, email, ovr, pack_source, pipeline_status, last_note, acquired_at

### Stage 9 — Auto-subscription Packs + Cron
- `pack_subscriptions` table management (`/pro/subscriptions` page)
- `GET /api/cron/deliver-subscriptions` — Vercel cron job, runs daily

### Stage 10 — Cosmetic
- LEGENDARY PRO badge everywhere agent names render
- Gold foil border (`pro-card` class) on Pro agent cards

### Backlog
- **Apply migrations 011 + 012** to Supabase (pending)
- **Wallet top-up** — WiPay integration for credit purchases (`POST /api/wallet/topup` + callback)
- **Upstash Redis timers** — replace DB-based `pack_cracks` expiry

---

## Session History

### Session 7 (2026-04-10): Legendary Pro + KYC AI + Pipeline Kanban + WhatsApp Connector (Stages 1–6)

**Stage 1 — Schema (migration 012_legendary_pro.sql):**
- Added `is_legendary_pro`, `pro_activated_at`, `pro_membership_expires_at` to `agents`
- New tables: `pro_applications`, `whatsapp_templates` (partial unique index for one default per agent), `lead_notes`, `pack_subscriptions`
- Added `pipeline_status` to `leads`, `release_at`/`pro_early_access_at` to `packs`

**Stage 2 — Pro gating + upgrade flow:**
- `isActivePro(agent)` in `lib/db/agents.ts` — single source of truth
- `(pro)` route group layout — server-side DB check, redirects to `/pro/upgrade`
- `lib/payments/wipay.ts` — `WiPayService` interface, `MockWiPayService` (dev instant-success), `LiveWiPayService` (stub)
- `lib/db/pro.ts` — `upsertProApplication()`, `activateProApplication()` (transaction: flags agent, seeds default template)
- `POST /api/pro/apply` → WiPay checkout; `POST /api/payments/wipay/callback` → activates; `GET /api/payments/mock-success` → dev shortcut
- `/pro/upgrade` — 4-step form: account → KYC check → billing → TT$5,000 review

**Stage 3 — AI KYC verification:**
- `lib/ai/kycVerify.ts` — sends 3 docs to Claude Haiku vision; returns `APPROVED | REJECTED | PENDING`
- `POST /api/kyc/submit` updated — auto-approves on `APPROVED`, shows rejection reason for `REJECTED`, falls back to manual review for `PENDING`
- `KycUploadForm.tsx` rewritten — 4 UI phases (idle / submitting / approved / pending / rejected)

**Stage 4 — Legendary pack gating:**
- `packs.ts` — `release_at`, `pro_early_access_at` fields; WHERE clause excludes packs in early-access window from non-Pro agents
- `PackCard.tsx` — Legendary Pro lock overlay with amber lock icon + "Upgrade to Pro" CTA; early-access countdown badge

**Stage 5 — Pipeline kanban:**
- `lib/db/pipeline.ts` — `getPipelineLeads()` (DISTINCT ON dedup), `updatePipelineStatus()`, `getLeadNotes()`, `addLeadNote()`
- `PipelineBoard.tsx` — dnd-kit drag-and-drop, optimistic updates with server rollback
- `LeadSidePanel.tsx` — slide-over: lead details + notes thread + add-note form
- `PATCH /api/pro/leads/[leadId]/pipeline` + `GET|POST /api/pro/leads/[leadId]/notes`

**Stage 6 — WhatsApp wa.me connector:**
- `lib/db/templates.ts` — full CRUD + setDefault (transaction)
- `GET|POST /api/pro/templates` + `PATCH|DELETE /api/pro/templates/[id]`
- `TemplatesManager.tsx` — inline create/edit/delete/set-default
- `WhatsAppModal.tsx` — template picker → variable interpolation (`{{firstName}}` etc.) → editable body → confirmation → opens `wa.me/18681234567?text=<encoded>`
- `WhatsAppButton.tsx` rewritten — Pro: opens modal; non-Pro: "WA ↑Pro" label
- `phoneToWaMe()` added to `lib/utils.ts`

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
