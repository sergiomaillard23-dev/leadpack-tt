# Technical Design Doc: LeadPack T&T Landing Page
**Date:** 2026-04-09  
**Commit prefix:** `feat: landing-page`  
**Priority:** HIGH -- this is the public front door of the app

---

## What Are We Building? (Plain English)

Right now, when someone visits your website, they get thrown straight into the marketplace -- that's like walking into a store with no sign on the door. We're building the **sign on the door**.

This landing page is what every visitor sees FIRST. It will:
- Explain what LeadPack T&T is (in simple terms)
- Show agents why they should sign up
- Walk them through how it works (step by step)
- Show the 3 pack tiers and pricing
- Build trust with testimonials
- Answer common questions (FAQ)
- Give them big, obvious buttons to Sign Up or Log In

---

## Design Direction

**Vibe:** Professional but with gamified energy -- think "fintech meets trading card game."

**Theme:** Dark mode (matching the existing app which uses a dark theme), with bold accent colors for the pack tiers:
- **Starter packs:** Blue tones
- **Premium packs:** Purple/violet tones  
- **Legendary packs:** Gold/amber tones

**Font Pairing:**
- Headlines: A bold display font (e.g., Clash Display or Cabinet Grotesk)
- Body: A clean readable font (e.g., Satoshi or General Sans)

**Key Visual Moments:**
- Hero section with a floating/glowing pack card animation
- Pack tier cards with subtle glow effects matching their tier color
- Smooth scroll-triggered fade-in animations for each section
- A "crack open" visual metaphor in the How It Works section

---

## Page Sections (Top to Bottom)

### 1. Navigation Bar (sticky at top)
- LeadPack T&T logo/wordmark (left)
- Links: How It Works | Pricing | FAQ (center, scroll to section)
- Buttons: "Log In" (outline) + "Get Started" (filled) -- both link to existing /login and /register pages

### 2. Hero Section
- **Headline:** "Your Next Client Is Waiting Inside"
- **Subheadline:** "LeadPack T&T delivers exclusive, verified insurance leads straight to your dashboard. Crack open a pack. Close the deal."
- **CTA Buttons:** "Start Closing Deals" → /register | "I Have an Account" → /login
- **Visual:** Animated pack card floating with a subtle glow

### 3. How It Works (4 steps)
| Step | Title | Description |
|------|-------|-------------|
| 1 | Sign Up & Get Verified | Create your account, upload your insurance license, and get approved in 24 hours |
| 2 | Browse the Marketplace | Pick from Standard, Premium, or Legendary packs -- each with 20 verified leads |
| 3 | Crack Your Pack | Open your pack and preview leads. You have 5 minutes to decide before it locks |
| 4 | Close Deals | Access full lead details, reach out via WhatsApp, and start converting |

### 4. Pack Tiers / Pricing
Three cards side by side showing:

| | Standard | Premium | Legendary |
|---|---|---|---|
| **Leads per pack** | 20 | 20 | 20 |
| **Exclusivity** | Shared (up to 3 buyers) | Limited (up to 2 buyers) | Exclusive (1 buyer only) |
| **Income Segment** | Mixed income | Mid-to-high income | High net worth |
| **Price** | TT$1,200 | TT$2,400 | TT$3,600 |
| **Visual** | Blue glow | Purple glow | Gold glow |

*Note: Prices pulled from the handoff doc and constants.ts -- verify these are current before going live.*

### 5. Testimonials / Trust Signals
- 3 testimonial cards (placeholder content for now -- real ones added later)
- Trust badges: "Verified Leads Only" | "24hr KYC Approval" | "T&T Insurance Agents Only"
- Stats bar: "500+ Leads Delivered" | "50+ Agents Active" | "98% Verification Rate"
  *(These are aspirational/placeholder -- swap for real numbers when available)*

### 6. FAQ Section (Accordion style -- click to expand)
| Question | Answer |
|---|---|
| What is LeadPack T&T? | LeadPack is a lead marketplace built for insurance agents in Trinidad & Tobago. We deliver packs of 20 verified leads organized by exclusivity and income segment. |
| How do I get started? | Sign up, upload your insurance license and two forms of ID, and wait for admin approval (usually within 24 hours). |
| What does "crack a pack" mean? | When you crack a pack, you get a 5-minute preview window to see the leads inside. If you like what you see, purchase before the timer runs out. If not, the pack re-locks. |
| Can multiple agents buy the same leads? | It depends on the tier. Standard packs can be sold to up to 3 agents. Premium allows 2. Legendary packs are exclusive -- only 1 agent gets those leads. |
| What payment methods do you accept? | We are integrating WiPay and First Atlantic Commerce for local TT dollar payments. (Coming soon) |
| How do I contact leads after purchase? | Purchased leads appear in your Journal with full contact details. WhatsApp outreach is coming soon for Pro subscribers. |

### 7. Final CTA Section
- **Headline:** "Ready to Grow Your Book?"
- **Subheadline:** "Join T&T's first gamified insurance lead marketplace."
- **Button:** "Create Your Account" → /register

### 8. Footer
- LeadPack T&T wordmark
- Links: Privacy Policy | Terms of Service | Contact
- "Built in Trinidad & Tobago" tagline
- Copyright 2026

---

## File Structure (What Claude Code Creates)

```
web/app/(landing)/
├── page.tsx                 ← The full landing page (this replaces the current / redirect)
└── layout.tsx               ← Minimal layout -- no sidebar, no header, no auth required

web/components/landing/
├── Navbar.tsx               ← Sticky nav with logo + scroll links + auth buttons
├── HeroSection.tsx          ← Main headline, subheadline, CTA, animated pack visual
├── HowItWorks.tsx           ← 4-step visual walkthrough
├── PricingTiers.tsx         ← 3 pack tier cards with glow effects
├── Testimonials.tsx         ← 3 testimonial cards + trust badges + stats bar
├── FAQ.tsx                  ← Accordion-style Q&A
├── FinalCTA.tsx             ← Bottom call-to-action section
└── Footer.tsx               ← Site footer
```

---

## Routing Change (Important)

**Current behavior:** `web/app/page.tsx` redirects everyone to `/marketplace`

**New behavior:**
- `/` shows the landing page (public, no auth needed)
- `/marketplace` still exists behind auth (agents only)
- The landing page buttons link to `/login` and `/register` which already work

**This means:** The middleware must NOT block the landing page. It should only protect dashboard routes.

---

## What This Does NOT Include (Out of Scope Today)

These are things you still need but we are NOT building today:
- WiPay/FAC payment integration (wallet top-up)
- WhatsApp outreach
- Upstash Redis timer upgrade
- Pro subscription tier
- Vercel deployment
- Real testimonials (using placeholders)
- Real stats numbers (using placeholders)

---

## Claude Code Execution Steps

Hand these to Claude Code in order:

### Step 1: Create the landing page layout
```
Create web/app/(landing)/layout.tsx -- a minimal layout with NO sidebar, 
NO header, NO auth requirement. Just a clean shell that renders children 
with the same dark theme and fonts as the rest of the app.
```

### Step 2: Create all landing page components
```
Create these components in web/components/landing/:
- Navbar.tsx (sticky, transparent bg, scroll links, Log In + Get Started buttons)
- HeroSection.tsx (headline, subheadline, CTAs, animated floating pack card)
- HowItWorks.tsx (4 steps with icons and descriptions)
- PricingTiers.tsx (3 tier cards: Standard/Premium/Legendary with glow effects)
- Testimonials.tsx (3 placeholder testimonials + trust badges + stats)
- FAQ.tsx (accordion Q&A, 6 questions)
- FinalCTA.tsx (closing section with register button)
- Footer.tsx (links, copyright, T&T tagline)

Use the content from the TDD-landing-page.md document for all copy.
Match the existing dark theme. Add scroll-triggered animations.
```

### Step 3: Create the landing page
```
Create web/app/(landing)/page.tsx -- imports and renders all landing 
components in order: Navbar, Hero, HowItWorks, Pricing, Testimonials, 
FAQ, FinalCTA, Footer.
```

### Step 4: Update routing
```
Modify web/app/page.tsx -- instead of redirecting to /marketplace, 
render the landing page. Authenticated users who visit / should still 
see the landing page (they can navigate to /marketplace from the dashboard).
```

### Step 5: Update middleware
```
Update web/middleware.ts to allow unauthenticated access to the root 
path /. The landing page must be publicly visible.
```

### Step 6: Test
```
Run: cd web && npm run dev
Visit http://localhost:3000 -- should see landing page
Click "Get Started" -- should go to /register
Click "Log In" -- should go to /login
Scroll through all sections -- verify content and animations
```

### Step 7: Commit
```
git add -A
git commit -m "feat: add public landing page with hero, pricing, how-it-works, FAQ, testimonials"
```

---

## Checklist Before Moving On

- [ ] Landing page loads at `/` without login
- [ ] All 7 sections render correctly
- [ ] "Get Started" button goes to `/register`
- [ ] "Log In" button goes to `/login`
- [ ] Navigation scroll links work (How It Works, Pricing, FAQ)
- [ ] Pack tier cards show correct prices and descriptions
- [ ] FAQ accordion opens/closes
- [ ] Page looks good on mobile (responsive)
- [ ] Existing `/marketplace` still works for logged-in agents
- [ ] Middleware does not block the landing page
- [ ] Dark theme matches the rest of the app

---

## After Today (What's Next)

Once the landing page is live, the priority order for remaining work is:

1. **Deploy to Vercel** -- get the site live on a real URL
2. **WiPay integration** -- so agents can actually pay
3. **WhatsApp outreach** -- so agents can contact leads
4. **Real testimonials** -- swap placeholder content
5. **Pro subscription** -- gate Legendary packs and AI features
