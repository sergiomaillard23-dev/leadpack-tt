# LeadPack T&T — Full Implementation Map
**For Claude Code. Read this entire document before writing a single line of code.**

**Date:** 2026-04-09
**Status:** Approved for execution
**Repo root:** `/c/Users/sergi/projects/leadpack-tt`
**App dir:** `web/` (Next.js 14, TypeScript, Tailwind CSS, dark mode only)
**DB:** Railway PostgreSQL (business data) + Supabase Auth (tokens only)
**Automation:** Local n8n instance (n8nac CLI for workflow management)
**Payments:** WiPay (scaffold only — no live integration this phase)
**Mock data:** All features use mock/seed data. Real DB queries come after Migration 004.
**Excel leads:** ~1,000 existing leads in Excel. An import script must be scaffolded but NOT run.

---

## Architecture Snapshot (Existing)

```
web/
├── app/
│   ├── (auth)/login/page.tsx          ← EXISTS — do not modify
│   ├── (auth)/register/page.tsx       ← EXISTS — do not modify
│   ├── (dashboard)/
│   │   ├── layout.tsx                 ← EXISTS — minor modification in Phase 5
│   │   └── marketplace/page.tsx       ← EXISTS — extend in Phase 5
│   └── layout.tsx                     ← EXISTS — do not modify
├── components/
│   ├── layout/Header.tsx              ← EXISTS — minor modification in Phase 5
│   └── layout/Sidebar.tsx             ← EXISTS — extend in Phase 6
├── lib/
│   ├── constants.ts                   ← EXISTS — update in Phase 1
│   ├── utils.ts                       ← EXISTS — do not modify
│   ├── supabase/client.ts             ← EXISTS — do not modify
│   ├── supabase/server.ts             ← EXISTS — do not modify
│   └── db/packs.ts                    ← EXISTS — extend in Phase 2
├── middleware.ts                      ← EXISTS — extend in Phase 6
└── tests/                             ← EXISTS — add new tests per phase
```

---

## New Files to Create (Full Map)

```
web/
├── app/
│   └── (dashboard)/
│       ├── dashboard/
│       │   └── page.tsx               ← NEW Phase 5 — "The Lobby" home page
│       └── pro/
│           └── page.tsx               ← NEW Phase 6 — Pro Tools page (stub)
├── components/
│   ├── dashboard/
│   │   ├── MarketTicker.tsx           ← NEW Phase 5
│   │   ├── NextDropTimer.tsx          ← NEW Phase 5
│   │   ├── WalletCard.tsx             ← NEW Phase 5
│   │   ├── PerformanceCard.tsx        ← NEW Phase 5
│   │   ├── InventoryCard.tsx          ← NEW Phase 5
│   │   └── KYCBanner.tsx              ← NEW Phase 5
│   ├── leads/
│   │   ├── LeadCard.tsx               ← NEW Phase 3
│   │   └── StatBar.tsx                ← NEW Phase 3
│   ├── packs/
│   │   └── PackReveal.tsx             ← NEW Phase 4
│   ├── marketplace/
│   │   └── FreemiumHeatMap.tsx        ← NEW Phase 6
│   └── pro/
│       ├── ScoutFilters.tsx           ← NEW Phase 6
│       └── AIScriptGenerator.tsx      ← NEW Phase 6
├── lib/
│   ├── types/
│   │   └── leads.ts                   ← NEW Phase 2
│   └── utils/
│       └── scoring.ts                 ← NEW Phase 2
├── migrations/
│   └── 004_add_lead_stats.sql         ← NEW Phase 1
├── src/
│   └── import_excel_leads.py          ← NEW Phase 7 (scaffold only, do not run)
└── workflows/
    ├── whatsapp-first-contact.workflow.ts     ← NEW Phase 7
    └── crm-export-google-sheets.workflow.ts   ← NEW Phase 7
```

---

## Git Commit Convention
Follow Conventional Commits for every task:
- `feat:` new feature
- `fix:` bug fix
- `chore:` config/tooling
- `docs:` documentation only
- `refactor:` restructure without behavior change

---

## PHASE 1 — Constants Update + DB Migration

### 1.1 Update `web/lib/constants.ts`

Modify these values in the existing file:

```typescript
// CHANGE existing value:
export const PRO_SUBSCRIPTION_PRICE_CENTS = 100000   // TT$1,000.00/mo (was 20000)

// ADD new constants:
export const PRO_EARLY_ACCESS_WINDOW_SECONDS = 60    // 60s head start for Pro on Legendary packs
export const LEGENDARY_OVR_THRESHOLD = 90            // OVR >= 90 = Legendary card tier
export const GOLD_OVR_THRESHOLD = 80                 // OVR 80–89 = Gold
export const SILVER_OVR_THRESHOLD = 70               // OVR 70–79 = Silver
// OVR < 70 = Bronze

export const DROP_TIME_HOUR = 9                      // Daily pack drop at 9:00 AM
export const TIMEZONE = 'America/Port_of_Spain'      // Already exists, confirm it's here
```

### 1.2 Create Migration 004

Create `web/migrations/004_add_lead_stats.sql`:

```sql
-- Migration 004: Add OVR scoring columns to leads table
-- Run AFTER migrations 001, 002, 003

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_stats JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS calculated_ovr INTEGER DEFAULT 0 CHECK (calculated_ovr BETWEEN 0 AND 99);

-- Index for fast filtering by OVR (Scout feature)
CREATE INDEX IF NOT EXISTS idx_leads_ovr ON leads (calculated_ovr DESC);

-- NOTE: Do NOT run this migration until Railway Postgres is ready.
-- The web app uses mock data until this migration is applied.
```

**Git commit:** `feat: update Pro price constant and scaffold migration 004`

---

## PHASE 2 — OVR Scoring Engine

### 2.1 Create `web/lib/types/leads.ts`

```typescript
export type LeadTier = 'LEGENDARY' | 'GOLD' | 'SILVER' | 'BRONZE'

export interface LeadStats {
  frh: number  // Freshness     0–100
  int: number  // Intent        0–100
  loc: number  // Location      0–100
  fin: number  // Financials    0–100
  sta: number  // Stability     0–100
  fit: number  // Product Fit   0–100
}

export interface ScoredLead {
  id: string
  first_name: string
  last_name: string
  parish: string
  income_bracket: string
  employer_type: string
  age: number
  intent_source: string
  hours_since_generated: number
  stats: LeadStats
  ovr: number
  tier: LeadTier
}
```

### 2.2 Create `web/lib/utils/scoring.ts`

This is the core scoring engine. Every value is based on the T&T market rules.

```typescript
import { LEGENDARY_OVR_THRESHOLD, GOLD_OVR_THRESHOLD, SILVER_OVR_THRESHOLD } from '@/lib/constants'
import type { LeadStats, LeadTier, ScoredLead } from '@/lib/types/leads'

// --- INDIVIDUAL STAT CALCULATORS ---

function calcFRH(hoursSinceGenerated: number): number {
  if (hoursSinceGenerated < 2)  return 100
  if (hoursSinceGenerated < 4)  return 90
  if (hoursSinceGenerated < 12) return 75
  if (hoursSinceGenerated < 24) return 60
  if (hoursSinceGenerated < 48) return 45
  return 30
}

function calcINT(intentSource: string): number {
  const src = intentSource.toLowerCase()
  if (src === 'quote_request')     return 95
  if (src === 'eligibility_quiz')  return 80
  if (src === 'fb_ad')             return 65
  if (src === 'pdf_download')      return 55
  return 50
}

function calcLOC(parish: string): number {
  const TIER_1 = ['westmoorings', 'valsayn', 'fairways', 'palmiste', 'glencoe', 'moka', 'long circular']
  const TIER_2 = ['chaguanas', 'san fernando', 'diego martin', 'maraval', 'st clair', 'newtown']
  const p = parish.toLowerCase()
  if (TIER_1.some(t => p.includes(t))) return 100
  if (TIER_2.some(t => p.includes(t))) return 85
  return 60
}

function calcFIN(monthlyIncomeTTD: number): number {
  if (monthlyIncomeTTD >= 25000) return 100
  if (monthlyIncomeTTD >= 15000) return 85
  if (monthlyIncomeTTD >= 8000)  return 70
  return 50
}

function calcSTA(employerType: string): number {
  const e = employerType.toLowerCase()
  if (e.includes('government') || e.includes('public sector')) return 95
  if (e.includes('medical') || e.includes('legal') || e.includes('doctor')) return 90
  if (e.includes('private')) return 80
  if (e.includes('self')) return 75
  return 55
}

function calcFIT(age: number): number {
  if (age >= 30 && age <= 45) return 100
  if (age >= 46 && age <= 60) return 85
  if (age >= 21 && age <= 29) return 80
  return 55
}

// --- MAIN OVR FUNCTION ---

export function calculateLeadStats(data: {
  hoursSinceGenerated: number
  intentSource: string
  parish: string
  monthlyIncomeTTD: number
  employerType: string
  age: number
}): LeadStats {
  return {
    frh: calcFRH(data.hoursSinceGenerated),
    int: calcINT(data.intentSource),
    loc: calcLOC(data.parish),
    fin: calcFIN(data.monthlyIncomeTTD),
    sta: calcSTA(data.employerType),
    fit: calcFIT(data.age),
  }
}

export function calculateLeadOVR(stats: LeadStats): number {
  const avg = (stats.frh + stats.int + stats.loc + stats.fin + stats.sta + stats.fit) / 6
  return Math.round(avg)
}

// LEGENDARY requires high income AND freshness — not just average
export function applyLegendaryGate(ovr: number, stats: LeadStats): number {
  if (ovr >= LEGENDARY_OVR_THRESHOLD) {
    if (stats.fin < 90 || stats.frh < 90) return LEGENDARY_OVR_THRESHOLD - 1  // demote to Gold max
  }
  return ovr
}

export function getLeadTier(ovr: number): LeadTier {
  if (ovr >= LEGENDARY_OVR_THRESHOLD) return 'LEGENDARY'
  if (ovr >= GOLD_OVR_THRESHOLD)      return 'GOLD'
  if (ovr >= SILVER_OVR_THRESHOLD)    return 'SILVER'
  return 'BRONZE'
}
```

### 2.3 Extend `web/lib/db/packs.ts` — Add Mock Scored Leads

Add a `getMockLeadsForPack(packId: string): ScoredLead[]` export that returns 5 mock scored leads per pack for use in the reveal sequence. Use a variety of tiers — include at least one LEGENDARY (OVR 91) so the animation triggers.

### 2.4 Tests

Create `web/tests/lib/utils/scoring.test.ts`:
- Test that a $30k income + Government worker + Westmoorings lead returns OVR >= 90
- Test that a $6k income lead returns tier BRONZE
- Test that LEGENDARY gate demotes a lead with high average but low FIN

**Git commit:** `feat: add OVR scoring engine and ScoredLead types`

---

## PHASE 3 — Lead Card UI (FIFA Style)

### 3.1 Create `web/components/leads/StatBar.tsx`

A small inline component that renders a single stat label + value bar.

```tsx
// Props: label (e.g. "FRH"), value (0–100)
// Visual: label left, colored fill bar right
// Color: green 90+, yellow 70–89, red <70
```

### 3.2 Create `web/components/leads/LeadCard.tsx`

This is the visual centerpiece. It must feel like a FIFA Ultimate Team card.

**Design rules:**
- Card shape: portrait rectangle, rounded corners, ~180px wide
- LEGENDARY: `bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse-slow` + animated sparkle ring
- GOLD: `bg-gradient-to-br from-yellow-500 to-yellow-700`
- SILVER: `bg-gradient-to-br from-slate-300 to-slate-500`
- BRONZE: `bg-gradient-to-br from-orange-700 to-orange-900`

**Card layout (top to bottom):**
1. Top-left corner: OVR number (large, bold, dark text)
2. Top-right corner: Tier label ("LEGENDARY" / "GOLD" etc.)
3. Center: Lead initials avatar circle
4. Below avatar: Lead first name only (no last name — privacy)
5. Parish label
6. Bottom half: 6 stat bars using `StatBar.tsx` (FRH, INT, LOC, FIN, STA, FIT)

**Props:**
```typescript
interface LeadCardProps {
  lead: ScoredLead
  revealed: boolean    // false = show glowing back of card, true = show front
  onReveal?: () => void
}
```

When `revealed = false`, show a dark card back with a pulsing gold border and "?" centered. No lead data visible. This is the pre-crack state.

**Add this to `web/tailwind.config.ts`** under `theme.extend`:
```typescript
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'card-flip': 'flip 0.6s ease-in-out',
  'shine': 'shine 1.5s ease-in-out',
},
keyframes: {
  flip: {
    '0%':   { transform: 'rotateY(0deg)' },
    '50%':  { transform: 'rotateY(90deg)' },
    '100%': { transform: 'rotateY(0deg)' },
  },
  shine: {
    '0%':   { backgroundPosition: '-200% center' },
    '100%': { backgroundPosition: '200% center' },
  },
},
```

**Git commit:** `feat: add LeadCard and StatBar components with tier-based styling`

---

## PHASE 4 — Pack Crack Animation + Reveal Sequence

### 4.1 Create `web/components/packs/PackReveal.tsx`

This component controls the full "crack" experience. It receives the list of `ScoredLead[]` for a pack and reveals them one at a time.

**Flow:**
1. User clicks "Crack Pack" on `PackCard`
2. `PackReveal` mounts as a full-screen modal overlay (dark bg)
3. All N `LeadCard` components render face-down (showing glowing card back with "?")
4. Two interaction modes available simultaneously:
   - **Click any individual card** to flip it face-up with the CSS flip animation
   - **"Reveal All" button** at the bottom — flips all remaining cards one by one with a 300ms stagger between each flip (not all at once — each card waits for the previous to finish rotating)
5. If any card being revealed is OVR >= 90 (LEGENDARY): trigger a full-screen gold flash (`bg-yellow-400 opacity-30`) for 400ms before that card flips — this is "The Big Pull" moment. If multiple LEGENDARY cards exist, each one triggers its own flash.
6. After all cards are revealed, show "Pack Complete" summary bar: X Legendary, X Gold, X Silver, X Bronze
7. "Close" button dismisses the modal

**Props:**
```typescript
interface PackRevealProps {
  packId: string
  leads: ScoredLead[]
  onClose: () => void
}
```

### 4.2 Update `web/components/packs/PackCard.tsx`

- Add `onClick` to "Crack Pack" button that opens `PackReveal`
- Add a small "Avg OVR" badge to the card (e.g., "Avg OVR 84") calculated from mock leads
- If any lead in the pack is LEGENDARY tier, add a `LEGENDARY PACK` gold badge to the card header

**Git commit:** `feat: add PackReveal modal with card flip animation and legendary flash`

---

## PHASE 5 — Dashboard Lobby

### 5.1 Create `web/app/(dashboard)/dashboard/page.tsx`

This is "The Lobby" — the home page agents land on. It composes all the new dashboard components.

**Layout (mobile-first, responsive grid):**
```
[MarketTicker — full width]
[NextDropTimer — full width]
[WalletCard] [PerformanceCard] [InventoryCard]  ← 3-col on desktop, stack on mobile
[KYCBanner — full width, only if kyc_status !== 'approved']
[FreemiumHeatMap — full width, blurred for Basic users]
```

### 5.2 Create `web/components/dashboard/MarketTicker.tsx`

A horizontally scrolling ticker bar pinned to the top of the lobby.

- Red pulsing dot on the left: `LIVE`
- Scrolls a repeating array of mock activity strings:
  - `"Agent X just cracked a Gold Pack in Chaguanas"`
  - `"New Legendary Pack dropped — San Fernando area"`
  - `"3 packs cracked in the last hour"`
  - `"Pack B just cracked — 2 spots left!"`
- Use CSS `animation: marquee linear infinite` — no JS interval needed
- Dark bar, neon green text (`text-emerald-400`)

### 5.3 Create `web/components/dashboard/NextDropTimer.tsx`

Counts down to the next 9:00 AM drop (Port of Spain time).

- Uses `useEffect` + `setInterval(1000)` to tick
- Displays: `NEXT DROP IN 04:23:11` in a large monospace font
- Neon green color, high contrast
- When timer hits 0, flash gold and show `DROP LIVE NOW`
- Uses `TIMEZONE = 'America/Port_of_Spain'` from constants

### 5.4 Create `web/components/dashboard/WalletCard.tsx`

```
┌─────────────────────────────┐
│ 💰 Wallet Balance            │
│ TT$0.00                     │  ← large, slot-machine roll on mount
│ [+$100] [+$250] [+$500]     │  ← Quick Add buttons — onClick shows a toast: "Coming Soon — WiPay integration launching soon!"
└─────────────────────────────┘
```

The balance counter must use a CSS number-roll animation on mount (numbers scroll up into place like a slot machine). This is a pure visual effect on the initial render.

The Quick Add buttons are fully styled and clickable but trigger a toast notification only. No payment logic. Use a simple `useState` toast that auto-dismisses after 3 seconds.

### 5.5 Create `web/components/dashboard/PerformanceCard.tsx`

```
┌─────────────────────────────┐
│ 📊 Performance               │
│ Agent Rank: #42              │
│ Lead Conversion: 18%         │
│ Active Streak: 3 days 🔥     │
└─────────────────────────────┘
```

All mock data for now.

### 5.6 Create `web/components/dashboard/InventoryCard.tsx`

```
┌─────────────────────────────┐
│ 🎴 Pack Inventory            │
│ Unopened: 2 packs            │
│ Active: 1 pack               │
│ Total Leads: 40              │
└─────────────────────────────┘
```

All mock data for now.

### 5.7 Create `web/components/dashboard/KYCBanner.tsx`

Only renders when `agent.kyc_status !== 'approved'`.

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚠️  Verification Pending — Upload your ID to unlock Legendary Packs │
│ [████████░░] 80% Verified   [Complete Verification →]             │
└──────────────────────────────────────────────────────────────────┘
```

Use amber/yellow colors. Progress bar hardcoded at 80% for mock.

### 5.8 Update `web/components/layout/Sidebar.tsx`

Add "Dashboard" as the first nav link (above Marketplace):
```typescript
{ href: '/dashboard', label: 'Dashboard' },
```

### 5.9 Update `web/app/(dashboard)/marketplace/page.tsx`

Add `MarketTicker` and `NextDropTimer` above the pack grid:
```tsx
<MarketTicker />
<NextDropTimer />
<div className="grid ...">
  {packs.map(...)}
</div>
```

**Git commit:** `feat: add Dashboard Lobby with ticker, timer, and career stat cards`

---

## PHASE 6 — Pro Tier Features + Freemium Hook

### 6.1 Create `web/components/marketplace/FreemiumHeatMap.tsx`

For Basic (non-Pro) users: show a blurred heat map placeholder with locked overlay.

```
┌──────────────────────────────────┐
│ 🗺️  Scout's Map — Today's Leads   │
│ [blurred gradient heat map]       │
│ 70 leads in Chaguanas today       │
│ [UPGRADE TO PRO TO SEE THE MAP →] │
└──────────────────────────────────┘
```

The "heat map" is a CSS gradient blob (no real data). The blur effect: `filter: blur(6px)` on the map div, with an absolute-positioned overlay containing the upgrade CTA.

For Pro users: show the same component with `isBlurred={false}` — the blur is removed and mock parish data is shown as colored dots.

**Props:**
```typescript
interface FreemiumHeatMapProps {
  isPro: boolean
}
```

### 6.2 Create `web/components/pro/ScoutFilters.tsx`

Pro-only feature. Allows agents to set stat filter alerts.

```
┌──────────────────────────────────────────────────┐
│ 🔍 The Scout — Alert Filters                      │
│ Alert me when a lead matches:                     │
│ FIN (Income) ≥ [90] ▼                            │
│ LOC (Location) ≥ [80] ▼                          │
│ [Save Alert]                                      │
│                                                   │
│ Active Alerts: 1                                  │
│ — FIN ≥ 90 AND LOC ≥ 80                          │
└──────────────────────────────────────────────────┘
```

Use React `useState` for filter values. Saving is a no-op stub for now (just shows a toast "Alert saved").

### 6.3 Create `web/components/pro/AIScriptGenerator.tsx`

Pro-only feature. Calls the Anthropic API to generate a calling script for a given lead batch profile.

```tsx
// Input: Pack description (parish, avg income tier, pack type)
// Output: A 5-step calling script personalized to that batch
// Uses fetch() to /api/ai/script route (create this route too)
```

Create `web/app/api/ai/script/route.ts`:
```typescript
// POST /api/ai/script
// Body: { parish: string, incomeTier: string, packType: string }
// Returns: { script: string }
// Calls Anthropic API (claude-sonnet-4-20250514) — SINGLE response, no streaming.
// Await the full response, return JSON. Show a loading spinner in the UI while waiting.
// Do NOT use streaming (no ReadableStream, no SSE).
```

System prompt for the AI route:
```
You are an expert insurance sales coach for the Trinidad and Tobago market. 
Generate a 5-step phone calling script for an insurance agent 
contacting leads from a specific pack. 
Be direct, use local T&T context (Carnival, TTEC, NHS, government jobs, etc.). 
Keep each step to 2 sentences max. Return plain text only.
```

### 6.4 Create `web/app/(dashboard)/pro/page.tsx`

Stub page for the Pro Tools section. Renders:
- `ScoutFilters` (full if user is Pro, locked with upgrade CTA if not)
- `AIScriptGenerator` (same)

### 6.5 Update `web/components/layout/Sidebar.tsx`

Add "Pro Tools" nav link (below Wallet):
```typescript
{ href: '/pro', label: 'Pro Tools ✦' },
```

### 6.6 Update `web/middleware.ts`

Add logic to handle the 60-second Legendary lock for Free users.

The middleware already protects dashboard routes. Add a note comment (no actual implementation yet — this requires real pack creation timestamps from the DB):

```typescript
// TODO (Phase 8 — Real DB): Check if pack.income_tier === 'LEGENDARY'
// and pack.created_at is within the last PRO_EARLY_ACCESS_WINDOW_SECONDS.
// If so, redirect non-Pro users away from that pack's detail page.
// Requires: agent.subscription_tier column on agents table.
```

**Git commit:** `feat: add Pro Tier features — Scout, AI Script Generator, FreemiumHeatMap`

---

## PHASE 7 — n8n Workflows + Excel Import Script

### 7.1 Create `workflows/whatsapp-first-contact.workflow.ts`

Using n8nac (local instance). This workflow:

1. **Trigger:** Webhook — POST from the Next.js `/api/packs/crack` route (future)
2. **Input schema:**
   ```json
   {
     "source": "LeadPack_PackCrack",
     "timestamp": "ISO-8601",
     "payload": {
       "agent_name": "string",
       "agent_phone": "string",
       "leads": [{ "first_name": "string", "phone": "string", "parish": "string" }]
     }
   }
   ```
3. **Nodes:**
   - `Receive Pack Crack` (Webhook)
   - `Split Lead List` (Split In Batches — 1 item at a time)
   - `Format WA Message` (Set node — build personalized message string)
   - `Send WhatsApp` (HTTP Request to Meta WhatsApp Business API)
   - `Log Result` (Set node — format success/fail log)

**Message template:**
```
Hi {{lead.first_name}}, my name is {{agent.name}} from [Agency Name].
I noticed you were looking into life insurance options in {{lead.parish}}.
I have a couple of minutes today — would you be open to a quick chat?
```

Credentials: Use `WHATSAPP_TOKEN` env variable — never hardcode.

### 7.2 Create `workflows/crm-export-google-sheets.workflow.ts`

1. **Trigger:** Webhook — POST from "Export to CRM" button in the future UI
2. **Input schema:**
   ```json
   {
     "source": "LeadPack_CRMExport",
     "timestamp": "ISO-8601",
     "payload": {
       "agent_id": "string",
       "pack_id": "string",
       "leads": [{ "first_name": "string", "last_name": "string", "parish": "string", "phone": "string", "ovr": 85 }]
     }
   }
   ```
3. **Nodes:**
   - `Receive Export Request` (Webhook)
   - `Append to Sheet` (Google Sheets node — append rows)
   - `Confirm Export` (Respond to Webhook — 200 OK)

Credentials: Use `GOOGLE_SHEETS_CREDENTIAL` — provisioned via n8nac credential commands.

### 7.3 Create `src/import_excel_leads.py`

**SCAFFOLD ONLY — do not run this script. It is ready for when the ~1,000 Excel leads need to be imported.**

```python
#!/usr/bin/env python3
"""
import_excel_leads.py
Idempotent script to import Excel leads into the Railway Postgres leads table.

Usage:
    python3 src/import_excel_leads.py --file path/to/leads.xlsx --dry-run
    python3 src/import_excel_leads.py --file path/to/leads.xlsx

Requirements:
    pip install openpyxl psycopg2-binary python-dotenv

Input Excel columns expected (case-insensitive):
    First Name, Last Name, Phone, Parish, Monthly Income, Employer Type, Age, Source

Each lead is scored using the OVR engine rules and inserted with calculated_ovr.
Idempotent: skips rows where phone already exists in the DB.
"""

import argparse
import os
# Full implementation follows in body...
# [Claude Code: implement the full script body here following the docstring spec]
```

**Git commit:** `feat: scaffold n8n workflows and Excel lead import script`

---

## PHASE 8 — README Documentation

For every new major module, add a section to `web/README.md` (create it if it doesn't exist):

### Sections to document:

**OVR Scoring Engine**
- What it does (calculates lead quality 0–99 from 6 T&T-specific attributes)
- How to use `calculateLeadOVR()` in your code
- How to add a new parish to the LOC tier list

**Pack Reveal**
- How to connect to a real `/api/packs/crack` route when the DB is ready
- The LEGENDARY flash trigger threshold (`LEGENDARY_OVR_THRESHOLD = 90`)

**n8n Workflow: whatsapp-first-contact**
- Required env vars: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- How to connect to the Execute Command node or Webhook trigger
- Input format (copy the JSON schema from Phase 7.1)

**n8n Workflow: crm-export-google-sheets**
- Required credentials: Google Sheets OAuth via n8nac
- Input format (copy the JSON schema from Phase 7.2)

**Excel Lead Import**
- When to use: when ready to load the ~1,000 historical leads
- Command: `python3 src/import_excel_leads.py --file leads.xlsx --dry-run` first
- Expected Excel column format

**Git commit:** `docs: add README sections for scoring engine, workflows, and lead import`

---

## Build Order Summary

Execute phases in this exact order. Do not skip ahead:

| Phase | What | Key Output |
|-------|------|-----------|
| 1 | Constants + Migration | `constants.ts` updated, `004_add_lead_stats.sql` |
| 2 | Scoring Engine | `lib/utils/scoring.ts`, `lib/types/leads.ts` |
| 3 | Lead Card UI | `LeadCard.tsx`, `StatBar.tsx` |
| 4 | Pack Reveal | `PackReveal.tsx`, `PackCard.tsx` updated |
| 5 | Dashboard Lobby | All `components/dashboard/` files, lobby page |
| 6 | Pro Tier | `ScoutFilters.tsx`, `AIScriptGenerator.tsx`, `FreemiumHeatMap.tsx` |
| 7 | n8n + Import Script | 2 workflows, `import_excel_leads.py` |
| 8 | Docs | `README.md` updated |

---

## Key Rules for Claude Code

1. **Never hardcode credentials.** All API keys go in `.env.local` (gitignored) and `.env.local.example` (committed).
2. **All currency as cents integers.** `10000` = TT$100.00. Use `formatCurrency()` from `lib/utils.ts` for display.
3. **Mock data only.** No real DB queries until Migration 004 is confirmed applied on Railway.
4. **Idempotent scripts.** The Excel import script must be safe to run twice without duplicating data (check phone number uniqueness).
5. **Mobile-first Tailwind.** All new components stack vertically on mobile, expand to grid on `sm:` and `lg:`.
6. **Dark mode only.** No light mode classes. Background base is `bg-gray-950`. Cards use `bg-gray-900`.
7. **TypeScript strict.** No `any` types. All props must be typed interfaces.
8. **Run tests after each phase.** `cd web && npx vitest run` must pass before committing.
9. **n8nac workflow files go in `workflows/` at repo root**, not inside `web/`.
10. **Python scripts go in `src/`** at repo root, not inside `web/`.

---

## Environment Variables to Add to `.env.local.example`

```bash
# Anthropic API (AI Script Generator)
ANTHROPIC_API_KEY=your-anthropic-api-key

# WhatsApp (Meta Business API)
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# WiPay (scaffold only — not live this phase)
WIPAY_API_KEY=your-wipay-key
WIPAY_ACCOUNT_NUMBER=your-account-number

# n8n (local instance)
N8N_HOST=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
```

---

## Notes on Excel Leads (1,000 Historical Records)

- Do NOT import them until Migration 004 is live on Railway
- The `import_excel_leads.py` script is scaffolded in Phase 7 but must not be executed
- These will be packaged as "legacy packs" (older leads) at lower prices (Bronze/Silver tier expected)
- When ready to import: run with `--dry-run` first, verify row count, then run live
