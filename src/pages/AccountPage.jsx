import Button from '../components/Button.jsx'
import { useMemo, useState } from 'react'
import { idProofOptions, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { api } from '../lib/api.js'
import { Link } from '../lib/router.jsx'

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

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Forgot Password' : 'Login'
  const [signupForm, setSignupForm] = useState(initialSignupForm)
  const [districtCode, setDistrictCode] = useState('')
  const [talukCode, setTalukCode] = useState('')
  const [villageCode, setVillageCode] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
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

  function updateSignupField(field, value) {
    setSignupForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!selectedDistrict || !selectedTaluk || !selectedVillage) {
      setStatus({ type: 'error', message: 'மாவட்டம், தாலுகா, கிராமம் தேர்வு செய்யவும்.' })
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
    payload.append('taluk', selectedTaluk.name)
    payload.append('village', selectedVillage.name)
    payload.append('districtCode', selectedDistrict.code)
    payload.append('talukCode', selectedTaluk.code)
    payload.append('villageCode', selectedVillage.code)

    try {
      setSubmitting(true)
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

  return (
    <section className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-center text-4xl font-bold">{title}</h1>
      <form className="mt-10 grid gap-5 border border-neutral-200 p-8" onSubmit={mode === 'register' ? handleSignupSubmit : undefined}>
        {mode === 'register' && (
          <>
            <div className="border-l-4 border-[#007cba] bg-[#eef8ff] p-4 text-sm leading-6 text-neutral-700">
              பதிவு கோரிக்கை அனுமதி பெற்ற பிறகே உள்நுழைவு செயல்படும்.
            </div>
            {status.message && (
              <div className={`border-l-4 p-4 text-sm leading-6 ${status.type === 'success' ? 'border-green-600 bg-green-50 text-green-800' : 'border-red-600 bg-red-50 text-red-800'}`}>
                {status.message}
              </div>
            )}
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('fullName', event.target.value)} placeholder="Full Name" required value={signupForm.fullName} />
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('username', event.target.value)} placeholder="Username" required value={signupForm.username} />
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('phone', event.target.value)} placeholder="Phone Number" required value={signupForm.phone} />
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('email', event.target.value)} placeholder="Email Address" required type="email" value={signupForm.email} />
            <select className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('requestedRole', event.target.value)} required value={signupForm.requestedRole}>
              <option disabled value="">Requested Role</option>
              {requestedRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" disabled value={tamilNaduState.name} />
            <select
              className="border border-neutral-300 px-4 py-3"
              onChange={(event) => {
                setDistrictCode(event.target.value)
                setTalukCode('')
                setVillageCode('')
              }}
              required
              value={districtCode}
            >
              <option disabled value="">District</option>
              {tamilNaduDistricts.map((district) => <option key={district.code} value={district.code}>{district.name}</option>)}
            </select>
            <select
              className="border border-neutral-300 px-4 py-3"
              disabled={!districtCode}
              onChange={(event) => {
                setTalukCode(event.target.value)
                setVillageCode('')
              }}
              required
              value={talukCode}
            >
              <option disabled value="">Taluk</option>
              {taluks.map((taluk) => <option key={taluk.code} value={taluk.code}>{taluk.name}</option>)}
            </select>
            <select className="border border-neutral-300 px-4 py-3" disabled={!talukCode} onChange={(event) => setVillageCode(event.target.value)} required value={villageCode}>
              <option disabled value="">Village</option>
              {villages.map((village) => <option key={village.code} value={village.code}>{village.name}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('pincode', event.target.value)} placeholder="Pincode" required value={signupForm.pincode} />
            <textarea className="min-h-24 border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('addressLine', event.target.value)} placeholder="Full Address" required value={signupForm.addressLine} />
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Passport Size Photo
              <input accept="image/*" className="border border-neutral-300 px-4 py-3 font-normal" onChange={(event) => updateSignupField('photo', event.target.files?.[0] || null)} required type="file" />
            </label>
            <select className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('idProofType', event.target.value)} required value={signupForm.idProofType}>
              <option disabled value="">ID Proof Type</option>
              {idProofOptions.map((proof) => <option key={proof.value} value={proof.value}>{proof.label}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('idProofNumber', event.target.value)} placeholder="ID Proof Number" value={signupForm.idProofNumber} />
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              ID Proof Image / Document
              <input accept="image/*,.pdf" className="border border-neutral-300 px-4 py-3 font-normal" onChange={(event) => updateSignupField('idProof', event.target.files?.[0] || null)} required type="file" />
            </label>
          </>
        )}
        {mode === 'reset' ? (
          <>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Email Address" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Phone Number" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="New Password" type="password" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Confirm New Password" type="password" />
          </>
        ) : (
          <>
            {mode === 'login' && <input className="border border-neutral-300 px-4 py-3" placeholder="Email / Phone / Username" />}
            <input className="border border-neutral-300 px-4 py-3" onChange={(event) => mode === 'register' && updateSignupField('password', event.target.value)} placeholder="Password" required={mode === 'register'} type="password" value={mode === 'register' ? signupForm.password : undefined} />
            {mode === 'register' && <input className="border border-neutral-300 px-4 py-3" onChange={(event) => updateSignupField('confirmPassword', event.target.value)} placeholder="Confirm Password" required type="password" value={signupForm.confirmPassword} />}
          </>
        )}
        <Button disabled={submitting} type="submit">{submitting ? 'Submitting...' : title}</Button>
        {mode === 'login' && (
          <p className="text-center text-sm text-neutral-600">
            Forget password? <Link className="font-bold text-[#007cba]" to="/forget">Forget password</Link>
          </p>
        )}
      </form>
    </section>
  )
}
