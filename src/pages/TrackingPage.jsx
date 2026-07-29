import { Search } from 'lucide-react'
import { useState } from 'react'

export default function TrackingPage() {
  const [applicationNo, setApplicationNo] = useState('')
  const [phone, setPhone] = useState('')
  const [tracking, setTracking] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    setTracking({
      applicationNo: applicationNo || 'TNW-20260729-0001',
      status: 'SUBMITTED',
      paymentStatus: 'PAID / நிலுவை இல்லை',
      formTitle: 'புதிய விண்ணப்பப் பதிவு',
      village: 'Assigned Village Scope',
      reason: 'No correction requested',
      revisionCount: 0,
      updatedAt: new Date().toLocaleDateString('en-IN'),
    })
  }

  return (
    <section className="bg-neutral-100 px-5 py-14">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[420px_1fr]">
        <form className="bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Application Tracking</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-950">விண்ணப்ப நிலை பார்க்க</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Application number மற்றும் mobile number வைத்து விண்ணப்ப நிலை, payment status, review stage பார்க்கலாம்.
          </p>

          <label className="mt-6 grid gap-2 text-sm font-bold text-neutral-800">
            Application Number
            <input
              className="border border-neutral-300 px-4 py-3 font-normal"
              onChange={(event) => setApplicationNo(event.target.value)}
              placeholder="TNW-20260729-0001"
              value={applicationNo}
            />
          </label>

          <label className="mt-4 grid gap-2 text-sm font-bold text-neutral-800">
            Mobile Number
            <input
              className="border border-neutral-300 px-4 py-3 font-normal"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Registered phone number"
              value={phone}
            />
          </label>

          <button className="mt-6 inline-flex items-center gap-2 bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-neutral-950" type="submit">
            <Search size={18} />
            Track Status
          </button>
        </form>

        <div className="bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-950">Tracking Result</h2>
          {tracking ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['Application No', tracking.applicationNo],
                ['Form', tracking.formTitle],
                ['Scope', tracking.village],
                ['Application Status', tracking.status],
                ['Payment Status', tracking.paymentStatus],
                ['Correction Reason', tracking.reason],
                ['Revision Count', tracking.revisionCount],
                ['Last Updated', tracking.updatedAt],
              ].map(([label, value]) => (
                <div className="border border-neutral-200 p-4" key={label}>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
                  <p className="mt-2 text-base font-bold text-neutral-950">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-neutral-300 p-8 text-sm leading-6 text-neutral-600">
              Enter an application number to view status. Backend route planned for this screen:
              <span className="mt-2 block font-mono text-neutral-900">GET /api/applications/track?applicationNo=TNW...</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
