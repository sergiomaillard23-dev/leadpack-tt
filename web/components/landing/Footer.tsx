export function Footer() {
  return (
    <footer className="bg-[#03050b] border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-lg font-bold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                LEADPACK
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 tracking-widest">
                T&amp;T
              </span>
            </div>
            <p className="text-sm text-[#6b7a9e] leading-relaxed max-w-xs">
              The gamified insurance lead marketplace for Trinidad &amp; Tobago agents. Crack a pack. Close a deal.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4a5568] mb-4">Platform</p>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Pricing',      href: '#pricing'       },
                { label: 'FAQ',          href: '#faq'            },
                { label: 'Log In',       href: '/login'          },
                { label: 'Register',     href: '/register'       },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#6b7a9e] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4a5568] mb-4">Legal</p>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
                { label: 'Contact Us', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#6b7a9e] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4a5568]">
          <span>&copy; 2026 LeadPack T&amp;T. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Built in Trinidad &amp; Tobago
          </span>
        </div>
      </div>
    </footer>
  )
}
