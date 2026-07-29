import { applicationForms } from '../data/applicationForms.js'
import { Link } from '../lib/router.jsx'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-2 text-neutral-600">Available Applications: {applicationForms.length}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {applicationForms.map((form) => (
            <Link className="bg-white p-6 shadow-sm transition hover:shadow-md" key={form.id} to={`/app/forms/${form.id}`}>
              <h2 className="text-xl font-bold">{form.tamilTitle}</h2>
              <p className="mt-2 text-sm text-neutral-600">{form.title}</p>
              <p className="mt-5 text-sm font-bold text-[#007cba]">View</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
