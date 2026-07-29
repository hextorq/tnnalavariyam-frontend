import { useEffect, useState } from 'react'

function normalizePath(path) {
  if (!path || path === '') return '/'
  const cleaned = path.split('?')[0].split('#')[0].replace(/\/+$/, '')
  return cleaned || '/'
}

export function navigate(to) {
  const path = normalizePath(to)
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function usePathname() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return path
}

export function Link({ children, className, to, onClick }) {
  return (
    <a
      className={className}
      href={to}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

export function NavLink({ children, className, to, onClick }) {
  const path = usePathname()
  const isActive = path === normalizePath(to)
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className

  return (
    <Link className={resolvedClassName} to={to} onClick={onClick}>
      {children}
    </Link>
  )
}
