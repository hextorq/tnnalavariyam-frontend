import { ArrowRight, FileText, ReceiptText } from 'lucide-react'
import { applicationForms } from '../data/applicationForms.js'
import { navigate } from '../lib/router.jsx'

export default function NewApplicationList() {
  return (
    <section id="new-application" className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Create New Application / புதிய விண்ணப்பம்</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Choose an Application Form</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          உங்களுக்கு தேவையான விண்ணப்ப படிவத்தை தேர்வு செய்து, விண்ணப்பத்தை பூர்த்தி செய்யவும். / Select the form you need and fill in the application.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {applicationForms.map((form) => (
          <button
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-[#007cba] hover:shadow-md"
            key={form.id}
            onClick={() => navigate(`/app/forms/${form.id}`)}
            type="button"
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eef8ff] text-[#007cba] ring-1 ring-[#007cba]/15">
              <FileText size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold leading-snug text-slate-950">{form.tamilTitle}</span>
              <span className="mt-1 block text-xs font-semibold leading-snug text-slate-500">{form.title}</span>
              <span className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8ff] px-2.5 py-1 text-[11px] font-bold text-[#007cba] ring-1 ring-[#007cba]/15">
                  <ReceiptText size={11} />
                  {form.fee ? `Fee: ₹${form.fee}` : 'Free / இலவசம்'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007cba] opacity-0 transition group-hover:opacity-100">
                  Open Form <ArrowRight size={13} />
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
