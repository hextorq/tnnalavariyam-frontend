import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { api } from '../lib/api.js'
import { clearProfilePhoto, clearSession, getProfilePhoto, getSession, getUploadUrl, isAuthenticated, saveProfilePhoto } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { Link, navigate } from '../lib/router.jsx'
import { Activity, BadgeCheck, BriefcaseBusiness, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, FileText, History, IdCard, Image as ImageIcon, Layers3, LayoutDashboard, LogOut, MapPin, RefreshCw, ShieldCheck, Upload, User, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const adminRoles = new Set(['SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'TALUK_ADMIN', 'VILLAGE_ADMIN'])

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  STATE_ADMIN: 'State Admin',
  DISTRICT_ADMIN: 'District Admin',
  TALUK_ADMIN: 'Taluk Admin',
  VILLAGE_ADMIN: 'Village Admin',
  PARTNER: 'Village Partner',
}

const roleScopeLabels = {
  SUPER_ADMIN: 'All Tamil Nadu - every state, district, taluk, village and partner',
  STATE_ADMIN: 'Assigned state and all child districts, taluks, villages and partners',
  DISTRICT_ADMIN: 'Assigned district and all child taluks, villages and partners',
  TALUK_ADMIN: 'Assigned taluk and all child villages and partners',
  VILLAGE_ADMIN: 'Assigned village and all village partners',
  PARTNER: 'Only applications submitted from this partner account',
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN')
}

function StatusPill({ status }) {
  const color = status === 'APPROVED' || status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : status === 'REJECTED' || status === 'NEEDS_CORRECTION'
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : 'bg-amber-50 text-amber-800 ring-amber-200'

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${color}`}>{status || '-'}</span>
}

function Panel({ children, className = '' }) {
  return <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>{children}</section>
}

function PanelHeader({ action, eyebrow, title }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">{eyebrow}</p>}
        <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function StatCard({ icon: Icon, label, loading, tone = 'blue', value }) {
  const tones = {
    blue: 'bg-[#eef8ff] text-[#007cba]',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{loading ? '-' : value}</p>
        </div>
        <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{children}</p>
}

function getUserDisplayName(user) {
  if (!user) return 'User'
  return user.firstName || user.name || user.username || user.email || 'User'
}

function getUserInitials(user) {
  const displayName = getUserDisplayName(user)
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
  return initials || 'U'
}

function DashboardSidebar({ activeTab, collapsed, onCollapseToggle, onLogout, onNavigate, user }) {
  const profilePhoto = getProfilePhoto(user)
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard', description: 'Summary & Forms' },
    { id: 'dashboard-work', icon: ShieldCheck, label: 'Work Panel', description: 'Admin or partner' },
    { id: 'check-status', icon: ClipboardCheck, label: 'Check Status', description: 'Track request' },
  ]

  return (
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
        <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#007cba]">TN NALAVARIYAM</p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-white">Menu</p>
        </div>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          onClick={onCollapseToggle}
          type="button"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-1.5">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${isActive ? 'bg-[#007cba] text-white shadow-lg shadow-[#007cba]/25' : 'text-slate-300 hover:bg-slate-900 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800'}`}>
                  <Icon size={16} />
                </span>
                <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                  <span className="block text-sm leading-tight">{item.label}</span>
                  <span className={`block text-[11px] font-normal ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{item.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'profile-image' ? 'bg-[#007cba] text-white shadow-lg shadow-[#007cba]/25' : 'text-slate-300 hover:bg-slate-900 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}
          onClick={() => onNavigate('profile-image')}
          type="button"
        >
          <span className={`inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${activeTab === 'profile-image' ? 'bg-white/20 text-white' : 'bg-white text-slate-950'}`}>
            {profilePhoto ? <img alt="Profile" className="h-full w-full object-cover" src={profilePhoto} /> : <span className="font-bold">{getUserInitials(user)}</span>}
          </span>
          <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="block truncate text-sm leading-tight">{getUserDisplayName(user)}</span>
            <span className={`block truncate text-[11px] font-normal ${activeTab === 'profile-image' ? 'text-white/80' : 'text-slate-500'}`}>Profile update</span>
          </span>
        </button>

        <button
          className={`mt-2 flex w-full items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-200 ${collapsed ? 'justify-center' : ''}`}
          onClick={onLogout}
          type="button"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-800">
            <LogOut size={17} />
          </span>
          <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="block text-sm leading-tight">Logout</span>
            <span className="block text-[11px] font-normal text-slate-500">Sign out safely</span>
          </span>
        </button>
      </div>
    </aside>
  )
}

function UserImageCard({ onProfilePhotoChange, user }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(() => getProfilePhoto(user))

  useEffect(() => {
    setPreviewUrl(getProfilePhoto(user))
  }, [user])

  function openPicker() {
    inputRef.current?.click()
  }

  function clearImage() {
    clearProfilePhoto(user)
    setPreviewUrl(getProfilePhoto(user))
    onProfilePhotoChange?.(getProfilePhoto(user))
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        saveProfilePhoto(reader.result)
        setPreviewUrl(reader.result)
        onProfilePhotoChange?.(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section id="profile-image" className="rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Profile Update</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Update Profile Photo</h2>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xs" onClick={openPicker} type="button">
          <Upload size={16} />
          Choose image
        </button>
      </div>

      <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <input ref={inputRef} accept="image/*" className="sr-only" onChange={handleFileChange} type="file" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {previewUrl ? (
            <img alt="User profile preview" className="h-full min-h-64 w-full object-cover" src={previewUrl} />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-8 text-center text-slate-500">
              <div className="flex size-20 items-center justify-center rounded-full bg-white text-slate-400 shadow-xs ring-1 ring-slate-200">
                <User size={34} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-950">{getUserDisplayName(user)}</p>
                <p className="mt-1 text-sm">Upload a JPG, PNG or WebP profile image.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Profile Photo Management</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Your registration photo is automatically set as your default profile photo. You can upload a new photo here anytime or reset to default.</p>
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f78a0c]" onClick={openPicker} type="button">
              <Upload size={16} />
              Upload image
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950" onClick={clearImage} type="button">
              Reset to default
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
            Changes to your profile image update instantly across your dashboard, sidebar, and application submissions.
          </div>
        </div>
      </div>
    </section>
  )
}

function CheckStatusPanel() {
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
      notify({ type: 'warning', title: 'Tracking Number Required / எண் தேவை', message: mode === 'signup' ? 'Signup request number உள்ளிடவும்.' : 'Application number உள்ளிடவும்.' })
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
      notify({ type: 'success', title: 'Status Found / நிலை கிடைத்தது', message: 'உங்கள் விண்ணப்ப நிலை கீழே காட்டப்பட்டுள்ளது.', popup: false })
    } catch (error) {
      notify({ type: 'error', title: 'Status Not Found / நிலை கிடைக்கவில்லை', message: error.response?.data?.message || 'Tracking details கிடைக்கவில்லை.' })
    } finally {
      setLoading(false)
    }
  }

  function formatTrackDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('en-IN')
  }

  return (
    <Panel>
      <PanelHeader eyebrow="Check Status" title="Track your request here" />
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {[
            ['application', 'Application'],
            ['signup', 'Signup'],
          ].map(([value, label]) => {
            const active = mode === value
            return (
              <button
                className={`px-4 py-3 text-sm font-bold ${active ? 'bg-slate-950 text-white' : 'bg-transparent text-slate-700'}`}
                key={value}
                onClick={() => {
                  setMode(value)
                  setTracking(null)
                }}
                type="button"
              >
                {label}
              </button>
            )
          })}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {mode === 'application' ? (
            <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Application Number</span>
              <input className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setApplicationNo(event.target.value)} placeholder="TNW-20260729-0001" value={applicationNo} />
            </label>
          ) : (
            <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Signup Request Number</span>
              <input className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setRequestNo(event.target.value)} placeholder="TNSU-20260729-0001" value={requestNo} />
            </label>
          )}

          <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
            <span>Registered Mobile Number</span>
            <input className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digit mobile number" value={phone} />
          </label>

          <div className="md:col-span-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f78a0c]" disabled={loading} type="submit">
              <ClipboardCheck size={16} />
              {loading ? 'Checking...' : 'Track Status'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          {tracking ? (
            <div className="grid gap-3 md:grid-cols-2">
              {(mode === 'signup'
                ? [
                    ['Request No', tracking.requestNo],
                    ['Requested Role', tracking.requestedRole],
                    ['Scope', tracking.scope],
                    ['Status', tracking.status],
                    ['Reason', tracking.reason || '-'],
                    ['Reviewed By', tracking.reviewedBy?.username || '-'],
                    ['Reviewed At', formatTrackDate(tracking.reviewedAt)],
                    ['Created At', formatTrackDate(tracking.createdAt)],
                  ]
                : [
                    ['Application No', tracking.applicationNo],
                    ['Form', tracking.tamilFormTitle || tracking.formTitle],
                    ['Applicant', tracking.applicantName || '-'],
                    ['Scope', tracking.scope || '-'],
                    ['Status', tracking.status],
                    ['Payment Status', tracking.paymentStatus],
                    ['Payment Reference', tracking.paymentReference || '-'],
                    ['Last Updated', formatTrackDate(tracking.updatedAt)],
                  ]).map(([label, value]) => (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={label}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-600">Track your signup request or application from this dashboard without leaving the page.</p>
          )}
        </div>
      </div>
    </Panel>
  )
}

function SignupRejectedHistory({ history }) {
  if (!history?.count) return null

  return (
    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-rose-700 ring-1 ring-rose-200">
          <History size={15} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">Already rejected {history.count} time{history.count === 1 ? '' : 's'}</p>
          <div className="mt-2 grid gap-2">
            {history.items.slice(0, 3).map((item) => (
              <div className="border-t border-rose-200 pt-2" key={item.id}>
                <p className="text-xs font-bold uppercase text-rose-700">
                  {formatDate(item.rejectedAt || item.requestedAt)} - Matched {item.matchedFields.join(', ')}
                </p>
                <p className="mt-1 break-words">{item.reason || 'No rejection reason recorded'}</p>
                {item.reviewedBy && (
                  <p className="mt-1 text-xs text-rose-700">
                    Reviewed by {item.reviewedBy.username} ({roleLabels[item.reviewedBy.role] || item.reviewedBy.role})
                  </p>
                )}
              </div>
            ))}
            {history.count > 3 && <p className="text-xs font-semibold text-rose-700">+{history.count - 3} older rejection{history.count - 3 === 1 ? '' : 's'}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function SignupDetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value || '-'}</p>
    </div>
  )
}

function SignupDocumentCard({ icon: Icon, label, path }) {
  const url = getUploadUrl(path)
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(path || '')

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef8ff] text-[#007cba]">
            <Icon size={17} />
          </span>
          <p className="font-bold text-slate-950">{label}</p>
        </div>
        {url && (
          <a className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#007cba] hover:text-[#007cba]" href={url} rel="noreferrer" target="_blank">
            Open <ExternalLink size={13} />
          </a>
        )}
      </div>
      {url && isImage ? (
        <a href={url} rel="noreferrer" target="_blank">
          <img alt={label} className="max-h-72 w-full bg-slate-50 object-contain p-3" src={url} />
        </a>
      ) : (
        <div className="p-4 text-sm font-semibold text-slate-600">
          {url ? 'View uploaded file via the link above' : 'No document uploaded'}
        </div>
      )}
    </div>
  )
}

function AdminPanel({ user }) {
  const [signupRequests, setSignupRequests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSignup, setSelectedSignup] = useState(null)
  const [reviewReason, setReviewReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [signupResponse, submissionResponse] = await Promise.all([
        api.get('/auth/signup-requests'),
        api.get('/applications/submissions'),
      ])
      setSignupRequests(signupResponse.data.requests || [])
      setSubmissions(submissionResponse.data.submissions || [])
    } catch (error) {
      notify({
        type: 'error',
        title: 'Dashboard Load Failed',
        message: error.response?.data?.message || 'Admin dashboard details could not be loaded.',
      })
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  async function reviewSignup(request, status) {
    if (status === 'REJECTED' && !reviewReason.trim()) {
      notify({ type: 'warning', title: 'Reason Required', message: 'Rejection reason உள்ளிடவும்.' })
      return
    }

    try {
      setSubmittingReview(true)
      await api.patch(`/auth/signup-requests/${request.id}/review`, {
        status,
        reason: reviewReason.trim() || undefined,
      })
      notify({
        type: 'success',
        title: status === 'APPROVED' ? 'Request Approved' : 'Request Rejected',
        message: `${request.fullName} signup request update செய்யப்பட்டது.`,
      })
      setSelectedSignup(null)
      setReviewReason('')
      await loadDashboard()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Review Failed',
        message: error.response?.data?.message || 'Signup request review செய்ய முடியவில்லை.',
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  async function reviewApplication(submission, status) {
    const reason = window.prompt(`Enter review note/reason for status ${status}:`, submission.currentReviewReason || '')
    if (reason === null) return

    try {
      await api.post(`/applications/submissions/${submission.id}/review`, {
        action: status === 'APPROVED' ? 'APPROVED' : status === 'NEEDS_CORRECTION' ? 'CORRECTION_REQUESTED' : status === 'REJECTED' ? 'REJECTED' : 'REVIEW_STARTED',
        toStatus: status,
        reason,
      })
      notify({ type: 'success', title: 'Application Updated', message: `${submission.applicationNo} status set to ${status}.` })
      await loadDashboard()
    } catch (error) {
      notify({ type: 'error', title: 'Review Failed', message: error.response?.data?.message || 'Application review could not be updated.' })
    }
  }

  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])

  const stats = useMemo(() => {
    const pendingReview = submissions.filter((submission) => ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
    const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
    const returned = submissions.filter((submission) => submission.status === 'NEEDS_CORRECTION').length
    return [
      ['Pending Signups', pendingRequests.length, Users, 'amber'],
      ['Applications to Review', pendingReview, Activity, 'blue'],
      ['Returned Applications', returned, ClipboardCheck, 'rose'],
      ['Approved Applications', approved, BadgeCheck, 'green'],
    ]
  }, [pendingRequests.length, submissions])

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon, tone]) => (
          <StatCard icon={Icon} key={label} label={label} loading={loading} tone={tone} value={value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            action={<span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{pendingRequests.length} pending</span>}
            eyebrow="Signup Approval"
            title="User Signup Requests"
          />
          <div className="grid gap-3 p-4 sm:p-5">
            {pendingRequests.length ? (
              pendingRequests.map((request) => (
                <div className="rounded-xl border border-slate-200 p-4 transition hover:border-[#007cba]" key={request.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">{request.fullName}</p>
                      <p className="mt-1 text-sm text-slate-600">{request.requestNo} - {roleLabels[request.requestedRole] || request.requestedRole}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{request.district} | {request.taluk} | {request.village}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(request.createdAt)}</p>
                      <SignupRejectedHistory history={request.rejectedHistory} />
                    </div>
                    <button className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#007cba] hover:text-[#007cba]" onClick={() => setSelectedSignup(request)} type="button">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>No pending signup requests for your scope.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Work Queue" title="Applications Review Queue" />
          <div className="grid gap-3 p-4 sm:p-5">
            {submissions.length ? submissions.slice(0, 10).map((submission) => (
              <div className="rounded-xl border border-slate-200 p-3" key={submission.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-slate-950">{submission.applicationNo}</p>
                    <p className="mt-1 text-sm text-slate-600">{submission.form?.tamilTitle || submission.form?.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{submission.user?.firstName || submission.user?.username || 'Applicant'} - {submission.geoUnit?.name || '-'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(submission.updatedAt)}</p>
                  </div>
                  <StatusPill status={submission.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => reviewApplication(submission, 'UNDER_REVIEW')} type="button">Start Review</button>
                  <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'APPROVED')} type="button">Approve</button>
                  <button className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950" onClick={() => reviewApplication(submission, 'NEEDS_CORRECTION')} type="button">Return</button>
                  <button className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'REJECTED')} type="button">Reject</button>
                </div>
              </div>
            )) : (
              <EmptyState>No applications found.</EmptyState>
            )}
          </div>
        </Panel>
      </div>

      {selectedSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Signup Request Review</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedSignup.fullName}</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedSignup.requestNo} - {roleLabels[selectedSignup.requestedRole] || selectedSignup.requestedRole}</p>
              </div>
              <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100" onClick={() => setSelectedSignup(null)} type="button">Close</button>
            </div>

            <div className="mt-4 grid gap-4">
              <SignupRejectedHistory history={selectedSignup.rejectedHistory} />

              <div className="grid gap-3 sm:grid-cols-2">
                <SignupDetailRow label="Username" value={selectedSignup.username} />
                <SignupDetailRow label="Requested Role" value={roleLabels[selectedSignup.requestedRole] || selectedSignup.requestedRole} />
                <SignupDetailRow label="Mobile Number" value={selectedSignup.phone} />
                <SignupDetailRow label="Email Address" value={selectedSignup.email} />
                <SignupDetailRow label="District" value={selectedSignup.district} />
                <SignupDetailRow label="Taluk" value={selectedSignup.taluk} />
                <SignupDetailRow label="Village" value={selectedSignup.village} />
                <SignupDetailRow label="Pincode" value={selectedSignup.pincode} />
                <SignupDetailRow label="ID Proof Type" value={selectedSignup.idProofType} />
                <SignupDetailRow label="ID Proof Number" value={selectedSignup.idProofNumber} />
                <div className="sm:col-span-2">
                  <SignupDetailRow label="Address" value={selectedSignup.addressLine} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SignupDocumentCard icon={ImageIcon} label="Passport Photo" path={selectedSignup.photoPath} />
                <SignupDocumentCard icon={IdCard} label="ID Proof Document" path={selectedSignup.idProofPath} />
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>Review Note / Reason (Required if rejecting)</span>
                <textarea className="rounded-xl border border-slate-300 p-3 outline-none focus:border-[#007cba]" onChange={(e) => setReviewReason(e.target.value)} rows={3} value={reviewReason} />
              </label>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
                <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700" onClick={() => setSelectedSignup(null)} type="button">Cancel</button>
                <button className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50" disabled={submittingReview} onClick={() => reviewSignup(selectedSignup, 'REJECTED')} type="button">Reject Request</button>
                <button className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50" disabled={submittingReview} onClick={() => reviewSignup(selectedSignup, 'APPROVED')} type="button">Approve Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PartnerPanel({ user }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/applications/submissions')
      setSubmissions(response.data.submissions || [])
    } catch (error) {
      notify({
        type: 'error',
        title: 'Dashboard Load Failed',
        message: error.response?.data?.message || 'Partner dashboard details could not be loaded.',
      })
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const stats = useMemo(() => {
    const needsCorrection = submissions.filter((submission) => ['NEEDS_CORRECTION', 'REJECTED'].includes(submission.status)).length
    const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
    const inProgress = submissions.filter((submission) => ['DRAFT', 'SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
    return [
      ['My Applications', submissions.length, FileText, 'blue'],
      ['In Progress', inProgress, Activity, 'amber'],
      ['Needs Correction', needsCorrection, ClipboardCheck, 'rose'],
      ['Approved', approved, BadgeCheck, 'green'],
    ]
  }, [submissions])

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon, tone]) => (
          <StatCard icon={Icon} key={label} label={label} loading={loading} tone={tone} value={value} />
        ))}
      </div>

      <Panel>
        <PanelHeader eyebrow="My Work" title="My Recent Applications" />
        <div className="grid gap-3 p-4 sm:p-5">
          {submissions.length ? submissions.slice(0, 10).map((submission) => (
            <div className="rounded-xl border border-slate-200 p-3" key={submission.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all font-bold text-slate-950">{submission.applicationNo}</p>
                  <p className="mt-1 text-sm text-slate-600">{submission.form?.tamilTitle || submission.form?.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{submission.geoUnit?.name || '-'}</p>
                  {submission.currentReviewReason && (
                    <p className="mt-2 border-l-4 border-red-500 bg-red-50 p-2 text-sm font-semibold text-red-800">{submission.currentReviewReason}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{formatDate(submission.updatedAt)}</p>
                </div>
                <StatusPill status={submission.status} />
              </div>
            </div>
          )) : (
            <EmptyState>No applications submitted yet.</EmptyState>
          )}
        </div>
      </Panel>
    </section>
  )
}

function ServicePortal() {
  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Online Service Portal</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">விண்ணப்ப சேவை மையம்</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          கீழே உள்ள நலவாரிய சேவைகளில் தேவையான விண்ணப்பத்தை தேர்வு செய்து சமர்ப்பிக்கலாம்.
          விண்ணப்ப எண்ணை பயன்படுத்தி நிலையை தொடர்ந்து பார்க்கலாம்.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-slate-950">விண்ணப்ப சேவைகள்: {applicationForms.length}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {applicationForms.map((form) => (
            <Link className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-[#007cba] hover:shadow-md sm:p-5" key={form.id} to={`/app/forms/${form.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{form.tamilTitle}</h2>
                  <p className="mt-2 text-sm text-slate-600">{form.title}</p>
                </div>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef8ff] text-[#007cba]">
                  <FileText size={18} />
                </span>
              </div>
              <p className="mt-5 text-sm font-bold text-[#007cba]">திறக்கவும் →</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}

export default function DashboardPage() {
  if (!isAuthenticated()) return <AuthRequired />
  const user = getSession()?.user
  const isAdmin = adminRoles.has(user?.role)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard-overview')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(() => getProfilePhoto(user))

  useEffect(() => {
    const syncProfilePhoto = () => setProfilePhotoUrl(getProfilePhoto(user))
    syncProfilePhoto()
    window.addEventListener('authchange', syncProfilePhoto)
    window.addEventListener('storage', syncProfilePhoto)
    return () => {
      window.removeEventListener('authchange', syncProfilePhoto)
      window.removeEventListener('storage', syncProfilePhoto)
    }
  }, [user])

  const handleLogout = useCallback(() => {
    clearSession()
    navigate('/login')
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-900">
      <DashboardSidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        onLogout={handleLogout}
        onNavigate={(tabId) => setActiveTab(tabId)}
        user={user}
      />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {activeTab === 'dashboard-overview' && (
          <>
            {/* Header Banner */}
            <section id="dashboard-overview" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">User Dashboard / பயனர் டாஷ்போர்டு</p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">My Dashboard</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Welcome back, <span className="font-bold text-slate-900">{getUserDisplayName(user)}</span>. {roleLabels[user?.role] || user?.role} access active.
                  </p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                    {isAdmin ? roleScopeLabels[user?.role] : 'Select an application form below, track submitted requests, or manage your profile.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                    onClick={() => setActiveTab('profile-image')}
                    type="button"
                  >
                    <User size={16} />
                    Profile Update
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xs" onClick={() => window.location.reload()} type="button">
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* Selectable Application Forms Quick Bar */}
            <Panel>
              <PanelHeader
                eyebrow="Application Forms / விண்ணப்பப் படிவங்கள்"
                title="Select Application Form / விண்ணப்பத்தை தேர்வு செய்க"
              />
              <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-3">
                {applicationForms.map((form) => (
                  <Link
                    className="group flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-[#007cba] hover:bg-white hover:shadow-md"
                    key={form.id}
                    to={`/app/forms/${form.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-950">{form.tamilTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">{form.title}</p>
                      <p className="mt-3 text-xs font-bold text-[#007cba] group-hover:underline">
                        Apply Form / விண்ணப்பிக்க →
                      </p>
                    </div>
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef8ff] text-[#007cba]">
                      <FileText size={18} />
                    </span>
                  </Link>
                ))}
              </div>
            </Panel>

            <section id="dashboard-work" className="space-y-6">
              {isAdmin && <AdminPanel user={user} />}
              {!isAdmin && <PartnerPanel user={user} />}
            </section>
          </>
        )}

        {activeTab === 'profile-image' && (
          <UserImageCard onProfilePhotoChange={setProfilePhotoUrl} user={user} />
        )}

        {activeTab === 'check-status' && (
          <section id="check-status">
            <CheckStatusPanel />
          </section>
        )}

        {activeTab === 'service-portal' && (
          <section id="service-portal">
            <ServicePortal />
          </section>
        )}
      </main>
    </div>
  )
}
