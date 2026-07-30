import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { api } from '../lib/api.js'
import { clearSession, getSession, isAuthenticated } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { Link, navigate } from '../lib/router.jsx'
import { Activity, BadgeCheck, BriefcaseBusiness, ChevronLeft, ChevronRight, ClipboardCheck, FileText, History, Layers3, LayoutDashboard, LogOut, RefreshCw, ShieldCheck, Upload, User, Users } from 'lucide-react'
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
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard', description: 'Summary' },
    { id: 'profile-image', icon: User, label: 'Profile Update', description: 'Upload image' },
    { id: 'service-portal', icon: FileText, label: 'Application', description: 'Open forms' },
    { to: '/tracking', icon: ClipboardCheck, label: 'Check Status', description: 'Track request' },
  ]

  return (
    <aside className={`sticky top-4 self-start overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${collapsed ? 'lg:w-24' : 'lg:w-80'}`}>
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
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-950">
            {getUserInitials(user)}
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

function UserImageCard({ user }) {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function openPicker() {
    inputRef.current?.click()
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
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
      setSignupRequests(signupResponse.data.requests || [])
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
  const activeRecentUsers = (overview?.users?.recent || []).filter((recentUser) => recentUser.isActive)

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
          <PanelHeader eyebrow="Access" title="Active Users & Activity" />
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {(overview?.users?.byRole || []).map((item) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={item.role}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{roleLabels[item.role] || item.role}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{item.count}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto px-4 pb-4 sm:px-5 sm:pb-5">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Scope</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last Login</th>
                  <th className="px-3 py-3">Latest Activity</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {activeRecentUsers.map((recentUser) => (
                  <tr className="border-b border-slate-100" key={recentUser.id}>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-950">{recentUser.username}</p>
                      <p className="text-xs text-slate-500">{recentUser.email}</p>
                    </td>
                    <td className="px-3 py-3">{roleLabels[recentUser.role] || recentUser.role}</td>
                    <td className="px-3 py-3">{recentUser.scope?.name || 'All Tamil Nadu'}</td>
                    <td className="px-3 py-3"><StatusPill status={recentUser.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-3 py-3">{formatDate(recentUser.lastLoginAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-800">{recentUser.latestActivity?.label || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(recentUser.latestActivity?.at)}</p>
                    </td>
                    <td className="px-3 py-3">{formatDate(recentUser.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!activeRecentUsers.length && <EmptyState>No active users found.</EmptyState>}
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
        <Panel>
          <PanelHeader eyebrow="Approvals" title="Signup Approvals" />
          <div className="grid gap-3 p-4 sm:p-5">
            {signupRequests.length ? signupRequests.map((request) => (
              <div className="rounded-lg border border-slate-200 p-3" key={request.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{request.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{request.phone} - {request.email}</p>
                    <p className="mt-1 text-sm text-slate-600">{roleLabels[request.requestedRole] || request.requestedRole} - {request.scope?.name || request.village || request.taluk || request.district}</p>
                  </div>
                  <StatusPill status={request.status} />
                </div>
                <SignupRejectedHistory history={request.rejectedHistory} />
                {request.status === 'PENDING' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewSignup(request, 'APPROVED')} type="button">Approve</button>
                    <button className="rounded-md bg-rose-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewSignup(request, 'REJECTED')} type="button">Reject</button>
                  </div>
                )}
              </div>
            )) : (
              <EmptyState>No signup requests found.</EmptyState>
            )}
          </div>
        </Panel>
      )}

      {activeSection === 'applications' && (
        <Panel>
          <PanelHeader eyebrow="Review Queue" title="Application Review" />
          <div className="grid gap-3 p-4 sm:p-5">
            {submissions.length ? submissions.map((submission) => (
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

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    navigate('/login')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 px-3 py-4 text-slate-900 sm:px-5 sm:py-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
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

          <UserImageCard user={user} />

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
