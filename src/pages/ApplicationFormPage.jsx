import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { tamilNaduDistrictOptions } from '../data/signup.js'
import { api } from '../lib/api.js'
import { isAuthenticated } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { Link, navigate } from '../lib/router.jsx'
import { ArrowLeft, Camera, CheckCircle2, FileText, Image as ImageIcon, LoaderCircle, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const dobProofOptions = [
  { value: 'voter-id', label: 'வாக்காளர் அட்டை / Voter ID' },
  { value: 'ration-card', label: 'குடும்ப அட்டை / Ration Card' },
  { value: 'passport', label: 'பாஸ்போர்ட் / Passport' },
  { value: 'driving-licence', label: 'ஓட்டுநர் உரிமம் / Driving Licence' },
  { value: 'birth-certificate', label: 'பிறப்புச் சான்றிதழ் / Birth Certificate' },
  { value: 'transfer-certificate', label: 'பரிமாற்று சான்றிதழ் / Transfer Certificate' },
]

const religionOptions = [
  { value: 'Hindu', label: 'இந்து / Hindu' },
  { value: 'Muslim', label: 'இஸ்லாம் / Muslim' },
  { value: 'Christian', label: 'கிறிஸ்துவர் / Christian' },
  { value: 'Sikh', label: 'சீக்கியர் / Sikh' },
  { value: 'Buddhist', label: 'புத்தம் / Buddhist' },
  { value: 'Jain', label: 'சமணம் / Jain' },
  { value: 'Other', label: 'பிற மதம் / Other' },
]

const casteOptions = [
  { value: 'General', label: 'பொது பிரிவு / General' },
  { value: 'BC', label: 'பிற்படுத்தப்பட்டோர் / BC' },
  { value: 'MBC', label: 'மிகவும் பிற்படுத்தப்பட்டோர் / MBC' },
  { value: 'DNC', label: 'சீர் மரபினர் / DNC' },
  { value: 'SC', label: 'பட்டியல் சாதி / SC' },
  { value: 'ST', label: 'பட்டியல் பழங்குடி / ST' },
  { value: 'Other', label: 'பிற பிரிவு / Other' },
]

const subCasteOptions = [
  { value: 'Adi Dravidar', label: 'ஆதிதிராவிடர் / Adi Dravidar' },
  { value: 'Arunthathiyar', label: 'அருந்ததியர் / Arunthathiyar' },
  { value: 'Vanniyar', label: 'வன்னியர் / Vanniyar' },
  { value: 'Nadar', label: 'நாடார் / Nadar' },
  { value: 'Yadava', label: 'யாதவர் / Yadava' },
  { value: 'Thevar', label: 'தேவர் / Thevar' },
  { value: 'Gounder', label: 'கவுண்டர் / Gounder' },
  { value: 'Naidu', label: 'நாயுடு / Naidu' },
  { value: 'Mudaliar', label: 'முதலியார் / Mudaliar' },
  { value: 'Pillai', label: 'பிள்ளை / Pillai' },
  { value: 'Chettiar', label: 'செட்டியார் / Chettiar' },
  { value: 'Muslim Community', label: 'முஸ்லிம் சமூக பிரிவு / Muslim Community' },
  { value: 'Christian Community', label: 'கிறிஸ்துவர் சமூக பிரிவு / Christian Community' },
  { value: 'Other', label: 'பிற உட்பிரிவு / Other' },
]

const workerJobOptions = [
  { value: 'Mason', label: 'கட்டிட மேஸ்திரி / Mason' },
  { value: 'Construction Helper', label: 'கட்டிட உதவியாளர் / Construction Helper' },
  { value: 'Painter', label: 'பெயிண்டர் / Painter' },
  { value: 'Carpenter', label: 'தச்சர் / Carpenter' },
  { value: 'Electrician', label: 'மின்சார தொழிலாளர் / Electrician' },
  { value: 'Plumber', label: 'குழாய் தொழிலாளர் / Plumber' },
  { value: 'Welder', label: 'வெல்டர் / Welder' },
  { value: 'Tiles Worker', label: 'டைல்ஸ் தொழிலாளர் / Tiles Worker' },
  { value: 'Bar Bender', label: 'கம்பி கட்டுபவர் / Bar Bender' },
  { value: 'Centering Worker', label: 'சென்டரிங் தொழிலாளர் / Centering Worker' },
  { value: 'Road Worker', label: 'சாலை தொழிலாளர் / Road Worker' },
  { value: 'Earthwork Labour', label: 'மண் வேலை தொழிலாளர் / Earthwork Labour' },
  { value: 'Concrete Worker', label: 'கான்கிரீட் தொழிலாளர் / Concrete Worker' },
  { value: 'Machine Operator', label: 'இயந்திர ஆபரேட்டர் / Machine Operator' },
  { value: 'Other', label: 'பிற தொழில் / Other' },
]

const standardOptions = [
  { value: '6', label: '6ம் வகுப்பு / 6th Standard' },
  { value: '7', label: '7ம் வகுப்பு / 7th Standard' },
  { value: '8', label: '8ம் வகுப்பு / 8th Standard' },
  { value: '9', label: '9ம் வகுப்பு / 9th Standard' },
]

const girlsStandardOptions = [
  { value: '10', label: '10ம் வகுப்பு / 10th Standard' },
  { value: '11', label: '11ம் வகுப்பு / 11th Standard' },
  { value: '12', label: '12ம் வகுப்பு / 12th Standard' },
]

const examPassedOptions = [
  { value: '10', label: '10ம் வகுப்பு தேர்ச்சி / 10th Pass' },
  { value: '12', label: '12ம் வகுப்பு தேர்ச்சி / 12th Pass' },
]

const courseTypeOptions = [
  { value: 'ITI', label: 'தொழிற்பயிற்சி / ITI' },
  { value: 'Diploma', label: 'டிப்ளமோ / Diploma' },
  { value: 'UG', label: 'இளநிலை பட்டப்படிப்பு / UG Degree' },
  { value: 'PG', label: 'முதுநிலை பட்டப்படிப்பு / PG Degree' },
  { value: 'Professional', label: 'தொழில்முறை படிப்பு / Professional Course' },
  { value: 'Other', label: 'பிற படிப்பு / Other' },
]

const applyingYearOptions = [
  { value: '1', label: 'முதல் ஆண்டு / First Year' },
  { value: '2', label: 'இரண்டாம் ஆண்டு / Second Year' },
  { value: '3', label: 'மூன்றாம் ஆண்டு / Third Year' },
  { value: '4', label: 'நான்காம் ஆண்டு / Fourth Year' },
  { value: '5', label: 'ஐந்தாம் ஆண்டு / Fifth Year' },
]

const currentYear = new Date().getFullYear()
const academicYearOptions = Array.from({ length: 6 }, (_, offset) => {
  const start = currentYear - 1 + offset
  const value = `${start}-${start + 1}`
  return { value, label: value }
})

function Section({ eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-bold text-neutral-950 sm:text-xl">{title}</h2>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  )
}

function Field({ children, className = '', required = false, ...props }) {
  return (
    <label className={`flex flex-col justify-start gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <input className="w-full rounded-lg border border-neutral-300 px-4 py-3 font-normal outline-none transition focus:border-[#007cba]" {...props} />
    </label>
  )
}

function SelectField({ children, options, className = '', required = false, ...props }) {
  return (
    <label className={`flex flex-col justify-start gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <select className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal text-neutral-900 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20" {...props}>
        <option value="">Select an option / தேர்வு செய்யவும்</option>
        {options.map((option) => {
          if (typeof option === 'string') {
            return <option key={option} value={option}>{option}</option>
          }
          const val = option.value || option.name || option.code
          const lbl = option.label || option.name || option.englishName || option.code
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function FileField({ children, className = '', preview = '', onChange, required = false, ...props }) {
  const inputRef = useRef(null)
  const isImageSrc = preview && (preview.startsWith('data:image/') || preview.startsWith('http') || preview.startsWith('blob:'))

  function handleReupload() {
    inputRef.current?.click()
  }

  function handleDelete() {
    if (!inputRef.current) return
    inputRef.current.value = ''
    onChange?.({ target: inputRef.current })
  }

  return (
    <div className={`flex flex-col justify-start gap-2 text-sm font-semibold text-neutral-700 ${className}`}>
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>

      <input
        ref={inputRef}
        className={preview ? 'hidden' : 'w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 font-normal outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-[#007cba] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#007cba]'}
        onChange={onChange}
        type="file"
        {...props}
      />

      {preview && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {isImageSrc ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-2xs">
                <img alt="File preview" className="h-full w-full object-cover" src={preview} />
              </div>
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eef8ff] text-[#007cba]">
                <FileText size={22} />
              </div>
            )}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={14} />
                Ready to upload / பதிவேற்ற தயார்
              </span>
              <p className="truncate text-xs font-semibold text-slate-500 mt-0.5">
                {isImageSrc ? 'Image Selected / படம் தேர்வு செய்யப்பட்டது' : 'Document Attached / ஆவணம் இணைக்கப்பட்டது'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#007cba] hover:text-[#007cba]"
              onClick={handleReupload}
              type="button"
            >
              <RefreshCw size={13} />
              Re-upload / மீண்டும்
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
              onClick={handleDelete}
              type="button"
            >
              <Trash2 size={13} />
              Delete / நீக்கு
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LivePhotoSection({ preview, onCapture, label = 'Live Photo / நேரடி புகைப்படம்', required = true }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [mode, setMode] = useState(preview ? 'captured' : 'idle')
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    if (mode === 'streaming' && videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [mode, stream])

  function stopCamera(activeStream = stream) {
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop())
    }
    setStream(null)
  }

  function startCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((mediaStream) => {
        setStream(mediaStream)
        setMode('streaming')
      })
      .catch((err) => {
        console.error('Camera error:', err)
        setCameraError('Unable to access camera. Please allow camera permission in your browser settings.')
        setMode('idle')
      })
  }

  function handleCapture() {
    const video = videoRef.current
    if (!video) return
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCapture(dataUrl)
    stopCamera()
    setMode('captured')
  }

  function handleRetake() {
    stopCamera()
    setMode('idle')
    onCapture('')
  }

  const isValidImageSrc = preview && (preview.startsWith('data:image/') || preview.startsWith('http') || preview.startsWith('blob:'))

  return (
    <div className="col-span-1 flex flex-col gap-2 text-sm font-semibold text-neutral-700 md:col-span-2">
      <span>
        {label} {required && <span className="ml-1 text-red-600">*</span>}
      </span>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6">
        {preview && (isValidImageSrc || mode === 'captured') ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-start">
            <div className="relative h-56 w-44 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-neutral-900 shadow-md ring-4 ring-emerald-500/10">
              {isValidImageSrc ? (
                <img alt="Live Photo Captured" className="h-full w-full object-cover" src={preview} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-slate-400">
                  <Camera className="text-[#007cba]" size={32} />
                  <p className="mt-2 text-xs font-bold text-white">Live Photo Ready</p>
                </div>
              )}
              <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-emerald-600 py-1 text-center text-[10px] font-bold text-white shadow-xs">
                ✓ Live Photo Captured
              </span>
            </div>

            <div className="flex flex-col gap-3 text-center sm:text-left">
              <div>
                <p className="text-base font-bold text-slate-950">Live Passport Photo</p>
                <p className="mt-1 text-xs text-slate-500">
                  உங்கள் நேரடி புகைப்படம் வெற்றிகரமாக பதிவு செய்யப்பட்டது.
                </p>
              </div>
              <div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100"
                  onClick={handleRetake}
                  type="button"
                >
                  <RefreshCw size={14} />
                  Retake Live Photo / மீண்டும் படம் எடுக்க
                </button>
              </div>
            </div>
          </div>
        ) : mode === 'streaming' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#007cba] bg-slate-950 shadow-lg">
              <video autoPlay muted playsInline ref={videoRef} className="h-full w-full object-cover" />

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-48 w-40 rounded-[50%/60%] border-2 border-dashed border-white/80 shadow-2xl ring-8 ring-black/40" />
                <p className="mt-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                  Align face inside frame / முகத்தை சரியாக வைக்கவும்
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                onClick={handleCapture}
                type="button"
              >
                <Camera size={16} />
                Capture Photo / படம் எடு
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-100"
                onClick={() => {
                  stopCamera()
                  setMode('idle')
                }}
                type="button"
              >
                Cancel / ரத்து செய்
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba]">
              <Camera size={28} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-950">Live Passport Photo Capture</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                நேரடி புகைப்படம் எடுக்க 'Start Camera' பொத்தானைக் கிளிக் செய்யவும்.
              </p>
            </div>

            {cameraError && (
              <p className="max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {cameraError}
              </p>
            )}

            <div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007cba] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090]"
                onClick={startCamera}
                type="button"
              >
                <Camera size={18} />
                Start Camera / கேமராவைத் தொடங்கு
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
    bankPassbookFront: '',
    bankPassbookLast: '',
    aadharCard: '',
    rationCard: '',
    registrationCard: '',
    nomineeAadhar: '',
    signature: '',
    livePhoto: '',
    paymentScreenshot: '',
    childAadhar: '',
    bonafide: '',
    markSheet: '',
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
    if (!file) {
      setPreviews((prev) => ({ ...prev, [field]: '' }))
      return
    }

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
  const isHigherEducation = currentKey === 'higher-education'
  const isPass = currentKey === 'education-pass'
  const isGirls = currentKey === 'education-girls-10-12'
  const isEducation = !isRenewal && !isNewRegistration

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
              <div className="grid gap-5 md:grid-cols-2 items-start">
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
                  options={tamilNaduDistrictOptions}
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

              {/* DOB Proof Combo Row */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('dobProofType', e.target.value)}
                  options={dobProofOptions}
                  value={formData.dobProofType}
                >
                  Document for Date of Birth / பிறந்த தேதிக்கான ஆவணம்
                </SelectField>

                <FileField
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect('dobDocument', e)}
                  preview={previews.dobDocument}
                >
                  Submit a document for date of birth / பிறந்த தேதிக்கான ஆவணத்தை சமர்ப்பிக்கவும்
                </FileField>
              </div>

              {/* Photo & Registration Card Row */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('photo', e)}
                  preview={previews.photo}
                >
                  Photo / புகைப்படம்
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('registrationCard', e)}
                  preview={previews.registrationCard}
                  required
                >
                  Worker Registration Card / தொழிலாளியின் பதிவு அட்டை
                </FileField>
              </div>

              <div className="grid gap-5 md:grid-cols-3 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  options={religionOptions}
                  value={formData.religion}
                >
                  Religion / மதம்
                </SelectField>

                <SelectField
                  onChange={(e) => handleInputChange('caste', e.target.value)}
                  options={casteOptions}
                  value={formData.caste}
                >
                  Caste / ஜாதி
                </SelectField>

                <SelectField
                  onChange={(e) => handleInputChange('subCaste', e.target.value)}
                  options={subCasteOptions}
                  value={formData.subCaste}
                >
                  Sub-Caste / உட்பிரிவு
                </SelectField>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('workerJob', e.target.value)}
                  options={workerJobOptions}
                  value={formData.workerJob}
                >
                  Worker's job / தொழிலாளியின் வேலை
                </SelectField>

                <Field
                  onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                  placeholder="நாமினி பெயர்"
                  type="text"
                  value={formData.nomineeName}
                >
                  Nominee Name / நாமினி பெயர்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
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

              <div className="grid gap-5 md:grid-cols-2 items-start">
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

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('signature', e)}
                  preview={previews.signature}
                >
                  Signature / கையொப்பம்
                </FileField>
              </div>

              {/* Dedicated Full-Width Live Photo Section */}
              <div className="grid gap-5 grid-cols-1">
                <LivePhotoSection
                  onCapture={(dataUrl) => {
                    setPreviews((prev) => ({ ...prev, livePhoto: dataUrl }))
                  }}
                  preview={previews.livePhoto}
                />
              </div>
            </Section>
          )}

          {/* Dedicated New Registration Form View */}
          {isNewRegistration && (
            <Section eyebrow="Worker Details" title="Worker details / தொழிலாளியின் விவரங்கள்">
              <div className="grid gap-5 md:grid-cols-2 items-start">
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
                  options={tamilNaduDistrictOptions}
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

              {/* DOB Proof Combo Row */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('dobProofType', e.target.value)}
                  options={dobProofOptions}
                  value={formData.dobProofType}
                >
                  Document for Date of Birth / பிறந்த தேதிக்கான ஆவணம்
                </SelectField>

                <FileField
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect('dobDocument', e)}
                  preview={previews.dobDocument}
                >
                  Submit a document for date of birth / பிறந்த தேதிக்கான ஆவணத்தை சமர்ப்பிக்கவும்
                </FileField>
              </div>

              {/* Photo & Registration Card Row */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('photo', e)}
                  preview={previews.photo}
                >
                  Photo / புகைப்படம்
                </FileField>

                <FileField
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('registrationCard', e)}
                  preview={previews.registrationCard}
                >
                  Worker Registration Card / தொழிலாளியின் பதிவு அட்டை
                </FileField>
              </div>

              <div className="grid gap-5 md:grid-cols-3 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  options={religionOptions}
                  value={formData.religion}
                >
                  Religion / மதம்
                </SelectField>

                <SelectField
                  onChange={(e) => handleInputChange('caste', e.target.value)}
                  options={casteOptions}
                  value={formData.caste}
                >
                  Caste / ஜாதி
                </SelectField>

                <SelectField
                  onChange={(e) => handleInputChange('subCaste', e.target.value)}
                  options={subCasteOptions}
                  value={formData.subCaste}
                >
                  Sub-Caste / உட்பிரிவு
                </SelectField>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('workerJob', e.target.value)}
                  options={workerJobOptions}
                  value={formData.workerJob}
                >
                  Worker's job / தொழிலாளியின் வேலை
                </SelectField>

                <Field
                  onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                  placeholder="நாமினி பெயர்"
                  type="text"
                  value={formData.nomineeName}
                >
                  Nominee Name / நாமினி பெயர்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
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

              <div className="grid gap-5 md:grid-cols-2 items-start">
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

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <FileField
                  accept="image/*"
                  onChange={(e) => handleFileSelect('signature', e)}
                  preview={previews.signature}
                >
                  Signature / கையொப்பம்
                </FileField>
              </div>

              {/* Dedicated Full-Width Live Photo Section */}
              <div className="grid gap-5 grid-cols-1">
                <LivePhotoSection
                  onCapture={(dataUrl) => {
                    setPreviews((prev) => ({ ...prev, livePhoto: dataUrl }))
                  }}
                  preview={previews.livePhoto}
                />
              </div>
            </Section>
          )}

          {/* Dedicated View for Educational Assistance Forms */}
          {isEducation && (
            <>
              <Section eyebrow="Child Details" title="Child details / குழந்தையின் விவரங்கள்">
                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <SelectField
                    onChange={(e) => handleCustomChange('childStandard', e.target.value)}
                    options={isPass ? examPassedOptions : isGirls ? girlsStandardOptions : isHigherEducation ? courseTypeOptions : standardOptions}
                    required
                    value={formData.customData.childStandard || ''}
                  >
                    {isPass
                      ? 'Examination passed / தேர்ச்சி பெற்ற தேர்வு'
                      : isHigherEducation
                        ? 'Choose the course / படிப்பை தேர்வு செய்யவும்'
                        : 'Choose standard / வகுப்பை தேர்வு செய்யவும்'}
                  </SelectField>

                  <Field
                    onChange={(e) => handleCustomChange('childName', e.target.value)}
                    placeholder="குழந்தையின் பெயர் உள்ளிடவும்"
                    required
                    type="text"
                    value={formData.customData.childName || ''}
                  >
                    Child's Name / குழந்தையின் பெயர்
                  </Field>

                  {isHigherEducation && (
                    <>
                      <Field
                        onChange={(e) => handleCustomChange('courseName', e.target.value)}
                        placeholder="படிப்பின் பெயர்"
                        type="text"
                        value={formData.customData.courseName || ''}
                      >
                        Name of the Course / படிப்பின் பெயர்
                      </Field>

                      <Field
                        onChange={(e) => handleCustomChange('courseDuration', e.target.value)}
                        placeholder="ஆண்டுகளில் காலம்"
                        type="number"
                        value={formData.customData.courseDuration || ''}
                      >
                        Duration of the Course in Years / படிப்பின் காலம் (ஆண்டுகளில்)
                      </Field>

                      <SelectField
                        onChange={(e) => handleCustomChange('applyingYear', e.target.value)}
                        options={applyingYearOptions}
                        value={formData.customData.applyingYear || ''}
                      >
                        In which year applying for / எந்த ஆண்டில் விண்ணப்பிக்கிறது
                      </SelectField>
                    </>
                  )}

                  <SelectField
                    onChange={(e) => handleCustomChange('academicYear', e.target.value)}
                    options={academicYearOptions}
                    required
                    value={formData.customData.academicYear || ''}
                  >
                    Academic year / கல்வி ஆண்டு
                  </SelectField>
                </div>

                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('childAadhar', e)}
                    preview={previews.childAadhar}
                    required
                  >
                    Child's Aadhar / குழந்தையின் ஆதார் அட்டை
                  </FileField>

                  {isPass ? (
                    <FileField
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileSelect('markSheet', e)}
                      preview={previews.markSheet}
                      required
                    >
                      Mark Sheet (Original) / மதிப்பெண் பட்டியல் (அசல்)
                    </FileField>
                  ) : (
                    <FileField
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileSelect('bonafide', e)}
                      preview={previews.bonafide}
                      required
                    >
                      Bonafide certificate / பொனாஃபைடு சான்றிதழ்
                    </FileField>
                  )}
                </div>
              </Section>

              <Section eyebrow="Worker Details" title="Worker details / தொழிலாளியின் விவரங்கள்">
                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <Field
                    onChange={(e) => handleInputChange('workerName', e.target.value)}
                    placeholder="தொழிலாளியின் பெயர் உள்ளிடவும்"
                    required
                    type="text"
                    value={formData.workerName}
                  >
                    Worker Name / தொழிலாளியின் பெயர்
                  </Field>

                  <Field
                    {...phoneInputProps}
                    onChange={(e) => handleInputChange('phone', normalizePhone(e.target.value))}
                    placeholder="10 digit mobile number"
                    required
                    value={formData.phone}
                  >
                    Phone Number / அலைபேசி எண்
                  </Field>

                  <SelectField
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    options={tamilNaduDistrictOptions}
                    required
                    value={formData.district}
                  >
                    District / மாவட்டம்
                  </SelectField>
                </div>

                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('registrationCard', e)}
                    preview={previews.registrationCard}
                    required
                  >
                    Worker Registration card / தொழிலாளியின் பதிவு அட்டை
                  </FileField>

                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('aadharCard', e)}
                    preview={previews.aadharCard}
                    required
                  >
                    {isHigherEducation ? "Worker's Aadhar / தொழிலாளியின் ஆதார் அட்டை" : 'Aadhar Card / ஆதார் அட்டை'}
                  </FileField>
                </div>

                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('rationCard', e)}
                    preview={previews.rationCard}
                    required
                  >
                    Ration Card / குடும்ப அட்டை
                  </FileField>

                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('bankPassbookFront', e)}
                    preview={previews.bankPassbookFront}
                    required
                  >
                    Upload Bank passbook front page / வங்கி புத்தகத்தின் முதல் பக்கம்
                  </FileField>
                </div>

                <div className="grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('bankPassbookLast', e)}
                    preview={previews.bankPassbookLast}
                    required
                  >
                    Upload Last Transaction page / கடைசி பரிவர்த்தனை பக்கம்
                  </FileField>

                  <FileField
                    accept="image/*"
                    onChange={(e) => handleFileSelect('signature', e)}
                    preview={previews.signature}
                    required
                  >
                    Worker Signature / தொழிலாளியின் கையொப்பம்
                  </FileField>
                </div>

                {/* Worker Live Photo Section */}
                <div className="grid gap-5 grid-cols-1">
                  <LivePhotoSection
                    label="Worker Live Photo / தொழிலாளியின் நேரடி புகைப்படம்"
                    onCapture={(dataUrl) => {
                      setPreviews((prev) => ({ ...prev, livePhoto: dataUrl }))
                    }}
                    preview={previews.livePhoto}
                  />
                </div>
              </Section>
            </>
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
