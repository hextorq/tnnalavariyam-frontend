import { Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'

export default function TrackingPage() {
  const [mode, setMode] = useState('application')
  const [applicationNo, setApplicationNo] = useState('')
  const [requestNo, setRequestNo] = useState('')
  const [phone, setPhone] = useState('')
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(false)
  const { notify } = useNotifications()

  async function handleSubmit(event) {
    event.preventDefault()

    const trackingNumber = mode === 'signup' ? requestNo.trim() : applicationNo.trim()
    if (!trackingNumber) {
      notify({
        type: 'warning',
        title: 'Tracking Number Required / எண் தேவை',
        message: mode === 'signup' ? 'Signup request number உள்ளிடவும்.' : 'Application number உள்ளிடவும்.',
      })
      return
    }
    if (phone && phone.length !== 10) {
      notify({
        type: 'warning',
        title: 'Phone Number Required / தொலைபேசி எண்',
        message: '10 இலக்க பதிவு செய்யப்பட்ட தொலைபேசி எண்ணை உள்ளிடவும்.',
      })
      return
    }

    try {
      setLoading(true)
      setTracking(null)
      const params = mode === 'signup'
        ? { requestNo: trackingNumber, ...(phone ? { phone } : {}) }
        : { applicationNo: trackingNumber, ...(phone ? { phone } : {}) }
      const endpoint = mode === 'signup' ? '/auth/signup-requests/track' : '/applications/track'
      const response = await api.get(endpoint, { params })
      setTracking(response.data.tracking)
      notify({
        type: 'success',
        title: 'Status Found / நிலை கிடைத்தது',
        message: 'உங்கள் விண்ணப்ப நிலை கீழே காட்டப்பட்டுள்ளது.',
        popup: false,
      })
    } catch (error) {
      const message = error.response?.data?.message || 'Tracking details கிடைக்கவில்லை. விவரங்களை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
      notify({
        type: 'error',
        title: 'Status Not Found / நிலை கிடைக்கவில்லை',
        message,
      })
    } finally {
      setLoading(false)
    }
  }

  function formatDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('en-IN')
  }

  return (
    <section className="bg-neutral-100 px-3 py-8 sm:px-5 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-8">
        <form className="min-w-0 bg-white p-4 shadow-sm sm:p-6" onSubmit={handleSubmit}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Application Tracking</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">விண்ணப்ப நிலை பார்க்க</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Application number அல்லது signup request number வைத்து approval/review status பார்க்கலாம்.
          </p>

          <div className="mt-6 grid grid-cols-2 border border-neutral-300">
            {[
              ['application', 'Application'],
              ['signup', 'Signup'],
            ].map(([value, label]) => (
              <button
              className={`min-w-0 px-3 py-3 text-sm font-bold ${mode === value ? 'bg-[#007cba] text-white' : 'bg-white text-neutral-800'}`}
                key={value}
                onClick={() => {
                  setMode(value)
                  setTracking(null)
                  setPhone('')
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'application' ? (
            <label className="mt-6 grid gap-2 text-sm font-bold text-neutral-800">
              Application Number
              <input
                className="min-w-0 border border-neutral-300 px-4 py-3 font-normal"
                onChange={(event) => setApplicationNo(event.target.value)}
                placeholder="TNW-20260729-0001"
                value={applicationNo}
              />
            </label>
          ) : (
            <label className="mt-6 grid gap-2 text-sm font-bold text-neutral-800">
              Signup Request Number
              <input
                className="min-w-0 border border-neutral-300 px-4 py-3 font-normal"
                onChange={(event) => setRequestNo(event.target.value)}
                placeholder="TNSU-20260729-0001"
                value={requestNo}
              />
            </label>
          )}

          <label className="mt-4 grid gap-2 text-sm font-bold text-neutral-800">
            Mobile Number
            <input
              {...phoneInputProps}
              className="min-w-0 border border-neutral-300 px-4 py-3 font-normal"
              onChange={(event) => setPhone(normalizePhone(event.target.value))}
              placeholder="10 digit registered mobile number"
              value={phone}
            />
          </label>

          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto" disabled={loading} type="submit">
            <Search size={18} />
            {loading ? 'Checking...' : 'Track Status'}
          </button>
        </form>

        <div className="min-w-0 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950 sm:text-xl">நிலை விவரம்</h2>
          {tracking ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(mode === 'signup'
                ? [
                    ['Request No', tracking.requestNo],
                    ['Requested Role', tracking.requestedRole],
                    ['பகுதி', tracking.scope],
                    ['Signup Status', tracking.status],
                    ['குறிப்பு', tracking.reason || '-'],
                    ['Reviewed By', tracking.reviewedBy?.username || '-'],
                    ['Reviewed At', formatDate(tracking.reviewedAt)],
                    ['Created At', formatDate(tracking.createdAt)],
                  ]
                : [
                    ['Application No', tracking.applicationNo],
                    ['Form', tracking.tamilFormTitle || tracking.formTitle],
                    ['Applicant', tracking.applicantName || '-'],
                    ['பகுதி', tracking.scope || '-'],
                    ['Application Status', tracking.status],
                    ['Payment Status', tracking.paymentStatus],
                    ['Payment Reference', tracking.paymentReference || '-'],
                    ['Correction Reason', tracking.currentReviewReason || '-'],
                    ['திருத்த எண்ணிக்கை', tracking.revisionCount],
                    ['Last Updated', formatDate(tracking.updatedAt)],
                  ]).map(([label, value]) => (
                <div className="border border-neutral-200 p-4" key={label}>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
                  <p className="mt-2 text-base font-bold text-neutral-950">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-neutral-300 p-5 text-sm leading-6 text-neutral-600 sm:p-8">
              {mode === 'signup'
                ? 'Signup request number மற்றும் registered mobile number வைத்து approval status பார்க்கலாம்.'
                : 'Application number மற்றும் registered mobile number வைத்து application status பார்க்கலாம்.'}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
