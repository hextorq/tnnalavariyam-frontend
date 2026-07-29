import { Link } from '../lib/router.jsx'

export default function Button({ children, to, variant = 'primary', type = 'button' }) {
  const classes =
    variant === 'outline'
      ? 'inline-flex items-center justify-center border border-black px-6 py-3 text-sm font-bold text-black transition hover:bg-black hover:text-white'
      : 'inline-flex items-center justify-center bg-[#f0ad4e] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#f78a0c]'

  if (to) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} type={type}>
      {children}
    </button>
  )
}
