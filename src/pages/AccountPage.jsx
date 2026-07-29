import Button from '../components/Button.jsx'
import { useMemo, useState } from 'react'
import { idProofOptions, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { Link } from '../lib/router.jsx'

export default function AccountPage({ mode }) {
  const title = mode === 'register' ? 'Register' : mode === 'reset' ? 'Forgot Password' : 'Login'
  const [districtCode, setDistrictCode] = useState('')
  const [talukCode, setTalukCode] = useState('')
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

  return (
    <section className="mx-auto max-w-xl px-5 py-20">
      <h1 className="text-center text-4xl font-bold">{title}</h1>
      <form className="mt-10 grid gap-5 border border-neutral-200 p-8">
        {mode === 'register' && (
          <>
            <div className="border-l-4 border-[#007cba] bg-[#eef8ff] p-4 text-sm leading-6 text-neutral-700">
              Self signup creates an approval request. Login is enabled only after the higher hierarchy approves it.
            </div>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Full Name" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Username" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Phone Number" />
            <input className="border border-neutral-300 px-4 py-3" placeholder="Email Address" type="email" />
            <select className="border border-neutral-300 px-4 py-3" defaultValue="">
              <option disabled value="">Requested Role</option>
              {requestedRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" disabled value={tamilNaduState.name} />
            <select
              className="border border-neutral-300 px-4 py-3"
              onChange={(event) => {
                setDistrictCode(event.target.value)
                setTalukCode('')
              }}
              value={districtCode}
            >
              <option disabled value="">District</option>
              {tamilNaduDistricts.map((district) => <option key={district.code} value={district.code}>{district.name}</option>)}
            </select>
            <select
              className="border border-neutral-300 px-4 py-3"
              disabled={!districtCode}
              onChange={(event) => setTalukCode(event.target.value)}
              value={talukCode}
            >
              <option disabled value="">Taluk</option>
              {taluks.map((taluk) => <option key={taluk.code} value={taluk.code}>{taluk.name}</option>)}
            </select>
            <select className="border border-neutral-300 px-4 py-3" disabled={!talukCode} defaultValue="">
              <option disabled value="">Village</option>
              {villages.map((village) => <option key={village.code} value={village.code}>{village.name}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" placeholder="Pincode" />
            <textarea className="min-h-24 border border-neutral-300 px-4 py-3" placeholder="Full Address" />
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Passport Size Photo
              <input className="border border-neutral-300 px-4 py-3 font-normal" type="file" />
            </label>
            <select className="border border-neutral-300 px-4 py-3" defaultValue="">
              <option disabled value="">ID Proof Type</option>
              {idProofOptions.map((proof) => <option key={proof.value} value={proof.value}>{proof.label}</option>)}
            </select>
            <input className="border border-neutral-300 px-4 py-3" placeholder="ID Proof Number" />
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              ID Proof Image / Document
              <input className="border border-neutral-300 px-4 py-3 font-normal" type="file" />
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
            <input className="border border-neutral-300 px-4 py-3" placeholder="Password" type="password" />
            {mode === 'register' && <input className="border border-neutral-300 px-4 py-3" placeholder="Confirm Password" type="password" />}
          </>
        )}
        <Button type="submit">{title}</Button>
        {mode === 'login' && (
          <p className="text-center text-sm text-neutral-600">
            Forget password? <Link className="font-bold text-[#007cba]" to="/forget">Forget password</Link>
          </p>
        )}
      </form>
    </section>
  )
}
