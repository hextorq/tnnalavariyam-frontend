import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { isAuthenticated } from '../lib/auth.js'
import { Link } from '../lib/router.jsx'

export default function DashboardPage() {
  if (!isAuthenticated()) return <AuthRequired />

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Online Service Portal</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">விண்ணப்ப சேவை மையம்</h1>
          <p className="mt-2 max-w-3xl text-neutral-600">
            கீழே உள்ள நலவாரிய சேவைகளில் தேவையான விண்ணப்பத்தை தேர்வு செய்து சமர்ப்பிக்கலாம்.
            விண்ணப்ப எண்ணை பயன்படுத்தி நிலையை தொடர்ந்து பார்க்கலாம்.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-neutral-950">விண்ணப்ப சேவைகள்: {applicationForms.length}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {applicationForms.map((form) => (
              <Link className="bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6" key={form.id} to={`/app/forms/${form.id}`}>
                <h2 className="text-lg font-bold sm:text-xl">{form.tamilTitle}</h2>
                <p className="mt-2 text-sm text-neutral-600">{form.title}</p>
                <p className="mt-5 text-sm font-bold text-[#007cba]">திறக்கவும்</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
