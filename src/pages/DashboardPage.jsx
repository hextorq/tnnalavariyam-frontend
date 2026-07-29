import { applicationForms } from '../data/applicationForms.js'
import { applicationWorkflow, rbacRules, roleHierarchy, userCreationRules } from '../data/rbac.js'
import { Link } from '../lib/router.jsx'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Online Service Portal</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-950">விண்ணப்ப சேவை மையம்</h1>
            <p className="mt-2 max-w-3xl text-neutral-600">
              பயனர், கிராமம், தாலுகா, மாவட்டம், மாநிலம் என்ற வரிசையில் விண்ணப்பங்கள் பார்க்கப்படும்.
              கிராம பங்குதாரர்கள் விண்ணப்பங்களை சமர்ப்பிக்கலாம்; அலுவலர்கள் தங்களுக்குரிய பகுதி விண்ணப்பங்களை பரிசீலிக்கலாம்.
            </p>
          </div>

          <div className="border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-950">சேவை குறிப்புகள்</h2>
            <div className="mt-4 space-y-3">
              {rbacRules.map((rule) => (
                <p className="border-l-4 border-[#007cba] pl-3 text-sm text-neutral-700" key={rule}>
                  {rule}
                </p>
              ))}
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-neutral-950">விண்ணப்ப சேவைகள்: {applicationForms.length}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {applicationForms.map((form) => (
              <Link className="bg-white p-6 shadow-sm transition hover:shadow-md" key={form.id} to={`/app/forms/${form.id}`}>
                <h2 className="text-xl font-bold">{form.tamilTitle}</h2>
                <p className="mt-2 text-sm text-neutral-600">{form.title}</p>
                <p className="mt-5 text-sm font-bold text-[#007cba]">திறக்கவும்</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-neutral-950">அனுமதி நிலைகள்</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roleHierarchy.map((item, index) => (
              <div className="border border-neutral-200 bg-white p-5 shadow-sm" key={item.role}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#007cba]">{item.scope}</p>
                    <h3 className="mt-1 text-lg font-bold text-neutral-950">{item.tamilRole}</h3>
                    <p className="text-sm text-neutral-600">{item.role}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center bg-[#f2b705] text-sm font-bold text-neutral-950">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{item.canView}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 bg-[#071f35] p-5 text-white">
            <p className="text-sm font-bold text-[#f2b705]">சேவை நடைமுறை</p>
            <p className="mt-2 text-lg font-bold">மாநிலம் முதல் கிராம பங்குதாரர் வரை விண்ணப்பங்கள் ஒழுங்காக பரிசீலிக்கப்படும்.</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-neutral-950">விண்ணப்ப பரிசீலனை நடைமுறை</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {applicationWorkflow.map((step, index) => (
              <div className="border border-neutral-200 bg-white p-5 shadow-sm" key={step}>
                <p className="text-sm font-bold text-[#007cba]">நிலை {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-neutral-950">கணக்கு பதிவு அனுமதி</h2>
          <div className="mt-5 overflow-hidden border border-neutral-200 bg-white shadow-sm">
            {userCreationRules.map(([role, allowed]) => (
              <div className="grid gap-2 border-b border-neutral-200 p-4 last:border-b-0 md:grid-cols-[220px_1fr]" key={role}>
                <p className="text-sm font-bold text-neutral-950">{role}</p>
                <p className="text-sm leading-6 text-neutral-700">{allowed}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
