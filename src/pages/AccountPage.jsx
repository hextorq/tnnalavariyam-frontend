import Button from '../components/Button.jsx'
import { Eye, EyeOff, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { idProofOptions, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { api } from '../lib/api.js'
import { saveSession } from '../lib/auth.js'
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

function FormSection({ children, title }) {
  return (
    <section className="grid gap-4 border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="border-b border-neutral-200 pb-3 text-base font-bold text-neutral-950">{title}</h2>
      {children}
    </section>
  )
}

function PasswordInput({ onChange, placeholder, value }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        className="min-w-0 w-full border border-neutral-300 px-4 py-3 pr-12"
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
        className="min-w-0 w-full border border-neutral-300 px-4 py-3 disabled:bg-neutral-100"
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

function DocumentUpload({ accept, file, label, onChange, required = false }) {
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

  return (
    <div className="grid gap-2 text-sm font-semibold text-neutral-700">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        accept={accept}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
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
            <span className="text-xs font-normal text-neutral-500">Image or document preview will appear here</span>
          </button>
        )}
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

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Forgot Password' : 'Login'
  const [signupForm, setSignupForm] = useState(initialSignupForm)
  const [districtCode, setDistrictCode] = useState('')
  const [talukCode, setTalukCode] = useState('')
  const [villageCode, setVillageCode] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) return 'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும். / Enter a valid email address.'
    if (signupForm.password.length < 6) return 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும். / Password must be at least 6 characters.'
    return ''
  }

  async function checkSignupAvailability() {
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

    const payload = new FormData()
    Object.entries(signupForm).forEach(([key, value]) => {
      if (value) payload.append(key, value)
    })
    payload.append('state', 'Tamil Nadu')
    payload.append('district', selectedDistrict.name)
    payload.append('taluk', selectedTaluk?.name || '')
    payload.append('village', selectedVillage?.name || '')
    payload.append('districtCode', selectedDistrict.code)
    payload.append('talukCode', selectedTaluk?.code || '')
    payload.append('villageCode', selectedVillage?.code || '')

    try {
      setSubmitting(true)
      const available = await checkSignupAvailability()
      if (!available) return

      const response = await api.post('/auth/register', payload)
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
      })
      setSignupForm(initialSignupForm)
      setDistrictCode('')
      setTalukCode('')
      setVillageCode('')
    } catch (error) {
      const message = error.response?.data?.message || 'பதிவு கோரிக்கை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>முழு பெயர் / Full Name</FieldLabel>
                  <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('fullName', event.target.value)} placeholder="Full Name" required value={signupForm.fullName} />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>பயனர் பெயர் / Username</FieldLabel>
                  <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('username', event.target.value)} placeholder="Username" required value={signupForm.username} />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>தொலைபேசி எண் / Phone Number</FieldLabel>
                  <input
                    {...phoneInputProps}
                    className="min-w-0 border border-neutral-300 px-4 py-3"
                    onChange={(event) => updateSignupField('phone', normalizePhone(event.target.value))}
                    placeholder="10 digit phone number"
                    required
                    value={signupForm.phone}
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>மின்னஞ்சல் முகவரி / Email Address</FieldLabel>
                  <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('email', event.target.value)} placeholder="Email Address" required type="email" value={signupForm.email} />
                </label>
              </div>
            </FormSection>

            <FormSection title="பங்கு மற்றும் பகுதி / Role and Area">
              <label className="grid gap-2">
                <FieldLabel required>பங்கு / Requested Role</FieldLabel>
                <SearchSelect onChange={(value) => updateSignupField('requestedRole', value)} options={roleOptions} placeholder="பங்கு தேடவும் / Search role" value={signupForm.requestedRole} />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel required>மாநிலம் / State</FieldLabel>
                  <input className="min-w-0 border border-neutral-300 px-4 py-3" disabled value={bilingualName(tamilNaduState)} />
                </label>
                <label className="grid gap-2">
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
                  <label className="grid gap-2">
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
                  <label className="grid gap-2">
                    <FieldLabel required>கிராமம் / Village</FieldLabel>
                    <SearchSelect disabled={!talukCode} onChange={setVillageCode} options={villageOptions} placeholder="கிராமம் தேடவும் / Search village" value={villageCode} />
                  </label>
                )}
              </div>
            </FormSection>

            <FormSection title="முகவரி / Address">
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <label className="grid gap-2">
                  <FieldLabel required>அஞ்சல் குறியீடு / Pincode</FieldLabel>
                  <input
                    {...pincodeInputProps}
                    className="border border-neutral-300 px-4 py-3"
                    onChange={(event) => updateSignupField('pincode', normalizePincode(event.target.value))}
                    placeholder="6 digit pincode"
                    required
                    value={signupForm.pincode}
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel required>முழு முகவரி / Full Address</FieldLabel>
                  <textarea className="min-h-24 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('addressLine', event.target.value)} placeholder="Full Address" required value={signupForm.addressLine} />
                </label>
              </div>
            </FormSection>

            <FormSection title="ஆவணங்கள் / Documents">
              <div className="grid gap-4 lg:grid-cols-2">
                <DocumentUpload accept="image/*" file={signupForm.photo} label="பாஸ்போர்ட் அளவு புகைப்படம் / Passport Size Photo" onChange={(file) => updateSignupField('photo', file)} required />
                <div className="grid content-start gap-4">
                  <label className="grid gap-2">
                    <FieldLabel required>அடையாள ஆவணம் / ID Proof Type</FieldLabel>
                    <SearchSelect onChange={(value) => updateSignupField('idProofType', value)} options={proofOptions} placeholder="அடையாள ஆவணம் தேடவும் / Search ID proof" value={signupForm.idProofType} />
                  </label>
                  <label className="grid gap-2">
                    <FieldLabel>அடையாள ஆவண எண் / ID Proof Number</FieldLabel>
                    <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('idProofNumber', event.target.value)} placeholder="ID Proof Number" value={signupForm.idProofNumber} />
                  </label>
                </div>
              </div>
              <DocumentUpload accept="image/*,.pdf" file={signupForm.idProof} label="அடையாள ஆவண படம் / ID Proof Image or Document" onChange={(file) => updateSignupField('idProof', file)} required />
            </FormSection>
          </>
        )}
        {mode === 'reset' ? (
          <>
            <input className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="Email Address" />
            <input {...phoneInputProps} className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="10 digit phone number" />
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
                  className="min-w-0 border border-neutral-300 px-4 py-3"
                  onChange={(event) => setLoginForm((current) => ({ ...current, identifier: event.target.value }))}
                  placeholder="Email / Phone / Username"
                  required
                  value={loginForm.identifier}
                />
              </>
            )}
            {mode === 'register' ? (
              <FormSection title="உள்நுழைவு பாதுகாப்பு / Login Security">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <FieldLabel required>கடவுச்சொல் / Password</FieldLabel>
                    <PasswordInput
                      onChange={(event) => updateSignupField('password', event.target.value)}
                      placeholder="Password"
                      value={signupForm.password}
                    />
                  </label>
                  <label className="grid gap-2">
                    <FieldLabel required>கடவுச்சொல் உறுதி / Confirm Password</FieldLabel>
                    <PasswordInput onChange={(event) => updateSignupField('confirmPassword', event.target.value)} placeholder="Confirm Password" value={signupForm.confirmPassword} />
                  </label>
                </div>
              </FormSection>
            ) : (
              <label className="grid gap-2">
                <PasswordInput
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Password"
                  value={loginForm.password}
                />
              </label>
            )}
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
