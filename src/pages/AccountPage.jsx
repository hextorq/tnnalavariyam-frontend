import Button from '../components/Button.jsx'
import { useEffect, useMemo, useState } from 'react'
import { idProofOptions, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { api } from '../lib/api.js'
import { saveSession } from '../lib/auth.js'
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

function FieldLabel({ children }) {
  return <span className="text-sm font-semibold text-neutral-700">{children}</span>
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

function FilePreview({ file, label }) {
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

  if (!file) return null

  return (
    <div className="mt-3 overflow-hidden border border-neutral-200 bg-neutral-50">
      <div className="grid gap-1 p-3 text-xs text-neutral-600">
        <p className="font-bold text-neutral-900">{label}</p>
        <p>{file.name}</p>
        <p>{file.type || 'Selected file'}{file.size ? ` • ${formatFileSize(file.size)}` : ''}</p>
      </div>
      {previewUrl ? (
        <img className="max-h-64 w-full object-contain bg-white" src={previewUrl} alt={`${label} preview`} />
      ) : (
        <div className="border-t border-neutral-200 bg-white p-4 text-sm font-semibold text-neutral-700">
          {file.type === 'application/pdf' ? 'PDF document selected' : 'Document selected'}
        </div>
      )}
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

  async function checkSignupAvailability() {
    const params = new URLSearchParams({
      username: signupForm.username.trim(),
      email: signupForm.email.trim(),
      phone: signupForm.phone.trim(),
    })
    const response = await api.get(`/auth/availability?${params.toString()}`)
    if (!response.data.available) {
      setStatus({
        type: 'error',
        message: getConflictMessage(response.data.conflicts) || 'Username, email அல்லது phone ஏற்கனவே உள்ளது.',
      })
      return false
    }
    return true
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!selectedDistrict) {
      setStatus({ type: 'error', message: 'மாவட்டம் தேர்வு செய்யவும். / Select District.' })
      return
    }
    if (needsTaluk && !selectedTaluk) {
      setStatus({ type: 'error', message: 'தாலுகா தேர்வு செய்யவும். / Select Taluk.' })
      return
    }
    if (needsVillage && !selectedVillage) {
      setStatus({ type: 'error', message: 'கிராமம் தேர்வு செய்யவும். / Select Village.' })
      return
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setStatus({ type: 'error', message: 'Password மற்றும் Confirm Password ஒன்றாக இல்லை.' })
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
      setStatus({
        type: 'success',
        message: `பதிவு கோரிக்கை சமர்ப்பிக்கப்பட்டது. Request No: ${response.data.signupRequest.requestNo}`,
      })
      setSignupForm(initialSignupForm)
      setDistrictCode('')
      setTalukCode('')
      setVillageCode('')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'பதிவு கோரிக்கை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    try {
      setSubmitting(true)
      const response = await api.post('/auth/login', loginForm)
      saveSession({ token: response.data.token, user: response.data.user })
      navigate('/app')
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'உள்நுழைய முடியவில்லை. அனுமதி பெற்ற கணக்கு விவரங்களை சரிபார்க்கவும்.',
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
            <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>முழு பெயர் / Full Name</FieldLabel>
              <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('fullName', event.target.value)} placeholder="Full Name" required value={signupForm.fullName} />
            </label>
            <label className="grid gap-2">
              <FieldLabel>பயனர் பெயர் / Username</FieldLabel>
              <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('username', event.target.value)} placeholder="Username" required value={signupForm.username} />
            </label>
            <label className="grid gap-2">
              <FieldLabel>தொலைபேசி எண் / Phone Number</FieldLabel>
              <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('phone', event.target.value)} placeholder="Phone Number" required value={signupForm.phone} />
            </label>
            <label className="grid gap-2">
              <FieldLabel>மின்னஞ்சல் முகவரி / Email Address</FieldLabel>
              <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('email', event.target.value)} placeholder="Email Address" required type="email" value={signupForm.email} />
            </label>
            </div>
            <label className="grid gap-2">
              <FieldLabel>பங்கு / Requested Role</FieldLabel>
              <SearchSelect onChange={(value) => updateSignupField('requestedRole', value)} options={roleOptions} placeholder="பங்கு தேடவும் / Search role" value={signupForm.requestedRole} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>மாநிலம் / State</FieldLabel>
              <input className="min-w-0 border border-neutral-300 px-4 py-3" disabled value={bilingualName(tamilNaduState)} />
            </label>
            <label className="grid gap-2">
              <FieldLabel>மாவட்டம் / District</FieldLabel>
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
                <FieldLabel>தாலுகா / Taluk</FieldLabel>
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
                <FieldLabel>கிராமம் / Village</FieldLabel>
                <SearchSelect disabled={!talukCode} onChange={setVillageCode} options={villageOptions} placeholder="கிராமம் தேடவும் / Search village" value={villageCode} />
              </label>
            )}
            </div>
            <label className="grid gap-2">
              <FieldLabel>அஞ்சல் குறியீடு / Pincode</FieldLabel>
              <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('pincode', event.target.value)} placeholder="Pincode" required value={signupForm.pincode} />
            </label>
            <label className="grid gap-2">
              <FieldLabel>முழு முகவரி / Full Address</FieldLabel>
              <textarea className="min-h-24 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('addressLine', event.target.value)} placeholder="Full Address" required value={signupForm.addressLine} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              பாஸ்போர்ட் அளவு புகைப்படம் / Passport Size Photo
              <input accept="image/*" className="border border-neutral-300 px-4 py-3 font-normal" onChange={(event) => updateSignupField('photo', event.target.files?.[0] || null)} required type="file" />
              <FilePreview file={signupForm.photo} label="Passport photo preview" />
            </label>
            <label className="grid gap-2 self-end">
              <FieldLabel>அடையாள ஆவணம் / ID Proof Type</FieldLabel>
              <SearchSelect onChange={(value) => updateSignupField('idProofType', value)} options={proofOptions} placeholder="அடையாள ஆவணம் தேடவும் / Search ID proof" value={signupForm.idProofType} />
            </label>
            </div>
            <label className="grid gap-2">
              <FieldLabel>அடையாள ஆவண எண் / ID Proof Number</FieldLabel>
              <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('idProofNumber', event.target.value)} placeholder="ID Proof Number" value={signupForm.idProofNumber} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              அடையாள ஆவண படம் / ID Proof Image or Document
              <input accept="image/*,.pdf" className="border border-neutral-300 px-4 py-3 font-normal" onChange={(event) => updateSignupField('idProof', event.target.files?.[0] || null)} required type="file" />
              <FilePreview file={signupForm.idProof} label="ID proof preview" />
            </label>
          </>
        )}
        {mode === 'reset' ? (
          <>
            <input className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="Email Address" />
            <input className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="Phone Number" />
            <input className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="New Password" type="password" />
            <input className="min-w-0 border border-neutral-300 px-4 py-3" placeholder="Confirm New Password" type="password" />
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
            <label className="grid gap-2">
              {mode === 'register' && <FieldLabel>கடவுச்சொல் / Password</FieldLabel>}
              <input
                className="min-w-0 border border-neutral-300 px-4 py-3"
                onChange={(event) => {
                  if (mode === 'register') updateSignupField('password', event.target.value)
                  if (mode === 'login') setLoginForm((current) => ({ ...current, password: event.target.value }))
                }}
                placeholder="Password"
                required={mode !== 'reset'}
                type="password"
                value={mode === 'register' ? signupForm.password : mode === 'login' ? loginForm.password : undefined}
              />
            </label>
            {mode === 'register' && (
              <label className="grid gap-2">
                <FieldLabel>கடவுச்சொல் உறுதி / Confirm Password</FieldLabel>
                <input className="min-w-0 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('confirmPassword', event.target.value)} placeholder="Confirm Password" required type="password" value={signupForm.confirmPassword} />
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
