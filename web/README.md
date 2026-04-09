# LeadPack T&T — Web App

Gamified insurance lead marketplace for Trinidad and Tobago agents.

Built with Next.js 14 (App Router), Supabase Auth, Railway PostgreSQL, Tailwind CSS.

---

## OVR Scoring Engine

**Location:** `lib/utils/scoring.ts` | **Types:** `lib/types/leads.ts`

Calculates a lead quality score (0–99) from 6 T&T-specific attributes:

| Stat | Meaning | Key signal |
|------|---------|-----------|
| FRH  | Freshness | Hours since lead was generated |
| INT  | Intent | How the lead was captured (quote request scores highest) |
| LOC  | Location | Parish — Westmoorings/Valsayn tier 1, Chaguanas/San Fernando tier 2 |
| FIN  | Financials | Monthly income in TTD |
| STA  | Stability | Employer type — Government/Medical score highest |
| FIT  | Product Fit | Age bracket — 30–45 is optimal for life insurance |

**Usage:**

```typescript
import { calculateLeadStats, calculateLeadOVR, getLeadTier, applyLegendaryGate } from '@/lib/utils/scoring'

const stats = calculateLeadStats({ hoursSinceGenerated, intentSource, parish, monthlyIncomeTTD, employerType, age })
const rawOvr = calculateLeadOVR(stats)
const ovr    = applyLegendaryGate(rawOvr, stats)  // demotes if FIN or FRH < 90
const tier   = getLeadTier(ovr)  // 'LEGENDARY' | 'GOLD' | 'SILVER' | 'BRONZE'
```

**Tier thresholds** (defined in `lib/constants.ts`):
- `LEGENDARY_OVR_THRESHOLD = 90`
- `GOLD_OVR_THRESHOLD = 80`
- `SILVER_OVR_THRESHOLD = 70`
- Below 70 = Bronze

**LEGENDARY gate:** A lead must have both `FIN >= 90` AND `FRH >= 90` to reach the LEGENDARY tier — high average alone is not enough.

**Adding a new parish to the LOC tier list:**
Open `lib/utils/scoring.ts` and add the parish name (lowercase) to `TIER_1` or `TIER_2` inside `calcLOC()`.

---

## Pack Reveal

**Location:** `components/packs/PackReveal.tsx`

Full-screen modal that reveals `ScoredLead[]` cards one at a time with a FIFA-style flip animation.

**Connecting to a real `/api/packs/crack` route (Phase 8 — Real DB):**
1. The `PackCard` already calls `POST /api/packs/crack` on click.
2. Replace `getMockLeadsForPack()` in `lib/mock/leads.ts` with real leads returned from the crack API response.
3. Pass the real `ScoredLead[]` array into `<PackReveal leads={...} />`.

**LEGENDARY flash trigger:** Any card with `ovr >= LEGENDARY_OVR_THRESHOLD` (90) triggers a 400ms gold screen flash before it flips. Controlled in `PackReveal.tsx` → `revealWithFlash()`.

---

## n8n Workflow: whatsapp-first-contact

**Location:** `workflows/local_5678_sergio_m/personal/whatsapp-first-contact.workflow.ts`

Sends a personalised WhatsApp message to each lead after a pack is cracked.

**Required env variables:**
```bash
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

**Trigger:** `POST /webhook/leadpack-whatsapp-first-contact` (set in n8n)

**Input format:**
```json
{
  "source": "LeadPack_PackCrack",
  "timestamp": "2026-04-09T12:00:00Z",
  "payload": {
    "agent_name": "Marcus Joseph",
    "agent_phone": "1-868-555-1234",
    "leads": [
      { "first_name": "Priya", "phone": "1-868-600-1234", "parish": "Chaguanas" }
    ]
  }
}
```

**Deploy:**
```bash
npx n8nac push
```

---

## n8n Workflow: crm-export-google-sheets

**Location:** `workflows/local_5678_sergio_m/personal/crm-export-google-sheets.workflow.ts`

Appends exported leads to a Google Sheet when an agent clicks "Export to CRM".

**Required credentials:**
```bash
# Provision Google Sheets OAuth via n8nac:
npx n8nac credential set GOOGLE_SHEETS_CREDENTIAL

# Set the target sheet ID as an n8n env variable:
LEADPACK_EXPORT_SHEET_ID=your-google-sheet-id
```

**Trigger:** `POST /webhook/leadpack-crm-export`

**Input format:**
```json
{
  "source": "LeadPack_CRMExport",
  "timestamp": "2026-04-09T12:00:00Z",
  "payload": {
    "agent_id": "uuid",
    "pack_id": "uuid",
    "leads": [
      { "first_name": "Devon", "last_name": "Joseph", "parish": "San Fernando", "phone": "1-868-600-5678", "ovr": 85 }
    ]
  }
}
```

---

## Excel Lead Import

**Location:** `src/import_excel_leads.py`

Idempotent script to load ~1,000 historical leads from Excel into Railway Postgres.

**When to use:** Only after Migration 010 is confirmed applied on Railway (`calculated_ovr` and `lead_stats` columns exist on the `leads` table).

**Setup:**
```bash
pip install openpyxl psycopg2-binary python-dotenv
```

**Always dry-run first:**
```bash
python3 src/import_excel_leads.py --file leads.xlsx --lead-batch-id <uuid> --dry-run
```

**Live import:**
```bash
python3 src/import_excel_leads.py --file leads.xlsx --lead-batch-id <uuid>
```

**Expected Excel columns** (case-insensitive):
`First Name`, `Last Name`, `Phone`, `Parish`, `Monthly Income`, `Employer Type`, `Age`, `Source`

**Notes:**
- Phone must match `1-868-XXX-XXXX` — invalid rows are skipped with a warning
- Duplicate phones (already in DB) are skipped automatically
- Historical leads receive `FRH = 30` (48+ hours old) — expect mostly Bronze/Silver OVR scores
- You must create a `lead_batch` record first and pass its UUID via `--lead-batch-id`

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
