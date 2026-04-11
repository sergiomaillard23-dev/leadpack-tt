# LeadPack Pro — Feature Specification

> Drop this file into the project root (or `/docs`) and point Claude Code at it. This is an implementation brief, not finished code.

---

## 1. Context

LeadPack is a lead-distribution platform for insurance agents in Trinidad & Tobago. Leads are ingested (primarily from Facebook/Instagram Lead Ads), scored with an OVR rating, and packaged into collectible "packs" inspired by FC Ultimate Team. Three tiers currently exist: **Standard**, **Premium**, and **Legendary**.

This spec introduces **LeadPack Pro** — a paid annual membership that unlocks **Legendary Pro Status** and a suite of power-user features aimed at serious agents who buy leads at volume.

**Stack:** Next.js (App Router) + Postgres. Assume Prisma unless the project already uses another ORM — match what's there.

---

## 2. Product Summary

| Item | Value |
|---|---|
| Product name | LeadPack Pro |
| Price | **TTD $5,000 / year** |
| Billing | **Annual only** (no monthly option) |
| Status granted | Legendary Pro |
| Payment processor | **WiPay** (not yet integrated — stub the integration behind a service module, see §6) |
| Membership model | Fixed-term: 365 days from activation date, no auto-renew in v1 (user re-purchases) |

---

## 3. Features In Scope (v1)

Build all of the following. Each should be gated behind `user.isLegendaryPro === true` AND `user.proMembershipExpiresAt > now()`.

### 3.1 Legendary Pack Purchase Gate
- Only Pro users can see/buy Legendary Packs in the shop.
- Non-Pro users see the pack with a lock overlay and an "Upgrade to Pro" CTA.

### 3.2 WhatsApp Outreach
- On any lead card owned by a Pro user, show a "WhatsApp" action button.
- Clicking it opens `https://wa.me/<lead.phone>?text=<encoded template>`.
- Templates are managed per-user: Pro users have a `whatsapp_templates` table where they can create, edit, delete message templates. Support simple variable substitution: `{{firstName}}`, `{{lastName}}`, `{{policyInterest}}`.
- UI: a dropdown next to the WhatsApp button lets them pick which template to use. Default template seeded on Pro activation.

### 3.3 CRM-Lite Pipeline Tracker
- Each lead owned by a Pro user gets a `pipeline_status` field with enum: `NEW`, `CONTACTED`, `QUOTED`, `CLOSED_WON`, `CLOSED_LOST`.
- Add a `lead_notes` table: `id, lead_id, user_id, body, created_at`.
- New page `/pro/pipeline` — kanban board view grouped by status, drag-and-drop between columns. Use `@dnd-kit/core`.
- Each card shows lead name, OVR, last contact date, note count.
- Clicking a card opens a side panel with full lead details + notes thread.

### 3.4 Early Access to Legendary Drops
- Add `release_at` and `pro_early_access_at` timestamps to the `packs` table.
- Pro users can purchase a pack when `now() >= pro_early_access_at`.
- Standard users must wait until `now() >= release_at`.
- Surface this on the shop page with a "Pro Early Access" badge on eligible packs and a countdown timer.

### 3.5 Auto-Subscription Packs
- Pro users can opt into recurring pack delivery.
- New table `pack_subscriptions`: `id, user_id, pack_tier, quantity_per_cycle, cycle_days, next_delivery_at, active, created_at`.
- A scheduled job (`/api/cron/deliver-subscriptions`, called daily via Vercel Cron) checks for due subscriptions and:
  1. Charges the stored WiPay payment method (stub).
  2. Delivers the packs to the user's inventory.
  3. Advances `next_delivery_at`.
- Settings page `/pro/subscriptions` to manage.

### 3.6 Analytics Dashboard
- New page `/pro/analytics` with the following tiles:
  - Total leads owned (all-time, last 30 days)
  - Pipeline conversion funnel (counts per status)
  - Close rate (`CLOSED_WON / (CLOSED_WON + CLOSED_LOST)`)
  - Spend vs. closed-won count (rough ROI proxy)
  - OVR distribution histogram of owned leads
- Use Recharts. All data computed server-side from existing tables + `pipeline_status`.

### 3.7 Pro Badge / Cosmetic
- Add a gold "LEGENDARY PRO" badge to the user's profile header and next to their name anywhere it's displayed (leaderboard, etc.).
- Lead cards owned by Pro users get a subtle gold foil border treatment on hover — add a `.pro-card` CSS class.

### 3.8 CSV Export
- Button on `/pro/pipeline` and `/pro/analytics`: "Export CSV".
- Exports all owned leads with columns: `lead_id, first_name, last_name, phone, email, ovr, pack_source, pipeline_status, last_note, acquired_at`.
- Use `papaparse` or native string building — no heavy deps.

---

## 4. Signup Flow

New route: `/pro/upgrade`

### 4.1 Multi-step form
1. **Account info** — name, email (prefilled if logged in, editable)
2. **KYC upload** — two file inputs:
   - Government-issued ID (image or PDF, max 5 MB)
   - Insurance license (image or PDF, max 5 MB)
   - Store in Supabase Storage / S3 / whichever blob store the project already uses. Save URLs on a new `pro_applications` table.
3. **Billing info** — billing address fields + cardholder name. **Do not collect card numbers directly** — WiPay will handle that in their hosted flow. For now, collect billing address only and stub the WiPay redirect.
4. **Review & Pay** — shows TTD $5,000 total, "Pay with WiPay" button.

### 4.2 Data model
```
pro_applications
  id, user_id, full_name, email,
  id_document_url, insurance_license_url,
  billing_address_line1, billing_address_line2, city, country,
  status (PENDING_PAYMENT | PENDING_REVIEW | APPROVED | REJECTED),
  wipay_transaction_id (nullable),
  created_at, reviewed_at
```

### 4.3 Activation
On successful WiPay callback + admin KYC approval:
- Set `users.is_legendary_pro = true`
- Set `users.pro_membership_expires_at = now() + interval '365 days'`
- Set `users.pro_activated_at = now()`
- Seed a default WhatsApp template
- Send confirmation email

---

## 5. Data Model Changes

Add to `users`:
- `is_legendary_pro BOOLEAN DEFAULT false`
- `pro_activated_at TIMESTAMPTZ`
- `pro_membership_expires_at TIMESTAMPTZ`

New tables: `pro_applications`, `whatsapp_templates`, `lead_notes`, `pack_subscriptions`.

Add to `leads`: `pipeline_status` (enum, default `NEW`).

Add to `packs`: `release_at`, `pro_early_access_at`.

Provide a single Prisma migration covering all of the above.

---

## 6. WiPay Integration (Stubbed)

Create `lib/payments/wipay.ts` with this interface:

```ts
export interface WiPayService {
  createCheckoutSession(args: {
    amountTTD: number;
    orderId: string;
    customerEmail: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; transactionId: string }>;

  verifyCallback(payload: unknown): Promise<{
    transactionId: string;
    status: "success" | "failed";
    orderId: string;
  }>;
}
```

Ship two implementations:
1. `MockWiPayService` — logs to console, returns a fake checkout URL that just hits `/api/payments/mock-success?orderId=...` and immediately marks the transaction successful. Used in dev.
2. `WiPayService` — empty stub with `TODO` comments referencing WiPay's docs. Do not guess their API.

Select via `process.env.WIPAY_MODE === "live" ? real : mock`.

---

## 7. Routes Summary

| Route | Purpose |
|---|---|
| `/pro/upgrade` | Signup/upgrade flow |
| `/pro/pipeline` | CRM kanban board |
| `/pro/analytics` | Dashboard |
| `/pro/subscriptions` | Manage auto-sub packs |
| `/pro/templates` | Manage WhatsApp templates |
| `/api/pro/apply` | POST — create pro_application |
| `/api/pro/upload-kyc` | POST — handle file upload |
| `/api/payments/wipay/callback` | POST — WiPay webhook |
| `/api/payments/mock-success` | GET — dev-only mock |
| `/api/cron/deliver-subscriptions` | Daily cron |
| `/api/pro/export-csv` | GET — CSV export |

All `/pro/*` pages and `/api/pro/*` endpoints must check Pro status via middleware. `/pro/upgrade` is the exception — accessible to non-Pro logged-in users.

---

## 8. Acceptance Criteria

- [ ] Non-Pro users cannot access any `/pro/*` route except `/pro/upgrade`.
- [ ] Non-Pro users see Legendary Packs locked in the shop.
- [ ] A user can complete the `/pro/upgrade` flow end-to-end using the mock WiPay service and end up with `is_legendary_pro = true`.
- [ ] KYC files are uploaded and URLs stored on `pro_applications`.
- [ ] Pipeline kanban supports drag-and-drop between all 5 statuses and persists changes.
- [ ] WhatsApp button opens `wa.me` with a templated message.
- [ ] Analytics page renders all 5 tiles with live data from the logged-in user's leads.
- [ ] CSV export downloads a valid file.
- [ ] Pro badge appears wherever the user's name is rendered.
- [ ] Expired Pro membership (`pro_membership_expires_at < now()`) revokes access — middleware must treat these users as non-Pro.
- [ ] All new tables covered by a single Prisma migration.
- [ ] No real WiPay credentials committed; `.env.example` updated with `WIPAY_MODE`, `WIPAY_API_KEY`, `WIPAY_ACCOUNT_NUMBER` placeholders.

---

## 9. Out of Scope (v2+)

Explicitly **not** in this build: lead reroll/dud credits, advanced pack filters, exclusive non-resold leads, team seats, auto-dialer, auto-renewal billing, admin KYC review UI (manual DB approval is fine for v1).

---

## 10. Implementation Order (suggested)

1. Schema migration + `users` flag plumbing
2. Middleware for Pro gating
3. `/pro/upgrade` flow + mock WiPay
4. Legendary Pack gating in shop
5. Pipeline + notes + kanban
6. WhatsApp templates + button
7. Analytics dashboard
8. CSV export
9. Auto-subscription packs + cron
10. Cosmetic badge + foil treatment
