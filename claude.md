# claude.md — LeadPack T&T
> Persistent context file for Claude Code (CLI agent).
> Read this file before writing any code, creating any file, or making any architectural decision.
> Last updated: 2026-04-07

---

## 1. Project Overview

**Product Name:** LeadPack T&T
**Tagline:** The gamified insurance lead marketplace for Trinidad and Tobago agents.
**Purpose:** Agents buy "packs" of 20 insurance leads. Packs are tiered by exclusivity and income segment. The experience is designed to feel like opening a trading card pack — fast, competitive, and reward-driven.
**Market:** Trinidad and Tobago insurance agents. All money is TTD unless explicitly stated otherwise.
**Primary Users:** Licensed insurance agents (PALIG, Sagicor, Guardian, etc.)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR + API Routes in one repo |
| Auth | Supabase Auth | Email/password + magic link |
| Database | Supabase (PostgreSQL) | All migrations via SQL files |
| Cache / Timers | Upstash Redis | Serverless Redis for 5-min pack timers |
| Background Jobs | Modal | Lead batch processing, timer workers, AI outreach |
| Payments | WiPay / FAC | Primary payment processors for T&T |
| Messaging | WhatsApp Cloud API | Outreach and lead notifications |
| Deployment | Vercel (frontend) + Modal (workers) | |
| Styling | Tailwind CSS | Utility-first, no CSS-in-JS |
| State | Zustand | Lightweight global state |
| ORM | Supabase JS Client + raw SQL | No Prisma — use migrations directly |

**Never introduce a new dependency without a comment explaining why it is necessary.**

---

## 3. Core Business Logic

### 3.1 Lead Pack Structure

- 1 Pack = exactly 20 leads.
- Every lead upload event generates exactly 3 sibling packs: Pack A, Pack B, Pack C.
- All 3 packs share the same `lead_batch_id`.
- Packs are independent purchasable units but are linked by `lead_batch_id`.

### 3.2 Pack Types

| Type | Price (TTD) | Max Buyers | Notes |
|---|---|---|---|
| Exclusive | $100 | 1 | One agent owns the pack entirely |
| Community | $30 | 3 | Up to 3 agents share the same pack |

**Hard Rules:**
- A Community pack must never be sold to more than 3 buyers. Enforce at DB level with a check constraint.
- An Exclusive pack must never have more than 1 buyer. Enforce at DB level.
- Once a pack is sold as Exclusive, it cannot be converted to Community, and vice versa. Pack type is immutable after creation.

### 3.3 The 5-Minute Priority Window (Pack Timer)

This is the core gamification mechanic. Treat it like a state machine.

**States:** `AVAILABLE` → `CRACKED` → `PRIORITY_WINDOW` → `RELEASED` or `PURCHASED`

**Flow:**
1. Agent cracks a pack (views lead previews). Status moves to `CRACKED`.
2. A 5-minute countdown begins immediately. Store the expiry timestamp in Upstash Redis with key `pack_timer:{pack_id}:{agent_id}`.
3. During the 5-minute window, the cracking agent has priority purchase rights on any sibling pack (Pack A, B, or C from the same `lead_batch_id`).
4. If the agent purchases a sibling pack within 5 minutes: status moves to `PURCHASED`. Timer is cleared from Redis.
5. If the timer expires without purchase: all sibling packs return to `AVAILABLE` in the main rotation. Timer key is deleted from Redis.

**Rules:**
- Only one agent can hold a priority window on a given `lead_batch_id` at a time.
- If another agent attempts to crack a pack from the same batch while a timer is active, return a `423 Locked` response with the remaining seconds.
- The Modal worker `check_expired_timers` runs every 60 seconds and releases any packs whose Redis keys have expired.

### 3.4 Subscription Plan

| Feature | Free Tier | Pro ($200 TTD/mo) |
|---|---|---|
| Credits | Purchase only | 5 free credits/month |
| AI Outreach | No | Yes |
| Legendary Packs | No | Yes |
| Pack discount | None | None (credits are 1:1) |

**Legendary Packs:** Leads where the prospect's estimated household income is >= $25,000 TTD/month. These are flagged during lead ingestion and are only visible and purchasable by Pro subscribers.

### 3.5 Wallet and Credit System

- 1 Credit = $1 TTD. No exceptions.
- Credits are added to the wallet via WiPay/FAC top-up or monthly Pro subscription grant.
- Credits are debited at the moment of pack purchase. If the wallet balance is insufficient, reject the purchase with a clear error — do not allow negative balances.
- Credits never expire once earned (subscription credits included).
- All wallet transactions must be written to the `wallet_transactions` table with a `type` field: `TOP_UP`, `SUBSCRIPTION_GRANT`, `PACK_PURCHASE`, `DISPUTE_REFUND`.

### 3.6 Dispute System

Agents can flag individual leads within a purchased pack as bad/invalid.

**Valid dispute reasons:**
- `WRONG_NUMBER` — phone number is incorrect or disconnected
- `DUPLICATE` — lead already exists in agent's CRM
- `FAKE_LEAD` — name/contact info is clearly fabricated
- `OUT_OF_MARKET` — prospect is not in T&T

**Flow:**
1. Agent submits a dispute for a specific `lead_id` with a `reason` and optional `notes`.
2. System sets `dispute_status` to `PENDING`.
3. An admin reviews the dispute within 48 hours (or an automated check runs for `WRONG_NUMBER` via a number validation API).
4. If approved: `dispute_status` → `APPROVED`. One credit is refunded to the agent's wallet. Write a `DISPUTE_REFUND` transaction.
5. If rejected: `dispute_status` → `REJECTED`. No refund. Agent is notified via WhatsApp.
6. An agent may not dispute more than 5 leads per pack. Enforce this at the API layer.

---

## 4. Database Rules

**All schema changes must be done via numbered SQL migration files.**
**Never modify the database schema directly in the Supabase dashboard and leave it undocumented.**
Migration file naming convention: `0001_initial_schema.sql`, `0002_add_disputes.sql`, etc.

### 4.1 Core Tables (Schema Outline)

```sql
-- Agents (extends Supabase auth.users)
agents (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text NOT NULL, -- must be 1-868-XXX-XXXX format
  subscription_tier text NOT NULL DEFAULT 'FREE', -- 'FREE' | 'PRO'
  subscription_expires_at timestamptz,
  wallet_balance integer NOT NULL DEFAULT 0, -- stored in cents (TTD)
  created_at timestamptz DEFAULT now()
)

-- Lead Batches (the source upload event)
lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES agents(id),
  income_tier text NOT NULL, -- 'STANDARD' | 'LEGENDARY'
  created_at timestamptz DEFAULT now()
)

-- Packs (3 per batch)
packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_batch_id uuid REFERENCES lead_batches(id),
  pack_label text NOT NULL, -- 'A' | 'B' | 'C'
  pack_type text NOT NULL, -- 'EXCLUSIVE' | 'COMMUNITY'
  status text NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'CRACKED' | 'PURCHASED' | 'RETIRED'
  price_ttd integer NOT NULL, -- 10000 = $100 TTD (stored in cents)
  buyer_count integer NOT NULL DEFAULT 0,
  max_buyers integer NOT NULL, -- 1 for EXCLUSIVE, 3 for COMMUNITY
  CONSTRAINT chk_buyer_count CHECK (buyer_count <= max_buyers)
)

-- Leads (20 per pack)
leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_batch_id uuid REFERENCES lead_batches(id),
  full_name text NOT NULL,
  phone text NOT NULL, -- validated 1-868 format
  email text,
  parish text, -- e.g. 'Port of Spain', 'San Fernando', 'Chaguanas'
  estimated_income_ttd integer, -- monthly, used to flag LEGENDARY
  source text, -- 'FACEBOOK' | 'REFERRAL' | 'COLD' etc.
  created_at timestamptz DEFAULT now()
)

-- Pack Purchases
pack_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid REFERENCES packs(id),
  agent_id uuid REFERENCES agents(id),
  purchased_at timestamptz DEFAULT now(),
  credits_spent integer NOT NULL
)

-- Wallet Transactions
wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id),
  type text NOT NULL, -- 'TOP_UP' | 'SUBSCRIPTION_GRANT' | 'PACK_PURCHASE' | 'DISPUTE_REFUND'
  amount_credits integer NOT NULL, -- positive = credit added, negative = debit
  reference_id uuid, -- pack_id or dispute_id depending on type
  created_at timestamptz DEFAULT now()
)

-- Disputes
disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  agent_id uuid REFERENCES agents(id),
  reason text NOT NULL, -- 'WRONG_NUMBER' | 'DUPLICATE' | 'FAKE_LEAD' | 'OUT_OF_MARKET'
  notes text,
  status text NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
)

-- Trader Journal (analytics per lead)
trader_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id),
  lead_id uuid REFERENCES leads(id),
  pack_purchase_id uuid REFERENCES pack_purchases(id),
  status text NOT NULL DEFAULT 'UNCONTACTED', -- 'UNCONTACTED' | 'CONTACTED' | 'MEETING' | 'CLOSED_WON' | 'CLOSED_LOST'
  commission_earned_ttd integer DEFAULT 0, -- agent inputs this manually
  notes text,
  updated_at timestamptz DEFAULT now()
)
```

### 4.2 DB Constraints to Always Enforce

- `phone` fields: must match regex `^1-868-\d{3}-\d{4}$` — enforce via DB check constraint or API validation.
- `wallet_balance` on `agents` must never go below 0 — enforce via check constraint.
- `buyer_count <= max_buyers` on `packs` — enforce via check constraint.
- `pack_label` must be one of `'A'`, `'B'`, `'C'` — enforce via check constraint.
- All timestamps must be stored in UTC. Display in AST (UTC-4) on the frontend.

---

## 5. API Workflows

All API routes live in `app/api/` using Next.js App Router Route Handlers.
All responses follow this envelope: `{ success: boolean, data?: any, error?: string }`.
All monetary values are passed and stored in **cents (TTD)**. Format for display only on the frontend.

### 5.1 Key Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/packs/crack` | Crack a pack, start the 5-min timer |
| POST | `/api/packs/purchase` | Purchase a pack (deducts wallet) |
| GET | `/api/packs/available` | List available packs for the marketplace |
| GET | `/api/packs/:id/timer` | Get remaining seconds on priority window |
| POST | `/api/wallet/topup` | Initiate WiPay/FAC payment for credits |
| POST | `/api/wallet/topup/callback` | WiPay/FAC webhook — credit wallet on success |
| POST | `/api/disputes` | Submit a dispute for a lead |
| GET | `/api/journal` | Get agent's trader journal entries |
| PATCH | `/api/journal/:id` | Update lead status or commission |
| POST | `/api/outreach/whatsapp` | Trigger AI WhatsApp outreach (Pro only) |
| GET | `/api/admin/disputes` | Admin: list pending disputes |
| PATCH | `/api/admin/disputes/:id` | Admin: approve or reject a dispute |

### 5.2 WiPay / FAC Payment Flow

1. Agent selects a credit top-up amount.
2. Frontend calls `POST /api/wallet/topup` which creates a pending `wallet_transactions` record and returns a WiPay payment URL.
3. Agent completes payment on WiPay's hosted page.
4. WiPay sends a webhook to `POST /api/wallet/topup/callback`.
5. Verify the webhook signature. If valid and payment status is `SUCCESS`: update `wallet_transactions` to confirmed, increment `agents.wallet_balance`.
6. Never credit the wallet before the webhook is verified. Never credit it twice (use idempotency key = WiPay transaction ID).

### 5.3 WhatsApp Outreach (Pro Only)

- Only available to agents with `subscription_tier = 'PRO'`.
- All message templates must use professional Caribbean business English. Avoid slang.
- Phone numbers must be formatted as `18681234567` (no dashes, no plus) for the WhatsApp Cloud API.
- All outreach events must be logged — do not fire and forget.

**Approved template pattern:**
> "Good day [Name], my name is [Agent Name] from [Agency]. I am reaching out regarding a financial planning consultation. Would you be available for a brief call this week? You may reply to this message or call me at [Agent Phone]."

---

## 6. Analytics — Trader Journal Dashboard

The dashboard is inspired by TraderVue. It gives agents a clear view of their lead ROI.

### 6.1 Metrics to Display

| Metric | Calculation |
|---|---|
| Total Spent (TTD) | Sum of `credits_spent` across all `pack_purchases` for the agent |
| Total Earned (TTD) | Sum of `commission_earned_ttd` from `trader_journal` where status = `CLOSED_WON` |
| ROI (%) | `((Total Earned - Total Spent) / Total Spent) * 100` |
| Win Rate (%) | `(CLOSED_WON count / (CLOSED_WON + CLOSED_LOST) count) * 100` |
| Pipeline Value | Count of leads in `CONTACTED` or `MEETING` status |
| Dispute Rate | `(disputes filed / total leads purchased) * 100` |

### 6.2 Lead Status Flow

`UNCONTACTED` → `CONTACTED` → `MEETING` → `CLOSED_WON` or `CLOSED_LOST`

An agent can move a lead forward or backward in this funnel manually. No automated status transitions.

---

## 7. UI/UX Guidelines

### 7.1 General Principles

- The UI should feel fast and slightly gamified — think a mix of a trading platform and a card marketplace.
- Dark mode is the primary theme. Light mode is optional.
- All currency displays must use the format: `TT$100.00` or `TT$1,250.00`.
- All dates and times must display in AST (UTC-4). Never display raw UTC to the user.
- Phone number display format: `1-868-XXX-XXXX`.

### 7.2 Pack Card Component

Each pack on the marketplace renders as a card with:
- Pack label (A, B, or C) prominently displayed
- Pack type badge (EXCLUSIVE or COMMUNITY)
- Income tier badge (STANDARD or LEGENDARY — Legendary is gold/amber)
- Price in TTD
- Buyer slots remaining (e.g., "2/3 spots taken" for Community)
- A "Crack Pack" CTA button
- If a priority timer is active for the current agent: show a live countdown

### 7.3 Timer Display

- Show a circular countdown ring when the 5-minute window is active.
- Color: green above 3 min, yellow 1-3 min, red below 1 min.
- On expiry: animate the pack back into the rotation with a visual "released" state.

### 7.4 Wallet Display

- Always visible in the top navigation bar: `TT$XX.XX` with a wallet icon.
- Clicking it opens a slide-over showing transaction history.

---

## 8. Localization Rules

These rules are non-negotiable. Apply them in every relevant piece of code.

- **Currency:** All values stored in cents (integer). Display as `TT$X,XXX.XX`.
- **Timezone:** Store all timestamps in UTC. Convert to AST (UTC-4 / `America/Port_of_Spain`) for all display, emails, and WhatsApp messages.
- **Phone validation:** All T&T phone numbers must match `^1-868-\d{3}-\d{4}$`. Reject anything else at the API and form level.
- **WhatsApp formatting:** Strip formatting to `18681234567` before sending to the WhatsApp Cloud API.
- **Language:** Professional Caribbean business English in all user-facing copy and outreach templates. No slang. No UK or US idioms that do not translate locally.
- **Parishes:** Use correct T&T parish/borough names: Port of Spain, San Fernando, Chaguanas, Arima, Point Fortin, Sangre Grande, Siparia, Tobago.

---

## 9. Deployment and Local Context

### 9.1 Services

| Service | Purpose | Notes |
|---|---|---|
| Vercel | Next.js frontend + API routes | Connect to GitHub, auto-deploy on push to `main` |
| Supabase | PostgreSQL + Auth + Storage | All DB migrations must be applied via CLI |
| Upstash Redis | Pack timers (5-min windows) | Use REST API client for serverless compatibility |
| Modal | Background workers | `check_expired_timers`, lead batch jobs, AI outreach queues |
| WiPay / FAC | Payment processing | Sandbox credentials in `.env.local` |
| WhatsApp Cloud API | Outreach messaging | Meta Business account required |

### 9.2 Environment Variables

Always check for these variables before writing any integration code:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# WiPay / FAC
WIPAY_ACCOUNT_NUMBER=
WIPAY_API_KEY=
WIPAY_CALLBACK_SECRET=

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Modal
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

### 9.3 Local Development

```bash
# Install dependencies
npm install

# Run Supabase locally
supabase start

# Apply migrations
supabase db push

# Run dev server
npm run dev

# Deploy Modal workers
modal deploy workers/check_expired_timers.py
```

### 9.4 Branch and Migration Rules

- `main` is production. Never push directly to `main`.
- All features go through a feature branch + PR.
- Every DB change requires a new numbered migration file in `supabase/migrations/`.
- Never edit an existing migration file after it has been applied to production.

---

## 10. Coding Standards

- Write modular, single-responsibility functions. No god functions.
- Every function that touches the DB must handle errors explicitly — no silent failures.
- No raw SQL in component files. All DB logic lives in `lib/db/` or Supabase RPC functions.
- No inline styles. Use Tailwind utility classes only.
- All API routes must validate the session via Supabase Auth before processing any request.
- Do not hard-code TTD amounts or timer durations. Use named constants in `lib/constants.ts`.

```typescript
// lib/constants.ts
export const PACK_SIZE = 20;
export const PACKS_PER_BATCH = 3;
export const PRIORITY_WINDOW_SECONDS = 300; // 5 minutes
export const EXCLUSIVE_PRICE_CENTS = 10000; // TT$100.00
export const COMMUNITY_PRICE_CENTS = 3000; // TT$30.00
export const COMMUNITY_MAX_BUYERS = 3;
export const LEGENDARY_INCOME_THRESHOLD_TTD = 25000; // monthly
export const PRO_SUBSCRIPTION_PRICE_CENTS = 20000; // TT$200.00/mo
export const PRO_MONTHLY_FREE_CREDITS = 5;
export const MAX_DISPUTES_PER_PACK = 5;
export const TIMEZONE = 'America/Port_of_Spain';
export const CURRENCY_LOCALE = 'en-TT';
```

---

*End of claude.md — LeadPack T&T*
