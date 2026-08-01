import Button from '../components/Button.jsx'
import FormUploadProgressModal from '../components/FormUploadProgressModal.jsx'
import { CheckCircle2, Eye, EyeOff, LoaderCircle, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { idProofOptions, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { api } from '../lib/api.js'
import { saveProfilePhoto, saveSession } from '../lib/auth.js'
import { normalizePhone, normalizePincode, phoneInputProps, pincodeInputProps } from '../lib/phone.js'
import { useNotifications } from '../lib/notifications.js'
import { Link, navigate } from '../lib/router.jsx'
import { transliterateTamil } from '../lib/tamilTransliteration.js'

const initialSignupForm = {
  fullName: '',
  username: '',
  phone: '',
  email: '',
  requestedRole: 'PARTNER',
  pincode: '',
  addressLine: '',
  idProofType: 'AADHAR_CARD',
  idProofNumber: '',
  password: '',
  confirmPassword: '',
  photo: null,
  idProof: null,
}

const initialPreuploads = {
  photo: { error: '', path: '', progress: 0, status: 'idle' },
  idProof: { error: '', path: '', progress: 0, status: 'idle' },
}

const MB = 1024 * 1024
const passportConfig = {
  maxSize: 2 * MB,
  accept: 'image/jpeg,image/png',
  allowedExtensions: ['jpg', 'jpeg', 'png'],
  allowedMimePrefixes: ['image/jpeg', 'image/jpg', 'image/png'],
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  hint: 'JPEG or PNG only. Max 2 MB.',
}
const documentConfig = {
  maxSize: 2 * MB,
  accept: 'image/jpeg,image/png',
  allowedExtensions: ['jpg', 'jpeg', 'png'],
  allowedMimePrefixes: ['image/jpeg', 'image/jpg', 'image/png'],
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  hint: 'JPEG or PNG only. Max 2 MB.',
}

const signupProgressSteps = [
  { id: 'checking', label: 'விவரங்கள் சரிபார்ப்பு / Checking details' },
  { id: 'uploading', label: 'விவரங்கள் சமர்ப்பிக்கப்படுகிறது / Submitting details' },
  { id: 'processing', label: 'சர்வர் செயலாக்கம் / Server processing' },
]

function bilingualName(item) {
  if (!item) return ''
  const englishName = item.englishName || transliterateTamil(item.name)
  return englishName && englishName !== item.name ? `${item.name} / ${englishName}` : item.name
}

function FieldLabel({ children, required = false }) {
  return (
    <span className="text-sm font-semibold text-neutral-700">
      {children}
      {required && <span className="ml-1 text-red-600" aria-label="required">*</span>}
    </span>
  )
}

const inputClass = 'min-w-0 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20'

function FormSection({ children, title }) {
  return (
    <section className="grid gap-4 border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="border-b border-neutral-200 pb-3 text-base font-bold text-neutral-950">{title}</h2>
      {children}
    </section>
  )
}

function PasswordInput({ minLength, onChange, placeholder, value }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        className={`${inputClass} pr-12`}
        minLength={minLength}
        onChange={onChange}
        placeholder={placeholder}
        required
        type={visible ? 'text' : 'password'}
        value={value}
      />
      <button
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center text-neutral-600 hover:text-neutral-950"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

function SearchSelect({ disabled = false, onChange, options, placeholder, value }) {
  const selectedOption = options.find((option) => option.value === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    setQuery(selectedOption?.label || '')
  }, [selectedOption?.label])

  return (
    <div className="relative">
      <input
        aria-expanded={open}
        autoComplete="off"
        className={`${inputClass} disabled:bg-neutral-100`}
        disabled={disabled}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        placeholder={placeholder}
        role="combobox"
        value={open ? query : selectedOption?.label || ''}
      />
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto border border-neutral-300 bg-white shadow-lg">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                className="block w-full px-4 py-3 text-left text-sm hover:bg-[#eef8ff] focus:bg-[#eef8ff]"
                key={option.value}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(option.value)
                  setQuery(option.label)
                  setOpen(false)
                }}
                type="button"
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">No matching option</div>
          )}
        </div>
      )}
    </div>
  )
}

function formatFileSize(size) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(file) {
  return file?.name?.split('.').pop()?.toLowerCase() || ''
}

function validateFile(file, config) {
  if (!file) return ''
  const extension = getFileExtension(file)
  const mimeAllowed = config.allowedMimePrefixes?.some((prefix) => file.type?.startsWith(prefix))
    || config.allowedMimeTypes?.includes(file.type)
  const extensionAllowed = config.allowedExtensions.includes(extension)

  if (!mimeAllowed && !extensionAllowed) {
    return `Invalid file type. Allowed: ${config.allowedExtensions.join(', ')}.`
  }
  if (file.size > config.maxSize) {
    return `File is too large. Maximum allowed size is ${formatFileSize(config.maxSize)}.`
  }
  return ''
}

function DocumentUpload({ file, label, onChange, required = false, uploadConfig }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file || !file.type?.startsWith('image/')) {
      setPreviewUrl('')
      return undefined
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [file])

  function openPicker() {
    inputRef.current?.click()
  }

  function clearFile() {
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null
    const error = validateFile(selectedFile, uploadConfig)
    if (error) {
      event.target.value = ''
      onChange(null, error)
      return
    }
    onChange(selectedFile, '')
  }

  return (
    <div className="flex flex-col justify-start gap-2 text-sm font-semibold text-neutral-700">
      <span className="block lg:min-h-10"><FieldLabel required={required}>{label}</FieldLabel></span>
      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
        <span className="font-bold text-amber-700 shrink-0">⚠️ Disclaimer / குறிப்பு:</span>
        <span>JPEG (.jpg, .jpeg) or PNG (.png) images only. Maximum file size 2 MB.</span>
      </div>
      <input
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={handleFileChange}
        ref={inputRef}
        required={required && !file}
        type="file"
      />
      <div className="overflow-hidden border border-neutral-300 bg-neutral-50">
        {file ? (
          <>
            <div className="flex flex-col gap-3 border-b border-neutral-200 bg-white p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-bold text-neutral-950">{file.name}</p>
                <p className="mt-1 text-xs font-normal text-neutral-600">
                  {file.type || 'Selected file'}{file.size ? ` - ${formatFileSize(file.size)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="inline-flex items-center gap-2 border border-neutral-300 px-3 py-2 text-xs font-bold" onClick={openPicker} type="button">
                  <Upload size={14} />
                  Reselect
                </button>
                <button className="inline-flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700" onClick={clearFile} type="button">
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
            {previewUrl ? (
              <div className="bg-white p-3">
                <img className="mx-auto max-h-72 w-full object-contain" src={previewUrl} alt={`${label} preview`} />
              </div>
            ) : (
              <div className="bg-white p-5 text-sm font-semibold text-neutral-700">
                {file.type === 'application/pdf' ? 'PDF document selected' : 'Document selected'}
              </div>
            )}
          </>
        ) : (
          <button className="flex min-h-40 w-full flex-col items-center justify-center gap-3 px-4 py-6 text-center" onClick={openPicker} type="button">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba]">
              <Upload size={22} />
            </span>
            <span className="font-bold text-neutral-950">Choose file</span>
            <span className="text-xs font-normal text-neutral-500">{uploadConfig.hint}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function SignupUploadManager({ idProof, phase, photo, progress }) {
  if (!phase) return null

  const activeIndex = signupProgressSteps.findIndex((step) => step.id === phase)
  const progressText = phase === 'uploading' ? `${progress || 0}%` : phase === 'processing' ? 'Processing' : 'In progress'

  return (
    <div className="rounded-lg border border-[#007cba]/30 bg-[#eef8ff] p-4 text-sm text-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-neutral-950">பதிவு சமர்ப்பிப்பு நிலை / Submission Status</p>
          <p className="mt-1 text-neutral-600">Large images/documents may take time. Please keep this page open.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#007cba] ring-1 ring-[#007cba]/20">
          <LoaderCircle className="animate-spin" size={14} />
          {progressText}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#007cba] transition-all" style={{ width: `${phase === 'uploading' ? progress : Math.max(8, (activeIndex + 1) * 18)}%` }} />
      </div>
      <div className="mt-4 grid gap-2">
        {signupProgressSteps.map((step, index) => {
          const done = activeIndex > index
          const active = activeIndex === index
          return (
            <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${active ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-600'}`} key={step.id}>
              {done ? <CheckCircle2 className="text-emerald-600" size={16} /> : active ? <LoaderCircle className="animate-spin text-[#007cba]" size={16} /> : <span className="size-4 rounded-full border border-neutral-300" />}
              <span className="font-semibold">{step.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 grid gap-2 rounded-md bg-white p-3 text-xs text-neutral-600 sm:grid-cols-2">
        <p><span className="font-bold text-neutral-800">Photo:</span> {photo?.name || '-'} {photo?.size ? `(${formatFileSize(photo.size)})` : ''}</p>
        <p><span className="font-bold text-neutral-800">Document:</span> {idProof?.name || '-'} {idProof?.size ? `(${formatFileSize(idProof.size)})` : ''}</p>
      </div>
    </div>
  )
}

function getConflictMessage(conflicts) {
  const labels = {
    username: 'பயனர் பெயர் / Username',
    email: 'மின்னஞ்சல் / Email',
    phone: 'தொலைபேசி எண் / Phone',
  }
  const conflictFields = Object.entries(conflicts || {})
    .filter(([, conflict]) => !conflict.available)
    .map(([field, conflict]) => {
      const source = conflict.pendingRequest ? 'pending signup request' : 'approved account'
      return `${labels[field]} already exists in ${source}`
    })

  if (!conflictFields.length) return ''
  return `இந்த விவரங்கள் ஏற்கனவே உள்ளது. ${conflictFields.join(', ')}. வேறு விவரம் பயன்படுத்தவும்.`
}

function getValidationIssueMessage(issue) {
  const field = issue.path?.[0]
  const messages = {
    username: 'பயனர் பெயர் குறைந்தது 3 எழுத்துகள் வேண்டும். / Username must be at least 3 characters.',
    password: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும். / Password must be at least 6 characters.',
    confirmPassword: 'Password மற்றும் Confirm Password ஒன்றாக இல்லை.',
    email: 'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும். / Enter a valid email address.',
    phone: '10 இலக்க தொலைபேசி எண் தேவை. / 10 digit phone number is required.',
    pincode: '6 இலக்க அஞ்சல் குறியீடு தேவை. / 6 digit pincode is required.',
    fullName: 'முழு பெயர் குறைந்தது 2 எழுத்துகள் வேண்டும். / Full Name must be at least 2 characters.',
    addressLine: 'முழு முகவரி குறைந்தது 5 எழுத்துகள் வேண்டும். / Full Address must be at least 5 characters.',
    district: 'மாவட்டம் தேர்வு செய்யவும். / Select District.',
    taluk: 'தாலுகா தேர்வு செய்யவும். / Select Taluk.',
    village: 'கிராமம் தேர்வு செய்யவும். / Select Village.',
    photoPath: 'பாஸ்போர்ட் புகைப்படம் தேர்வு செய்யவும். / Passport photo is required.',
    idProofPath: 'அடையாள ஆவண படம் தேர்வு செய்யவும். / ID proof document is required.',
  }
  return messages[field] || issue.message || 'தவறான விவரம். / Invalid detail.'
}

function getApiErrorMessage(error, fallback) {
  const issues = error.response?.data?.issues
  if (Array.isArray(issues) && issues.length) {
    return [...new Set(issues.map(getValidationIssueMessage))].join(' ')
  }
  return error.response?.data?.message || fallback
}

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Forgot Password' : 'Login'
  const [signupForm, setSignupForm] = useState(initialSignupForm)
  const [districtCode, setDistrictCode] = useState('')
  const [talukCode, setTalukCode] = useState('')
  const [villageCode, setVillageCode] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [uploadPhase, setUploadPhase] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preuploads, setPreuploads] = useState(initialPreuploads)
  const uploadTokensRef = useRef({})
  const uploadPromisesRef = useRef({})
  const { notify } = useNotifications()
  const selectedDistrict = useMemo(
    () => tamilNaduDistricts.find((district) => district.code === districtCode),
    [districtCode],
  )
  const taluks = useMemo(() => selectedDistrict?.taluks || [], [selectedDistrict])
  const selectedTaluk = useMemo(
    () => taluks.find((taluk) => taluk.code === talukCode),
    [talukCode, taluks],
  )
  const villages = useMemo(() => selectedTaluk?.villages || [], [selectedTaluk])
  const selectedVillage = useMemo(
    () => villages.find((village) => village.code === villageCode),
    [villageCode, villages],
  )
  const needsTaluk = ['TALUK_ADMIN', 'VILLAGE_ADMIN', 'PARTNER'].includes(signupForm.requestedRole)
  const needsVillage = ['VILLAGE_ADMIN', 'PARTNER'].includes(signupForm.requestedRole)
  const roleOptions = useMemo(
    () => requestedRoles.map((role) => ({ value: role.value, label: role.label })),
    [],
  )
  const districtOptions = useMemo(
    () => tamilNaduDistricts.map((district) => ({ value: district.code, label: bilingualName(district) })),
    [],
  )
  const talukOptions = useMemo(
    () => taluks.map((taluk) => ({ value: taluk.code, label: bilingualName(taluk) })),
    [taluks],
  )
  const villageOptions = useMemo(
    () => villages.map((village) => ({ value: village.code, label: bilingualName(village) })),
    [villages],
  )
  const proofOptions = useMemo(
    () => idProofOptions.map((proof) => ({ value: proof.value, label: proof.label })),
    [],
  )

  useEffect(() => {
    if (!needsTaluk) {
      setTalukCode('')
      setVillageCode('')
    } else if (!needsVillage) {
      setVillageCode('')
    }
  }, [needsTaluk, needsVillage])

  function updateSignupField(field, value) {
    setSignupForm((current) => ({ ...current, [field]: value }))
  }

  function updateSignupFile(field, file, error = '') {
    setSignupForm((current) => ({ ...current, [field]: file }))
    if (error) {
      showStatus('warning', 'Invalid File / தவறான கோப்பு', error)
    }
  }

  function resetPreupload(field, overrides = {}) {
    setPreuploads((current) => ({
      ...current,
      [field]: { ...initialPreuploads[field], ...overrides },
    }))
  }

  async function deletePreuploadedPath(path) {
    if (!path) return
    try {
      await api.delete('/auth/uploads/signup-temp', { params: { path }, showLoader: false })
    } catch (error) {
      console.warn('[signup upload cleanup failed]', error.response?.data?.message || error.message)
    }
  }

  function startBackgroundUpload(field, file) {
    const token = Symbol(field)
    uploadTokensRef.current[field] = token

    const payload = new FormData()
    payload.append(field, file)
    resetPreupload(field, { status: 'uploading', progress: 0 })

    const uploadPromise = api.post('/auth/uploads/signup-temp', payload, {
      showLoader: false,
      onUploadProgress: (progressEvent) => {
        if (uploadTokensRef.current[field] !== token) return
        const percent = progressEvent.total
          ? Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total))
          : 0
        setPreuploads((current) => ({
          ...current,
          [field]: { ...current[field], progress: percent, status: 'uploading' },
        }))
      },
    }).then((response) => {
      const uploadedPath = response.data.upload?.path || ''
      if (uploadTokensRef.current[field] !== token) {
        deletePreuploadedPath(uploadedPath)
        return null
      }
      setPreuploads((current) => ({
        ...current,
        [field]: { error: '', path: uploadedPath, progress: 100, status: 'ready' },
      }))
      return uploadedPath
    }).catch((error) => {
      if (uploadTokensRef.current[field] === token) {
        setPreuploads((current) => ({
          ...current,
          [field]: {
            error: error.response?.data?.message || 'File preparation failed. It will be uploaded during submit.',
            path: '',
            progress: 0,
            status: 'error',
          },
        }))
      }
      return null
    })

    uploadPromisesRef.current[field] = uploadPromise
    return uploadPromise
  }

  function handleSignupFileChange(field, file, error = '') {
    const previousPath = preuploads[field]?.path
    uploadTokensRef.current[field] = Symbol(`${field}-reset`)
    updateSignupFile(field, file, error)
    if (previousPath) deletePreuploadedPath(previousPath)

    if (field === 'photo' && file && !error) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          saveProfilePhoto(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }

    if (error || !file) {
      resetPreupload(field)
      uploadPromisesRef.current[field] = null
      return
    }

    startBackgroundUpload(field, file)
  }

  function showStatus(type, title, message) {
    setStatus({ type: type === 'warning' ? 'error' : type, message })
    notify({ type, title, message })
  }

  function validateSignupForm() {
    const requiredFields = [
      [signupForm.fullName.trim(), 'முழு பெயர் தேவை. / Full Name is required.'],
      [signupForm.username.trim(), 'பயனர் பெயர் தேவை. / Username is required.'],
      [signupForm.phone.length === 10, '10 இலக்க தொலைபேசி எண் தேவை. / 10 digit phone number is required.'],
      [signupForm.email.trim(), 'மின்னஞ்சல் முகவரி தேவை. / Email Address is required.'],
      [signupForm.requestedRole, 'பங்கு தேர்வு செய்யவும். / Select Role.'],
      [signupForm.pincode.length === 6, '6 இலக்க அஞ்சல் குறியீடு தேவை. / 6 digit pincode is required.'],
      [signupForm.addressLine.trim(), 'முழு முகவரி தேவை. / Full Address is required.'],
      [signupForm.photo, 'பாஸ்போர்ட் புகைப்படம் தேர்வு செய்யவும். / Passport photo is required.'],
      [signupForm.idProofType, 'அடையாள ஆவணம் தேர்வு செய்யவும். / Select ID Proof.'],
      [signupForm.idProof, 'அடையாள ஆவண படம் தேர்வு செய்யவும். / ID proof document is required.'],
      [signupForm.password, 'கடவுச்சொல் தேவை. / Password is required.'],
      [signupForm.confirmPassword, 'கடவுச்சொல் உறுதி தேவை. / Confirm Password is required.'],
    ]
    const missingField = requiredFields.find(([valid]) => !valid)
    if (missingField) return missingField[1]
    if (signupForm.fullName.trim().length < 2) return 'முழு பெயர் குறைந்தது 2 எழுத்துகள் வேண்டும். / Full Name must be at least 2 characters.'
    if (signupForm.username.trim().length < 3) return 'பயனர் பெயர் குறைந்தது 3 எழுத்துகள் வேண்டும். / Username must be at least 3 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) return 'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும். / Enter a valid email address.'
    if (signupForm.addressLine.trim().length < 5) return 'முழு முகவரி குறைந்தது 5 எழுத்துகள் வேண்டும். / Full Address must be at least 5 characters.'
    if (signupForm.password.length < 6) return 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும். / Password must be at least 6 characters.'
    return ''
  }

  async function checkSignupAvailability() {
    if (signupForm.username.trim().length < 3) {
      showStatus('warning', 'Required Field / அவசியமான விவரம்', 'பயனர் பெயர் குறைந்தது 3 எழுத்துகள் வேண்டும். / Username must be at least 3 characters.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      showStatus('warning', 'Required Field / அவசியமான விவரம்', 'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும். / Enter a valid email address.')
      return false
    }
    if (signupForm.phone.trim().length !== 10) {
      showStatus('warning', 'Required Field / அவசியமான விவரம்', '10 இலக்க தொலைபேசி எண் தேவை. / 10 digit phone number is required.')
      return false
    }

    const params = new URLSearchParams({
      username: signupForm.username.trim(),
      email: signupForm.email.trim(),
      phone: signupForm.phone.trim(),
    })
    const response = await api.get(`/auth/availability?${params.toString()}`)
    if (!response.data.available) {
      const message = getConflictMessage(response.data.conflicts) || 'Username, email அல்லது phone ஏற்கனவே உள்ளது.'
      setStatus({
        type: 'error',
        message,
      })
      notify({
        type: 'error',
        title: 'Already Exists / ஏற்கனவே உள்ளது',
        message,
      })
      return false
    }
    return true
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setUploadPhase('')
    setUploadProgress(0)

    const validationMessage = validateSignupForm()
    if (validationMessage) {
      showStatus('warning', 'Required Field / அவசியமான விவரம்', validationMessage)
      return
    }
    if (!selectedDistrict) {
      const message = 'மாவட்டம் தேர்வு செய்யவும். / Select District.'
      showStatus('warning', 'Required Field / அவசியமான விவரம்', message)
      return
    }
    if (needsTaluk && !selectedTaluk) {
      const message = 'தாலுகா தேர்வு செய்யவும். / Select Taluk.'
      showStatus('warning', 'Required Field / அவசியமான விவரம்', message)
      return
    }
    if (needsVillage && !selectedVillage) {
      const message = 'கிராமம் தேர்வு செய்யவும். / Select Village.'
      showStatus('warning', 'Required Field / அவசியமான விவரம்', message)
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      const message = 'Password மற்றும் Confirm Password ஒன்றாக இல்லை.'
      showStatus('warning', 'Password Mismatch / கடவுச்சொல் பொருந்தவில்லை', message)
      return
    }

    try {
      setSubmitting(true)
      setUploadPhase('checking')
      const available = await checkSignupAvailability()
      if (!available) {
        setUploadPhase('')
        setUploadProgress(0)
        return
      }

      const preparedPhotoPath = preuploads.photo.path || await uploadPromisesRef.current.photo
      const preparedIdProofPath = preuploads.idProof.path || await uploadPromisesRef.current.idProof

      const payload = new FormData()
      Object.entries(signupForm).forEach(([key, value]) => {
        if (!value) return
        if (key === 'photo' && preparedPhotoPath) return
        if (key === 'idProof' && preparedIdProofPath) return
        payload.append(key, value)
      })
      if (preparedPhotoPath) payload.append('photoPath', preparedPhotoPath)
      if (preparedIdProofPath) payload.append('idProofPath', preparedIdProofPath)
      payload.append('state', 'Tamil Nadu')
      payload.append('district', selectedDistrict.name)
      payload.append('taluk', selectedTaluk?.name || '')
      payload.append('village', selectedVillage?.name || '')
      payload.append('districtCode', selectedDistrict.code)
      payload.append('talukCode', selectedTaluk?.code || '')
      payload.append('villageCode', selectedVillage?.code || '')

      setUploadPhase('uploading')
      const response = await api.post('/auth/register', payload, {
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total
            ? Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total))
            : 0
          setUploadProgress(percent)
          if (percent >= 100) setUploadPhase('processing')
        },
      })
      setUploadPhase('processing')
      const message = `பதிவு கோரிக்கை சமர்ப்பிக்கப்பட்டது. Request No: ${response.data.signupRequest.requestNo}`
      setStatus({
        type: 'success',
        message,
      })
      notify({
        type: 'success',
        title: 'Registration Submitted / பதிவு சமர்ப்பிக்கப்பட்டது',
        message,
        actionLabel: 'Request number noted',
        popup: true,
        toast: false,
      })
      setSignupForm(initialSignupForm)
      setDistrictCode('')
      setTalukCode('')
      setVillageCode('')
      setPreuploads(initialPreuploads)
      setUploadPhase('')
      setUploadProgress(0)
    } catch (error) {
      setUploadPhase('')
      setUploadProgress(0)
      const message = getApiErrorMessage(error, 'பதிவு கோரிக்கை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.')
      setStatus({
        type: 'error',
        message,
      })
      notify({
        type: 'error',
        title: 'Registration Failed / பதிவு தோல்வியடைந்தது',
        message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!loginForm.identifier.trim() || !loginForm.password) {
      showStatus('warning', 'Required Field / அவசியமான விவரம்', 'Email / Phone / Username மற்றும் Password இரண்டும் தேவை.')
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post('/auth/login', loginForm)
      saveSession({ token: response.data.token, user: response.data.user })
      navigate('/app')
    } catch (error) {
      const message = error.response?.data?.message || 'உள்நுழைய முடியவில்லை. அனுமதி பெற்ற கணக்கு விவரங்களை சரிபார்க்கவும்.'
      setStatus({
        type: 'error',
        message,
      })
      notify({
        type: 'error',
        title: 'Login Failed / உள்நுழைவு தோல்வி',
        message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`mx-auto px-3 py-8 sm:px-5 sm:py-16 ${mode === 'register' ? 'max-w-4xl' : 'max-w-xl'}`}>
      <h1 className="text-center text-2xl font-bold sm:text-4xl">{title}</h1>
      <form
        className="mt-6 grid gap-4 border border-neutral-200 p-3 sm:mt-10 sm:gap-5 sm:p-8"
        noValidate
        onSubmit={mode === 'register' ? handleSignupSubmit : mode === 'login' ? handleLoginSubmit : undefined}
      >
        {mode === 'register' && (
          <>
            <div className="border-l-4 border-[#007cba] bg-[#eef8ff] p-3 text-sm leading-6 text-neutral-700 sm:p-4">
              பதிவு கோரிக்கை அனுமதி பெற்ற பிறகே உள்நுழைவு செயல்படும்.
            </div>
            {status.message && (
              <div className={`border-l-4 p-3 text-sm leading-6 sm:p-4 ${status.type === 'success' ? 'border-green-600 bg-green-50 text-green-800' : 'border-red-600 bg-red-50 text-red-800'}`}>
                {status.message}
              </div>
            )}
            <FormSection title="தனிப்பட்ட விவரங்கள் / Personal Details">
              <div className="grid items-start gap-4 md:grid-cols-2">
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>முழு பெயர் / Full Name</FieldLabel>
                  <input className={inputClass} onChange={(event) => updateSignupField('fullName', event.target.value.replace(/[^\p{L}\s.]/gu, ''))} placeholder="Full Name" required value={signupForm.fullName} />
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>பயனர் பெயர் / Username</FieldLabel>
                  <input className={inputClass} minLength={3} onChange={(event) => updateSignupField('username', event.target.value)} placeholder="Minimum 3 characters" required value={signupForm.username} />
                  <p className="text-xs text-neutral-500">குறைந்தது 3 எழுத்துகள் / Minimum 3 characters</p>
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>தொலைபேசி எண் / Phone Number</FieldLabel>
                  <input
                    {...phoneInputProps}
                    className={inputClass}
                    onChange={(event) => updateSignupField('phone', normalizePhone(event.target.value))}
                    placeholder="10 digit phone number"
                    required
                    value={signupForm.phone}
                  />
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>மின்னஞ்சல் முகவரி / Email Address</FieldLabel>
                  <input className={inputClass} onChange={(event) => updateSignupField('email', event.target.value)} placeholder="Email Address" required type="email" value={signupForm.email} />
                </label>
              </div>
            </FormSection>

            <FormSection title="பங்கு மற்றும் பகுதி / Role and Area">
              <label className="flex flex-col justify-start gap-2">
                <FieldLabel required>பங்கு / Requested Role</FieldLabel>
                <SearchSelect onChange={(value) => updateSignupField('requestedRole', value)} options={roleOptions} placeholder="பங்கு தேடவும் / Search role" value={signupForm.requestedRole} />
              </label>
              <div className="grid items-start gap-4 md:grid-cols-2">
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>மாநிலம் / State</FieldLabel>
                  <input className={`${inputClass} disabled:bg-neutral-100`} disabled value={bilingualName(tamilNaduState)} />
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>மாவட்டம் / District</FieldLabel>
                  <SearchSelect
                    onChange={(value) => {
                      setDistrictCode(value)
                      setTalukCode('')
                      setVillageCode('')
                    }}
                    options={districtOptions}
                    placeholder="மாவட்டம் தேடவும் / Search district"
                    value={districtCode}
                  />
                </label>
                {needsTaluk && (
                  <label className="flex flex-col justify-start gap-2">
                    <FieldLabel required>தாலுகா / Taluk</FieldLabel>
                    <SearchSelect
                      disabled={!districtCode}
                      onChange={(value) => {
                        setTalukCode(value)
                        setVillageCode('')
                      }}
                      options={talukOptions}
                      placeholder="தாலுகா தேடவும் / Search taluk"
                      value={talukCode}
                    />
                  </label>
                )}
                {needsVillage && (
                  <label className="flex flex-col justify-start gap-2">
                    <FieldLabel required>கிராமம் / Village</FieldLabel>
                    <SearchSelect disabled={!talukCode} onChange={setVillageCode} options={villageOptions} placeholder="கிராமம் தேடவும் / Search village" value={villageCode} />
                  </label>
                )}
              </div>
            </FormSection>

            <FormSection title="முகவரி / Address">
              <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>அஞ்சல் குறியீடு / Pincode</FieldLabel>
                  <input
                    {...pincodeInputProps}
                    className={inputClass}
                    onChange={(event) => updateSignupField('pincode', normalizePincode(event.target.value))}
                    placeholder="6 digit pincode"
                    required
                    value={signupForm.pincode}
                  />
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>முழு முகவரி / Full Address</FieldLabel>
                  <textarea className={`${inputClass} min-h-24 resize-y`} onChange={(event) => updateSignupField('addressLine', event.target.value)} placeholder="Full Address" required value={signupForm.addressLine} />
                </label>
              </div>
            </FormSection>

            <FormSection title="ஆவணங்கள் / Documents">
              <div className="grid items-start gap-4 md:grid-cols-2">
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel required>அடையாள ஆவணம் / ID Proof Type</FieldLabel>
                  <SearchSelect onChange={(value) => updateSignupField('idProofType', value)} options={proofOptions} placeholder="அடையாள ஆவணம் தேடவும் / Search ID proof" value={signupForm.idProofType} />
                </label>
                <label className="flex flex-col justify-start gap-2">
                  <FieldLabel>அடையாள ஆவண எண் / ID Proof Number</FieldLabel>
                  <input className={inputClass} inputMode="numeric" maxLength={20} onChange={(event) => updateSignupField('idProofNumber', event.target.value.replace(/\D/g, '').slice(0, 20))} placeholder="ID Proof Number" value={signupForm.idProofNumber} />
                </label>
              </div>
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <DocumentUpload file={signupForm.photo} label="பாஸ்போர்ட் அளவு புகைப்படம் / Passport Size Photo" onChange={(file, error) => handleSignupFileChange('photo', file, error)} required uploadConfig={passportConfig} />
                <DocumentUpload file={signupForm.idProof} label="அடையாள ஆவண படம் / ID Proof Image or Document" onChange={(file, error) => handleSignupFileChange('idProof', file, error)} required uploadConfig={documentConfig} />
              </div>
            </FormSection>
          </>
        )}
        {mode === 'reset' ? (
          <>
            <input className={inputClass} placeholder="Email Address" />
            <input {...phoneInputProps} className={inputClass} placeholder="10 digit phone number" />
            <PasswordInput placeholder="New Password" />
            <PasswordInput placeholder="Confirm New Password" />
          </>
        ) : (
          <>
            {mode === 'login' && (
              <>
                {status.message && (
                  <div className="border-l-4 border-red-600 bg-red-50 p-4 text-sm leading-6 text-red-800">
                    {status.message}
                  </div>
                )}
                <input
                  className={inputClass}
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                  placeholder="Email / Phone / Username"
                  required
                  value={loginForm.identifier}
                />
              </>
            )}
            {mode === 'register' ? (
              <FormSection title="உள்நுழைவு பாதுகாப்பு / Login Security">
                <div className="grid items-start gap-4 md:grid-cols-2">
                  <label className="flex flex-col justify-start gap-2">
                    <FieldLabel required>கடவுச்சொல் / Password</FieldLabel>
                    <PasswordInput
                      minLength={6}
                      onChange={(event) => updateSignupField('password', event.target.value)}
                      placeholder="Minimum 6 characters"
                      value={signupForm.password}
                    />
                    <p className="text-xs text-neutral-500">குறைந்தது 6 எழுத்துகள் / Minimum 6 characters</p>
                  </label>
                  <label className="flex flex-col justify-start gap-2">
                    <FieldLabel required>கடவுச்சொல் உறுதி / Confirm Password</FieldLabel>
                    <PasswordInput minLength={6} onChange={(event) => updateSignupField('confirmPassword', event.target.value)} placeholder="Confirm Password" value={signupForm.confirmPassword} />
                    <p className="text-xs text-neutral-500">கடவுச்சொல்லுடன் பொருந்த வேண்டும் / Must match the password</p>
                  </label>
                </div>
              </FormSection>
            ) : (
              <label className="flex flex-col justify-start gap-2">
                <PasswordInput
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Password"
                  value={loginForm.password}
                />
              </label>
            )}
          </>
        )}
        {mode === 'register' && (
          <>
            <SignupUploadManager idProof={signupForm.idProof} phase={uploadPhase} photo={signupForm.photo} progress={uploadProgress} />
            <FormUploadProgressModal
              currentStageIndex={uploadPhase === 'checking' ? 0 : uploadPhase === 'uploading' ? 1 : uploadPhase === 'processing' ? 2 : 0}
              isOpen={submitting && Boolean(uploadPhase)}
              progress={uploadPhase === 'checking' ? 15 : uploadPhase === 'uploading' ? Math.max(25, uploadProgress) : 95}
              stages={[
                { title: 'Validating Username, Email & Phone Availability', tamil: 'விவரங்கள் சரிபார்க்கப்படுகிறது' },
                { title: 'Uploading Passport Photo & ID Proof Documents', tamil: 'சான்றுகள் பதிவேற்றப்படுகிறது' },
                { title: 'Routing Request to Administrative Officers Queue', tamil: 'அதிகார வரம்பிற்கு அனுப்பப்படுகிறது' },
                { title: 'Registration Complete! Request Number Generated', tamil: 'பதிவு எண் உருவாக்கப்பட்டது' },
              ]}
              subtitle={`Role: ${signupForm.requestedRole} • District: ${selectedDistrict?.name || '-'}`}
              title="Signup Request Submission / பயனர் பதிவு"
              uploadedFiles={[
                signupForm.photo && { label: `Passport Photo: ${signupForm.photo.name}`, status: uploadProgress >= 50 ? 'completed' : 'uploading' },
                signupForm.idProof && { label: `ID Proof Document: ${signupForm.idProof.name}`, status: uploadProgress >= 90 ? 'completed' : 'uploading' },
              ].filter(Boolean)}
            />
          </>
        )}
        <Button disabled={submitting} type="submit">{submitting ? 'Submitting...' : title}</Button>
        {mode === 'login' && (
          <div className="grid gap-3 text-center text-sm text-neutral-600">
            <p>
              New user? <Link className="font-bold text-[#007cba]" to="/register">Create signup request</Link>
            </p>
            <p>
              புதிய கணக்கு வேண்டுமா? <Link className="font-bold text-[#007cba]" to="/register">பதிவு செய்யவும்</Link>
            </p>
            <p>
              Forget password? <Link className="font-bold text-[#007cba]" to="/forget">Forget password</Link>
            </p>
          </div>
        )}
      </form>
    </section>
  )
}
