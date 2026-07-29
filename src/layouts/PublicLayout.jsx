import { Menu } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button.jsx'
import { associationName, brandName, images, navItems } from '../data/siteContent.js'
import { Link, NavLink } from '../lib/router.jsx'

export default function PublicLayout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <Link className="flex min-w-0 flex-1 items-center gap-3 text-left lg:max-w-xl" to="/">
            <img className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12" src={images.logoLeft} alt="" />
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-snug text-black sm:text-sm md:text-base">{brandName}</span>
              <span className="hidden text-xs font-semibold text-neutral-500 md:block">{associationName}</span>
            </span>
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
            <Button to="/app">Apply Now</Button>
          </nav>
          <button className="shrink-0 p-2 lg:hidden" onClick={() => setOpen((value) => !value)} type="button">
            <Menu />
          </button>
        </div>
        {open && (
          <nav className="grid gap-3 border-t border-neutral-200 px-4 py-5 sm:px-5 lg:hidden">
            {navItems.map((item) => (
              <NavLink className="py-2 text-sm font-semibold" key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <Button to="/app">Apply Now</Button>
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
