import { Menu } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button.jsx'
import { brandName, navItems } from '../data/siteContent.js'
import { Link, NavLink } from '../lib/router.jsx'

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link className="max-w-sm text-base font-bold leading-snug text-black" to="/">
            {brandName}
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `text-sm font-semibold transition hover:text-[#007cba] ${isActive ? 'text-[#007cba]' : 'text-black'}`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            <Button to="/contact">Get Support</Button>
          </nav>
          <button className="lg:hidden" onClick={() => setOpen((value) => !value)} type="button">
            <Menu />
          </button>
        </div>
        {open && (
          <nav className="grid gap-3 border-t border-neutral-200 px-5 py-5 lg:hidden">
            {navItems.map((item) => (
              <NavLink className="text-sm font-semibold" key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main>
        {children}
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-7xl px-5 text-center text-sm text-neutral-600">
          Copyright © 2026 {brandName}
        </div>
      </footer>
    </div>
  )
}
