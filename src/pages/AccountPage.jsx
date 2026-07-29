import Button from '../components/Button.jsx'

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Password Reset' : 'Login'

  return (
    <section className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-center text-4xl font-bold">{title}</h1>
      <form className="mt-10 grid gap-5 border border-neutral-200 p-8">
        {mode === 'register' && (
          <>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Username" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="First Name" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Last Name" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="E-mail Address" type="email" />
          </>
        )}
        {mode === 'reset' ? (
          <input className="border border-neutral-300 px-4 py-3" placeholder="Enter your username or email" />
        ) : (
          <>
            {mode === 'login' && <input className="border border-neutral-300 px-4 py-3" placeholder="Username or E-mail" />}
            <input className="border border-neutral-300 px-4 py-3" placeholder="Password" type="password" />
            {mode === 'register' && <input className="border border-neutral-300 px-4 py-3" placeholder="Confirm Password" type="password" />}
          </>
        )}
        <Button type="submit">{title}</Button>
      </form>
    </section>
  )
}
