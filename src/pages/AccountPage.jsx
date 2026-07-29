import Button from '../components/Button.jsx'
import { Link } from '../lib/router.jsx'

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Forgot Password' : 'Login'

  return (
    <section className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-center text-4xl font-bold">{title}</h1>
      <form className="mt-10 grid gap-5 border border-neutral-200 p-8">
        {mode === 'register' && (
          <>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Full Name" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Phone Number" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Email Address" type="email" />
          </>
        )}
        {mode === 'reset' ? (
          <>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Email Address" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Phone Number" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="New Password" type="password" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Confirm New Password" type="password" />
          </>
        ) : (
          <>
            {mode === 'login' && <input className="border border-neutral-300 px-4 py-3" placeholder="Email / Phone / Username" />}
            <input className="border border-neutral-300 px-4 py-3" placeholder="Password" type="password" />
            {mode === 'register' && <input className="border border-neutral-300 px-4 py-3" placeholder="Confirm Password" type="password" />}
          </>
        )}
        <Button type="submit">{title}</Button>
        {mode === 'login' && (
          <p className="text-center text-sm text-neutral-600">
            Forget password? <Link className="font-bold text-[#007cba]" to="/forget">Forget password</Link>
          </p>
        )}
      </form>
    </section>
  )
}
