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
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-5">
          <Link className="flex min-w-0 max-w-[72vw] shrink items-center gap-3 text-left lg:max-w-md xl:max-w-lg" to="/">
            <span className="rounded-lg border border-slate-200 bg-slate-50 p-1">
              <img className="h-10 w-10 shrink-0 rounded-md object-cover sm:h-11 sm:w-11" src={images.logoLeft} alt="" decoding="async" />
            </span>
            <span className="min-w-0 overflow-hidden">
              <span className="block truncate whitespace-nowrap text-[11px] font-extrabold leading-snug text-slate-950 sm:text-sm md:text-base">{brandName}</span>
              <span className="hidden truncate whitespace-nowrap text-xs font-semibold text-slate-500 md:block">{associationName}</span>
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-5 xl:flex">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-0.5 py-2 text-xs font-bold leading-tight transition 2xl:text-sm ${
                    isActive ? 'border-[#007cba] text-[#007cba]' : 'border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-950'
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
            <Link className="inline-flex items-center justify-center rounded-md bg-[#f0ad4e] px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-[#f78a0c]" to={loggedIn ? '/app' : '/login'}>
              Apply Now
            </Link>
          </div>
          <button className="shrink-0 rounded-md border border-slate-300 bg-white p-2 text-slate-900 xl:hidden" onClick={() => setOpen((value) => !value)} type="button" aria-label="Open menu">
            <Menu />
          </button>
        </div>
        {open && (
          <nav className="grid gap-2 border-t border-slate-200 bg-white px-3 py-4 sm:px-5 xl:hidden">
            {navItems.map((item) => (
              <NavLink className="rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-slate-800" key={item.to} to={item.to} onClick={() => setOpen(false)}>
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
