import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { tamilNaduDistricts } from '../data/signup.js'
import { api } from '../lib/api.js'
import { isAuthenticated } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { Link, navigate } from '../lib/router.jsx'
import { ArrowLeft, CheckCircle2, FileText, Image as ImageIcon, LoaderCircle, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

const dobProofOptions = [
  { value: 'voter-id', label: 'வாக்காளர் அட்டை / Voter ID' },
  { value: 'ration-card', label: 'குடும்ப அட்டை / Ration Card' },
  { value: 'passport', label: 'பாஸ்போர்ட் / Passport' },
  { value: 'driving-licence', label: 'ஓட்டுநர் உரிமம் / Driving Licence' },
  { value: 'birth-certificate', label: 'பிறப்புச் சான்றிதழ் / Birth Certificate' },
  { value: 'transfer-certificate', label: 'பரிமாற்று சான்றிதழ் / Transfer Certificate' },
]

const religionOptions = [
  'இந்து / Hindu',
  'இஸ்லாம் / Muslim',
  'கிறிஸ்துவர் / Christian',
  'சீக்கியர் / Sikh',
  'புத்தம் / Buddhist',
  'சமணம் / Jain',
  'பிற மதம் / Other',
]

const casteOptions = [
  'பொது பிரிவு / General',
  'பிற்படுத்தப்பட்டோர் / BC',
  'மிகவும் பிற்படுத்தப்பட்டோர் / MBC',
  'சீர் மரபினர் / DNC',
  'பட்டியல் சாதி / SC',
  'பட்டியல் பழங்குடி / ST',
  'பிற பிரிவு / Other',
]

const subCasteOptions = [
  'ஆதிதிராவிடர் / Adi Dravidar',
  'அருந்ததியர் / Arunthathiyar',
  'வன்னியர் / Vanniyar',
  'நாடார் / Nadar',
  'யாதவர் / Yadava',
  'தேவர் / Thevar',
  'கவுண்டர் / Gounder',
  'நாயுடு / Naidu',
  'முதலியார் / Mudaliar',
  'பிள்ளை / Pillai',
  'செட்டியார் / Chettiar',
  'முஸ்லிம் சமூக பிரிவு / Muslim Community',
  'கிறிஸ்துவர் சமூக பிரிவு / Christian Community',
  'பிற உட்பிரிவு / Other',
]

const workerJobOptions = [
  'கட்டிட மேஸ்திரி / Mason',
  'கட்டிட உதவியாளர் / Construction Helper',
  'பெயிண்டர் / Painter',
  'தச்சர் / Carpenter',
  'மின்சார தொழிலாளர் / Electrician',
  'குழாய் தொழிலாளர் / Plumber',
  'வெல்டர் / Welder',
  'டைல்ஸ் தொழிலாளர் / Tiles Worker',
  'கம்பி கட்டுபவர் / Bar Bender',
  'சென்டரிங் தொழிலாளர் / Centering Worker',
  'சாலை தொழிலாளர் / Road Worker',
  'மண் வேலை தொழிலாளர் / Earthwork Labour',
  'கான்கிரீட் தொழிலாளர் / Concrete Worker',
  'இயந்திர ஆபரேட்டர் / Machine Operator',
  'பிற தொழில் / Other',
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

function SearchableTextField({ children, options, hint = 'Select from list or type your own value / பட்டியலில் தேர்வு செய்யவும் அல்லது தனியாக உள்ளிடவும்', inputId, className = '', required = false, ...props }) {
  const listId = `${inputId}-options`

  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <input
        className="min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]"
        list={listId}
        {...props}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <span className="text-xs font-medium leading-5 text-neutral-500">{hint}</span>
    </label>
  )
}

function Field({ children, className = '', required = false, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <input className="min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props} />
    </label>
  )
}

function FileField({ children, className = '', preview = '', onChange, required = false, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <div className="grid gap-2">
        <input
          className="min-w-0 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 font-normal outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-[#007cba] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#007cba]"
          onChange={onChange}
          type="file"
          {...props}
        />
        {preview && (
          <div className="max-w-xs overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-2">
            <img alt="File preview" className="max-h-40 w-full object-contain" src={preview} />
          </div>
        )}
      </div>
    </label>
  )
}

function SelectField({ children, options, className = '', required = false, ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <select className="min-w-0 rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props}>
        <option value="">Select an option / தேர்வு செய்யவும்</option>
        {options.map((option) => (
          <option key={option.value || option.code} value={option.value || option.name}>
            {option.label || option.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ApplicationFormPage({ formId }) {
  if (!isAuthenticated()) return <AuthRequired />

  const { notify } = useNotifications()
  const form = applicationForms.find((item) => item.id === formId) || applicationForms[0]
  const currentKey = form.id

  const [formData, setFormData] = useState({
    workerName: '',
    district: '',
    phone: '',
    dob: '',
    dobProofType: '',
    religion: '',
    caste: '',
    subCaste: '',
    workerJob: '',
    nomineeName: '',
    upiTransactionId: '',
    declared: false,
    customData: {},
  })

  const [previews, setPreviews] = useState({
    photo: '',
    dobDocument: '',
    bankPassbook: '',
    aadharCard: '',
    rationCard: '',
    registrationCard: '',
    nomineeAadhar: '',
    signature: '',
    livePhoto: '',
    paymentScreenshot: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedAppNo, setSubmittedAppNo] = useState('')

  function handleInputChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleCustomChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      customData: { ...prev.customData, [field]: value },
    }))
  }

  function handleFileSelect(field, event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type?.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviews((prev) => ({ ...prev, [field]: reader.result }))
        }
      }
      reader.readAsDataURL(file)
    } else {
      setPreviews((prev) => ({ ...prev, [field]: file.name }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!formData.workerName.trim()) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'தொழிலாளியின் பெயர் உள்ளிடவும். / Enter worker name.' })
      return
    }
    if (!formData.district) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'மாவட்டம் தேர்வு செய்யவும். / Select district.' })
      return
    }
    if (formData.phone.length !== 10) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: '10 இலக்க அலைபேசி எண் தேவை. / Enter 10 digit mobile number.' })
      return
    }
    if (!formData.upiTransactionId.trim()) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'UPI transaction ID உள்ளிடவும். / Enter UPI transaction ID.' })
      return
    }
    if (!formData.declared) {
      notify({ type: 'warning', title: 'Declaration Required', message: 'உறுதிமொழியை டிக் செய்ய வேண்டும். / Please accept the declaration.' })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        formKey: currentKey,
        applicantData: {
          workerName: formData.workerName.trim(),
          district: formData.district,
          phone: formData.phone,
          dob: formData.dob,
          dobProofType: formData.dobProofType,
          religion: formData.religion,
          caste: formData.caste,
          subCaste: formData.subCaste,
          workerJob: formData.workerJob,
          nomineeName: formData.nomineeName,
          customData: formData.customData,
          formTitle: form.tamilTitle || form.title,
        },
        paymentData: {
          amount: form.fee || 150,
          upiTransactionId: formData.upiTransactionId.trim(),
        },
        paymentReference: formData.upiTransactionId.trim(),
        submit: true,
      }

      const response = await api.post('/applications/submissions', payload)
      const appNo = response.data.submission?.applicationNo || `TNW-${Date.now()}`
      setSubmittedAppNo(appNo)
      notify({
        type: 'success',
        title: 'Application Submitted / விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
        message: `உங்கள் விண்ணப்ப எண்: ${appNo}`,
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Submission Failed / சமர்ப்பிக்க முடியவில்லை',
        message: error.response?.data?.message || 'விண்ணப்பம் சமர்ப்பிப்பதில் பிழை ஏற்பட்டது.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedAppNo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-white px-3 py-10 sm:px-5">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-lg sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 size={36} />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-700">Application Submitted / வெற்றியடைந்தது</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">விண்ணப்பம் சமர்ப்பிக்கப்பட்டது</h1>
          <p className="mt-3 text-base font-bold text-[#007cba]">{submittedAppNo}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            உங்கள் விண்ணப்ப எண் பதிவு செய்யப்பட்டது. இந்த எண்ணைப் பயன்படுத்தி டாஷ்போர்டில் நிலையை கண்காணிக்கலாம்.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              className="rounded-xl bg-[#007cba] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090]"
              onClick={() => navigate('/app')}
              type="button"
            >
              Go to Dashboard / டாஷ்போர்டிற்கு செல்லவும்
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isRenewal = currentKey === 'renewal'
  const isNewRegistration = currentKey === 'new-registration'

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-white px-3 py-6 sm:px-5 sm:py-10">
      <form className="mx-auto max-w-5xl rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">TN Nalavariyam / தமிழ்நாடு நலவாரியம்</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-950 sm:text-3xl">
              {form.tamilTitle} / {form.title}
            </h1>
          </div>
          <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm transition hover:border-[#007cba] hover:text-[#007cba]" to="/app">
            <ArrowLeft size={16} />
            <span>திரும்ப / Back</span>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 border border-neutral-200 bg-neutral-50 p-4 rounded-2xl md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Application Name</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">{form.tamilTitle}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Fee Amount / கட்டணம்</p>
            <p className="mt-1 text-sm font-bold text-[#007cba]">{form.fee ? `₹${form.fee}` : 'Based on course'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Processing</p>
            <p className="mt-1 text-sm font-bold text-neutral-950">Online Portal Submission</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8">
          {/* Dedicated Renewal Form View */}
          {isRenewal && (
            <Section eyebrow="Renewal Details" title="Renewal / புதுப்பித்தல் விவரங்கள்">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  onChange={(e) => handleInputChange('workerName', e.target.value)}
                  placeholder="தொழிலாளியின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.workerName}
                >
                  Worker Name / தொழிலாளியின் பெயர்
                </Field>

                <SelectField
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  options={tamilNaduDistricts}
                  required
                  value={formData.district}
                >
                  District / மாவட்டம்
                </SelectField>

                <Field
                  {...phoneInputProps}
                  onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                  placeholder="10 digit mobile number"
                  required
                  value={formData.phone}
                >
                  Phone no / அலைபேசி எண்
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('registrationCard', e)}
                  preview={previews.registrationCard}
                  required
                >
                  Worker Registration Card / தொழிலாளியின் பதிவு அட்டை
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('aadharCard', e)}
                  preview={previews.aadharCard}
                >
                  Aadhar Card / ஆதார் அட்டை
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('bankPassbook', e)}
                  preview={previews.bankPassbook}
                >
                  Bank Passbook / வங்கி புத்தகம்
                </FileField>
              </div>
            </Section>
          )}

          {/* Dedicated New Registration Form View */}
          {isNewRegistration && (
            <Section eyebrow="Worker Details" title="Worker details / தொழிலாளியின் விவரங்கள்">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  onChange={(e) => handleInputChange('workerName', e.target.value)}
                  placeholder="தொழிலாளியின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.workerName}
                >
                  Worker Name / தொழிலாளியின் பெயர்
                </Field>

                <SelectField
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  options={tamilNaduDistricts}
                  required
                  value={formData.district}
                >
                  District / மாவட்டம்
                </SelectField>

                <Field
                  {...phoneInputProps}
                  onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                  placeholder="10 digit mobile number"
                  required
                  value={formData.phone}
                >
                  Phone no / அலைபேசி எண்
                </Field>

                <Field
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  type="date"
                  value={formData.dob}
                >
                  Date of Birth / பிறந்த தேதி
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('photo', e)}
                  preview={previews.photo}
                >
                  Photo / புகைப்படம்
                </FileField>

                <div className="grid gap-4">
                  <SelectField
                    onChange={(e) => handleInputChange('dobProofType', e.target.value)}
                    options={dobProofOptions}
                    value={formData.dobProofType}
                  >
                    Document for Date of Birth / பிறந்த தேதிக்கான ஆவணம் (Select Proof Type / ஆவண வகையைத் தேர்ந்தெடுக்கவும்)
                  </SelectField>

                  <FileField
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect('dobDocument', e)}
                    preview={previews.dobDocument}
                  >
                    Submit a document for date of birth / பிறந்த தேதிக்கான ஆவணத்தை சமர்ப்பிக்கவும்
                  </FileField>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SearchableTextField
                  inputId="religion"
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  options={religionOptions}
                  placeholder="மதம் / Religion"
                  type="text"
                  value={formData.religion}
                >
                  Religion / மதம்
                </SearchableTextField>

                <SearchableTextField
                  inputId="caste"
                  onChange={(e) => handleInputChange('caste', e.target.value)}
                  options={casteOptions}
                  placeholder="ஜாதி / Caste"
                  type="text"
                  value={formData.caste}
                >
                  Caste / ஜாதி
                </SearchableTextField>

                <SearchableTextField
                  inputId="sub-caste"
                  onChange={(e) => handleInputChange('subCaste', e.target.value)}
                  options={subCasteOptions}
                  placeholder="உட்பிரிவு / Sub-Caste"
                  type="text"
                  value={formData.subCaste}
                >
                  Sub-Caste / உட்பிரிவு
                </SearchableTextField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SearchableTextField
                  inputId="worker-job"
                  onChange={(e) => handleInputChange('workerJob', e.target.value)}
                  options={workerJobOptions}
                  placeholder="தொழிலாளியின் வேலை / Worker's job"
                  type="text"
                  value={formData.workerJob}
                >
                  Worker's job / தொழிலாளியின் வேலை
                </SearchableTextField>

                <Field
                  onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                  placeholder="நாமினி பெயர்"
                  type="text"
                  value={formData.nomineeName}
                >
                  Nominee Name / நாமினி பெயர்
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('bankPassbook', e)}
                  preview={previews.bankPassbook}
                >
                  Bank Passbook / வங்கி புத்தகம்
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('aadharCard', e)}
                  preview={previews.aadharCard}
                >
                  Aadhar Card / ஆதார் அட்டை
                </FileField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('rationCard', e)}
                  preview={previews.rationCard}
                >
                  Ration card / குடும்ப அட்டை
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('nomineeAadhar', e)}
                  preview={previews.nomineeAadhar}
                >
                  Nominee's Aadhar Card File / நாமினி ஆதார் அட்டை
                </FileField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('signature', e)}
                  preview={previews.signature}
                >
                  Signature / கையொப்பம்
                </FileField>

                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('livePhoto', e)}
                  preview={previews.livePhoto}
                >
                  Live Photo / நேரடி புகைப்படம்
                </FileField>
              </div>
            </Section>
          )}

          {/* Dedicated View for Other Welfare Assistance Forms */}
          {!isRenewal && !isNewRegistration && (
            <Section eyebrow="Application Details" title={`${form.tamilTitle} விவரங்கள்`}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  onChange={(e) => handleInputChange('workerName', e.target.value)}
                  placeholder="தொழிலாளியின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.workerName}
                >
                  Worker Name / தொழிலாளியின் பெயர்
                </Field>

                <SelectField
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  options={tamilNaduDistricts}
                  required
                  value={formData.district}
                >
                  District / மாவட்டம்
                </SelectField>

                <Field
                  {...phoneInputProps}
                  onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                  placeholder="10 digit mobile number"
                  required
                  value={formData.phone}
                >
                  Phone no / அலைபேசி எண்
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {form.fields.map((field) => (
                  <Field
                    key={field}
                    onChange={(e) => handleCustomChange(field, e.target.value)}
                    placeholder={field}
                    type="text"
                  >
                    {field}
                  </Field>
                ))}
              </div>
            </Section>
          )}

          {/* Payment Section */}
          <Section eyebrow="Payment Information" title="Registration Fee Payment / பதிவுக் கட்டண செலுத்துதல்">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-neutral-500">QR Image / க்யூஆர் படம்</p>
                <img
                  alt="Registration QR Code"
                  className="mx-auto mt-3 h-52 w-52 rounded-xl border border-neutral-200 bg-white object-contain p-2 shadow-xs"
                  src="https://tnthozhilalarservice.com/uploads/qrcodes/68c6543910e47-nv%20qr.jpg"
                />
                <p className="mt-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 px-3 rounded-xl">
                  Pay the amount ₹{form.fee || 150} / ₹{form.fee || 150} தொகையை செலுத்தவும்
                </p>
              </div>

              <div className="grid gap-4">
                <Field
                  onChange={(e) => handleInputChange('upiTransactionId', e.target.value)}
                  placeholder="Enter UPI Transaction ID / UTR Number"
                  required
                  type="text"
                  value={formData.upiTransactionId}
                >
                  Enter the upi Transaction ID / யுபிஐ பரிவர்த்தனை ஐடி எண்ணை உள்ளிடவும்
                </Field>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('paymentScreenshot', e)}
                  preview={previews.paymentScreenshot}
                >
                  Upload the payment screenshot / கட்டணத் தொகையின் ஸ்கிரீன்ஷாட்டை பதிவேற்றம் செய்யவும்
                </FileField>

                <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <label className="flex items-start gap-3 text-sm font-semibold text-neutral-800 cursor-pointer">
                    <input
                      checked={formData.declared}
                      className="mt-1 size-5 shrink-0 accent-[#007cba]"
                      onChange={(e) => handleInputChange('declared', e.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      I hereby declare that all the information provided above is true to the best of my knowledge. / மேலே கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் நான் அறிந்த வகையில் உண்மை என உறுதி கூறுகிறேன்.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50" to="/app">
            Cancel / ரத்து செய்
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-8 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f78a0c] disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? <LoaderCircle className="animate-spin" size={18} /> : null}
            <span>{submitting ? 'Submitting...' : 'Submit / சமர்ப்பிக்கவும்'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
