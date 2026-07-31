import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { api } from '../lib/api.js'
import { clearProfilePhoto, clearSession, getProfilePhoto, getSession, isAuthenticated, saveProfilePhoto } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { Link, navigate } from '../lib/router.jsx'
import { Activity, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, ExternalLink, FileText, History, IdCard, Image as ImageIcon, Layers3, LayoutDashboard, LogOut, MapPin, RefreshCw, ShieldCheck, Upload, User, Users } from 'lucide-react'
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

function getUserLocationDetails(user) {
  if (!user) return 'Not available'
  const parts = []
  if (user.village) parts.push(`Village: ${user.village}`)
  if (user.taluk) parts.push(`Taluk: ${user.taluk}`)
  if (user.district) parts.push(`District: ${user.district}`)
  if (user.state) parts.push(`State: ${user.state}`)

  if (parts.length > 0) return parts.join(' • ')
  if (user.geoUnit?.name) return `Assigned Jurisdiction: ${user.geoUnit.name}`
  return roleScopeLabels[user.role] || 'Assigned Jurisdiction'
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
  return <section className={`w-full min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>{children}</section>
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

function StatCard({ icon: Icon, label, loading, subtitle = 'Live Metric', tone = 'blue', value }) {
  const tones = {
    blue: {
      cardBorder: 'hover:border-blue-500/50',
      gradientTop: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500',
      iconBox: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25',
      badge: 'bg-blue-50 text-blue-700 ring-blue-200/80',
    },
    amber: {
      cardBorder: 'hover:border-amber-500/50',
      gradientTop: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500',
      iconBox: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
      badge: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    },
    rose: {
      cardBorder: 'hover:border-rose-500/50',
      gradientTop: 'bg-gradient-to-r from-rose-500 via-pink-600 to-red-500',
      iconBox: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25',
      badge: 'bg-rose-50 text-rose-800 ring-rose-200/80',
    },
    green: {
      cardBorder: 'hover:border-emerald-500/50',
      gradientTop: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-500',
      iconBox: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    },
  }

  const t = tones[tone] || tones.blue

  return (
    <div className={`group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${t.cardBorder}`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${t.gradientTop}`} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">{loading ? '-' : value}</p>
        </div>
        <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${t.iconBox}`}>
          <Icon size={24} />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold ring-1 ${t.badge}`}>
          {subtitle}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{children}</p>
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
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard', description: 'Summary & Forms' },
    { id: 'work-panel', icon: BriefcaseBusiness, label: 'Work Panel', description: 'Admin or partner' },
    { id: 'check-status', icon: ClipboardCheck, label: 'Check Status', description: 'Track request' },
  ]

  const profilePhoto = getProfilePhoto(user)

  return (
    <aside className={`sticky top-0 h-screen shrink-0 border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 flex flex-col justify-between overflow-y-auto ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}>
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
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
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="mt-4 flex-1">
          <nav className="grid gap-1.5">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const commonClasses = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#007cba] text-white shadow-md shadow-[#007cba]/20 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`

              return (
                <button
                  className={commonClasses}
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                >
                  <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-300'}`}>
                    <Icon size={16} />
                  </span>
                  <span className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                    <span className="block text-sm leading-tight">{item.label}</span>
                    <span className={`block text-[11px] font-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{item.description}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer User & Dedicated Profile Update Button */}
        <div className="mt-auto border-t border-slate-800 pt-4">
          <div className={`flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 ${collapsed ? 'lg:items-center' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 ring-2 ring-slate-700">
                {profilePhoto ? (
                  <img alt="" className="h-full w-full object-cover" src={profilePhoto} />
                ) : (
                  <span className="text-xs font-bold text-white">{getUserInitials(user)}</span>
                )}
              </div>
              <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm font-bold text-white">{getUserDisplayName(user)}</p>
                <p className="truncate text-xs text-slate-400">{roleLabels[user?.role] || user?.role}</p>
              </div>
              <button
                aria-label="Logout"
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition hover:bg-rose-600 hover:text-white ${
                  collapsed ? 'lg:hidden' : ''
                }`}
                onClick={onLogout}
                type="button"
              >
                <LogOut size={15} />
              </button>
            </div>

            <button
              className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#007cba] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#006090] ${
                collapsed ? 'w-full lg:px-0' : 'w-full'
              }`}
              onClick={() => onNavigate('profile-image')}
              type="button"
            >
              <User size={14} />
              <span className={collapsed ? 'lg:hidden' : ''}>Profile Update</span>
            </button>
          </div>
        </div>
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
    <section id="profile-image" className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Profile Settings</p>
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
  const [appNo, setAppNo] = useState('')
  const [appPhone, setAppPhone] = useState('')
  const [appTracking, setAppTracking] = useState(null)
  const [appLoading, setAppLoading] = useState(false)

  const [reqNo, setReqNo] = useState('')
  const [reqPhone, setReqPhone] = useState('')
  const [reqTracking, setReqTracking] = useState(null)
  const [reqLoading, setReqLoading] = useState(false)

  const { notify } = useNotifications()

  async function handleAppTrack(e) {
    e.preventDefault()
    if (!appNo.trim()) {
      notify({ type: 'warning', title: 'Number Required', message: 'Application number உள்ளிடவும்.' })
      return
    }
    try {
      setAppLoading(true)
      setAppTracking(null)
      const res = await api.get('/applications/track', { params: { applicationNo: appNo.trim(), ...(appPhone ? { phone: appPhone } : {}) } })
      setAppTracking(res.data.tracking)
      notify({ type: 'success', title: 'Status Found', message: 'விண்ணப்ப நிலை கீழே காட்டப்பட்டுள்ளது.', popup: false })
    } catch (err) {
      notify({ type: 'error', title: 'Not Found', message: err.response?.data?.message || 'Application status கிடைக்கவில்லை.' })
    } finally {
      setAppLoading(false)
    }
  }

  async function handleReqTrack(e) {
    e.preventDefault()
    if (!reqNo.trim()) {
      notify({ type: 'warning', title: 'Number Required', message: 'Signup request number உள்ளிடவும்.' })
      return
    }
    try {
      setReqLoading(true)
      setReqTracking(null)
      const res = await api.get('/auth/signup-requests/track', { params: { requestNo: reqNo.trim(), ...(reqPhone ? { phone: reqPhone } : {}) } })
      setReqTracking(res.data.tracking)
      notify({ type: 'success', title: 'Status Found', message: 'பதிவு கோரிக்கை நிலை கீழே காட்டப்பட்டுள்ளது.', popup: false })
    } catch (err) {
      notify({ type: 'error', title: 'Not Found', message: err.response?.data?.message || 'Signup request status கிடைக்கவில்லை.' })
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Widget 1: Application Tracker */}
      <Panel>
        <PanelHeader eyebrow="Application Tracker" title="Track Application Status / விண்ணப்ப நிலை" />
        <div className="grid gap-4 p-4 sm:p-5">
          <form className="grid gap-4" onSubmit={handleAppTrack}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Application Number / விண்ணப்ப எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]"
                onChange={(e) => setAppNo(e.target.value)}
                placeholder="e.g. TNW-20260729-0001"
                value={appNo}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Registered Mobile Number / அலைபேசி எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]"
                onChange={(e) => setAppPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 digit mobile number"
                value={appPhone}
              />
            </label>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007cba] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090]"
              disabled={appLoading}
              type="submit"
            >
              <ClipboardCheck size={16} />
              {appLoading ? 'Checking...' : 'Track Application / நிலை அறிய'}
            </button>
          </form>

          {/* Results Box at Bottom of Widget 1 */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            {appTracking ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Application No', appTracking.applicationNo],
                  ['Form Title', appTracking.tamilFormTitle || appTracking.formTitle],
                  ['Applicant', appTracking.applicantName || '-'],
                  ['Status', appTracking.status],
                  ['Payment Reference', appTracking.paymentReference || '-'],
                  ['Last Updated', formatDate(appTracking.updatedAt)],
                ].map(([lbl, val]) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={lbl}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{lbl}</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center">Enter application number above to view status.</p>
            )}
          </div>
        </div>
      </Panel>

      {/* Widget 2: Signup Tracker */}
      <Panel>
        <PanelHeader eyebrow="Signup Tracker" title="Track Signup Request Status / பதிவு கோரிக்கை நிலை" />
        <div className="grid gap-4 p-4 sm:p-5">
          <form className="grid gap-4" onSubmit={handleReqTrack}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Signup Request Number / பதிவு கோரிக்கை எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]"
                onChange={(e) => setReqNo(e.target.value)}
                placeholder="e.g. TNSU-20260729-0001"
                value={reqNo}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Registered Mobile Number / அலைபேசி எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#007cba]"
                onChange={(e) => setReqPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 digit mobile number"
                value={reqPhone}
              />
            </label>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-[#f78a0c]"
              disabled={reqLoading}
              type="submit"
            >
              <ClipboardCheck size={16} />
              {reqLoading ? 'Checking...' : 'Track Signup Status / நிலை அறிய'}
            </button>
          </form>

          {/* Results Box at Bottom of Widget 2 */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            {reqTracking ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Request No', reqTracking.requestNo],
                  ['Requested Role', roleLabels[reqTracking.requestedRole] || reqTracking.requestedRole],
                  ['Status', reqTracking.status],
                  ['Reason', reqTracking.reason || '-'],
                  ['Created At', formatDate(reqTracking.createdAt)],
                  ['Reviewed At', formatDate(reqTracking.reviewedAt)],
                ].map(([lbl, val]) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={lbl}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{lbl}</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center">Enter signup request number above to view status.</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
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

function MetricCardsBar({ isAdmin, loading, signupRequests, submissions }) {
  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])

  const stats = useMemo(() => {
    if (isAdmin) {
      const pendingReview = submissions.filter((submission) => ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
      const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
      const returned = submissions.filter((submission) => submission.status === 'NEEDS_CORRECTION').length
      return [
        ['Pending Signups', pendingRequests.length, Users, 'amber', 'Requires Review'],
        ['Applications to Review', pendingReview, Activity, 'blue', 'Action Needed'],
        ['Returned Applications', returned, ClipboardCheck, 'rose', 'Needs Fix'],
        ['Approved Applications', approved, BadgeCheck, 'green', 'Completed'],
      ]
    } else {
      const needsCorrection = submissions.filter((submission) => ['NEEDS_CORRECTION', 'REJECTED'].includes(submission.status)).length
      const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
      const inProgress = submissions.filter((submission) => ['DRAFT', 'SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)).length
      return [
        ['My Applications', submissions.length, FileText, 'blue', 'Total Submitted'],
        ['In Progress', inProgress, Activity, 'amber', 'Under Review'],
        ['Needs Correction', needsCorrection, ClipboardCheck, 'rose', 'Action Required'],
        ['Approved Applications', approved, BadgeCheck, 'green', 'Verified'],
      ]
    }
  }, [isAdmin, pendingRequests.length, submissions])

  return (
    <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value, Icon, tone, subtitle]) => (
        <StatCard icon={Icon} key={label} label={label} loading={loading} subtitle={subtitle} tone={tone} value={value} />
      ))}
    </div>
  )
}

function OverviewWorkPanels({ isAdmin, loading, onNavigateWorkPanel, signupRequests, submissions }) {
  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])
  const recentSignups = useMemo(() => pendingRequests.slice(0, 5), [pendingRequests])
  const recentSubmissions = useMemo(() => submissions.slice(0, 5), [submissions])

  if (!isAdmin) {
    return (
      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007cba] hover:underline" onClick={onNavigateWorkPanel} type="button">
              View All Applications <ArrowRight size={14} />
            </button>
          }
          eyebrow="Recent Work"
          title="Recent Applications (Latest 5)"
        />
        <div className="grid gap-3 p-4 sm:p-5">
          {recentSubmissions.length ? (
            recentSubmissions.map((submission) => (
              <div className="rounded-xl border border-slate-200 p-3" key={submission.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-slate-950">{submission.applicationNo}</p>
                    <p className="mt-1 text-sm text-slate-600">{submission.form?.tamilTitle || submission.form?.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(submission.updatedAt)}</p>
                  </div>
                  <StatusPill status={submission.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState>No applications submitted yet.</EmptyState>
          )}
        </div>
      </Panel>
    )
  }

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-2">
      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#007cba] hover:underline" onClick={onNavigateWorkPanel} type="button">
              Work Panel ({pendingRequests.length}) <ArrowRight size={14} />
            </button>
          }
          eyebrow="Signup Approval"
          title="User Signup Requests (Recent 5)"
        />
        <div className="grid gap-3 p-4 sm:p-5">
          {recentSignups.length ? (
            recentSignups.map((request) => (
              <div className="rounded-xl border border-slate-200 p-3.5" key={request.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{request.fullName}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{request.requestNo} • {roleLabels[request.requestedRole] || request.requestedRole}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{request.district} | {request.taluk} | {request.village}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">Pending</span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState>No pending signup requests for your scope.</EmptyState>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#007cba] hover:underline" onClick={onNavigateWorkPanel} type="button">
              Work Panel <ArrowRight size={14} />
            </button>
          }
          eyebrow="Work Queue"
          title="Applications Queue (Recent 5)"
        />
        <div className="grid gap-3 p-4 sm:p-5">
          {recentSubmissions.length ? (
            recentSubmissions.map((submission) => (
              <div className="rounded-xl border border-slate-200 p-3.5" key={submission.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-slate-950">{submission.applicationNo}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{submission.form?.tamilTitle || submission.form?.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{submission.user?.firstName || submission.user?.username || 'Applicant'}</p>
                  </div>
                  <StatusPill status={submission.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState>No applications found.</EmptyState>
          )}
        </div>
      </Panel>
    </div>
  )
}

function FullWorkPanel({ isAdmin, loading, onRefresh, signupRequests, submissions }) {
  const [selectedSignup, setSelectedSignup] = useState(null)
  const [reviewReason, setReviewReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const { notify } = useNotifications()

  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])

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
      await onRefresh?.()
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
      await onRefresh?.()
    } catch (error) {
      notify({ type: 'error', title: 'Review Failed', message: error.response?.data?.message || 'Application review could not be updated.' })
    }
  }

  if (!isAdmin) {
    return (
      <Panel>
        <PanelHeader eyebrow="Work Panel" title="All My Submitted Applications" />
        <div className="grid gap-3 p-4 sm:p-5">
          {submissions.length ? submissions.map((submission) => (
            <div className="rounded-xl border border-slate-200 p-4" key={submission.id}>
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
    )
  }

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-2">
      <Panel>
        <PanelHeader
          action={<span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{pendingRequests.length} pending</span>}
          eyebrow="Signup Approval"
          title="All User Signup Requests"
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
        <PanelHeader eyebrow="Work Queue" title="All Applications Review Queue" />
        <div className="grid gap-3 p-4 sm:p-5">
          {submissions.length ? submissions.map((submission) => (
            <div className="rounded-xl border border-slate-200 p-3.5" key={submission.id}>
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
    </div>
  )
}

export default function DashboardPage() {
  if (!isAuthenticated()) return <AuthRequired />
  const user = getSession()?.user
  const isAdmin = adminRoles.has(user?.role)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard-overview')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(() => getProfilePhoto(user))

  const [signupRequests, setSignupRequests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        const [signupResponse, submissionResponse] = await Promise.all([
          api.get('/auth/signup-requests'),
          api.get('/applications/submissions'),
        ])
        setSignupRequests(signupResponse.data.requests || [])
        setSubmissions(submissionResponse.data.submissions || [])
      } else {
        const response = await api.get('/applications/submissions')
        setSubmissions(response.data.submissions || [])
      }
    } catch (error) {
      notify({
        type: 'error',
        title: 'Dashboard Load Failed',
        message: error.response?.data?.message || 'Dashboard details could not be loaded.',
      })
    } finally {
      setLoading(false)
    }
  }, [isAdmin, notify])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

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
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:flex-row">
      <DashboardSidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        onLogout={handleLogout}
        onNavigate={(tabId) => setActiveTab(tabId)}
        user={user}
      />

      <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto p-3 sm:p-5 lg:h-screen lg:p-6 xl:p-8">
        {activeTab === 'dashboard-overview' && (
          <>
            {/* Header Banner */}
            <section id="dashboard-overview" className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">User Dashboard / பயனர் டாஷ்போர்டு</p>
                  <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">My Dashboard</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Welcome back, <span className="font-bold text-slate-900">{getUserDisplayName(user)}</span> ({roleLabels[user?.role] || user?.role}).
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                    <MapPin size={14} className="text-[#007cba]" />
                    <span>{getUserLocationDetails(user)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xs" onClick={() => loadDashboard()} type="button">
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* 1. METRICS / STAT CARDS BAR FIRST */}
            <section id="dashboard-metrics" className="w-full">
              <MetricCardsBar
                isAdmin={isAdmin}
                loading={loading}
                signupRequests={signupRequests}
                submissions={submissions}
              />
            </section>

            {/* 2. SELECTABLE APPLICATION FORMS QUICK BAR SECOND */}
            <Panel>
              <PanelHeader
                eyebrow="Application Forms / விண்ணப்பப் படிவங்கள்"
                title="Select Application Form / விண்ணப்பத்தை தேர்வு செய்க"
              />
              <div className="grid w-full gap-3 p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {applicationForms.map((form) => (
                  <Link
                    className="group flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-[#007cba] hover:bg-[#eef8ff]/40 hover:shadow-md"
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

            {/* 3. WORK PANELS / REVIEW QUEUES THIRD (RECENT 5 ITEMS ONLY) */}
            <section id="dashboard-work" className="w-full space-y-6">
              <OverviewWorkPanels
                isAdmin={isAdmin}
                loading={loading}
                onNavigateWorkPanel={() => setActiveTab('work-panel')}
                signupRequests={signupRequests}
                submissions={submissions}
              />
            </section>
          </>
        )}

        {activeTab === 'work-panel' && (
          <FullWorkPanel
            isAdmin={isAdmin}
            loading={loading}
            onRefresh={loadDashboard}
            signupRequests={signupRequests}
            submissions={submissions}
          />
        )}

        {activeTab === 'profile-image' && (
          <UserImageCard onProfilePhotoChange={setProfilePhotoUrl} user={user} />
        )}

        {activeTab === 'check-status' && (
          <section id="check-status">
            <CheckStatusPanel />
          </section>
        )}
      </main>
    </div>
  )
}
