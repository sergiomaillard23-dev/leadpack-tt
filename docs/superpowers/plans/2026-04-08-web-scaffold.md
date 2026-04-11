# Web App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `web/` — a Next.js 14 App Router app with Supabase Auth (cloud, auth-only), a protected dashboard layout, and a marketplace page showing 3 mock pack cards.

**Architecture:** Two route groups: `(auth)` for public login/register, `(dashboard)` for all protected pages. Next.js middleware validates the Supabase session cookie on every dashboard request. All business data from Railway Postgres; this session uses a mock fixture in `lib/db/packs.ts`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS (dark mode), @supabase/ssr, @supabase/supabase-js, Vitest + @testing-library/react

---

## File Map

| File | Purpose |
|---|---|
| `web/` | Created by `create-next-app` |
| `web/tailwind.config.ts` | Add `darkMode: 'class'` |
| `web/middleware.ts` | Protect `(dashboard)` — redirect to `/login` if no session |
| `web/lib/constants.ts` | All business constants from `claude.md` |
| `web/lib/utils.ts` | `formatCurrency(cents)` helper |
| `web/lib/supabase/client.ts` | `createClient()` for browser/client components |
| `web/lib/supabase/server.ts` | `createClient()` for RSC + API routes |
| `web/lib/db/packs.ts` | `Pack` type + `getAvailablePacks()` mock fixture |
| `web/app/layout.tsx` | Root layout — dark theme, `html className="dark"` |
| `web/app/globals.css` | Tailwind directives |
| `web/app/(auth)/layout.tsx` | Centered card layout for auth pages |
| `web/app/(auth)/login/page.tsx` | Password tab + Magic Link tab |
| `web/app/(auth)/register/page.tsx` | Email + password register form |
| `web/app/auth/callback/route.ts` | Exchange magic link code for session |
| `web/app/(dashboard)/layout.tsx` | Protected shell with Header + Sidebar |
| `web/app/(dashboard)/marketplace/page.tsx` | Renders mock pack grid |
| `web/components/layout/Header.tsx` | Wallet badge + agent name + logout |
| `web/components/layout/Sidebar.tsx` | Nav: Marketplace, Journal, Wallet |
| `web/components/packs/PackCard.tsx` | Pack card — label, badges, price, CTA |
| `web/.env.local.example` | Env var template |
| `web/vitest.config.ts` | Vitest + jsdom + `@/*` alias |
| `web/tests/setup.ts` | `@testing-library/jest-dom` import |
| `web/tests/lib/utils.test.ts` | `formatCurrency` unit tests |
| `web/tests/lib/db/packs.test.ts` | `getAvailablePacks` shape tests |

---

## Task 1: Scaffold Next.js 14 app

**Files:** Creates `web/` with all Next.js boilerplate

- [ ] **Step 1: Run create-next-app**

```bash
cd /c/Users/sergi/projects/leadpack-tt
npx create-next-app@14 web --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Expected: `web/` directory created with `package.json`, `app/`, `tailwind.config.ts`, `tsconfig.json`.

- [ ] **Step 2: Delete boilerplate files**

```bash
rm web/app/page.tsx
rm -rf web/app/fonts
rm web/public/next.svg web/public/vercel.svg
```

- [ ] **Step 3: Install Supabase auth packages**

```bash
cd web
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 5: Add test script to package.json**

Open `web/package.json`. Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create .env.local.example**

Create `web/.env.local.example`:
```bash
# Supabase Auth (cloud free tier — auth tokens only, no DB queries)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Railway Postgres
DATABASE_URL=postgresql://user:password@host:port/dbname

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 7: Create .env.local for dev**

Create `web/.env.local` (gitignored):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:postgresql1234@localhost:5432/leadpack_tt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 8: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/
git commit -m "feat: scaffold Next.js 14 app in web/"
```

---

## Task 2: Tailwind dark mode + Vitest config

**Files:**
- Modify: `web/tailwind.config.ts`
- Create: `web/vitest.config.ts`
- Create: `web/tests/setup.ts`

- [ ] **Step 1: Enable dark mode in Tailwind**

Replace the entire content of `web/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Create vitest.config.ts**

Create `web/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create tests/setup.ts**

```bash
mkdir -p web/tests/lib/db
```

Create `web/tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/tailwind.config.ts web/vitest.config.ts web/tests/
git commit -m "chore: configure Tailwind dark mode and Vitest"
```

---

## Task 3: Constants and utilities

**Files:**
- Create: `web/lib/constants.ts`
- Create: `web/lib/utils.ts`
- Create: `web/tests/lib/utils.test.ts`

- [ ] **Step 1: Write failing test for formatCurrency**

Create `web/tests/lib/utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats 10000 cents as TT$100.00', () => {
    expect(formatCurrency(10000)).toBe('TT$100.00')
  })

  it('formats 3000 cents as TT$30.00', () => {
    expect(formatCurrency(3000)).toBe('TT$30.00')
  })

  it('formats 125050 cents as TT$1,250.50', () => {
    expect(formatCurrency(125050)).toBe('TT$1,250.50')
  })

  it('formats 0 as TT$0.00', () => {
    expect(formatCurrency(0)).toBe('TT$0.00')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd web && npx vitest run tests/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils'`

- [ ] **Step 3: Create lib/constants.ts**

```bash
mkdir -p web/lib/db web/lib/supabase
```

Create `web/lib/constants.ts`:
```typescript
export const PACK_SIZE = 20
export const PACKS_PER_BATCH = 3
export const PRIORITY_WINDOW_SECONDS = 300           // 5 minutes
export const EXCLUSIVE_PRICE_CENTS = 10000           // TT$100.00
export const COMMUNITY_PRICE_CENTS = 3000            // TT$30.00
export const COMMUNITY_MAX_BUYERS = 3
export const LEGENDARY_INCOME_THRESHOLD_TTD = 25000  // monthly
export const PRO_SUBSCRIPTION_PRICE_CENTS = 20000    // TT$200.00/mo
export const PRO_MONTHLY_FREE_CREDITS = 5
export const MAX_DISPUTES_PER_PACK = 5
export const TIMEZONE = 'America/Port_of_Spain'
export const CURRENCY_LOCALE = 'en-TT'
```

- [ ] **Step 4: Create lib/utils.ts**

Create `web/lib/utils.ts`:
```typescript
/**
 * Formats a TTD amount stored in cents to display format.
 * e.g. 10000 → "TT$100.00"
 */
export function formatCurrency(cents: number): string {
  const amount = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `TT$${amount}`
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd web && npx vitest run tests/lib/utils.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/lib/ web/tests/lib/utils.test.ts
git commit -m "feat: add constants and formatCurrency utility"
```

---

## Task 4: Pack type and mock fixture

**Files:**
- Create: `web/lib/db/packs.ts`
- Create: `web/tests/lib/db/packs.test.ts`

- [ ] **Step 1: Write failing test**

Create `web/tests/lib/db/packs.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getAvailablePacks, type Pack } from '@/lib/db/packs'

describe('getAvailablePacks', () => {
  it('returns exactly 3 packs', async () => {
    const packs = await getAvailablePacks()
    expect(packs).toHaveLength(3)
  })

  it('returns one pack per label A, B, C', async () => {
    const packs = await getAvailablePacks()
    const labels = packs.map((p) => p.pack_label).sort()
    expect(labels).toEqual(['A', 'B', 'C'])
  })

  it('all packs share the same lead_batch_id', async () => {
    const packs = await getAvailablePacks()
    const batchIds = new Set(packs.map((p) => p.lead_batch_id))
    expect(batchIds.size).toBe(1)
  })

  it('EXCLUSIVE pack has max_buyers 1', async () => {
    const packs = await getAvailablePacks()
    const exclusive = packs.find((p) => p.pack_type === 'EXCLUSIVE')
    expect(exclusive?.max_buyers).toBe(1)
  })

  it('COMMUNITY pack has max_buyers 3', async () => {
    const packs = await getAvailablePacks()
    const community = packs.find((p) => p.pack_type === 'COMMUNITY')
    expect(community?.max_buyers).toBe(3)
  })

  it('price_ttd is stored in cents', async () => {
    const packs = await getAvailablePacks()
    packs.forEach((p) => {
      expect(p.price_ttd).toBeGreaterThanOrEqual(100)
    })
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd web && npx vitest run tests/lib/db/packs.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/db/packs'`

- [ ] **Step 3: Create lib/db/packs.ts**

Create `web/lib/db/packs.ts`:
```typescript
import { EXCLUSIVE_PRICE_CENTS, COMMUNITY_PRICE_CENTS, COMMUNITY_MAX_BUYERS } from '@/lib/constants'

// NOTE: price_ttd, buyer_count, max_buyers, and EXCLUSIVE/COMMUNITY pack_type values
// require migration 003 before real DB queries can be used.
// This mock fixture uses the correct spec shape so no rework is needed when the migration lands.
export type Pack = {
  id: string
  pack_label: 'A' | 'B' | 'C'
  lead_batch_id: string
  pack_type: 'EXCLUSIVE' | 'COMMUNITY'
  income_tier: 'STANDARD' | 'LEGENDARY'
  status: 'AVAILABLE' | 'CRACKED' | 'PURCHASED'
  price_ttd: number   // stored in cents, e.g. 10000 = TT$100.00
  buyer_count: number
  max_buyers: number  // 1 = EXCLUSIVE, 3 = COMMUNITY
}

const MOCK_PACKS: Pack[] = [
  {
    id: 'mock-pack-a',
    pack_label: 'A',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'EXCLUSIVE',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: EXCLUSIVE_PRICE_CENTS,
    buyer_count: 0,
    max_buyers: 1,
  },
  {
    id: 'mock-pack-b',
    pack_label: 'B',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'STANDARD',
    status: 'AVAILABLE',
    price_ttd: COMMUNITY_PRICE_CENTS,
    buyer_count: 1,
    max_buyers: COMMUNITY_MAX_BUYERS,
  },
  {
    id: 'mock-pack-c',
    pack_label: 'C',
    lead_batch_id: 'mock-batch-001',
    pack_type: 'COMMUNITY',
    income_tier: 'LEGENDARY',
    status: 'AVAILABLE',
    price_ttd: COMMUNITY_PRICE_CENTS,
    buyer_count: 0,
    max_buyers: COMMUNITY_MAX_BUYERS,
  },
]

/**
 * Returns available packs for the marketplace.
 * TODO: replace mock with real DB query once migration 003 is applied.
 */
export async function getAvailablePacks(): Promise<Pack[]> {
  return MOCK_PACKS
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd web && npx vitest run tests/lib/db/packs.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/lib/db/packs.ts web/tests/lib/db/packs.test.ts
git commit -m "feat: add Pack type and getAvailablePacks mock fixture"
```

---

## Task 5: Supabase client files

**Files:**
- Create: `web/lib/supabase/client.ts`
- Create: `web/lib/supabase/server.ts`

- [ ] **Step 1: Create lib/supabase/client.ts**

Create `web/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

/**
 * Use in client components ('use client').
 * Creates a Supabase client that reads/writes cookies in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create lib/supabase/server.ts**

Create `web/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Use in Server Components and Route Handlers.
 * Reads session from the request cookie store.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookie writes are ignored.
            // The middleware handles session refresh.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/lib/supabase/
git commit -m "feat: add Supabase browser and server clients"
```

---

## Task 6: Middleware (route protection)

**Files:**
- Create: `web/middleware.ts`

- [ ] **Step 1: Create middleware.ts**

Create `web/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — keeps tokens alive on every request
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/auth/')

  if (!user && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/middleware.ts
git commit -m "feat: add middleware to protect dashboard routes"
```

---

## Task 7: Auth callback route

**Files:**
- Create: `web/app/auth/callback/route.ts`

- [ ] **Step 1: Create auth/callback/route.ts**

```bash
mkdir -p web/app/auth/callback
```

Create `web/app/auth/callback/route.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Handles the redirect after a magic link click.
 * Supabase appends ?code=... to the callback URL.
 * This route exchanges the code for a session cookie and redirects to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/marketplace'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/app/auth/
git commit -m "feat: add magic link auth callback route"
```

---

## Task 8: Root layout and global CSS

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Replace app/layout.tsx**

Replace the entire content of `web/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeadPack T&T',
  description: 'The gamified insurance lead marketplace for Trinidad and Tobago agents.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace app/globals.css**

Replace the entire content of `web/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/app/layout.tsx web/app/globals.css
git commit -m "feat: set dark theme root layout"
```

---

## Task 9: Auth layout and pages

**Files:**
- Create: `web/app/(auth)/layout.tsx`
- Create: `web/app/(auth)/login/page.tsx`
- Create: `web/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create (auth)/layout.tsx**

```bash
mkdir -p "web/app/(auth)/login" "web/app/(auth)/register"
```

Create `web/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create (auth)/login/page.tsx**

Create `web/app/(auth)/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'password' | 'magic-link'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createClient()

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setMagicSent(false)
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/marketplace')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'
  const btnClass =
    'w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors'

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Sign in to LeadPack</h1>

      {/* Tab switcher */}
      <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
        {(['password', 'magic-link'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'password' ? 'Password' : 'Magic Link'}
          </button>
        ))}
      </div>

      {tab === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          {magicSent ? (
            <p className="text-green-400 text-center py-4">
              Check your inbox — we sent a sign-in link to <strong>{email}</strong>.
            </p>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </>
          )}
        </form>
      )}

      <p className="text-center text-gray-500 text-sm mt-6">
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Create one
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Create (auth)/register/page.tsx**

Create `web/app/(auth)/register/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/marketplace')
      router.refresh()
    }
    setLoading(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Create your account</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className={inputClass}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add "web/app/(auth)/"
git commit -m "feat: add auth layout, login page with tabs, and register page"
```

---

## Task 10: PackCard component

**Files:**
- Create: `web/components/packs/PackCard.tsx`

- [ ] **Step 1: Create components/packs/PackCard.tsx**

```bash
mkdir -p web/components/packs web/components/layout
```

Create `web/components/packs/PackCard.tsx`:
```typescript
'use client'
import type { Pack } from '@/lib/db/packs'
import { formatCurrency } from '@/lib/utils'

interface PackCardProps {
  pack: Pack
  onCrack?: (packId: string) => void
}

export function PackCard({ pack, onCrack }: PackCardProps) {
  const isLegendary = pack.income_tier === 'LEGENDARY'
  const isExclusive = pack.pack_type === 'EXCLUSIVE'
  const spotsLeft = pack.max_buyers - pack.buyer_count

  return (
    <div
      className={`relative flex flex-col gap-5 rounded-xl border p-6 bg-gray-900 transition-colors ${
        isLegendary
          ? 'border-amber-500/60 shadow-lg shadow-amber-900/20'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Header row: label + legendary badge */}
      <div className="flex items-center justify-between">
        <span className="text-5xl font-black text-white tracking-tight">
          {pack.pack_label}
        </span>
        {isLegendary && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black uppercase tracking-wider">
            Legendary
          </span>
        )}
      </div>

      {/* Type + tier badges */}
      <div className="flex gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
            isExclusive ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {pack.pack_type}
        </span>
        {!isLegendary && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 uppercase tracking-wide">
            Standard
          </span>
        )}
      </div>

      {/* Price */}
      <p className="text-3xl font-bold text-white">{formatCurrency(pack.price_ttd)}</p>

      {/* Buyer slots */}
      <p className="text-sm text-gray-400">
        {isExclusive
          ? 'Exclusive — 1 buyer only'
          : `${spotsLeft} of ${pack.max_buyers} spots remaining`}
      </p>

      {/* CTA */}
      <button
        onClick={() => onCrack?.(pack.id)}
        className="mt-auto w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors"
      >
        Crack Pack
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/components/packs/PackCard.tsx
git commit -m "feat: add PackCard component"
```

---

## Task 11: Header and Sidebar

**Files:**
- Create: `web/components/layout/Header.tsx`
- Create: `web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create components/layout/Header.tsx**

Create `web/components/layout/Header.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface HeaderProps {
  agentEmail: string
  walletBalanceCents: number
}

export function Header({ agentEmail, walletBalanceCents }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-950 shrink-0">
      <Link href="/marketplace" className="text-lg font-bold text-white tracking-tight">
        LeadPack <span className="text-indigo-400">T&T</span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Wallet balance */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Wallet</span>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(walletBalanceCents)}
          </span>
        </div>

        {/* Agent email */}
        <span className="text-sm text-gray-400 hidden sm:block">{agentEmail}</span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create components/layout/Sidebar.tsx**

Create `web/components/layout/Sidebar.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/journal',     label: 'My Journal' },
  { href: '/wallet',      label: 'Wallet' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col pt-6">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/components/layout/
git commit -m "feat: add Header and Sidebar layout components"
```

---

## Task 12: Dashboard layout and marketplace page

**Files:**
- Create: `web/app/(dashboard)/layout.tsx`
- Create: `web/app/(dashboard)/marketplace/page.tsx`

- [ ] **Step 1: Create (dashboard)/layout.tsx**

```bash
mkdir -p "web/app/(dashboard)/marketplace"
```

Create `web/app/(dashboard)/layout.tsx`:
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        agentEmail={user.email ?? ''}
        walletBalanceCents={0}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create (dashboard)/marketplace/page.tsx**

Create `web/app/(dashboard)/marketplace/page.tsx`:
```typescript
import { PackCard } from '@/components/packs/PackCard'
import { getAvailablePacks } from '@/lib/db/packs'

export default async function MarketplacePage() {
  const packs = await getAvailablePacks()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="text-gray-400 mt-1">
          {packs.length} pack{packs.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add "web/app/(dashboard)/"
git commit -m "feat: add dashboard layout and marketplace page with mock packs"
```

---

## Task 13: Add root redirect and run all tests

**Files:**
- Create: `web/app/page.tsx`

- [ ] **Step 1: Add root redirect**

Create `web/app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'

// Root path redirects to marketplace (middleware handles auth check)
export default function RootPage() {
  redirect('/marketplace')
}
```

- [ ] **Step 2: Run all tests**

```bash
cd web && npx vitest run
```

Expected: all tests PASS (utils + packs fixture)

- [ ] **Step 3: Start dev server and verify**

```bash
cd web && npm run dev
```

Open `http://localhost:3000`. Expected:
- Redirects to `/login`
- Login page shows Password + Magic Link tabs
- After signing in (you need a Supabase project URL in `.env.local`), redirects to `/marketplace`
- Marketplace shows 3 mock pack cards: Pack A (Exclusive), Pack B (Community, 1 spot taken), Pack C (Community Legendary)

- [ ] **Step 4: Final commit**

```bash
cd /c/Users/sergi/projects/leadpack-tt
git add web/app/page.tsx
git commit -m "feat: add root redirect to marketplace"
```

---

## Post-Scaffold: What's next

Before the real marketplace API can replace the mock fixture, **migration 003** must be applied to add `price_ttd`, `buyer_count`, `max_buyers` to `packs` and correct `pack_type` enum values to `EXCLUSIVE`/`COMMUNITY`. This is the gate for the next session.
