import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { api } from '../lib/api.js'
import { clearProfilePhoto, clearSession, getProfilePhoto, getSession, isAuthenticated, saveProfilePhoto } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { Link, navigate } from '../lib/router.jsx'
import { Activity, BadgeCheck, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, FileText, History, IdCard, Image as ImageIcon, Layers3, LayoutDashboard, LogOut, MapPin, RefreshCw, ShieldCheck, Upload, User, Users } from 'lucide-react'
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

function getUploadUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const apiBase = api.defaults.baseURL || window.location.origin
  const siteBase = apiBase.replace(/\/api\/?$/, '/')
  return new URL(path, siteBase).href
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
  return <section className={`min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{loading ? '-' : value}</p>
        </div>
        <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{children}</p>
}

function StatusFilter({ active, options, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
      {options.map((option) => (
        <button
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold transition ${active === option.value ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
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

function DashboardSidebar({ collapsed, onCollapseToggle, onLogout, onNavigate, user }) {
  const [formsExpanded, setFormsExpanded] = useState(true)
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard', description: 'Summary' },
    { id: 'profile-image', icon: User, label: 'Profile Update', description: 'Upload image' },
    { id: 'check-status', icon: ClipboardCheck, label: 'Check Status', description: 'Track request' },
  ]

  return (
    <aside className={`sticky top-6 self-start overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-2xl transition-[width] duration-300 lg:h-[calc(100vh-3rem)] lg:overflow-y-auto ${collapsed ? 'lg:w-24' : 'lg:w-80'}`}>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
        <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/45">User Panel</p>
          <p className="mt-2 text-2xl font-bold leading-tight">My Dashboard</p>
          <p className="mt-2 text-sm leading-6 text-white/65">Manage profile, applications and status updates from one place.</p>
        </div>
        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          onClick={onCollapseToggle}
          type="button"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-slate-950">
            {getProfilePhoto(user) ? <img alt="Profile" className="h-full w-full object-cover" src={getProfilePhoto(user)} /> : getUserInitials(user)}
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="truncate text-base font-bold">{getUserDisplayName(user)}</p>
            <p className="truncate text-sm text-white/60">{user?.role || 'PARTNER'}</p>
          </div>
        </div>

        <nav className="mt-4 grid gap-2">
          {items.map((item) => {
            const Icon = item.icon
            const commonClasses = `flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${collapsed ? 'justify-center' : ''}`

            if (item.to) {
              return (
                <Link className={`${commonClasses} text-white/80 hover:bg-white/10 hover:text-white`} key={item.label} to={item.to}>
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Icon size={17} />
                  </span>
                  <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                    <span className="block">{item.label}</span>
                    <span className="block text-xs font-normal text-white/45">{item.description}</span>
                  </span>
                </Link>
              )
            }

            return (
              <button
                className={`${commonClasses} text-white/80 hover:bg-white/10 hover:text-white`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon size={17} />
                </span>
                <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                  <span className="block">{item.label}</span>
                  <span className="block text-xs font-normal text-white/45">{item.description}</span>
                </span>
              </button>
            )
          })}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <button
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''}`}
              onClick={() => {
                if (collapsed) {
                  onCollapseToggle()
                  setFormsExpanded(true)
                } else {
                  setFormsExpanded((current) => !current)
                }
                onNavigate('service-portal')
              }}
              type="button"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <FileText size={17} />
              </span>
              <span className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <span className="block">Application Forms</span>
                <span className="block text-xs font-normal text-white/45">6 welfare forms</span>
              </span>
              <ChevronDown className={`shrink-0 transition ${formsExpanded ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`} size={16} />
            </button>

            {formsExpanded && !collapsed && (
              <div className="grid gap-1 px-3 pb-3">
                {applicationForms.map((form, index) => (
                  <Link
                    className="group flex min-w-0 items-start gap-2 rounded-xl px-3 py-2 text-left text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
                    key={form.id}
                    to={`/app/forms/${form.id}`}
                  >
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/70 group-hover:text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{form.tamilTitle}</span>
                      <span className="block truncate text-white/45">{form.title}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className={`mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Quick Note</p>
          <p className="mt-2 text-sm leading-6 text-white/70">Use the profile card to upload an image preview and the service portal to open application forms.</p>
        </div>

        <button
          className={`mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''}`}
          onClick={onLogout}
          type="button"
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <LogOut size={17} />
          </span>
          <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="block">Logout</span>
            <span className="block text-xs font-normal text-white/45">Sign out safely</span>
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
    setPreviewUrl('')
    onProfilePhotoChange?.('')
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
    <section id="profile-image" className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Profile Update</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Upload your image first</h2>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm" onClick={openPicker} type="button">
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
              <div className="flex size-20 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
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
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Photo dashboard</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">This section gives the user a quick image upload area with instant preview, so the dashboard feels complete and personal.</p>
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f78a0c]" onClick={openPicker} type="button">
              <Upload size={16} />
              Upload image
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950" onClick={clearImage} type="button">
              Clear preview
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
            Upload the user photo here first. The rest of the dashboard stays available below for applications, status and review actions.
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
              <input className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setApplicationNo(event.target.value)} placeholder="TNW-20260729-0001" value={applicationNo} />
            </label>
          ) : (
            <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Signup Request Number</span>
              <input className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setRequestNo(event.target.value)} placeholder="TNSU-20260729-0001" value={requestNo} />
            </label>
          )}

          <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
            <span>Registered Mobile Number</span>
            <input className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]" onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digit mobile number" value={phone} />
          </label>

          <div className="md:col-span-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f78a0c]" disabled={loading} type="submit">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value || '-'}</p>
    </div>
  )
}

function SignupDocumentCard({ icon: Icon, label, path }) {
  const url = getUploadUrl(path)
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(path || '')

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef8ff] text-[#007cba]">
            <Icon size={17} />
          </span>
          <p className="font-bold text-slate-950">{label}</p>
        </div>
        {url && (
          <a className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#007cba] hover:text-[#007cba]" href={url} rel="noreferrer" target="_blank">
            Open <ExternalLink size={13} />
          </a>
        )}
      </div>
      {url && isImage ? (
        <a href={url} rel="noreferrer" target="_blank">
          <img alt={label} className="max-h-72 w-full bg-slate-50 object-contain p-3" src={url} />
        </a>
      ) : (
        <div className="p-5 text-sm font-semibold text-slate-600">{url ? 'Document uploaded. Open to view.' : 'No document uploaded.'}</div>
      )}
    </div>
  )
}

function SignupRequestDetail({ request, onReview }) {
  if (!request) {
    return (
      <Panel>
        <PanelHeader eyebrow="Details" title="Signup Request Details" />
        <div className="p-4 sm:p-5">
          <EmptyState>Select a signup request to view full details and documents.</EmptyState>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHeader
        action={<StatusPill status={request.status} />}
        eyebrow="Details"
        title={request.fullName || 'Signup Request'}
      />
      <div className="grid gap-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <SignupDetailRow label="Request No" value={request.requestNo} />
          <SignupDetailRow label="Requested Role" value={roleLabels[request.requestedRole] || request.requestedRole} />
          <SignupDetailRow label="Username" value={request.username} />
          <SignupDetailRow label="Phone" value={request.phone} />
          <SignupDetailRow label="Email" value={request.email} />
          <SignupDetailRow label="Pincode" value={request.pincode} />
          <SignupDetailRow label="ID Proof Type" value={request.idProofType?.replaceAll('_', ' ')} />
          <SignupDetailRow label="ID Proof No" value={request.idProofNumber} />
          <SignupDetailRow label="Submitted" value={formatDate(request.createdAt)} />
          <SignupDetailRow label="Reviewed" value={formatDate(request.reviewedAt)} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <MapPin size={14} />
            Address and Scope
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{request.addressLine || '-'}</p>
          <p className="mt-2 text-sm text-slate-600">
            {[request.village, request.taluk, request.district, request.state].filter(Boolean).join(', ')}
          </p>
          <p className="mt-1 text-sm text-slate-600">Scope: {request.scope?.name || '-'}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SignupDocumentCard icon={ImageIcon} label="Passport Photo" path={request.photoPath} />
          <SignupDocumentCard icon={IdCard} label="ID Proof Document" path={request.idProofPath} />
        </div>

        {request.reviewReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="font-bold">Rejection Reason</p>
            <p className="mt-1">{request.reviewReason}</p>
          </div>
        )}

        <SignupRejectedHistory history={request.rejectedHistory} />

        {request.status === 'PENDING' && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white" onClick={() => onReview(request, 'APPROVED')} type="button">Approve</button>
            <button className="rounded-md bg-rose-600 px-4 py-2.5 text-sm font-bold text-white" onClick={() => onReview(request, 'REJECTED')} type="button">Reject</button>
          </div>
        )}
      </div>
    </Panel>
  )
}

function AdminSectionTabs({ activeSection, counts, onChange }) {
  const sections = [
    { id: 'overview', label: 'Overview', tamil: 'மேலோட்டம்', count: null, icon: Layers3 },
    { id: 'signups', label: 'Signup Approvals', tamil: 'பதிவு அனுமதி', count: counts.signups, icon: ShieldCheck },
    { id: 'applications', label: 'Application Review', tamil: 'விண்ணப்ப பரிசீலனை', count: counts.applications, icon: ClipboardCheck },
    { id: 'users', label: 'Users & Coverage', tamil: 'பயனர்கள் மற்றும் பகுதி', count: counts.users, icon: Users },
  ]

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:self-start">
      <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Admin Modules</p>
      <div className="grid gap-2">
        {sections.map((section) => {
          const active = activeSection === section.id
          const Icon = section.icon
          return (
            <button
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-3 text-left text-sm font-bold transition ${
                active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
              key={section.id}
              onClick={() => onChange(section.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/15' : 'bg-slate-100 text-slate-700'}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block">{section.tamil}</span>
                  <span className={`block text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>{section.label}</span>
                </span>
              </span>
              {section.count !== null && <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'}`}>{section.count}</span>}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function AdminPanel({ user }) {
  const [overview, setOverview] = useState(null)
  const [signupRequests, setSignupRequests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedSignupId, setSelectedSignupId] = useState(null)
  const [signupStatusFilter, setSignupStatusFilter] = useState('ALL')
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('ALL')
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [overviewResponse, signupResponse, submissionsResponse] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/auth/signup-requests'),
        api.get('/applications/submissions'),
      ])
      setOverview(overviewResponse.data.overview || null)
      const nextSignupRequests = signupResponse.data.requests || []
      setSignupRequests(nextSignupRequests)
      setSelectedSignupId((current) => (nextSignupRequests.some((request) => request.id === current) ? current : nextSignupRequests[0]?.id || null))
      setSubmissions(submissionsResponse.data.submissions || [])
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
    const reason = status === 'REJECTED' ? window.prompt('Enter rejection reason') : ''
    if (status === 'REJECTED' && !reason) return

    try {
      await api.patch(`/auth/signup-requests/${request.id}/review`, { status, reason })
      notify({
        type: 'success',
        title: status === 'APPROVED' ? 'Signup Approved' : 'Signup Rejected',
        message: `${request.fullName} request has been ${status.toLowerCase()}.`,
      })
      loadDashboard()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Review Failed',
        message: error.response?.data?.message || 'Unable to review this signup request.',
      })
    }
  }

  async function reviewApplication(submission, status) {
    const needsReason = ['NEEDS_CORRECTION', 'REJECTED'].includes(status)
    const reason = needsReason ? window.prompt(status === 'NEEDS_CORRECTION' ? 'Enter correction reason' : 'Enter rejection reason') : ''
    if (needsReason && !reason) return

    try {
      await api.patch(`/applications/submissions/${submission.id}/review`, { status, reason })
      notify({
        type: 'success',
        title: 'Application Updated',
        message: `${submission.applicationNo} moved to ${status}.`,
      })
      loadDashboard()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Application Review Failed',
        message: error.response?.data?.message || 'Unable to review this application.',
      })
    }
  }

  async function updateUserLoginStatus(targetUser, isActive) {
    const action = isActive ? 'unblock' : 'block'
    const confirmed = window.confirm(`${action === 'block' ? 'Block' : 'Unblock'} login for ${targetUser.username}?`)
    if (!confirmed) return

    try {
      await api.patch(`/admin/users/${targetUser.id}/login-status`, { isActive })
      notify({
        type: 'success',
        title: isActive ? 'Login Unblocked' : 'Login Blocked',
        message: `${targetUser.username} login access has been ${isActive ? 'enabled' : 'blocked'}.`,
      })
      loadDashboard()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Login Access Update Failed',
        message: error.response?.data?.message || 'Unable to update login access.',
      })
    }
  }

  const stats = useMemo(() => {
    const pendingSignups = signupRequests.filter((request) => request.status === 'PENDING').length
    const pendingApplications = submissions.filter((submission) => ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
    return [
      ['Total Users', overview?.users?.total ?? 0, Users, 'blue'],
      ['Active Users', overview?.users?.active ?? 0, BadgeCheck, 'green'],
      ['Pending Signups', pendingSignups, ShieldCheck, 'amber'],
      ['Pending Review', pendingApplications, ClipboardCheck, 'rose'],
      ['Applications', submissions.length, FileText, 'blue'],
      ['Geo Units', (overview?.geoUnits || []).reduce((total, item) => total + item.count, 0), Layers3, 'slate'],
      ['Active Forms', overview?.forms?.active ?? applicationForms.length, BriefcaseBusiness, 'green'],
      ['Signup Requests', signupRequests.length, Activity, 'amber'],
    ]
  }, [overview, signupRequests, submissions])

  const pendingSignupCount = signupRequests.filter((request) => request.status === 'PENDING').length
  const reviewApplicationCount = submissions.filter((submission) => ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
  const activeUsersCount = overview?.users?.active ?? 0
  const visibleUsers = overview?.users?.recent || []
  const selectedSignupRequest = signupRequests.find((request) => request.id === selectedSignupId) || signupRequests[0] || null
  const filteredSignupRequests = signupStatusFilter === 'ALL' ? signupRequests : signupRequests.filter((request) => request.status === signupStatusFilter)
  const filteredSubmissions = applicationStatusFilter === 'ALL' ? submissions : submissions.filter((submission) => submission.status === applicationStatusFilter)
  const visibleSignupRequest = filteredSignupRequests.find((request) => request.id === selectedSignupRequest?.id) || filteredSignupRequests[0] || null

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Admin Panel</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-4xl">நிர்வாக டாஷ்போர்டு</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {user?.username || user?.email} - {roleLabels[user?.role] || user?.role}
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              {roleScopeLabels[user?.role]}
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm" onClick={loadDashboard} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSectionTabs
          activeSection={activeSection}
          counts={{ applications: reviewApplicationCount, signups: pendingSignupCount, users: activeUsersCount }}
          onChange={setActiveSection}
        />

        <div className="min-w-0">

      {activeSection === 'overview' && (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value, Icon, tone]) => (
              <StatCard icon={Icon} key={label} label={label} loading={loading} tone={tone} value={value} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel>
              <PanelHeader eyebrow="Priority" title="Pending Signup Requests" />
              <div className="p-4 sm:p-5">
                <p className="text-4xl font-bold text-slate-950">{pendingSignupCount}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">New role signup requests waiting for hierarchy approval.</p>
                <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={() => setActiveSection('signups')} type="button">Open Signup Approvals</button>
              </div>
            </Panel>
            <Panel>
              <PanelHeader eyebrow="Priority" title="Applications for Review" />
              <div className="p-4 sm:p-5">
                <p className="text-4xl font-bold text-slate-950">{reviewApplicationCount}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Submitted and resubmitted welfare applications inside your RBAC scope.</p>
                <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={() => setActiveSection('applications')} type="button">Open Application Review</button>
              </div>
            </Panel>
            <Panel>
              <PanelHeader eyebrow="Access" title="Active Users" />
              <div className="p-4 sm:p-5">
                <p className="text-4xl font-bold text-slate-950">{activeUsersCount}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Approved users under your assigned hierarchy level.</p>
                <button className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={() => setActiveSection('users')} type="button">Open Users & Coverage</button>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {activeSection === 'users' && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
        <Panel>
          <PanelHeader eyebrow="Access" title="Active Users - Last Login & Activity" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {(overview?.users?.byRole || []).map((item) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={item.role}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{roleLabels[item.role] || item.role}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{item.count}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto px-4 pb-4 sm:px-5 sm:pb-5">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Scope</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last Login Time</th>
                  <th className="px-3 py-3">Latest Activity</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Login Access</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((recentUser) => (
                  <tr className="border-b border-slate-100" key={recentUser.id}>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-950">{recentUser.username}</p>
                      <p className="text-xs text-slate-500">{recentUser.email}</p>
                    </td>
                    <td className="px-3 py-3">{roleLabels[recentUser.role] || recentUser.role}</td>
                    <td className="px-3 py-3">{recentUser.scope?.name || 'All Tamil Nadu'}</td>
                    <td className="px-3 py-3"><StatusPill status={recentUser.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-950">{recentUser.lastLoginAt ? formatDate(recentUser.lastLoginAt) : 'Never logged in'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{recentUser.latestActivity?.label || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(recentUser.latestActivity?.at)}</p>
                    </td>
                    <td className="px-3 py-3">{formatDate(recentUser.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button
                        className={`rounded-md px-3 py-2 text-xs font-bold text-white ${recentUser.isActive ? 'bg-rose-600' : 'bg-emerald-600'}`}
                        onClick={() => updateUserLoginStatus(recentUser, !recentUser.isActive)}
                        type="button"
                      >
                        {recentUser.isActive ? 'Block Login' : 'Unblock Login'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleUsers.length && <EmptyState>No users found.</EmptyState>}
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="Coverage" title="System Coverage" />
          <div className="grid gap-3 p-4 sm:p-5">
            {(overview?.geoUnits || []).map((item) => (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3" key={item.type}>
                <span className="text-sm font-bold text-slate-700">{item.type}</span>
                <span className="text-xl font-bold text-slate-950">{item.count}</span>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-[#eef8ff] p-3">
              <p className="text-sm font-bold text-slate-700">Application Forms</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{overview?.forms?.active ?? applicationForms.length} active / {overview?.forms?.total ?? applicationForms.length} total</p>
            </div>
          </div>
        </Panel>
      </div>
      )}

      {activeSection === 'signups' && (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Panel>
            <PanelHeader eyebrow="Approvals" title="Signup Requests" />
            <div className="grid gap-3 p-4 sm:p-5">
              <StatusFilter
                active={signupStatusFilter}
                onChange={setSignupStatusFilter}
                options={[
                  { value: 'ALL', label: 'அனைத்தும் / All' },
                  { value: 'PENDING', label: 'நிலுவை / Pending' },
                  { value: 'APPROVED', label: 'அனுமதி / Approved' },
                  { value: 'REJECTED', label: 'நிராகரிப்பு / Rejected' },
                ]}
              />
            </div>
            <div className="grid max-h-[calc(100vh-330px)] gap-2 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              {filteredSignupRequests.length ? filteredSignupRequests.map((request) => {
                const selected = visibleSignupRequest?.id === request.id
                return (
                  <button
                    className={`rounded-lg border p-3 text-left transition ${selected ? 'border-[#007cba] bg-[#eef8ff] shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    key={request.id}
                    onClick={() => setSelectedSignupId(request.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-950">{request.fullName}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">{request.phone}</p>
                        <p className="mt-1 truncate text-sm text-slate-600">{request.email}</p>
                      </div>
                      <StatusPill status={request.status} />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{roleLabels[request.requestedRole] || request.requestedRole}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{request.scope?.name || request.village || request.taluk || request.district}</p>
                    {request.rejectedHistory?.count > 0 && (
                      <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">Rejected before: {request.rejectedHistory.count}</p>
                    )}
                  </button>
                )
              }) : (
                <EmptyState>No signup requests found.</EmptyState>
              )}
            </div>
          </Panel>

          <SignupRequestDetail request={visibleSignupRequest} onReview={reviewSignup} />
        </div>
      )}

      {activeSection === 'applications' && (
        <Panel>
          <PanelHeader eyebrow="Review Queue" title="Application Review" />
          <div className="grid gap-3 p-4 sm:p-5">
            <StatusFilter
              active={applicationStatusFilter}
              onChange={setApplicationStatusFilter}
              options={[
                { value: 'ALL', label: 'அனைத்தும் / All' },
                { value: 'SUBMITTED', label: 'சமர்ப்பிப்பு / Submitted' },
                { value: 'UNDER_REVIEW', label: 'பரிசீலனை / Under Review' },
                { value: 'NEEDS_CORRECTION', label: 'திருத்தம் / Returned' },
                { value: 'RESUBMITTED', label: 'மீண்டும் / Resubmitted' },
                { value: 'APPROVED', label: 'அனுமதி / Approved' },
                { value: 'REJECTED', label: 'நிராகரிப்பு / Rejected' },
              ]}
            />
            {filteredSubmissions.length ? filteredSubmissions.map((submission) => (
              <div className="rounded-lg border border-slate-200 p-3" key={submission.id}>
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
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => reviewApplication(submission, 'UNDER_REVIEW')} type="button">Start Review</button>
                  <button className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'APPROVED')} type="button">Approve</button>
                  <button className="rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950" onClick={() => reviewApplication(submission, 'NEEDS_CORRECTION')} type="button">Return</button>
                  <button className="rounded-md bg-rose-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'REJECTED')} type="button">Reject</button>
                </div>
              </div>
            )) : (
              <EmptyState>No applications found.</EmptyState>
            )}
          </div>
        </Panel>
      )}
        </div>
      </div>
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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Partner Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-4xl">என் விண்ணப்ப டாஷ்போர்டு</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {user?.username || user?.email} - {roleLabels[user?.role] || user?.role}
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{roleScopeLabels.PARTNER}</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm" onClick={loadDashboard} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon, tone]) => (
          <StatCard icon={Icon} key={label} label={label} loading={loading} tone={tone} value={value} />
        ))}
      </div>

      <Panel>
        <PanelHeader eyebrow="My Work" title="My Recent Applications" />
        <div className="grid gap-3 p-4 sm:p-5">
          {submissions.length ? submissions.slice(0, 10).map((submission) => (
            <div className="rounded-lg border border-slate-200 p-3" key={submission.id}>
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
            <Link className="group min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007cba] hover:shadow-md sm:p-5" key={form.id} to={`/app/forms/${form.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{form.tamilTitle}</h2>
                  <p className="mt-2 text-sm text-slate-600">{form.title}</p>
                </div>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef8ff] text-[#007cba]">
                  <FileText size={18} />
                </span>
              </div>
              <p className="mt-5 text-sm font-bold text-[#007cba]">திறக்கவும்</p>
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

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    navigate('/login')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 px-2 py-4 text-slate-900 sm:px-4 sm:py-6">
      <div className="grid w-full gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
          onLogout={handleLogout}
          onNavigate={scrollToSection}
          user={user}
        />

        <main className="min-w-0 space-y-6">
          <section id="dashboard-overview" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">User Dashboard</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">My Dashboard</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Welcome, {getUserDisplayName(user)}. {roleLabels[user?.role] || user?.role} access is active.
                </p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  {isAdmin ? roleScopeLabels[user?.role] : 'Use your dashboard to upload an image, track your work and continue your applications.'}
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm" onClick={() => window.location.reload()} type="button">
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </section>

          <UserImageCard onProfilePhotoChange={setProfilePhotoUrl} user={user} />

          <section id="check-status">
            <CheckStatusPanel />
          </section>

          <section id="dashboard-work" className="space-y-6">
            {isAdmin && <AdminPanel user={user} />}
            {!isAdmin && <PartnerPanel user={user} />}
          </section>

          <section id="service-portal">
            <ServicePortal />
          </section>
        </main>
      </div>
    </div>
  )
}
