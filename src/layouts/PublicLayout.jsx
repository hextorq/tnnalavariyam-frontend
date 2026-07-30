import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import { associationName, brandName, images, navItems } from '../data/siteContent.js'
import { isAuthenticated } from '../lib/auth.js'
import { Link, NavLink } from '../lib/router.jsx'

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated())

  useEffect(() => {
    const update = () => setLoggedIn(isAuthenticated())
    window.addEventListener('authchange', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('authchange', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-sky-900/10 bg-white/85 shadow-[0_14px_45px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <Link className="group flex min-w-0 max-w-[72vw] shrink items-center gap-3 text-left lg:max-w-md xl:max-w-lg" to="/">
            <span className="rounded-2xl bg-gradient-to-br from-[#007cba] to-slate-950 p-1 shadow-lg shadow-sky-900/20">
              <img className="h-10 w-10 shrink-0 rounded-xl border border-white/30 object-cover sm:h-12 sm:w-12" src={images.logoLeft} alt="" decoding="async" />
            </span>
            <span className="min-w-0 overflow-hidden">
              <span className="block truncate whitespace-nowrap text-[11px] font-extrabold leading-snug text-slate-950 sm:text-sm md:text-base">{brandName}</span>
              <span className="hidden truncate whitespace-nowrap text-xs font-semibold text-slate-500 md:block">{associationName}</span>
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 shadow-inner xl:flex">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 whitespace-nowrap text-xs font-bold leading-tight transition 2xl:text-sm ${
                    isActive ? 'bg-white text-[#007cba] shadow-sm ring-1 ring-slate-200' : 'text-slate-700 hover:bg-white hover:text-[#007cba]'
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden shrink-0 xl:block">
            <Link className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f0ad4e] to-[#f78a0c] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5" to={loggedIn ? '/app' : '/login'}>
              Apply Now
            </Link>
          </div>
          <button className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-900 shadow-sm xl:hidden" onClick={() => setOpen((value) => !value)} type="button" aria-label="Open menu">
            <Menu />
          </button>
        </div>
        {open && (
          <nav className="grid gap-2 border-t border-slate-200 bg-white/95 px-3 py-4 shadow-lg sm:px-5 xl:hidden">
            {navItems.map((item) => (
              <NavLink className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800" key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <Button to={loggedIn ? '/app' : '/login'}>Apply Now</Button>
          </nav>
        )}
      </header>

      <main>
        {children}
      </main>

      <footer className="border-t border-neutral-200 py-8">
        <div className="mx-auto max-w-7xl px-5 text-center text-sm text-neutral-600">
          © 2026 {brandName}. All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}
