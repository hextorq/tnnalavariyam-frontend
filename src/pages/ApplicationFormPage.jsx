import AuthRequired from '../components/AuthRequired.jsx'
import { FormSkeleton } from '../components/SkeletonLoader.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { bilingualName, tamilNaduDistricts } from '../data/signup.js'
import { api } from '../lib/api.js'
import { isAuthenticated } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { Link, navigate } from '../lib/router.jsx'
import FormUploadProgressModal from '../components/FormUploadProgressModal.jsx'
import SearchSelect from '../components/SearchSelect.jsx'
import { features } from '../config.js'
import { ArrowLeft, Camera, CheckCircle2, FileText, Image as ImageIcon, LoaderCircle, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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

function compressBase64Image(dataUrl, maxWidth = 1000, quality = 0.75) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

function dataUrlToBlob(dataUrl) {
  const commaIndex = dataUrl.indexOf(',')
  const meta = commaIndex > -1 ? dataUrl.slice(0, commaIndex) : ''
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  const base64 = commaIndex > -1 ? dataUrl.slice(commaIndex + 1) : dataUrl
  const byteString = atob(base64)
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i += 1) bytes[i] = byteString.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function uploadApplicationImage(blob, fileName) {
  const formData = new FormData()
  formData.append('file', blob, fileName)
  const response = await api.post('/applications/uploads/temp', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    showLoader: false,
  })
  return response.data?.upload
}

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
  { value: 'Other', label: 'பிற வகுப்பு / Other' },
]

const girlsStandardOptions = [
  { value: '10', label: '10ம் வகுப்பு / 10th Standard' },
  { value: '11', label: '11ம் வகுப்பு / 11th Standard' },
  { value: '12', label: '12ம் வகுப்பு / 12th Standard' },
  { value: 'Other', label: 'பிற வகுப்பு / Other' },
]

const examPassedOptions = [
  { value: '10', label: '10ம் வகுப்பு தேர்ச்சி / 10th Pass' },
  { value: '12', label: '12ம் வகுப்பு தேர்ச்சி / 12th Pass' },
  { value: 'Other', label: 'பிற தேர்ச்சி / Other' },
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

function SelectWithOther({ children, customPlaceholder, onCustomChange, onSelectChange, options, required = false, value = '' }) {
  const isCustom = value === 'Other' || (typeof value === 'string' && value.startsWith('Other - '))
  const customText = isCustom ? String(value).replace(/^Other - /, '') : ''
  return (
    <div className="flex flex-col justify-start gap-2 text-sm font-semibold text-neutral-700">
      <span>
        {children}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <select
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal text-neutral-900 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
        onChange={(e) => onSelectChange?.(e.target.value)}
        value={isCustom ? 'Other' : value || ''}
      >
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
      {isCustom && (
        <input
          className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 font-normal outline-none transition focus:border-[#f0ad4e] focus:ring-2 focus:ring-[#f0ad4e]/20"
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder={customPlaceholder || 'Type here / இங்கே உள்ளிடவும்'}
          value={customText}
        />
      )}
    </div>
  )
}

function UploadDisclaimer() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
      <span className="font-bold text-amber-700 shrink-0">⚠️ Disclaimer / குறிப்பு:</span>
      <span>JPEG (.jpg, .jpeg) or PNG (.png) images only. File size within 2 MB. / JPEG அல்லது PNG படங்கள் மட்டும். அளவு 2 MB க்குள்.</span>
    </div>
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
        accept="image/jpeg,image/png"
        className={preview ? 'hidden' : 'w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 font-normal outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-[#007cba] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-[#007cba]'}
        onChange={onChange}
        type="file"
        {...props}
      />

      {preview && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
          {isImageSrc ? (
            <div className="relative flex h-48 items-center justify-center bg-slate-900/5 p-3">
              <img alt="File preview" className="max-h-full max-w-full rounded-lg object-contain bg-white shadow-xs" src={preview} />
              <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                <CheckCircle2 className="shrink-0" size={14} />
                Ready to upload / பதிவேற்ற தயார்
              </span>
            </div>
          ) : (
            <div className="relative flex h-48 flex-col items-center justify-center gap-2 bg-[#eef8ff] px-4 text-center text-[#007cba]">
              <FileText size={40} />
              <p className="text-xs font-bold">Document Attached / ஆவணம் இணைக்கப்பட்டது</p>
              <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                <CheckCircle2 className="shrink-0" size={14} />
                Ready to upload / பதிவேற்ற தயார்
              </span>
            </div>
          )}

          <div className="border-t border-neutral-200 bg-neutral-50 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#007cba] hover:text-[#007cba]"
                onClick={handleReupload}
                type="button"
              >
                <RefreshCw className="shrink-0" size={13} />
                Re-upload / மீண்டும்
              </button>
              <button
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-100"
                onClick={handleDelete}
                type="button"
              >
                <Trash2 className="shrink-0" size={13} />
                Delete / நீக்கு
              </button>
            </div>
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
    if (preview) setMode('captured')
  }, [preview])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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

      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 w-full">
        <span className="font-bold text-amber-700 shrink-0">⚠️ Disclaimer / குறிப்பு:</span>
        <span>Webcam captures are automatically compressed to JPEG.</span>
      </div>

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
  const todayStr = new Date().toISOString().split('T')[0]

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

  const districtOptions = useMemo(
    () => tamilNaduDistricts.map((district) => ({ value: district.code, label: bilingualName(district) })),
    []
  )
  const [districtCode, setDistrictCode] = useState('')
  const handleDistrictChange = (code) => {
    setDistrictCode(code)
    const district = tamilNaduDistricts.find((item) => item.code === code)
    handleInputChange('district', district?.name || '')
  }

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
    childAadhar: '',    bonafide: '',
    markSheet: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedAppNo, setSubmittedAppNo] = useState('')
  const [loading, setLoading] = useState(true)

  // Progress Overlay Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStageIndex, setUploadStageIndex] = useState(0)
  const [activeFileList, setActiveFileList] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [formId])

  if (loading) return <FormSkeleton />

  const isRenewal = currentKey === 'renewal'
  const isNewRegistration = currentKey === 'new-registration'
  const isHigherEducation = currentKey === 'higher-education'
  const isPass = currentKey === 'education-pass'
  const isGirls = currentKey === 'education-girls-10-12'
  const isEducation = !isRenewal && !isNewRegistration

  function handleInputChange(field, value) {
    let sanitizedValue = value
    if (field === 'workerName' || field === 'nomineeName') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '')
    }
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }))
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png']

    if (!allowedTypes.includes(file.type?.toLowerCase()) && !allowedExtensions.includes(ext)) {
      notify({
        type: 'error',
        title: 'Invalid File Format / தவறான கோப்பு வகை',
        message: 'JPEG (.jpg, .jpeg) அல்லது PNG (.png) படங்கள் மட்டுமே ஏற்றுக் கொள்ளப்படும்.',
      })
      event.target.value = ''
      setPreviews((prev) => ({ ...prev, [field]: '' }))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      notify({
        type: 'error',
        title: 'File Size Exceeded / கோப்பின் அளவு பெரியது',
        message: 'கோப்பின் அளவு 2 MB-க்குள் மட்டுமே இருக்க வேண்டும். / Maximum file size allowed is 2 MB.',
      })
      event.target.value = ''
      setPreviews((prev) => ({ ...prev, [field]: '' }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviews((prev) => ({ ...prev, [field]: reader.result }))
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    // === Common validation for ALL forms ===
    if (!formData.workerName.trim()) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'தொழிலாளியின் பெயர் உள்ளிடவும் (எழுத்துக்கள் மட்டும்). / Enter worker name.' })
      return
    }
    if (!formData.phone || formData.phone.length !== 10) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: '10 இலக்க அலைபேசி எண் தேவை. / Enter 10 digit mobile number.' })
      return
    }
    if (!formData.district) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'மாவட்டம் தேர்வு செய்யவும். / Select district.' })
      return
    }

    // === New Registration & Renewal specific ===
    if (isNewRegistration || isRenewal) {
      if (!formData.dob) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பிறந்த தேதி தேர்வு செய்யவும். / Select date of birth.' })
        return
      }
      if (formData.dob > todayStr) {
        notify({ type: 'warning', title: 'Invalid Date', message: 'பிறந்த தேதி எதிர்காலத்தில் இருக்கக்கூடாது. / Select a valid past date of birth.' })
        return
      }
      if (!formData.dobProofType) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பிறந்த தேதிக்கான ஆவண வகை தேர்வு செய்யவும். / Select DOB proof document type.' })
        return
      }
      if (!formData.religion) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'மதம் தேர்வு செய்யவும். / Select religion.' })
        return
      }
      if (formData.religion === 'Other') {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'மதத்தின் பெயரை உள்ளிடவும். / Type the religion name.' })
        return
      }
      if (!formData.caste) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'சாதி பிரிவு தேர்வு செய்யவும். / Select caste.' })
        return
      }
      if (formData.caste === 'Other') {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'சாதி பிரிவின் பெயரை உள்ளிடவும். / Type the community name.' })
        return
      }
      if (!formData.subCaste) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'உட்பிரிவு தேர்வு செய்யவும். / Select sub-caste.' })
        return
      }
      if (formData.subCaste === 'Other') {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'உட்பிரிவின் பெயரை உள்ளிடவும். / Type the sub-caste name.' })
        return
      }
      if (!formData.workerJob) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'தொழிலாளியின் வேலை தேர்வு செய்யவும். / Select worker job.' })
        return
      }
      if (formData.workerJob === 'Other') {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வேலையின் பெயரை உள்ளிடவும். / Type the other work name.' })
        return
      }
      if (!formData.nomineeName.trim()) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'நாமினி பெயர் உள்ளிடவும் (எழுத்துக்கள் மட்டும்). / Enter nominee name.' })
        return
      }
      if (!previews.dobDocument) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பிறந்த தேதிக்கான ஆவணம் பதிவேற்றவும். / Upload DOB proof document.' })
        return
      }
      if (!previews.photo) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'புகைப்படம் பதிவேற்றவும். / Upload passport photo.' })
        return
      }
      if (!previews.nomineeAadhar) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'நாமினி ஆதார் அட்டை பதிவேற்றவும். / Upload nominee Aadhar card.' })
        return
      }
      if (!previews.bankPassbook) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வங்கி புத்தகம் பதிவேற்றவும். / Upload bank passbook.' })
        return
      }
    }

    // === Education forms specific ===
    if (isEducation) {
      if (!formData.customData.childName?.trim()) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'குழந்தையின் பெயர் உள்ளிடவும். / Enter child name.' })
        return
      }
      if (isHigherEducation) {
        if (!formData.customData.courseType) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'படிப்பு வகையைத் தேர்ந்தெடுக்கவும். / Select course type.' })
          return
        }
        if (formData.customData.courseType === 'Other') {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'படிப்பு வகையின் பெயரை உள்ளிடவும். / Type the other course type.' })
          return
        }
        if (!formData.customData.courseName?.trim()) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பாடத்தின் பெயர் உள்ளிடவும். / Enter course name.' })
          return
        }
        if (!formData.customData.courseDuration?.trim()) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பாடத்தின் கால அளவு உள்ளிடவும். / Enter course duration.' })
          return
        }
        if (!formData.customData.applyingYear) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'விண்ணப்பிக்கும் ஆண்டைத் தேர்ந்தெடுக்கவும். / Select applying year.' })
          return
        }
      } else if (isPass) {
        if (!formData.customData.examPassed) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'தேர்ச்சி பெற்ற வகுப்பைத் தேர்ந்தெடுக்கவும். / Select examination passed.' })
          return
        }
        if (formData.customData.examPassed === 'Other') {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'தேர்ச்சி வகுப்பின் பெயரை உள்ளிடவும். / Type the passed class name.' })
          return
        }
      } else {
        if (!formData.customData.standard) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வகுப்பைத் தேர்ந்தெடுக்கவும். / Select standard.' })
          return
        }
        if (formData.customData.standard === 'Other') {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வகுப்பின் பெயரை உள்ளிடவும். / Type the standard name.' })
          return
        }
      }
      if (!formData.customData.academicYear) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'கல்வி ஆண்டைத் தேர்ந்தெடுக்கவும். / Select academic year.' })
        return
      }
      if (!previews.childAadhar) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'குழந்தையின் ஆதார் அட்டை பதிவேற்றவும். / Upload child Aadhar card.' })
        return
      }
      if (isPass) {
        if (!previews.markSheet) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'மதிப்பெண் பட்டியல் பதிவேற்றவும். / Upload mark sheet.' })
          return
        }
      } else {
        if (!previews.bonafide) {
          notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'கல்வி சான்று பதிவேற்றவும். / Upload bonafide certificate.' })
          return
        }
      }
      if (!previews.bankPassbookFront) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வங்கி புத்தகத்தின் முதல் பக்கம் பதிவேற்றவும். / Upload bank passbook front page.' })
        return
      }
      if (!previews.bankPassbookLast) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'வங்கி புத்தகத்தின் கடைசி பரிவர்த்தனை பக்கம் பதிவேற்றவும். / Upload bank passbook last transaction page.' })
        return
      }
    }

    // === Common document validation for ALL forms ===
    if (!previews.registrationCard) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பதிவு அட்டை பதிவேற்றவும். / Upload registration card.' })
      return
    }
    if (!previews.aadharCard) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'ஆதார் அட்டை பதிவேற்றவும். / Upload Aadhar card.' })
      return
    }
    if (!previews.rationCard) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'குடும்ப அட்டை பதிவேற்றவும். / Upload ration card.' })
      return
    }
    if (!previews.signature) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'கையொப்பம் பதிவேற்றவும். / Upload signature.' })
      return
    }
    if (features.livePhoto && !previews.livePhoto) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'நேரடி புகைப்படம் எடுக்கவும். / Capture live photo.' })
      return
    }
    if (form.fee) {
      if (!formData.upiTransactionId.trim()) {
        notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'UPI transaction ID உள்ளிடவும். / Enter UPI transaction ID.' })
        return
      }
    }
    if (!formData.declared) {
      notify({ type: 'warning', title: 'Declaration Required', message: 'உறுதிமொழியை டிக் செய்ய வேண்டும். / Please accept the declaration.' })
      return
    }

    // Hard pre-submit validation for 2 MB file size & JPEG/PNG format across all uploaded previews
    const MAX_BASE64_LENGTH = 2.8 * 1024 * 1024
    for (const [key, val] of Object.entries(previews)) {
      if (val && typeof val === 'string' && val.startsWith('data:')) {
        const isJpegOrPng = val.startsWith('data:image/jpeg') || val.startsWith('data:image/jpg') || val.startsWith('data:image/png') || val.startsWith('data:image/pjpeg')
        if (!isJpegOrPng) {
          notify({
            type: 'error',
            title: 'Invalid File Format / தவறான படம்',
            message: `பதிவேற்றப்பட்ட படம் JPEG அல்லது PNG மட்டுமே ஏற்றுக் கொள்ளப்படும் (${key}).`,
          })
          return
        }
        if (val.length > MAX_BASE64_LENGTH) {
          notify({
            type: 'error',
            title: 'File Size Exceeded / கோப்பின் அளவு பெரியது',
            message: `ஆவணத்தின் அளவு 2 MB-க்குள் இருக்க வேண்டும் (${key}).`,
          })
          return
        }
      }
    }

    // Build file list for visual progress queue
    const docLabels = {
      photo: 'Passport Photo / புகைப்பட முகப்பு',
      livePhoto: 'Live Photo Capture / நேரடி புகைப்படம்',
      signature: 'Worker Signature / கையொப்பம்',
      dobDocument: 'DOB Proof Document / பிறந்த தேதிக்கான ஆவணம்',
      aadharCard: 'Aadhar Card / ஆதார் அட்டை',
      rationCard: 'Ration Card / குடும்ப அட்டை',
      bankPassbook: 'Bank Passbook / வங்கி புத்தகம்',
      bankPassbookFront: 'Passbook Front Page / வங்கி புத்தகம்',
      bankPassbookLast: 'Passbook Last Transaction / வங்கி புத்தகம்',
      registrationCard: 'Registration Card / பதிவு அட்டை',
      nomineeAadhar: "Nominee's Aadhar Card / நாமினி ஆதார்",
      childAadhar: "Child's Aadhar Card / குழந்தை ஆதார்",
      bonafide: 'Bonafide Certificate / கல்வி சான்று',
      markSheet: 'Mark Sheet / மதிப்பெண் பட்டியல்',
      paymentScreenshot: 'Payment Screenshot / கட்டண ரசீது',
    }
    const attachedFiles = Object.entries(previews)
      .filter(([_, val]) => Boolean(val))
      .map(([key]) => ({ label: docLabels[key] || key, status: 'uploading' }))

    setActiveFileList(attachedFiles)
    setUploadProgress(10)
    setUploadStageIndex(0)
    setUploadModalOpen(true)

    try {
      setSubmitting(true)

      // 1. Fast parallel image compression
      const compressedEntries = await Promise.all(
        Object.entries(previews).map(async ([k, v]) => {
          if (!v) return [k, '']
          const compressed = await compressBase64Image(v, 1000, 0.75)
          return [k, compressed]
        })
      )
      const compressedPreviews = Object.fromEntries(compressedEntries)
      setUploadProgress(25)
      setUploadStageIndex(1)

      // 2. Upload compressed images to temp storage; JSON payload stays tiny (paths only)
      const imageEntries = Object.entries(compressedPreviews).filter(
        ([, value]) => value && typeof value === 'string' && value.startsWith('data:')
      )
      const uploadedImages = []
      let uploadedChars = 0
      const totalChars = imageEntries.reduce((sum, [, value]) => sum + value.length, 0) || 1
      for (const [key, dataUrl] of imageEntries) {
        const blob = dataUrlToBlob(dataUrl)
        const upload = await uploadApplicationImage(blob, `${key}-${Date.now()}.jpg`)
        uploadedImages.push({
          field: key,
          path: upload.path,
          originalName: upload.originalName,
          sizeBytes: upload.sizeBytes,
          mimeType: upload.mimeType,
        })
        uploadedChars += dataUrl.length
        setUploadProgress(Math.min(80, Math.round(25 + (uploadedChars * 55) / totalChars)))
      }
      setUploadStageIndex(2)
      setUploadProgress(80)

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
        images: uploadedImages,
        paymentData: {
          amount: form.fee || 150,
          upiTransactionId: formData.upiTransactionId.trim(),
        },
        paymentReference: formData.upiTransactionId.trim(),
        submit: true,
      }

      // 3. Real Network Transmission Progress via Axios
      const response = await api.post('/applications/submissions', payload, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || (progressEvent.loaded ? progressEvent.loaded * 1.05 : 1)
          const percent = Math.min(95, Math.round(80 + (progressEvent.loaded * 15) / total))
          setUploadProgress(percent)
          if (percent >= 85) setUploadStageIndex(2)
        },
      })

      setUploadProgress(100)
      setUploadStageIndex(3)

      const appNo = response.data.submission?.applicationNo || `TNW-${Date.now()}`
      
      await new Promise((res) => setTimeout(res, 500))
      setUploadModalOpen(false)
      setSubmittedAppNo(appNo)
      
      notify({
        type: 'success',
        title: 'Application Submitted / விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
        message: `உங்கள் விண்ணப்ப எண்: ${appNo}`,
      })
    } catch (error) {
      setUploadModalOpen(false)
      if (uploadedImages.length) {
        uploadedImages.forEach((image) => {
          api.delete('/applications/uploads/temp', { params: { path: image.path }, showLoader: false }).catch(() => {})
        })
      }
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

  return (
    <div className="min-h-screen bg-neutral-100 px-3 py-6 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3 min-w-0">
            <Link className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100" to="/app">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Online Portal Submission</p>
              <h1 className="text-xl font-bold text-neutral-950 sm:text-2xl break-words">{form.tamilTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-bold text-[#007cba] border border-[#007cba]/20 whitespace-nowrap">
              {form.fee ? `Fee: ₹${form.fee}` : 'Free / இலவசம்'}
            </span>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* New Registration & Renewal Form */}
          {(isNewRegistration || isRenewal) && (
            <Section eyebrow="Worker Details" title="Worker details / தொழிலாளியின் விவரங்கள்">
              {/* Text & Dropdown Inputs Group 1 */}
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
                  Phone no / அலைபேசி எண்
                </Field>
              </div>

              {/* Text & Dropdown Inputs Group 2 */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <label className="flex flex-col justify-start gap-2">
                  <span className="text-sm font-semibold text-neutral-700">
                    மாவட்டம் / District
                    <span className="ml-1 text-red-600" aria-label="required">*</span>
                  </span>
                  <SearchSelect
                    onChange={handleDistrictChange}
                    options={districtOptions}
                    placeholder="மாவட்டம் தேடவும் / Search district"
                    value={districtCode}
                  />
                </label>

                <Field
                  max={todayStr}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  required
                  type="date"
                  value={formData.dob}
                >
                  Date of Birth / பிறந்த தேதி
                </Field>
              </div>

              {/* Text & Dropdown Inputs Group 3 */}
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleInputChange('dobProofType', e.target.value)}
                  options={dobProofOptions}
                  required
                  value={formData.dobProofType}
                >
                  Document for Date of Birth / பிறந்த தேதிக்கான ஆவணம்
                </SelectField>

                <Field
                  onChange={(e) => handleInputChange('nomineeName', e.target.value)}
                  placeholder="நாமினி பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.nomineeName}
                >
                  Nominee Name / நாமினி பெயர்
                </Field>
              </div>

              {/* Text & Dropdown Inputs Group 4 */}
              <div className="grid gap-5 md:grid-cols-3 items-start">
                <SelectWithOther
                  customPlaceholder="மதத்தின் பெயரை உள்ளிடவும் / Type the religion name"
                  onCustomChange={(text) => handleInputChange('religion', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleInputChange('religion', v)}
                  options={religionOptions}
                  required
                  value={formData.religion}
                >
                  Religion / மதம்
                </SelectWithOther>

                <SelectWithOther
                  customPlaceholder="உங்கள் பிரிவின் பெயரை உள்ளிடவும் / Type the community name"
                  onCustomChange={(text) => handleInputChange('caste', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleInputChange('caste', v)}
                  options={casteOptions}
                  required
                  value={formData.caste}
                >
                  Caste / ஜாதி
                </SelectWithOther>

                <SelectWithOther
                  customPlaceholder="உங்கள் உட்பிரிவின் பெயரை உள்ளிடவும் / Type the sub-caste name"
                  onCustomChange={(text) => handleInputChange('subCaste', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleInputChange('subCaste', v)}
                  options={subCasteOptions}
                  required
                  value={formData.subCaste}
                >
                  Sub-Caste / உட்பிரிவு
                </SelectWithOther>
              </div>

              {/* Text & Dropdown Inputs Group 5 */}
              <div className="grid gap-5 md:grid-cols-1 items-start">
                <SelectWithOther
                  customPlaceholder="வேலையின் பெயரை உள்ளிடவும் / Type the other work name"
                  onCustomChange={(text) => handleInputChange('workerJob', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleInputChange('workerJob', v)}
                  options={workerJobOptions}
                  required
                  value={formData.workerJob}
                >
                  Worker's job / தொழிலாளியின் வேலை
                </SelectWithOther>
              </div>

              {/* Document Uploads Section - Grouped Cleanly in Pairs */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Upload Mandatory Documents / ஆவணங்கள் பதிவேற்றம்</p>
                <UploadDisclaimer />
                <div className="mt-4 grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileSelect('dobDocument', e)}
                    preview={previews.dobDocument}
                    required
                  >
                    Submit a document for date of birth / பிறந்த தேதிக்கான ஆவணத்தை சமர்ப்பிக்கவும்
                  </FileField>

                  <FileField
                    accept="image/*"
                    onChange={(e) => handleFileSelect('photo', e)}
                    preview={previews.photo}
                    required
                  >
                    Photo / புகைப்படம்
                  </FileField>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 items-start">
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
                    onChange={(e) => handleFileSelect('bankPassbook', e)}
                    preview={previews.bankPassbook}
                    required
                  >
                    Bank Passbook / வங்கி புத்தகம்
                  </FileField>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('aadharCard', e)}
                    preview={previews.aadharCard}
                    required
                  >
                    Aadhar Card / ஆதார் அட்டை
                  </FileField>

                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('rationCard', e)}
                    preview={previews.rationCard}
                    required
                  >
                    Ration card / குடும்ப அட்டை
                  </FileField>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 items-start">
                  <FileField
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileSelect('nomineeAadhar', e)}
                    preview={previews.nomineeAadhar}
                    required
                  >
                    Nominee's Aadhar Card File / நாமினி ஆதார் அட்டை
                  </FileField>

                  <FileField
                    accept="image/*"
                    onChange={(e) => handleFileSelect('signature', e)}
                    preview={previews.signature}
                    required
                  >
                    Signature / கையொப்பம்
                  </FileField>
                </div>
              </div>
            </Section>
          )}

          {/* Education 6-9 & Girls 10-12 - Child Details */}
          {(currentKey === 'education-6-9' || isGirls) && (
            <Section eyebrow="Child Details" title="Child details / குழந்தையின் விவரங்கள்">
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectWithOther
                  customPlaceholder="வகுப்பின் பெயரை உள்ளிடவும் / Type the standard name"
                  onCustomChange={(text) => handleCustomChange('standard', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleCustomChange('standard', v)}
                  options={isGirls ? girlsStandardOptions : standardOptions}
                  required
                  value={formData.customData.standard || ''}
                >
                  Choose the standard in which studying / படிக்கும் வகுப்பைத் தேர்ந்தெடுக்கவும்
                </SelectWithOther>

                <Field
                  onChange={(e) => handleCustomChange('childName', e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  placeholder="குழந்தையின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.customData.childName || ''}
                >
                  Child's Name / குழந்தையின் பெயர்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-1 items-start">
                <SelectField
                  onChange={(e) => handleCustomChange('academicYear', e.target.value)}
                  options={academicYearOptions}
                  required
                  value={formData.customData.academicYear || ''}
                >
                  Academic year of study / கல்வி ஆண்டு
                </SelectField>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Upload Child Documents / குழந்தையின் ஆவணங்கள்</p>
                <UploadDisclaimer />
                <div className="mt-4 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('childAadhar', e)} preview={previews.childAadhar} required>
                    Child's Aadhar card / குழந்தையின் ஆதார் அட்டை
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('bonafide', e)} preview={previews.bonafide} required>
                    Bonafide certificate / கல்வி சான்று
                  </FileField>
                </div>
              </div>
            </Section>
          )}

          {/* 10th/12th Pass - Child Details */}
          {isPass && (
            <Section eyebrow="Child Details" title="Child details / குழந்தையின் விவரங்கள்">
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectWithOther
                  customPlaceholder="தேர்ச்சி வகுப்பின் பெயரை உள்ளிடவும் / Type the passed class name"
                  onCustomChange={(text) => handleCustomChange('examPassed', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleCustomChange('examPassed', v)}
                  options={examPassedOptions}
                  required
                  value={formData.customData.examPassed || ''}
                >
                  Examination passed / தேர்ச்சி பெற்ற வகுப்பு
                </SelectWithOther>

                <Field
                  onChange={(e) => handleCustomChange('childName', e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  placeholder="குழந்தையின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.customData.childName || ''}
                >
                  Child's Name / குழந்தையின் பெயர்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-1 items-start">
                <SelectField
                  onChange={(e) => handleCustomChange('academicYear', e.target.value)}
                  options={academicYearOptions}
                  required
                  value={formData.customData.academicYear || ''}
                >
                  Academic year of study / கல்வி ஆண்டு
                </SelectField>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Upload Child Documents / குழந்தையின் ஆவணங்கள்</p>
                <UploadDisclaimer />
                <div className="mt-4 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('childAadhar', e)} preview={previews.childAadhar} required>
                    Child's Aadhar card / குழந்தையின் ஆதார் அட்டை
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('markSheet', e)} preview={previews.markSheet} required>
                    Mark Sheet / மதிப்பெண் பட்டியல் (Original/அசல்)
                  </FileField>
                </div>
              </div>
            </Section>
          )}

          {/* Higher Education - Child Details */}
          {isHigherEducation && (
            <Section eyebrow="Child Details" title="Child details / குழந்தையின் விவரங்கள்">
              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectWithOther
                  customPlaceholder="படிப்பு வகையின் பெயரை உள்ளிடவும் / Type the other course type"
                  onCustomChange={(text) => handleCustomChange('courseType', text.trim() ? `Other - ${text}` : 'Other')}
                  onSelectChange={(v) => handleCustomChange('courseType', v)}
                  options={courseTypeOptions}
                  required
                  value={formData.customData.courseType || ''}
                >
                  Choose the standard in which studying / படிக்கும் வகுப்பைத் தேர்ந்தெடுக்கவும்
                </SelectWithOther>

                <Field
                  onChange={(e) => handleCustomChange('childName', e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  placeholder="குழந்தையின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.customData.childName || ''}
                >
                  Child's Name / குழந்தையின் பெயர்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <Field
                  onChange={(e) => handleCustomChange('courseName', e.target.value)}
                  placeholder="பாடத்தின் பெயர் உள்ளிடவும்"
                  required
                  type="text"
                  value={formData.customData.courseName || ''}
                >
                  Name of the Course / பாடத்தின் பெயர்
                </Field>

                <Field
                  onChange={(e) => handleCustomChange('courseDuration', e.target.value.replace(/\D/g, ''))}
                  placeholder="ஆண்டுகளின் எண்ணிக்கை"
                  required
                  type="text"
                  value={formData.customData.courseDuration || ''}
                >
                  Duration of the Course / பாடத்தின் ஆண்டுகளில் (in Years)
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2 items-start">
                <SelectField
                  onChange={(e) => handleCustomChange('applyingYear', e.target.value)}
                  options={applyingYearOptions}
                  required
                  value={formData.customData.applyingYear || ''}
                >
                  In which year applying for / எந்த ஆண்டில் விண்ணப்பிக்கிறது (in Years)
                </SelectField>

                <SelectField
                  onChange={(e) => handleCustomChange('academicYear', e.target.value)}
                  options={academicYearOptions}
                  required
                  value={formData.customData.academicYear || ''}
                >
                  Academic year of study / கல்வி ஆண்டு
                </SelectField>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Upload Child Documents / குழந்தையின் ஆவணங்கள்</p>
                <UploadDisclaimer />
                <div className="mt-4 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('childAadhar', e)} preview={previews.childAadhar} required>
                    Child's Aadhar card / குழந்தையின் ஆதார் அட்டை
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('bonafide', e)} preview={previews.bonafide} required>
                    Bonafide certificate / கல்வி சான்று
                  </FileField>
                </div>
              </div>
            </Section>
          )}

          {/* Shared Worker Details Section for ALL Education Forms */}
          {isEducation && (
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
                  Phone Number / கைபேசி எண்
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-1 items-start">
                <label className="flex flex-col justify-start gap-2">
                  <span className="text-sm font-semibold text-neutral-700">
                    மாவட்டம் / District
                    <span className="ml-1 text-red-600" aria-label="required">*</span>
                  </span>
                  <SearchSelect
                    onChange={handleDistrictChange}
                    options={districtOptions}
                    placeholder="மாவட்டம் தேடவும் / Search district"
                    value={districtCode}
                  />
                </label>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Upload Worker Documents / தொழிலாளியின் ஆவணங்கள் பதிவேற்றம்</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('registrationCard', e)} preview={previews.registrationCard} required>
                    Worker Registration card / தொழிலாளியின் பதிவு அட்டை
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('aadharCard', e)} preview={previews.aadharCard} required>
                    {isHigherEducation ? "Worker's Aadhar அட்டை / தொழிலாளியின் ஆதார் அட்டை" : 'Aadhar Card / ஆதார் அட்டை'}
                  </FileField>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('rationCard', e)} preview={previews.rationCard} required>
                    Ration Card / குடும்ப அட்டை
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('bankPassbookFront', e)} preview={previews.bankPassbookFront} required>
                    Upload Bank passbook front page / வங்கி கணக்கு புத்தகத்தின் முதல் பக்கத்தை பதிவேற்றம் செய்யவும்
                  </FileField>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2 items-start">
                  <FileField onChange={(e) => handleFileSelect('bankPassbookLast', e)} preview={previews.bankPassbookLast} required>
                    Upload Last Transaction page of the passbook / வங்கி கணக்கு புத்தகத்தில் கடைசி பரிவர்த்தனை பக்கத்தை பதிவேற்றம் செய்யவும்
                  </FileField>

                  <FileField onChange={(e) => handleFileSelect('signature', e)} preview={previews.signature} required>
                    Worker Signature / தொழிலாளியின் கையொப்பம்
                  </FileField>
                </div>
              </div>
            </Section>
          )}

          {/* Payment Section */}
          {form.fee ? (
            <Section eyebrow="Payment Information" title="Registration Fee Payment / பதிவுக் கட்டண செலுத்துதல்">
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                  <p className="text-xs font-bold uppercase text-neutral-500">QR Image / க்யூஆர் படம்</p>
                  <div className="mx-auto mt-3 h-52 w-52 rounded-xl border border-neutral-200 bg-black shadow-xs" aria-label="QR placeholder" />
                  <p className="mt-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 px-3 rounded-xl">
                    Pay the amount ₹{form.fee} / ₹{form.fee} தொகையை செலுத்தவும்
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
                    required
                  >
                    Upload the payment screenshot / கட்டணத் தொகையின் ஸ்கிரீன்ஷாட்டை பதிவேற்றம் செய்யவும்
                  </FileField>

                  <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <label className="flex items-start gap-3 text-sm font-semibold text-neutral-800 cursor-pointer">
                      <input
                        checked={formData.declared}
                        className="mt-1 size-5 shrink-0 accent-[#007cba]"
                        onChange={(e) => handleInputChange('declared', e.target.checked)}
                        required
                        type="checkbox"
                      />
                      <span>
                        I hereby declare that all the information provided above is true to the best of my knowledge. / மேலே கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் நான் அறிந்த வகையில் உண்மை என உறுதி கூறுகிறேன். *
                      </span>
                    </label>
                  </div>

                  {features.livePhoto && (
                    <LivePhotoSection
                      required
                      onCapture={(dataUrl) => {
                        setPreviews((prev) => ({ ...prev, livePhoto: dataUrl }))
                      }}
                      preview={previews.livePhoto}
                    />
                  )}
                </div>
              </div>
            </Section>
          ) : (
            <Section eyebrow="Declaration" title="Self Declaration / சுய உறுதிமொழி">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <label className="flex items-start gap-3 text-sm font-semibold text-neutral-800 cursor-pointer">
                  <input
                    checked={formData.declared}
                    className="mt-1 size-5 shrink-0 accent-[#007cba]"
                    onChange={(e) => handleInputChange('declared', e.target.checked)}
                    required
                    type="checkbox"
                  />
                  <span>
                    I hereby declare that all the information provided above is true to the best of my knowledge. / மேலே கொடுக்கப்பட்டுள்ள அனைத்து தகவல்களும் நான் அறிந்த வகையில் உண்மை என உறுதி கூறுகிறேன். *
                  </span>
                </label>
              </div>

              {features.livePhoto && (
                <div className="mt-5">
                  <LivePhotoSection
                    required
                    onCapture={(dataUrl) => {
                      setPreviews((prev) => ({ ...prev, livePhoto: dataUrl }))
                    }}
                    preview={previews.livePhoto}
                  />
                </div>
              )}
            </Section>
          )}

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

      <FormUploadProgressModal
        currentStageIndex={uploadStageIndex}
        isOpen={uploadModalOpen}
        progress={uploadProgress}
        stages={[
          { title: 'Validating Attached Images & Files', tamil: 'படங்கள் சரிபார்க்கப்படுகிறது' },
          { title: 'Compressing & Encrypting Payloads', tamil: 'ஆவணங்கள் தயார் செய்யப்படுகிறது' },
          { title: 'Transmitting Data & Images to Server', tamil: 'தரவு சேவையகத்திற்கு அனுப்பப்படுகிறது' },
          { title: 'Finalizing Application Record & No', tamil: 'விண்ணப்ப எண் உருவாக்கப்படுகிறது' },
        ]}
        subtitle={`Form: ${form.tamilTitle || form.title}`}
        title="Application Submission / விண்ணப்ப சமர்ப்பிப்பு"
        uploadedFiles={activeFileList}
      />
    </div>
  )
}
