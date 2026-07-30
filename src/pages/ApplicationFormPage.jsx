import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { isAuthenticated } from '../lib/auth.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { Link } from '../lib/router.jsx'
import { ArrowLeft } from 'lucide-react'

const dobProofOptions = [
  { value: 'voter-id', label: 'வாக்காளர் அட்டை / Voter ID' },
  { value: 'ration-card', label: 'குடும்ப அட்டை / Ration Card' },
  { value: 'passport', label: 'பாஸ்போர்ட் / Passport' },
  { value: 'driving-licence', label: 'ஓட்டுநர் உரிமம் / Driving Licence' },
  { value: 'transfer-certificate', label: 'பரிமாற்று சான்றிதழ் / Transfer Certificate' },
]

function Section({ eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-bold text-neutral-950 sm:text-xl">{title}</h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  )
}

function Field({ children, className = '', ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>{children}</span>
      <input className="min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props} />
    </label>
  )
}

function FileField({ children, className = '', ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>{children}</span>
      <input className="min-w-0 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 font-normal outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-[#007cba] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#007cba]" {...props} />
    </label>
  )
}

function SelectField({ children, options, className = '', ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>{children}</span>
      <select className="min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props}>
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({ children, className = '', ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>{children}</span>
      <textarea className="min-h-28 min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props} />
    </label>
  )
}

function getFieldInputProps(field) {
  if (/phone/i.test(field)) {
    return {
      ...phoneInputProps,
      onChange: (event) => {
        event.target.value = normalizePhone(event.target.value)
      },
      placeholder: '10 digit phone number',
    }
  }
  return {}
}

export default function ApplicationFormPage({ formId }) {
  if (!isAuthenticated()) return <AuthRequired />

  const form = applicationForms.find((item) => item.id === formId)

  if (!form) return null

  const isNewRegistration = form.id === 'new-registration'

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-white px-3 py-8 sm:px-5 sm:py-10">
      <form className="mx-auto max-w-5xl rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#007cba]">Application Form</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{form.tamilTitle}</h1>
            <p className="mt-2 text-neutral-600">{form.title}</p>
          </div>
          <Link className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm hover:border-[#007cba] hover:text-[#007cba]" to="/app">
            <ArrowLeft size={16} />
            <span>திரும்ப / Back</span>
          </Link>
        </div>
        <div className="mt-6 grid gap-4 border border-neutral-200 bg-neutral-50 p-3 sm:p-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Application No</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">Generated once, reused for corrections</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Payment</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">{form.fee ? `Rs. ${form.fee}` : 'Based on course'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Village</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">பங்குதாரர் கிராமம்</p>
          </div>
        </div>
        <div className="mt-5 border-l-4 border-[#007cba] bg-[#eef8ff] p-3 text-sm leading-6 text-neutral-700 sm:p-4">
          If this application is returned with a reason, the partner can correct the same application and resubmit it.
          A new application number will not be created.
        </div>
        {isNewRegistration ? (
          <div className="mt-8 grid gap-6">
            <Section eyebrow="New Registration" title="புதிய விண்ணப்பப் பதிவு">
              <div className="grid gap-4 md:grid-cols-2">
                <Field placeholder="Worker name" type="text">Worker Name / தொழிலாளியின் பெயர்</Field>
                <Field placeholder="District" type="text">District / மாவட்டம்</Field>
                <Field {...phoneInputProps} onChange={(event) => { event.target.value = normalizePhone(event.target.value) }} placeholder="10 digit mobile number">Phone no / அலைபேசி எண்</Field>
                <Field type="date">Date of Birth / பிறந்த தேதி</Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField accept="image/*" type="file">Photo / புகைப்படம்</FileField>
                <div className="grid gap-4">
                  <SelectField options={dobProofOptions}>Document for Date of Birth / பிறந்த தேதிக்கான ஆவணம்</SelectField>
                  <FileField accept="image/*,.pdf,.doc,.docx" type="file">Submit a document for date of birth / பிறந்த தேதிக்கான ஆவணத்தை சமர்ப்பிக்கவும்</FileField>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field type="text">Religion / மதம்</Field>
                <Field type="text">Caste / ஜாதி</Field>
                <Field type="text">Sub-Caste / உட்பிரிவு</Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field type="text">Worker's job / தொழிலாளியின் வேலை</Field>
                <Field type="text">Nominee Name / நாமினி பெயர்</Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField accept="image/*,.pdf" type="file">Bank Passbook / வங்கி புத்தகம்</FileField>
                <FileField accept="image/*,.pdf" type="file">Aadhar Card / ஆதார் அட்டை</FileField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField accept="image/*,.pdf" type="file">Nominee's Aadhar Card File / நாமினி ஆதார் அட்டை</FileField>
                <FileField accept="image/*,.pdf" type="file">Ration card / குடும்ப அட்டை</FileField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField accept="image/*" type="file">Signature / கையொப்பம்</FileField>
                <FileField accept="image/*" type="file">Live Photo / நேரடி புகைப்படம்</FileField>
              </div>
            </Section>

            <Section eyebrow="Registration Fee Payment" title="பதிவுக் கட்டண செலுத்துதல்">
              <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <p className="text-sm font-bold text-neutral-950">QR Image / க்யூஆர் படம்</p>
                  <img alt="Registration QR Code" className="mx-auto mt-4 h-48 w-48 rounded-xl object-contain" src="https://tnthozhilalarservice.com/uploads/qrcodes/68c6543910e47-nv%20qr.jpg" />
                  <p className="mt-4 text-sm font-semibold text-neutral-700">Pay the amount ₹300 / ₹300 தொகையை செலுத்தவும்</p>
                </div>

                <div className="grid gap-4">
                  <Field placeholder="UPI transaction ID" type="text">Enter the upi Transaction ID / யுபிஐ பரிவர்த்தனை ஐடி எண்ணை உள்ளிடவும்</Field>
                  <FileField accept="image/*,.pdf" type="file">Upload the payment screenshot / கட்டணத் தொகையின் ஸ்கிரீன்ஷாட்டை பதிவேற்றம் செய்யவும்</FileField>
                  <TextAreaField placeholder="Declaration text" value="I hereby declare that all the information provided above is true to the best of my knowledge. / மேலே கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் நான் அறிந்த வகையில் உண்மை என உறுதி கூறுகிறேன்." readOnly />
                </div>
              </div>
            </Section>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {form.fields.map((field) => (
              <label className="grid gap-2 text-sm font-semibold" key={field}>
                {field}
                <input className="min-w-0 border border-neutral-300 px-4 py-3 font-normal" {...getFieldInputProps(field)} />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-semibold">
              Payment Reference
              <input className="min-w-0 border border-neutral-300 px-4 py-3 font-normal" placeholder="UPI / receipt / transaction ID" />
            </label>
          </div>
        )}

        <button className="mt-8 w-full bg-[#f0ad4e] px-6 py-3 text-sm font-bold sm:w-auto" type="submit">
          Submit / சமர்ப்பிக்கவும்
        </button>
      </form>
    </div>
  )
}
