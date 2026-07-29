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
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {form.fields.map((field) => (
            <label className="grid gap-2 text-sm font-semibold" key={field}>
              {field}
              <input className="border border-neutral-300 px-4 py-3 font-normal" />
            </label>
          ))}
        </div>
        <button className="mt-8 bg-[#f0ad4e] px-6 py-3 text-sm font-bold" type="submit">
          Submit / சமர்ப்பிக்கவும்
        </button>
      </form>
    </div>
  )
}
