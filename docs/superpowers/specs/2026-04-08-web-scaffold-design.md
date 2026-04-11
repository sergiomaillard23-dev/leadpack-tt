# Design: `web/` App Scaffold
**Date:** 2026-04-08  
**Status:** Approved  
**Scope:** Next.js 14 App Router scaffold with Supabase Auth, protected layout, and marketplace mock UI

---

## 1. Context

The lead intake pipeline (n8n + Python) is complete. Packs are created in PostgreSQL on Railway. This scaffold is the frontend product that agents use — it does not yet implement real API routes or data fetching. Those come in the next session.

---

## 2. Deployment Architecture

| Layer | Service | Notes |
|---|---|---|
| Next.js app | Railway | `web/` subdirectory, Node runtime |
| PostgreSQL | Railway | Existing migrations applied |
| Auth | Supabase Auth cloud (free tier) | Auth tokens only — no Supabase DB queries |

Supabase is used **only for authentication**. All business data lives in Railway Postgres. The Supabase JS client (`@supabase/ssr`) handles session cookies via Next.js middleware.

---

## 3. Directory Structure

```
web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          ← email/password + magic link (two tabs)
│   │   └── register/
│   │       └── page.tsx          ← email + password, auto-confirms in dev
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← protected shell: Header + Sidebar
│   │   └── marketplace/
│   │       └── page.tsx          ← mock pack grid, initial landing after login
│   ├── layout.tsx                ← root layout, dark theme, Tailwind base
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Header.tsx            ← wallet balance badge + agent name/avatar
│   │   └── Sidebar.tsx           ← nav links: Marketplace, Journal, Wallet
│   └── packs/
│       └── PackCard.tsx          ← pack card component, typed to real DB shape
├── lib/
│   ├── supabase/
│   │   ├── client.ts             ← createBrowserClient (client components)
│   │   └── server.ts             ← createServerClient (RSC + middleware)
│   ├── db/
│   │   └── packs.ts              ← getAvailablePacks() — returns mock fixture now
│   └── constants.ts              ← PACK_SIZE, PRICES, TIMER, TIMEZONE, etc.
├── middleware.ts                  ← protects all (dashboard) routes
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Auth Flow

### Login page (`/login`)
- Two tabs: **Password** (email + password) and **Magic Link** (email only, sends OTP)
- On success → `router.push('/marketplace')`
- Error states shown inline (wrong password, user not found, etc.)

### Register page (`/register`)
- Email + password form
- On success → auto-redirect to `/marketplace` (Supabase auto-confirms in dev; requires email confirmation in prod)

### Middleware (`middleware.ts`)
- Runs on every request matching `/(dashboard)/**`
- Uses `@supabase/ssr` cookie helper to validate session server-side
- No session → `redirect('/login')`
- Refreshes session cookie on each request (keeps sessions alive)

### Env vars required
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase cloud project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon public key
DATABASE_URL=                    # Railway Postgres connection string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Marketplace Mock

### Pack type definition
```ts
// Types match claude.md §4.1 spec — note: migration 003 needed (see §8)
type Pack = {
  id: string
  pack_label: 'A' | 'B' | 'C'
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  income_tier: 'STANDARD' | 'LEGENDARY'   // from lead_batches JOIN
  status: 'AVAILABLE' | 'CRACKED' | 'PURCHASED'
  price_ttd: number                        // cents: 10000 = TT$100.00
  buyer_count: number
  max_buyers: number                       // 1 = EXCLUSIVE, 3 = COMMUNITY
}
```

### `lib/db/packs.ts`
Exports `getAvailablePacks(): Promise<Pack[]>`. Returns a hardcoded fixture of 3 packs (one per label A/B/C, mixed types) in this session. Swapping to a real DB query in the next session is a one-line change.

### `PackCard` component
Renders per `claude.md §7.2`:
- Pack label (A / B / C) — large, prominent
- Pack type badge: `EXCLUSIVE` (purple) or `COMMUNITY` (blue)
- Income tier badge: `STANDARD` (grey) or `LEGENDARY` (gold/amber)
- Price: `TT$100.00` or `TT$30.00`
- Buyer slots: `2/3 spots taken` (Community) or `Exclusive` (1 buyer)
- "Crack Pack" CTA button
- Dark card background, consistent with dark-primary theme

---

## 6. Layout Shell

### Header
- Left: LeadPack T&T logo / wordmark
- Right: wallet balance (`TT$0.00` mock), agent name, logout button

### Sidebar
- Marketplace (active)
- My Journal (stub link)
- Wallet (stub link)

---

## 7. Styling

- Dark mode is the **primary and only** theme for this scaffold
- Tailwind CSS utility classes only — no inline styles, no CSS-in-JS
- Font: system sans-serif (Inter via `next/font` if available)
- All currency formatted as `TT$X,XXX.XX` (`en-TT` locale)

---

## 8. Known Schema Gap — Migration 003 Required

The current `packs` table (after migrations 001 + 002) is missing fields needed by the real marketplace API:

| Field | Missing from DB | CLAUDE.md spec value |
|---|---|---|
| `price_ttd` | ✗ | `10000` (EXCLUSIVE) / `3000` (COMMUNITY) |
| `buyer_count` | ✗ | integer, default 0 |
| `max_buyers` | ✗ | 1 (EXCLUSIVE) / 3 (COMMUNITY) |
| `pack_type` values | wrong default (`'standard'`) | `'EXCLUSIVE'` / `'COMMUNITY'` |

**Action:** Migration 003 must be created before the real `getAvailablePacks()` DB query is implemented. This is explicitly out of scope for this scaffold session — the mock fixture uses the correct spec shape so no rework is needed when the migration lands.

---

## 9. Out of Scope

- Real DB queries (next session)
- `/api/packs/crack`, `/api/packs/purchase`, other API routes
- Upstash Redis pack timers
- WiPay/FAC payment flow
- WhatsApp outreach
- Zustand store (added when real state is needed)
- Light mode
