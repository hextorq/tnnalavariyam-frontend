import { applicationForms } from '../data/applicationForms.js'

export default function ApplicationFormPage({ formId }) {
  const form = applicationForms.find((item) => item.id === formId)

  if (!form) return null

  return (
    <div className="min-h-screen bg-neutral-100 px-5 py-10">
      <form className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-[#007cba]">Application Form</p>
        <h1 className="mt-2 text-3xl font-bold">{form.tamilTitle}</h1>
        <p className="mt-2 text-neutral-600">{form.title}</p>
        <div className="mt-6 grid gap-4 border border-neutral-200 bg-neutral-50 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Application No</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">Generated once, reused for corrections</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Payment</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">{form.fee ? `Rs. ${form.fee}` : 'Based on course'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Scope</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">Partner Village</p>
          </div>
        </div>
        <div className="mt-5 border-l-4 border-[#007cba] bg-[#eef8ff] p-4 text-sm leading-6 text-neutral-700">
          If this application is returned with a reason, the partner can correct the same application and resubmit it.
          A new application number will not be created.
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {form.fields.map((field) => (
            <label className="grid gap-2 text-sm font-semibold" key={field}>
              {field}
              <input className="border border-neutral-300 px-4 py-3 font-normal" />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-semibold">
            Payment Reference
            <input className="border border-neutral-300 px-4 py-3 font-normal" placeholder="UPI / receipt / transaction ID" />
          </label>
        </div>
        <button className="mt-8 bg-[#f0ad4e] px-6 py-3 text-sm font-bold" type="submit">
          Submit / சமர்ப்பிக்கவும்
        </button>
      </form>
    </div>
  )
}
