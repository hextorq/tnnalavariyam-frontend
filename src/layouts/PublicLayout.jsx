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
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
          <Link className="flex min-w-0 max-w-[72vw] shrink items-center gap-2 text-left sm:gap-3 lg:max-w-md xl:max-w-lg" to="/">
            <img className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-12 sm:w-12" src={images.logoLeft} alt="" decoding="async" />
            <span className="min-w-0 overflow-hidden">
              <span className="block truncate whitespace-nowrap text-[11px] font-bold leading-snug text-black sm:text-sm md:text-base">{brandName}</span>
              <span className="hidden truncate whitespace-nowrap text-xs font-semibold text-neutral-500 md:block">{associationName}</span>
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-3 xl:flex 2xl:gap-5">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap text-xs font-semibold leading-tight transition hover:text-[#007cba] 2xl:text-sm ${isActive ? 'text-[#007cba]' : 'text-black'}`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            <Button to={loggedIn ? '/app' : '/login'}>Apply Now</Button>
          </nav>
          <button className="shrink-0 p-2 xl:hidden" onClick={() => setOpen((value) => !value)} type="button" aria-label="Open menu">
            <Menu />
          </button>
        </div>
        {open && (
          <nav className="grid gap-2 border-t border-neutral-200 px-3 py-4 sm:px-5 xl:hidden">
            {navItems.map((item) => (
              <NavLink className="rounded border border-neutral-100 px-3 py-3 text-sm font-semibold" key={item.to} to={item.to} onClick={() => setOpen(false)}>
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
