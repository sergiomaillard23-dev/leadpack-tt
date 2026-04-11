'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing',      href: '#pricing'       },
    { label: 'Pro',          href: '#pro'            },
    { label: 'FAQ',          href: '#faq'            },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#05080f]/92 backdrop-blur-lg border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <span
            className="text-xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LEADPACK
          </span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-widest">
            T&amp;T
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#8892a4] hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#8892a4] hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/20"
          >
            Log In
          </Link>
          <Link
            href="/pro/upgrade"
            className="text-sm font-bold px-4 py-2 rounded-lg border transition-colors"
            style={{
              color: '#fbbf24',
              borderColor: 'rgba(245,158,11,0.4)',
              background: 'rgba(245,158,11,0.05)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.05)')}
          >
            Go Pro ✦
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg btn-glow-indigo"
          >
            Sign Up For Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#8892a4] hover:text-white transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#07090f]/98 backdrop-blur-lg border-b border-white/[0.06] px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#8892a4] hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#8892a4] hover:text-white transition-colors text-center py-2.5 rounded-lg border border-white/10"
            >
              Log In
            </Link>
            <Link
              href="/pro/upgrade"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-bold text-center py-2.5 rounded-lg border transition-colors"
              style={{
                color: '#fbbf24',
                borderColor: 'rgba(245,158,11,0.4)',
                background: 'rgba(245,158,11,0.05)',
              }}
            >
              Go Pro ✦
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-center py-2.5 rounded-lg btn-glow-indigo"
            >
              Sign Up For Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
