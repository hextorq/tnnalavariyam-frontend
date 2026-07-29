import { Link } from '../lib/router.jsx'

export default function Button({ children, disabled = false, to, variant = 'primary', type = 'button' }) {
  const classes =
    variant === 'outline'
      ? 'inline-flex w-full items-center justify-center border border-black px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-black hover:text-white sm:w-auto'
      : 'inline-flex w-full items-center justify-center bg-[#f0ad4e] px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-[#f78a0c] sm:w-auto'
  const disabledClasses = disabled ? ' cursor-not-allowed opacity-60' : ''

  if (to) {
    return (
      <Link className={`${classes}${disabledClasses}`} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <button className={`${classes}${disabledClasses}`} disabled={disabled} type={type}>
      {children}
    </button>
  )
}
