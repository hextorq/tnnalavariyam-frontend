import AuthRequired from '../components/AuthRequired.jsx'
import { DashboardSkeleton } from '../components/SkeletonLoader.jsx'
import { STATUS_META } from '../constants/statusMeta.js'
import { bilingualName, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import NewApplicationList from './NewApplicationList.jsx'
import { api } from '../lib/api.js'
import { clearProfilePhoto, clearSession, getProfilePhoto, getSession, isAuthenticated, saveProfilePhoto, updateSessionUser } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { navigate } from '../lib/router.jsx'
import { transliterateTamil } from '../lib/tamilTransliteration.js'
import { Activity, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Download, ExternalLink, Eye, EyeOff, FilePlus2, FileText, History, IdCard, Image as ImageIcon, Layers3, LayoutDashboard, LoaderCircle, LogOut, MapPin, Menu, ReceiptText, RefreshCw, Search, ShieldCheck, Upload, User, UserPlus, Users, X } from 'lucide-react'
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

function downloadImage(src, filename) {
  if (!src) return
  const link = document.createElement('a')
  link.href = src
  link.download = filename || 'document.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getUploadUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  const apiBase = api.defaults.baseURL || 'https://git-pipeline.metatronhost.in/tnnalavariyam/api'
  const cleanBase = apiBase.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/?(api\/)?/, '')
  return `${cleanBase}/${cleanPath}`
}

function getUserLocationDetails(user) {
  if (!user) return 'Not available'
  const parts = []
  if (user.state) parts.push(`State: ${user.state}`)
  if (user.district) parts.push(`District: ${user.district}`)
  if (user.taluk) parts.push(`Taluk: ${user.taluk}`)
  if (user.village) parts.push(`Village: ${user.village}`)

  if (parts.length > 0) return parts.join(' • ')
  if (user.scope?.name) return `Scope: ${user.scope.name}`
  return roleScopeLabels[user.role] || 'Assigned Jurisdiction'
}

function getJurisdictionName(user) {
  if (!user) return 'Tamil Nadu'
  const isPlaceholder = (value) => !value || value.startsWith('All ') || value.startsWith('Assigned ')
  if (!isPlaceholder(user.village)) return user.village
  if (!isPlaceholder(user.taluk)) return user.taluk
  if (!isPlaceholder(user.district)) return user.district
  return user.state || user.scope?.name || 'Tamil Nadu'
}

function StatusPill({ status }) {
  const meta = STATUS_META[status]
  const cls = meta?.cls || 'bg-amber-50 text-amber-800 ring-amber-200'

  return (
    <span className={`inline-flex flex-col items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-tight ring-1 ${cls}`}>
      <span>{meta?.en || status || '-'}</span>
      {meta?.ta && <span className="text-[9px] font-semibold opacity-80">{meta.ta}</span>}
    </span>
  )
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

function StatCard({ icon: Icon, label, loading, onClick, subtitle = 'Live Metric', tone = 'blue', value }) {
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
    slate: {
      cardBorder: 'hover:border-slate-400/50',
      gradientTop: 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400',
      iconBox: 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md shadow-slate-400/25',
      badge: 'bg-slate-100 text-slate-700 ring-slate-200/80',
    },
    cyan: {
      cardBorder: 'hover:border-cyan-500/50',
      gradientTop: 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500',
      iconBox: 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-md shadow-cyan-500/25',
      badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200/80',
    },
    indigo: {
      cardBorder: 'hover:border-indigo-500/50',
      gradientTop: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500',
      iconBox: 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25',
      badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/80',
    },
    violet: {
      cardBorder: 'hover:border-violet-500/50',
      gradientTop: 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500',
      iconBox: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25',
      badge: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    },
  }

  const t = tones[tone] || tones.blue

  const body = (
    <>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${t.gradientTop}`} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">{loading ? '-' : value}</p>
        </div>
        <span className={`inline-flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${t.iconBox}`}>
          <Icon size={22} />
        </span>
      </div>

      <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-bold ring-1 ${t.badge}`}>
          {subtitle}
        </span>
        {onClick && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007cba] opacity-0 transition group-hover:opacity-100">
            View <ArrowRight size={11} />
          </span>
        )}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        className={`group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${t.cardBorder}`}
        onClick={onClick}
        type="button"
      >
        {body}
      </button>
    )
  }

  return (
    <div className={`group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${t.cardBorder}`}>
      {body}
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{children}</p>
}

function formatGeoType(type) {
  const labels = {
    STATE: 'State / மாநிலம்',
    DISTRICT: 'District / மாவட்டம்',
    TALUK: 'Taluk / தாலுகா',
    VILLAGE: 'Village / கிராமம்',
  }
  return labels[type] || type || 'Scope'
}

function collectHierarchyNodes(nodes = []) {
  const result = []
  function walk(node, parents = []) {
    result.push({ node, parents })
    ;(node.children || []).forEach((child) => walk(child, [...parents, node]))
  }
  nodes.forEach((node) => walk(node))
  return result
}

function getStatusSummary(counts = {}) {
  return Object.entries(counts.byStatus || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
}

function hierarchyNodeLabel(node) {
  if (!node) return ''
  const tamilName = String(node.tamilName || node.name || '').trim()
  const englishName = String(node.englishName || '').trim() || transliterateTamil(tamilName)
  return englishName && englishName !== tamilName ? `${tamilName} / ${englishName}` : tamilName
}

function getApplicationCount(item) {
  return Number(item?.counts?.applications?.total ?? item?.applications?.total ?? 0)
}

function compareApplicationCount(first, second, sortOrder) {
  const countResult = getApplicationCount(first) - getApplicationCount(second)
  const nameA = hierarchyNodeLabel(first) || first?.name || first?.username || first?.applicationNo || ''
  const nameB = hierarchyNodeLabel(second) || second?.name || second?.username || second?.applicationNo || ''
  const nameResult = nameA.localeCompare(nameB, 'ta-IN', { numeric: true, sensitivity: 'base' })
  const result = countResult || nameResult
  return sortOrder === 'asc' ? result : -result
}

function getSubmissionSourceHierarchy(submission) {
  const applicantData = submission?.applicantData || {}
  const nodes = []
  let current = submission?.geoUnit || submission?.user?.scope || null
  while (current) {
    nodes.push(current)
    current = current.parent || null
  }

  const byType = nodes.reduce((acc, node) => {
    if (node?.type) acc[node.type] = hierarchyNodeLabel(node)
    return acc
  }, {})

  return {
    district: applicantData.district || byType.DISTRICT || '',
    taluk: applicantData.taluk || applicantData.talukName || byType.TALUK || '',
    village: applicantData.village || applicantData.villageName || byType.VILLAGE || '',
    partner: submission?.user?.firstName || submission?.user?.username || '',
  }
}

function SubmissionSourceLine({ submission }) {
  const source = getSubmissionSourceHierarchy(submission)
  const items = [
    ['District', source.district],
    ['Taluk', source.taluk],
    ['Village', source.village],
    ['Partner', source.partner],
  ].filter(([, value]) => value)

  if (!items.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
      {items.map(([label, value]) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200" key={label}>
          {label}: <span className="font-bold text-slate-800">{value}</span>
        </span>
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

function DashboardSidebar({ activeTab, collapsed, onCollapseToggle, onNavigate, user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdminUser = adminRoles.has(user?.role)
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'work-panel', icon: BriefcaseBusiness, label: 'Applications' },
    ...(isAdminUser ? [{ id: 'signup-queue', icon: UserPlus, label: 'Signup Requests' }] : []),
    { id: 'check-status', icon: ClipboardCheck, label: 'Check Status' },
    { id: 'payment-receipt', icon: ReceiptText, label: 'Payment Receipt' },
    { id: 'profile-image', icon: User, label: 'Profile' },
  ]

  function handleSelectTab(tabId) {
    onNavigate(tabId)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#007cba]">TN NALAVARIYAM</p>
          <p className="text-sm font-bold text-white truncate">{getUserDisplayName(user)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-slate-300 ring-1 ring-slate-800"
            onClick={() => setMobileOpen((prev) => !prev)}
            type="button"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white lg:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#007cba]">TN NALAVARIYAM</p>
              <p className="text-lg font-bold text-white">Menu Navigation</p>
            </div>
            <button className="rounded-xl bg-slate-900 p-2 text-slate-400" onClick={() => setMobileOpen(false)} type="button">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="grid gap-2">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    className={`flex items-center gap-3 rounded-2xl p-4 text-left font-bold transition ${isActive ? 'bg-[#007cba] text-white shadow-lg' : 'bg-slate-900 text-slate-300'
                      }`}
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    type="button"
                  >
                    <Icon size={20} />
                    <p className="text-base">{item.label}</p>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Docked Sidebar */}
      <aside className={`hidden lg:flex sticky top-0 h-screen shrink-0 border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 flex-col justify-between overflow-y-auto ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex flex-col flex-1 p-4">
          <div className={`flex items-center gap-3 border-b border-slate-800 pb-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#007cba]">TN NALAVARIYAM</p>
                <p className="mt-0.5 text-lg font-bold leading-tight text-white">Menu</p>
              </div>
            )}
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
            <nav className="grid gap-2">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                if (collapsed) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      title={item.label}
                      type="button"
                      className={`flex size-10 items-center justify-center rounded-xl mx-auto transition ${isActive ? 'bg-[#007cba] text-white shadow-md shadow-[#007cba]/20 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                    >
                      <Icon size={18} />
                    </button>
                  )
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    type="button"
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${isActive ? 'bg-[#007cba] text-white shadow-md shadow-[#007cba]/20 font-bold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                  >
                    <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800 text-slate-300'}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                    <span className="block text-sm leading-tight">{item.label}</span>
                  </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}

function ProfileField({ label, onChange, placeholder, required, type = 'text', value }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="min-w-0 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}

function UserImageCard({ onProfilePhotoChange, onUserUpdated, user }) {
  const inputRef = useRef(null)
  const { notify } = useNotifications()
  const [previewUrl, setPreviewUrl] = useState(() => getProfilePhoto(user))
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine: user?.addressLine || '',
    state: user?.state || 'Tamil Nadu',
    district: user?.district || '',
    taluk: user?.taluk || '',
    village: user?.village || '',
    pincode: user?.pincode || '',
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    setPreviewUrl(getProfilePhoto(user))
  }, [user])

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      addressLine: user?.addressLine || '',
      state: user?.state || 'Tamil Nadu',
      district: user?.district || '',
      taluk: user?.taluk || '',
      village: user?.village || '',
      pincode: user?.pincode || '',
    })
  }, [user])

  function setProfileField(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  function setPasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png']

    if (!allowedTypes.includes(file.type?.toLowerCase()) && !allowedExtensions.includes(ext)) {
      notify({
        type: 'error',
        title: 'Invalid Image Format / தவறான படம்',
        message: 'JPEG (.jpg, .jpeg) அல்லது PNG (.png) படங்கள் மட்டுமே ஏற்றுக் கொள்ளப்படும்.',
      })
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      notify({
        type: 'error',
        title: 'File Size Exceeded / அளவு பெரியது',
        message: 'புகைப்படத்தின் அளவு 2 MB-க்குள் மட்டுமே இருக்க வேண்டும்.',
      })
      event.target.value = ''
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

  async function handleSaveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    try {
      const payload = {}
      for (const [key, value] of Object.entries(profileForm)) {
        if (String(value || '').trim()) payload[key] = String(value).trim()
      }
      const response = await api.patch('/auth/profile', payload)
      const updatedUser = response.data.user
      if (updatedUser) {
        updateSessionUser(updatedUser)
        onUserUpdated?.(updatedUser)
      }
      notify({
        type: 'success',
        title: 'Profile Updated / சுயவிவரம் புதுப்பிக்கப்பட்டது',
        message: response.data.message,
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Update Failed / புதுப்பிக்க முடியவில்லை',
        message: error.response?.data?.message || 'சுயவிவரம் புதுப்பிக்க முடியவில்லை. / Profile could not be updated.',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault()
    setSavingPassword(true)
    try {
      await api.patch('/auth/profile/password', passwordForm)
      notify({
        type: 'success',
        title: 'Password Changed / கடவுச்சொல் மாற்றப்பட்டது',
        message: 'உங்கள் கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது. / Your password was changed successfully.',
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Password Change Failed / கடவுச்சொல் மாற்ற முடியவில்லை',
        message: error.response?.data?.message || 'கடவுச்சொல் மாற்ற முடியவில்லை. / Password could not be changed.',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const passwordInputClass =
    'min-w-0 w-full rounded-lg border border-neutral-300 py-3 pl-4 pr-11 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20'

  function PasswordField({ field, label, show, onToggleShow }) {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="relative block">
          <input
            className={passwordInputClass}
            minLength={6}
            onChange={(e) => setPasswordField(field, e.target.value)}
            placeholder="••••••••"
            required
            type={show ? 'text' : 'password'}
            value={passwordForm[field]}
          />
          <button
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onToggleShow()}
            type="button"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </label>
    )
  }

  return (
    <section id="profile-image" className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Profile Management / சுயவிவர மேலாண்மை</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">Edit Profile Details / சுயவிவர விவரங்கள்</h2>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
          onClick={openPicker}
          type="button"
        >
          <Upload size={16} />
          Choose Photo / படம் தேர்ந்தெடுக்க
        </button>
      </div>

      <div className="grid gap-6 sm:gap-8 p-4 sm:p-8 lg:grid-cols-[220px_minmax(0,1fr)] items-start">
        <input ref={inputRef} accept="image/jpeg,image/png" className="sr-only" onChange={handleFileChange} type="file" />

        {/* Passport Photo Frame Box */}
        <div className="flex flex-col items-center gap-3 mx-auto lg:mx-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 w-full mb-1">
            <span className="font-bold text-amber-700 shrink-0">⚠️ Disclaimer / குறிப்பு:</span>
            <span>JPEG/PNG only. Max 2 MB.</span>
          </div>
          <div className="relative h-64 w-52 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-slate-950 shadow-xl ring-4 ring-emerald-500/10">
            {previewUrl ? (
              <img alt="User profile preview" className="h-full w-full object-cover" src={previewUrl} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-slate-400">
                <Camera className="text-[#007cba]" size={40} />
                <p className="mt-2 text-xs font-bold text-white">{getUserDisplayName(user)}</p>
                <p className="mt-1 text-[11px] text-slate-400">No Custom Photo</p>
              </div>
            )}
            <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-emerald-600 py-1 text-center text-[10px] font-bold text-white shadow-md">
              ✓ Active Profile Photo
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 text-center">3:4 Passport Portrait Frame</p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-[#f78a0c]"
              onClick={openPicker}
              type="button"
            >
              <Upload size={14} />
              Upload New Photo / புதிய புகைப்படம்
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-950"
              onClick={clearImage}
              type="button"
            >
              Reset / மீட்டமை
            </button>
          </div>
        </div>

        <div className="grid content-start gap-6">
          <form className="grid gap-6" onSubmit={handleSaveProfile}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Information / கணக்கு தகவல்</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Username / பயனர் பெயர்</p>
                  <p className="truncate text-sm font-bold text-slate-900">{user?.username || '-'}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Email / மின்னஞ்சல்</p>
                  <p className="truncate text-sm font-bold text-slate-900">{user?.email || '-'}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Role / பதவி</p>
                  <p className="truncate text-sm font-bold text-[#007cba]">{roleLabels[user?.role] || user?.role || '-'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal Details / தனிப்பட்ட விவரங்கள்</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProfileField
                  label="Full Name / முழு பெயர்"
                  onChange={(e) => setProfileField('fullName', e.target.value)}
                  placeholder="உங்கள் முழு பெயர்"
                  required
                  value={profileForm.fullName}
                />
                <ProfileField
                  label="Phone Number / அலைபேசி எண்"
                  onChange={(e) => setProfileField('phone', normalizePhone(e.target.value))}
                  placeholder="10 digit mobile number"
                  required
                  type="tel"
                  value={profileForm.phone}
                />
                <ProfileField
                  label="Address / முகவரி"
                  onChange={(e) => setProfileField('addressLine', e.target.value)}
                  placeholder="வீட்டு முகவரி"
                  value={profileForm.addressLine}
                />
                <ProfileField
                  label="State / மாநிலம்"
                  onChange={(e) => setProfileField('state', e.target.value)}
                  placeholder="Tamil Nadu"
                  value={profileForm.state}
                />
                <ProfileField
                  label="District / மாவட்டம்"
                  onChange={(e) => setProfileField('district', e.target.value)}
                  placeholder="மாவட்டம்"
                  value={profileForm.district}
                />
                <ProfileField
                  label="Taluk / தாலுகா"
                  onChange={(e) => setProfileField('taluk', e.target.value)}
                  placeholder="தாலுகா"
                  value={profileForm.taluk}
                />
                <ProfileField
                  label="Village / கிராமம்"
                  onChange={(e) => setProfileField('village', e.target.value)}
                  placeholder="கிராமம்"
                  value={profileForm.village}
                />
                <ProfileField
                  label="Pincode / அஞ்சல் குறியீடு"
                  onChange={(e) => setProfileField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit pincode"
                  type="tel"
                  value={profileForm.pincode}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007cba] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090] disabled:opacity-50"
                  disabled={savingProfile}
                  type="submit"
                >
                  {savingProfile ? <LoaderCircle className="animate-spin" size={17} /> : null}
                  {savingProfile ? 'Saving...' : 'Save Changes / மாற்றங்களை சேமிக்கவும்'}
                </button>
              </div>
            </div>
          </form>

          <form className="grid gap-6" onSubmit={handleChangePassword}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Change Password / கடவுச்சொல்லை மாற்றவும்</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <PasswordField field="currentPassword" label="Current Password / தற்போதைய கடவுச்சொல்" onToggleShow={() => setShowCurrent((v) => !v)} show={showCurrent} />
                <PasswordField field="newPassword" label="New Password / புதிய கடவுச்சொல்" onToggleShow={() => setShowNew((v) => !v)} show={showNew} />
                <PasswordField field="confirmPassword" label="Confirm Password / மீண்டும் புதிய கடவுச்சொல்" onToggleShow={() => setShowConfirm((v) => !v)} show={showConfirm} />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                  disabled={savingPassword}
                  type="submit"
                >
                  {savingPassword ? <LoaderCircle className="animate-spin" size={17} /> : null}
                  {savingPassword ? 'Updating...' : 'Update Password / கடவுச்சொல்லை மாற்றவும்'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}


const createUserInputClass =
  'min-w-0 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20'

function CreateUserFieldLabel({ children, required = false }) {
  return (
    <span className="text-sm font-semibold text-neutral-700">
      {children}
      {required && <span className="ml-1 text-red-600" aria-label="required">*</span>}
    </span>
  )
}

function CreateUserFormSection({ children, title }) {
  return (
    <section className="grid gap-4 border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="border-b border-neutral-200 pb-3 text-base font-bold text-neutral-950">{title}</h2>
      {children}
    </section>
  )
}

function CreateUserPasswordInput({ minLength, onChange, placeholder, value }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        autoComplete="new-password"
        className={`${createUserInputClass} pr-12`}
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

function CreateUserSearchSelect({ disabled = false, onChange, options, placeholder, value }) {
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
        className={`${createUserInputClass} disabled:bg-neutral-100`}
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

function CreateUserPanel({ user }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    role: '',
    districtName: '',
    talukName: '',
    villageName: '',
    password: '',
    confirmPassword: '',
  })
  const { notify } = useNotifications()

  useEffect(() => {
    let cancelled = false
    api
      .get('/hierarchy/geo-units')
      .then((response) => {
        if (!cancelled) setUnits(response.data?.units || [])
      })
      .catch((error) => {
        if (!cancelled) {
          notify({
            type: 'error',
            title: 'Load Failed / ஏற்ற முடியவில்லை',
            message: error.response?.data?.message || 'User creation form could not be loaded.',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [notify])

  const roleOptions = useMemo(() => {
    return [
      { value: 'STATE_ADMIN', label: 'மாநில நிர்வாகி / State Admin' },
      ...requestedRoles.map((role) => ({ value: role.value, label: role.label })),
    ]
  }, [])

  const selectedDistrict = useMemo(
    () => tamilNaduDistricts.find((district) => district.name === form.districtName) || null,
    [form.districtName],
  )
  const selectedTaluk = useMemo(
    () => selectedDistrict?.taluks?.find((taluk) => taluk.name === form.talukName) || null,
    [selectedDistrict, form.talukName],
  )
  const selectedVillage = useMemo(
    () => selectedTaluk?.villages?.find((village) => village.name === form.villageName) || null,
    [selectedTaluk, form.villageName],
  )
  const districtOptions = useMemo(
    () => tamilNaduDistricts.map((district) => ({ value: district.name, label: bilingualName(district) })),
    [],
  )
  const talukOptions = useMemo(
    () => (selectedDistrict?.taluks || []).map((taluk) => ({ value: taluk.name, label: bilingualName(taluk) })),
    [selectedDistrict],
  )
  const villageOptions = useMemo(
    () => (selectedTaluk?.villages || []).map((village) => ({ value: village.name, label: bilingualName(village) })),
    [selectedTaluk],
  )

  const needsTaluk = ['TALUK_ADMIN', 'VILLAGE_ADMIN', 'PARTNER'].includes(form.role)
  const needsVillage = ['VILLAGE_ADMIN', 'PARTNER'].includes(form.role)

  function updateForm(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'districtName') {
        next.talukName = ''
        next.villageName = ''
      }
      if (field === 'talukName') next.villageName = ''
      return next
    })
  }

  function resolveScopeId() {
    if (form.role === 'STATE_ADMIN') {
      return units.find((unit) => unit.type === 'STATE' && unit.code === `STATE-${tamilNaduState.code}`)?.id
    }
    if (form.role === 'DISTRICT_ADMIN') {
      return units.find((unit) => unit.type === 'DISTRICT' && unit.code === `DISTRICT-${selectedDistrict?.code}`)?.id
    }
    if (form.role === 'TALUK_ADMIN') {
      return units.find((unit) => unit.type === 'TALUK' && unit.code === `TALUK-${selectedTaluk?.code}`)?.id
    }
    if (form.role === 'VILLAGE_ADMIN' || form.role === 'PARTNER') {
      return units.find((unit) => unit.type === 'VILLAGE' && unit.code === `VILLAGE-${selectedVillage?.code}`)?.id
    }
    return null
  }

  async function handleCreateUserSubmit(event) {
    event.preventDefault()
    setCreatedUser(null)

    if (form.fullName.trim().length < 2) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'முழு பெயர் குறைந்தது 2 எழுத்துகள் வேண்டும். / Full Name must be at least 2 characters.' })
      return
    }
    if (form.username.trim().length < 3) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பயனர் பெயர் குறைந்தது 3 எழுத்துகள் வேண்டும். / Username must be at least 3 characters.' })
      return
    }
    if (form.phone.trim().length !== 10) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: '10 இலக்க தொலைபேசி எண் தேவை. / 10 digit phone number is required.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notify({ type: 'warning', title: 'Invalid Email', message: 'சரியான மின்னஞ்சல் முகவரி உள்ளிடவும். / Enter a valid email address.' })
      return
    }
    if (!form.role) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பங்கு தேர்வு செய்யவும். / Select Role.' })
      return
    }
    if (form.password.length < 6) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் வேண்டும். / Password must be at least 6 characters.' })
      return
    }
    if (form.password !== form.confirmPassword) {
      notify({ type: 'warning', title: 'Password Mismatch', message: 'கடவுச்சொற்கள் பொருந்தவில்லை. / Passwords do not match.' })
      return
    }
    const scopeId = resolveScopeId()
    if (!scopeId) {
      notify({ type: 'warning', title: 'Required / அவசியமானது', message: 'பகுதி தேர்வு செய்யவும். / Select the required area for this role.' })
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post('/admin/users', {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        scopeId,
      })
      setCreatedUser(response.data.user)
      notify({
        type: 'success',
        title: 'User Created & Activated / பயனர் உருவாக்கப்பட்டு செயல்படுத்தப்பட்டது',
        message: `${response.data.user.username} (${roleLabels[response.data.user.role] || response.data.user.role}) can log in immediately.`,
      })
      setForm({
        fullName: '',
        username: '',
        phone: '',
        email: '',
        role: '',
        districtName: '',
        talukName: '',
        villageName: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Creation Failed / உருவாக்க முடியவில்லை',
        message: error.response?.data?.message || 'பயனரை உருவாக்க முடியவில்லை. / Could not create the user.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  return (
    <section className="mx-auto w-full max-w-4xl px-1 py-4 sm:px-5 sm:py-6">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">Create User / பயனர் உருவாக்கு</h1>
      <form
        className="mt-4 grid gap-4 border border-neutral-200 p-3 sm:mt-6 sm:gap-5 sm:p-8"
        noValidate
        onSubmit={handleCreateUserSubmit}
      >
        <div className="border-l-4 border-green-600 bg-green-50 p-3 text-sm leading-6 text-green-800 sm:p-4">
          உருவாக்கப்படும் பயனர் உடனடியாக செயல்படுத்தப்படுவார் — நிர்வாகி அங்கீகாரம் தேவையில்லை. The user is activated instantly — no approval needed.
        </div>

        <CreateUserFormSection title="தனிப்பட்ட விவரங்கள் / Personal Details">
          <div className="grid items-start gap-4 md:grid-cols-2">
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>முழு பெயர் / Full Name</CreateUserFieldLabel>
              <input
                className={createUserInputClass}
                onChange={(event) => updateForm('fullName', event.target.value.replace(/[^\p{L}\s.]/gu, ''))}
                placeholder="Full Name"
                required
                value={form.fullName}
              />
            </label>
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>பயனர் பெயர் / Username</CreateUserFieldLabel>
              <input
                className={createUserInputClass}
                minLength={3}
                onChange={(event) => updateForm('username', event.target.value.replace(/\s+/g, ''))}
                placeholder="Minimum 3 characters"
                required
                value={form.username}
              />
              <p className="text-xs text-neutral-500">குறைந்தது 3 எழுத்துகள் / Minimum 3 characters</p>
            </label>
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>தொலைபேசி எண் / Phone Number</CreateUserFieldLabel>
              <input
                {...phoneInputProps}
                className={createUserInputClass}
                onChange={(event) => updateForm('phone', normalizePhone(event.target.value))}
                placeholder="10 digit phone number"
                required
                value={form.phone}
              />
            </label>
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>மின்னஞ்சல் முகவரி / Email Address</CreateUserFieldLabel>
              <input
                className={createUserInputClass}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="Email Address"
                required
                type="email"
                value={form.email}
              />
            </label>
          </div>
        </CreateUserFormSection>

        <CreateUserFormSection title="பங்கு மற்றும் பகுதி / Role and Area">
          <label className="flex flex-col justify-start gap-2">
            <CreateUserFieldLabel required>பங்கு / Role</CreateUserFieldLabel>
            <CreateUserSearchSelect
              onChange={(value) => updateForm('role', value)}
              options={roleOptions}
              placeholder="பங்கு தேடவும் / Search role"
              value={form.role}
            />
          </label>
          <div className="grid items-start gap-4 md:grid-cols-2">
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>மாநிலம் / State</CreateUserFieldLabel>
              <input className={`${createUserInputClass} disabled:bg-neutral-100`} disabled value={bilingualName(tamilNaduState)} />
            </label>
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>மாவட்டம் / District</CreateUserFieldLabel>
              <CreateUserSearchSelect
                onChange={(value) => updateForm('districtName', value)}
                options={districtOptions}
                placeholder="மாவட்டம் தேடவும் / Search district"
                value={form.districtName}
              />
            </label>
            {needsTaluk && (
              <label className="flex flex-col justify-start gap-2">
                <CreateUserFieldLabel required>தாலுகா / Taluk</CreateUserFieldLabel>
                <CreateUserSearchSelect
                  disabled={!form.districtName}
                  onChange={(value) => updateForm('talukName', value)}
                  options={talukOptions}
                  placeholder="தாலுகா தேடவும் / Search taluk"
                  value={form.talukName}
                />
              </label>
            )}
            {needsVillage && (
              <label className="flex flex-col justify-start gap-2">
                <CreateUserFieldLabel required>கிராமம் / Village</CreateUserFieldLabel>
                <CreateUserSearchSelect
                  disabled={!form.talukName}
                  onChange={(value) => updateForm('villageName', value)}
                  options={villageOptions}
                  placeholder="கிராமம் தேடவும் / Search village"
                  value={form.villageName}
                />
              </label>
            )}
          </div>
        </CreateUserFormSection>

        <CreateUserFormSection title="உள்நுழைவு பாதுகாப்பு / Login Security">
          <div className="grid items-start gap-4 md:grid-cols-2">
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>கடவுச்சொல் / Password</CreateUserFieldLabel>
              <CreateUserPasswordInput
                minLength={6}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder="Minimum 6 characters"
                value={form.password}
              />
              <p className="text-xs text-neutral-500">குறைந்தது 6 எழுத்துகள் / Minimum 6 characters</p>
            </label>
            <label className="flex flex-col justify-start gap-2">
              <CreateUserFieldLabel required>கடவுச்சொல் உறுதி / Confirm Password</CreateUserFieldLabel>
              <CreateUserPasswordInput
                minLength={6}
                onChange={(event) => updateForm('confirmPassword', event.target.value)}
                placeholder="Confirm Password"
                value={form.confirmPassword}
              />
              <p className="text-xs text-neutral-500">கடவுச்சொல்லுடன் பொருந்த வேண்டும் / Must match the password</p>
            </label>
          </div>
        </CreateUserFormSection>

        {createdUser && (
          <div className="border-l-4 border-green-600 bg-green-50 p-4 text-sm leading-6 text-green-800">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={18} />
              User created & activated / பயனர் உருவாக்கப்பட்டு செயல்படுத்தப்பட்டது
            </div>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-green-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Username</p>
                <p className="mt-1 font-bold text-slate-950">{createdUser.username}</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-1 font-bold text-slate-950">{roleLabels[createdUser.role] || createdUser.role}</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Scope</p>
                <p className="mt-1 font-bold text-slate-950">{createdUser.scope?.name || '-'}</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 font-bold text-green-700">Active</p>
              </div>
            </div>
          </div>
        )}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#007cba] px-6 py-4 text-base font-bold text-white transition hover:bg-[#006090] disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <UserPlus size={18} />}
          {submitting ? 'Creating... / உருவாக்கப்படுகிறது' : 'Create & Activate User / பயனர் உருவாக்கு'}
        </button>
      </form>
    </section>
  )
}

function CheckStatusPanel({ onSelectSubmission }) {
  const [trackTab, setTrackTab] = useState('application')
  const [appNo, setAppNo] = useState('')
  const [appPhone, setAppPhone] = useState('')
  const [appTracking, setAppTracking] = useState(null)
  const [appLoading, setAppLoading] = useState(false)

  const [reqNo, setReqNo] = useState('')
  const [reqPhone, setReqPhone] = useState('')
  const [reqTracking, setReqTracking] = useState(null)
  const [reqLoading, setReqLoading] = useState(false)

  const { notify } = useNotifications()

  async function handleAppTrack(event) {
    event.preventDefault()
    if (!appNo.trim()) {
      notify({ type: 'warning', title: 'Application No Required', message: 'Enter application number.' })
      return
    }

    try {
      setAppLoading(true)
      setAppTracking(null)
      const params = { applicationNo: appNo.trim(), ...(appPhone ? { phone: appPhone } : {}) }
      const response = await api.get('/applications/track', { params })
      setAppTracking(response.data.tracking)
      notify({ type: 'success', title: 'Status Found', message: 'Application status loaded.', popup: false })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Status Not Found',
        message: error.response?.data?.message || 'Application tracking details not found.',
      })
    } finally {
      setAppLoading(false)
    }
  }

  async function handleReqTrack(event) {
    event.preventDefault()
    if (!reqNo.trim()) {
      notify({ type: 'warning', title: 'Request No Required', message: 'Enter signup request number.' })
      return
    }

    try {
      setReqLoading(true)
      setReqTracking(null)
      const params = { requestNo: reqNo.trim(), ...(reqPhone ? { phone: reqPhone } : {}) }
      const response = await api.get('/auth/signup-requests/track', { params })
      setReqTracking(response.data.tracking)
      notify({ type: 'success', title: 'Status Found', message: 'Signup status loaded.', popup: false })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Status Not Found',
        message: error.response?.data?.message || 'Signup request tracking details not found.',
      })
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex rounded-xl bg-slate-200/50 p-1.5 w-full sm:w-auto self-start text-sm font-bold border border-slate-200 shadow-xs">
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${trackTab === 'application' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setTrackTab('application')}
          type="button"
        >
          Application Tracker
        </button>
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${trackTab === 'signup' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setTrackTab('signup')}
          type="button"
        >
          Signup Tracker
        </button>
      </div>

      {trackTab === 'application' && (
      <Panel>
        <PanelHeader eyebrow="Application Tracker" title="Track Application Status / விண்ணப்ப நிலை" />
        <div className="grid gap-4 p-4 sm:p-5">
          <form className="grid gap-4" onSubmit={handleAppTrack}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Application Number / விண்ணப்ப எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-base sm:text-sm outline-none focus:border-[#007cba]"
                onChange={(e) => setAppNo(e.target.value)}
                placeholder="e.g. TNW-20260729-0001"
                value={appNo}
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
          <div className="grid gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            {appTracking ? (
              <>


                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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

                {/* Visual Workflow Steps Stepper */}
                <div className="mt-4 border-t border-slate-200 pt-5 space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Application Processing Path / விண்ணப்ப செயலாக்க நிலை
                  </p>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-2">
                    {[
                      { label: 'Submission', labelTa: 'சமர்ப்பிப்பு', desc: 'Submitted' },
                      { label: 'Village Level', labelTa: 'கிராம அதிகாரி', desc: 'VAO Verify' },
                      { label: 'Taluk Level', labelTa: 'தாலுகா அதிகாரி', desc: 'Taluk Review' },
                      { label: 'District Level', labelTa: 'மாவட்ட அதிகாரி', desc: 'District Approve' },
                      { label: 'State Level', labelTa: 'மாநில ஒப்புதல்', desc: 'Final Decision' },
                    ].map((step, idx) => {
                      let stepState = 'pending' // 'pending' | 'active' | 'completed' | 'correction' | 'rejected'
                      const status = appTracking.status

                      if (idx === 0) {
                        stepState = 'completed'
                      } else if (idx === 1) {
                        if (status === 'APPROVED') stepState = 'completed'
                        else if (status === 'REJECTED') stepState = 'rejected'
                        else if (status === 'NEEDS_CORRECTION') stepState = 'correction'
                        else if (['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(status)) stepState = 'active'
                        else stepState = 'completed'
                      } else if (idx === 2) {
                        if (status === 'APPROVED') stepState = 'completed'
                        else if (status === 'REJECTED') stepState = 'rejected'
                        else if (status === 'FORWARDED_TO_TALUK') stepState = 'active'
                        else if (['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION'].includes(status)) stepState = 'pending'
                        else stepState = 'completed'
                      } else if (idx === 3) {
                        if (status === 'APPROVED') stepState = 'completed'
                        else if (status === 'REJECTED') stepState = 'rejected'
                        else if (status === 'FORWARDED_TO_DISTRICT') stepState = 'active'
                        else if (['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'FORWARDED_TO_TALUK'].includes(status)) stepState = 'pending'
                        else stepState = 'completed'
                      } else if (idx === 4) {
                        if (status === 'APPROVED') stepState = 'completed'
                        else if (status === 'REJECTED') stepState = 'rejected'
                        else if (status === 'FORWARDED_TO_STATE') stepState = 'active'
                        else stepState = 'pending'
                      }

                      return (
                        <div key={step.label} className="flex-1 flex items-center gap-3 md:flex-col md:items-center text-center">
                          <div className="relative flex flex-col items-center">
                            {/* Step Circle */}
                            <div className={`flex size-8 items-center justify-center rounded-full font-bold text-[11px] shadow-2xs border-2 transition-all ${
                              stepState === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                              stepState === 'active' ? 'bg-blue-600 border-blue-600 text-white animate-pulse' :
                              stepState === 'correction' ? 'bg-amber-500 border-amber-500 text-white' :
                              stepState === 'rejected' ? 'bg-rose-600 border-rose-600 text-white' :
                              'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {stepState === 'completed' ? '✓' : idx + 1}
                            </div>
                          </div>
                          <div className="min-w-0 md:mt-2 md:text-center text-left">
                            <p className={`text-xs font-extrabold truncate ${stepState === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{step.labelTa}</p>
                            <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              stepState === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                              stepState === 'active' ? 'bg-blue-50 text-blue-700' :
                              stepState === 'correction' ? 'bg-amber-50 text-amber-700' :
                              stepState === 'rejected' ? 'bg-rose-50 text-rose-700' :
                              'bg-slate-50 text-slate-400'
                            }`}>
                              {stepState}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 text-center">Enter application number above to view status.</p>
            )}
          </div>
        </div>
      </Panel>
      )}

      {trackTab === 'signup' && (
      <Panel>
        <PanelHeader eyebrow="Signup Tracker" title="Track Signup Request Status / பதிவு கோரிக்கை நிலை" />
        <div className="grid gap-4 p-4 sm:p-5">
          <form className="grid gap-4" onSubmit={handleReqTrack}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Signup Request Number / பதிவு கோரிக்கை எண்</span>
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-base sm:text-sm outline-none focus:border-[#007cba]"
                onChange={(e) => setReqNo(e.target.value)}
                placeholder="e.g. TNSU-20260729-0001"
                value={reqNo}
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
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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
      )}
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3 bg-slate-50/60">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef8ff] text-[#007cba]">
            <Icon size={17} />
          </span>
          <p className="font-bold text-slate-950 text-sm">{label}</p>
        </div>
        {url && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async (e) => {
                e.preventDefault()
                try {
                  const response = await fetch(url)
                  const blob = await response.blob()
                  const objectUrl = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = objectUrl
                  const ext = path?.split('.').pop() || 'jpg'
                  a.download = `${label.replace(/\s+/g, '_')}.${ext}`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(objectUrl)
                } catch (error) {
                  console.error('Download failed', error)
                  const a = document.createElement('a')
                  a.href = url
                  a.target = '_blank'
                  a.download = true
                  a.click()
                }
              }}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#007cba] hover:text-[#007cba]"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <a
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#007cba] hover:text-[#007cba]"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              <span>Open</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
      {url ? (
        <a className="block overflow-hidden bg-slate-950/5 p-2 text-center group" href={url} rel="noreferrer" target="_blank">
          <img
            alt={label}
            className="max-h-72 w-full rounded-lg object-contain bg-white p-2 shadow-xs transition group-hover:scale-[1.01]"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling
              if (fallback) fallback.style.display = 'block'
            }}
            src={url}
          />
          <div className="hidden p-5 text-center text-xs font-semibold text-slate-600">
            📄 Uploaded Document ({path.split('/').pop()})<br />
            <span className="mt-1 inline-block font-bold text-[#007cba] underline">Click here to open file in new tab →</span>
          </div>
        </a>
      ) : (
        <div className="p-4 text-xs font-semibold text-slate-500 text-center">No document uploaded</div>
      )}
    </div>
  )
}

const documentLabels = {
  photo: 'Passport Photo / புகைப்பட முகப்பு',
  livePhoto: 'Live Photo Capture / நேரடி புகைப்படம்',
  signature: 'Worker Signature / கையொப்பம்',
  dobDocument: 'DOB Proof Document / பிறந்த தேதிக்கான ஆவணம்',
  aadharCard: 'Aadhar Card / ஆதார் அட்டை',
  rationCard: 'Ration Card / குடும்ப அட்டை',
  bankPassbook: 'Bank Passbook / வங்கி புத்தகம்',
  bankPassbookFront: 'Passbook Front Page / வங்கி புத்தகத்தின் முதல் பக்கம்',
  bankPassbookLast: 'Passbook Last Transaction / வங்கி புத்தகத்தில் கடைசி பரிவர்த்தனை',
  registrationCard: 'Registration Card / தொழிலாளர் பதிவு அட்டை',
  nomineeAadhar: "Nominee's Aadhar Card / நாமினியின் ஆதார் அட்டை",
  childAadhar: "Child's Aadhar Card / குழந்தையின் ஆதார் அட்டை",
  bonafide: 'Bonafide Certificate / கல்வி சான்று',
  markSheet: 'Mark Sheet / மதிப்பெண் பட்டியல்',
  paymentScreenshot: 'Payment Screenshot / கட்டண ரசீது',
}

function SubmissionDetailsModal({ onClose, onReview, submission, viewerRole }) {
  const [reviewReason, setReviewReason] = useState('')
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  const { notify } = useNotifications()

  const roleLevel = { VILLAGE_ADMIN: 1, TALUK_ADMIN: 2, DISTRICT_ADMIN: 3, STATE_ADMIN: 4, SUPER_ADMIN: null }
  const viewerLevel = roleLevel[viewerRole]
  const isSuperAdmin = viewerRole === 'SUPER_ADMIN'
  const actionableStatuses = ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'FORWARDED_TO_TALUK', 'FORWARDED_TO_DISTRICT', 'FORWARDED_TO_STATE']
  const canReviewHere = !!viewerRole && (isSuperAdmin || (viewerLevel !== null && viewerLevel >= submission.currentReviewLevel))
  const isActionable = actionableStatuses.includes(submission.status)
  const levelName = { 1: 'Village', 2: 'Taluk', 3: 'District', 4: 'State' }[submission.currentReviewLevel] || '—'
  const forwardStatusByLevel = { 1: 'FORWARDED_TO_TALUK', 2: 'FORWARDED_TO_DISTRICT', 3: 'FORWARDED_TO_STATE' }
  const nextLevelLabel = { 1: 'Taluk', 2: 'District', 3: 'State' }

  const rawApplicantData = useMemo(() => {
    if (!submission?.applicantData) return {}
    if (typeof submission.applicantData === 'string') {
      try {
        return JSON.parse(submission.applicantData)
      } catch {
        return {}
      }
    }
    return submission.applicantData
  }, [submission])

  const customData = useMemo(() => {
    const cd = rawApplicantData.customData || submission?.customData
    if (typeof cd === 'string') {
      try {
        return JSON.parse(cd)
      } catch {
        return {}
      }
    }
    return cd || {}
  }, [rawApplicantData, submission])

  // Collect all uploaded image/file entries from rawApplicantData, customData & paymentData
  const uploadedDocs = useMemo(() => {
    const entries = []
    const sources = [rawApplicantData, customData, submission?.paymentData || {}]

    sources.forEach((source) => {
      if (!source || typeof source !== 'object') return
      Object.entries(source).forEach(([key, val]) => {
        if (!val || typeof val !== 'string') return
        const isFileUrl =
          val.startsWith('data:') ||
          val.startsWith('http') ||
          val.startsWith('blob:') ||
          /\.(jpg|jpeg|png|webp|gif|pdf)$/i.test(val)

        if (isFileUrl) {
          if (!entries.some(([k]) => k === key)) {
            entries.push([key, getUploadUrl(val)])
          }
        }
      })
    })
    return entries
  }, [rawApplicantData, customData, submission])

  if (!submission) return null

  async function handleAction(nextStatus) {
    if ((nextStatus === 'REJECTED' || nextStatus === 'NEEDS_CORRECTION') && !reviewReason.trim()) {
      notify({ type: 'warning', title: 'Reason Required', message: 'Please enter a review remark or reason.' })
      return
    }

    if (nextStatus === 'APPROVED' && (submission.paymentAmount || submission.paymentReference) && !paymentVerified) {
      notify({ type: 'warning', title: 'Payment Verification Required', message: 'Please verify the UPI payment details by checking the box before approving.' })
      return
    }

    try {
      setSubmitting(true)
      await onReview?.(submission, nextStatus, reviewReason)
      onClose()
    } catch {
      // Handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  const workerName = rawApplicantData.workerName || submission.applicantName || submission.user?.firstName || '-'
  const phone = rawApplicantData.phone || submission.user?.phone || '-'
  const sourceHierarchy = getSubmissionSourceHierarchy({ ...submission, applicantData: rawApplicantData })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 p-4 pb-4 sm:p-7 sm:pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Application Review Details</span>
              <StatusPill status={submission.status} />
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-slate-700">
                Level {submission.currentReviewLevel || 1}/4 · {levelName}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-950 tracking-tight">{submission.applicationNo}</h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-600">
              {submission.tamilFormTitle || submission.formTitle || submission.form?.tamilTitle || submission.form?.title}
            </p>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center self-start rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 sm:self-auto"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 pt-4 sm:p-7 sm:pt-5 space-y-6">

          {/* Action Required Banner for Officer */}
          {canReviewHere && isActionable && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
                !
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Action Required at your Hierarchy Level</p>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  This application is currently pending your verification. Review the applicant details, attached document photos, and UPI payment before taking action.
                </p>
              </div>
            </div>
          )}

          {/* Waiting Elsewhere Info Strip for Officers */}
          {onReview && !(canReviewHere && isActionable) && ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'FORWARDED_TO_TALUK', 'FORWARDED_TO_DISTRICT', 'FORWARDED_TO_STATE'].includes(submission.status) && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 border border-slate-200 text-slate-700">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-500 text-white font-bold">
                !
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {submission.status === 'NEEDS_CORRECTION' ? 'Waiting for Applicant Resubmission' : `Currently at ${levelName} Level`}
                </p>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {submission.status === 'NEEDS_CORRECTION'
                    ? 'This application was returned to the applicant for correction. Review controls will be available once the applicant resubmits.'
                    : 'This application is waiting for action at another review level. The review controls will unlock here once it is forwarded to your level.'}
                </p>
              </div>
            </div>
          )}

          {/* Applicant Details Cards Grid */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#007cba] mb-3 flex items-center gap-2">
              <Users size={16} />
              Applicant Worker Information / தொழிலாளி விவரங்கள்
            </h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <SignupDetailRow label="Worker Name / தொழிலாளி பெயர்" value={workerName} />
              <SignupDetailRow label="Mobile Number / அலைபேசி எண்" value={phone} />
              <SignupDetailRow label="District / மாவட்டம்" value={sourceHierarchy.district || '-'} />
              <SignupDetailRow label="Taluk / தாலுகா" value={sourceHierarchy.taluk || '-'} />
              <SignupDetailRow label="Village / கிராமம்" value={sourceHierarchy.village || '-'} />
              <SignupDetailRow label="Submitted By / சமர்ப்பித்தவர்" value={sourceHierarchy.partner || '-'} />
              {rawApplicantData.dob && <SignupDetailRow label="Date of Birth / பிறந்த தேதி" value={rawApplicantData.dob} />}
              {rawApplicantData.dobProofType && <SignupDetailRow label="DOB Proof Document / ஆவண வகை" value={rawApplicantData.dobProofType} />}
              {rawApplicantData.religion && <SignupDetailRow label="Religion / மதம்" value={rawApplicantData.religion} />}
              {rawApplicantData.caste && <SignupDetailRow label="Caste / சாதி பிரிவு" value={rawApplicantData.caste} />}
              {rawApplicantData.subCaste && <SignupDetailRow label="Sub-Caste / உட்பிரிவு" value={rawApplicantData.subCaste} />}
              {rawApplicantData.workerJob && <SignupDetailRow label="Worker Job / தொழிலாளியின் வேலை" value={rawApplicantData.workerJob} />}
              {rawApplicantData.nomineeName && <SignupDetailRow label="Nominee Name / நாமினி பெயர்" value={rawApplicantData.nomineeName} />}
              <SignupDetailRow label="Submitted On / சமர்ப்பித்த தேதி" value={formatDate(submission.submittedAt || submission.createdAt)} />
              <SignupDetailRow label="Application Status" value={submission.status} />
            </div>
          </div>

          {/* Scheme & Child Details Cards Grid for Education & Benefit Forms */}
          {(Object.keys(customData).length > 0 || rawApplicantData.childName) && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#007cba] mb-3 flex items-center gap-2">
                <FileText size={16} />
                Scheme & Child Specific Details / உதவித்தொகை மற்றும் குழந்தையின் விவரங்கள்
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(customData.childName || rawApplicantData.childName) && (
                  <SignupDetailRow label="Child's Name / குழந்தையின் பெயர்" value={customData.childName || rawApplicantData.childName} />
                )}
                {(customData.standard || rawApplicantData.standard) && (
                  <SignupDetailRow label="Standard / வகுப்பு" value={`${customData.standard || rawApplicantData.standard}th Standard`} />
                )}
                {(customData.examPassed || rawApplicantData.examPassed) && (
                  <SignupDetailRow label="Examination Passed / தேர்ச்சி" value={`${customData.examPassed || rawApplicantData.examPassed}th Pass`} />
                )}
                {(customData.courseType || rawApplicantData.courseType) && (
                  <SignupDetailRow label="Course Type / படிப்பு வகை" value={customData.courseType || rawApplicantData.courseType} />
                )}
                {(customData.courseName || rawApplicantData.courseName) && (
                  <SignupDetailRow label="Course Name / பாடத்தின் பெயர்" value={customData.courseName || rawApplicantData.courseName} />
                )}
                {(customData.courseDuration || rawApplicantData.courseDuration) && (
                  <SignupDetailRow label="Duration / கால அளவு" value={`${customData.courseDuration || rawApplicantData.courseDuration} Years`} />
                )}
                {(customData.applyingYear || rawApplicantData.applyingYear) && (
                  <SignupDetailRow label="Applying Year / விண்ணப்பிக்கும் ஆண்டு" value={`Year ${customData.applyingYear || rawApplicantData.applyingYear}`} />
                )}
                {(customData.academicYear || rawApplicantData.academicYear) && (
                  <SignupDetailRow label="Academic Year / கல்வி ஆண்டு" value={customData.academicYear || rawApplicantData.academicYear} />
                )}
              </div>
            </div>
          )}

          {/* Uploaded Documents & Photos Visual Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#007cba] flex items-center gap-2">
                <ImageIcon size={16} />
                Uploaded Documents & Photos Gallery ({uploadedDocs.length}) / பதிவேற்றப்பட்ட ஆவணங்கள்
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Click any image to view full size</span>
            </div>

            {uploadedDocs.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {uploadedDocs.map(([key, imgSrc]) => {
                  const label = documentLabels[key] || key
                  return (
                    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-[#007cba] hover:shadow-md flex flex-col justify-between" key={key}>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate mb-2">{label}</p>
                        <div
                          className="relative flex h-40 items-center justify-center rounded-xl bg-slate-900/5 p-2 cursor-pointer overflow-hidden"
                          onClick={() => setLightboxImg({ src: imgSrc, title: label, key })}
                        >
                          <img alt={label} className="max-h-full max-w-full rounded-lg object-contain bg-white shadow-xs transition group-hover:scale-105" src={imgSrc} />
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md">
                              🔍 View Full Image
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-[#007cba] hover:text-white hover:border-[#007cba] transition"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadImage(imgSrc, `${submission.applicationNo || 'doc'}-${key}.png`)
                          }}
                          type="button"
                        >
                          <Download size={14} />
                          <span>Download Image / பதிவிறக்கு</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-semibold text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                No image previews available for this submission.
              </div>
            )}
          </div>

          {/* Payment Verification & Check Section */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Payment Verification & UPI Details / கட்டண சரிபார்ப்பு
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-center">
              <SignupDetailRow label="Payment Status" value={submission.paymentStatus || 'PAID'} />
              <SignupDetailRow label="UPI Transaction ID / UTR" value={submission.paymentReference || submission.paymentData?.upiTransactionId || 'N/A'} />
            </div>

            {/* Check Payment Checkbox */}
            {onReview && (submission.paymentAmount || submission.paymentReference) && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs transition-colors hover:border-[#007cba]/30">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    checked={paymentVerified}
                    className="mt-0.5 size-5 shrink-0 rounded border-slate-300 accent-[#007cba] cursor-pointer"
                    onChange={(e) => setPaymentVerified(e.target.checked)}
                    type="checkbox"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#007cba] transition">
                      Verify UPI Payment Details / கட்டண விவரங்களை சரிபார்த்தேன்
                    </span>
                    <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
                      Confirm that the UPI Transaction ID <strong className="text-slate-800">({submission.paymentReference || 'UTR'})</strong> matches the uploaded payment receipt image before approving this application.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Officer Verification & Forwarding Controls */}
          {onReview && canReviewHere && isActionable && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold tracking-wide text-slate-800 flex items-center gap-2">
                  <Activity className="text-[#007cba]" size={18} />
                  Officer Decision Controls / அதிகாரியின் முடிவு
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-300/50 shadow-sm">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex size-1.5 rounded-full bg-amber-500"></span>
                  </span>
                  {submission.status === 'UNDER_REVIEW' ? 'Review in Progress' : 'Action Required'}
                </span>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>Review Remarks / Reason for Return or Rejection (குறிப்புகள்)</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-slate-300 bg-slate-50 p-3 outline-none focus:border-[#007cba] focus:bg-white focus:ring-2 focus:ring-[#007cba]/20 text-sm font-normal transition-all"
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Enter remarks required if returning or rejecting..."
                  rows={2}
                  value={reviewReason}
                />
              </label>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                    disabled={submitting}
                    onClick={() => handleAction('UNDER_REVIEW')}
                    type="button"
                  >
                    <span>Start Review / மதிப்பாய்வு</span>
                  </button>
                  <button
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition shadow-2xs disabled:opacity-50"
                    disabled={submitting}
                    onClick={() => handleAction('NEEDS_CORRECTION')}
                    type="button"
                  >
                    <span>Return / திருத்தம்</span>
                  </button>
                  <button
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs disabled:opacity-50"
                    disabled={submitting}
                    onClick={() => handleAction('REJECTED')}
                    type="button"
                  >
                    <span>Reject / நிராகரிப்பு</span>
                  </button>
                  {submission.currentReviewLevel < 4 && (
                    <button
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs disabled:opacity-50"
                      disabled={submitting}
                      onClick={() => handleAction(forwardStatusByLevel[submission.currentReviewLevel])}
                      type="button"
                    >
                      <ArrowUpRight size={14} />
                      <span>Forward to {nextLevelLabel[submission.currentReviewLevel]} / மேல்நிலைக்கு அனுப்பு</span>
                    </button>
                  )}
                </div>
                
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => handleAction('APPROVED')}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  <span>Approve Application / அங்கீகரிப்பு</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-3">
              <p className="font-bold text-slate-950 text-sm">{lightboxImg.title}</p>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#007cba] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#006090] transition"
                  onClick={() => downloadImage(lightboxImg.src, `${submission.applicationNo || 'doc'}-${lightboxImg.title}.png`)}
                  type="button"
                >
                  <Download size={14} />
                  <span>Download Image / பதிவிறக்கம்</span>
                </button>
                <button
                  className="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  onClick={() => setLightboxImg(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-900 rounded-xl p-2">
              <img alt={lightboxImg.title} className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg" src={lightboxImg.src} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HierarchyApplicationsPanel({ hierarchy, loading, onRefresh, onSelectSubmission, submissions = [] }) {
  const roots = hierarchy?.roots || []
  const [path, setPath] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    setPath([])
  }, [roots])

  useEffect(() => {
    setSearchQuery('')
  }, [path])

  const currentNode = path[path.length - 1] || null
  const visibleCards = currentNode ? currentNode.children || [] : roots
  const partnerCards = currentNode?.type === 'VILLAGE' ? currentNode.partners || [] : []
  const hasNextLevel = visibleCards.length > 0
  const pageStatusSummary = getStatusSummary((currentNode || hierarchy?.total)?.counts?.applications)
  const pageTitle = currentNode
    ? hierarchyNodeLabel(currentNode)
    : `${formatGeoType(visibleCards[0]?.type || hierarchy?.firstType)} List / பட்டியல்`
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredCards = useMemo(() => {
    const list = normalizedSearch ? visibleCards.filter((node) => {
      const haystack = [
        node.label,
        hierarchyNodeLabel(node),
        node.name,
        node.tamilName,
        node.counts?.applications?.total,
        node.counts?.users?.partners,
        node.childCount,
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    }) : visibleCards
    return [...list].sort((a, b) => compareApplicationCount(a, b, sortOrder))
  }, [normalizedSearch, sortOrder, visibleCards])
  const filteredPartners = useMemo(() => {
    const list = normalizedSearch ? partnerCards.filter((partner) => {
      const haystack = [
        partner.name,
        partner.username,
        partner.phone,
        partner.applications?.total,
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    }) : partnerCards
    return [...list].sort((a, b) => compareApplicationCount(a, b, sortOrder))
  }, [normalizedSearch, partnerCards, sortOrder])
  const filteredRecentApplications = useMemo(() => {
    const recent = currentNode?.recentApplications || []
    const list = normalizedSearch ? recent.filter((application) => {
      const haystack = [
        application.applicationNo,
        application.status,
        application.form?.title,
        application.form?.tamilTitle,
        application.user?.username,
        application.user?.firstName,
        application.user?.phone,
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    }) : recent
    return [...list].sort((a, b) => {
      const result = String(a.applicationNo || '').localeCompare(String(b.applicationNo || ''), 'en-IN', { numeric: true })
      return sortOrder === 'asc' ? result : -result
    })
  }, [currentNode, normalizedSearch, sortOrder])

  function openApplication(application) {
    const fullSubmission = submissions.find((submission) => submission.id === application.id) || application
    onSelectSubmission?.(fullSubmission)
  }

  if (loading) return <DashboardSkeleton />

  if (!roots.length) {
    return (
      <Panel>
        <PanelHeader
          action={<button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={onRefresh} type="button">Refresh</button>}
          eyebrow="Hierarchy Applications / நிர்வாக விண்ணப்பங்கள்"
          title="No hierarchy data available / படிநிலை தரவு கிடைக்கவில்லை"
        />
        <div className="p-5">
          <EmptyState>No districts, taluks, villages or partners are available inside your current scope. / உங்கள் எல்லைக்குள் மாவட்டம், தாலுகா, கிராமம் அல்லது பங்குதாரர்கள் எதுவும் இல்லை.</EmptyState>
        </div>
      </Panel>
    )
  }

  return (
    <section className="space-y-6">
      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xs" onClick={onRefresh} type="button">
              <RefreshCw size={16} />
              Refresh / புதுப்பிக்க
            </button>
          }
          eyebrow="Hierarchy Applications / நிர்வாக நிலை விண்ணப்பங்கள்"
          title="Application Count by Area / பகுதி வாரியான விண்ணப்ப எண்ணிக்கை"
        />
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-4">
          <StatCard icon={Layers3} label="Visible Areas / காணக்கூடிய பகுதிகள்" loading={false} subtitle="Inside Scope / என் எல்லைக்குள்" tone="slate" value={hierarchy?.total?.geoUnits || 0} />
          <StatCard icon={FileText} label="Applications / விண்ணப்பங்கள்" loading={false} subtitle="All Statuses / அனைத்து நிலைகள்" tone="blue" value={hierarchy?.total?.applications || 0} />
          <StatCard icon={Users} label="Village Partners / கிராம பங்குதாரர்கள்" loading={false} subtitle="Approved Users / அங்கீகரிக்கப்பட்ட பயனர்கள்" tone="green" value={hierarchy?.total?.partners || 0} />
          <StatCard icon={UserPlus} label="Signup Requests / பதிவு கோரிக்கைகள்" loading={false} subtitle="Visible Queue / காணக்கூடிய வரிசை" tone="amber" value={hierarchy?.total?.signupRequests || 0} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          action={
            <div className="flex flex-wrap gap-2">
              {path.length > 0 && (
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setPath((items) => items.slice(0, -1))}
                  type="button"
                >
                  <ChevronLeft size={16} />
                  Back / பின்
                </button>
              )}
              {path.length > 0 && (
                <button
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setPath([])}
                  type="button"
                >
                  First Page / முதல் பக்கம்
                </button>
              )}
            </div>
          }
          eyebrow={path.length ? 'Selected Area / தேர்ந்தெடுத்த பகுதி' : 'First Page / முதல் பக்கம்'}
          title={pageTitle}
        />
        <div className="grid gap-4 p-4 sm:p-5">
          {path.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              {path.map((node, index) => (
                <button
                  className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200 hover:bg-white"
                  key={node.id}
                  onClick={() => setPath((items) => items.slice(0, index + 1))}
                  type="button"
                >
                  {hierarchyNodeLabel(node)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">
              {hasNextLevel ? 'Open next page / அடுத்த பக்கம் திறக்கவும்' : 'Partner Details / பங்குதாரர் விவரங்கள்'}
            </p>
            <h3 className="text-lg font-extrabold leading-snug text-slate-950">
              {hasNextLevel ? 'Select one card / ஒன்றைத் தேர்வு செய்யவும்' : 'Village partner application counts / கிராம பங்குதாரர் விண்ணப்ப எண்ணிக்கைகள்'}
            </h3>
          </div>

          <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#007cba] focus:ring-4 focus:ring-[#007cba]/10"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={hasNextLevel ? 'Search this page / இந்த பக்கத்தில் தேடவும்' : 'Search partners or applications / பங்குதாரர் அல்லது விண்ணப்பம் தேடவும்'}
                type="search"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Application Count Sort / விண்ணப்ப எண்ணிக்கை வரிசை</span>
              <select
                className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-800 outline-none transition focus:border-[#007cba] focus:ring-4 focus:ring-[#007cba]/10"
                onChange={(event) => setSortOrder(event.target.value)}
                value={sortOrder}
              >
                <option value="asc">Ascending / ஏறுவரிசை</option>
                <option value="desc">Descending / இறங்குவரிசை</option>
              </select>
            </label>
          </div>

          {currentNode && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Applications / விண்ணப்பங்கள்</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">{currentNode.counts?.applications?.total || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Partners / பங்குதாரர்கள்</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">{currentNode.counts?.users?.partners || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Active Users / செயலில் உள்ள பயனர்கள்</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">{currentNode.counts?.users?.active || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Signups / பதிவுகள்</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">{currentNode.counts?.signupRequests?.total || 0}</p>
              </div>
            </div>
          )}

          {hasNextLevel && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Name / பெயர்</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Applications / விண்ணப்பங்கள்</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Partners / பங்குதாரர்கள்</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Next / அடுத்தது</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map((node) => (
                      <tr
                        className="cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-[#eef8ff]/60"
                        key={node.id}
                        onClick={() => setPath((items) => [...items, node])}
                      >
                        <td className="px-4 py-3 font-extrabold text-slate-950">{hierarchyNodeLabel(node)}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-950">{node.counts?.applications?.total || 0}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">{node.counts?.users?.partners || 0}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">{node.childCount || node.partners?.length || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="ml-auto text-slate-400" size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filteredCards.length && (
                <div className="p-4">
                  <EmptyState>No matching records found on this page. / இந்த பக்கத்தில் பொருந்தக்கூடிய பதிவுகள் இல்லை.</EmptyState>
                </div>
              )}
            </div>
          )}

          {!hasNextLevel && partnerCards.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Name / பெயர்</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Username / Phone</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Last Login / கடைசி உள்நுழைவு</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Apps / விண்ணப்பங்கள்</th>
                      <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Status / நிலை</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map((partner) => (
                      <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#eef8ff]/60" key={partner.id}>
                        <td className="px-4 py-3 font-extrabold text-slate-950">{partner.name}</td>
                        <td className="px-4 py-3 text-slate-600">{partner.username} • {partner.phone || '-'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-500">{formatDate(partner.lastLoginAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block rounded-lg bg-[#eef8ff] px-3 py-1.5 text-xs font-bold text-[#007cba]">
                            {partner.applications?.total || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {getStatusSummary(partner.applications).map(([status, count]) => (
                              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200" key={status}>
                                {STATUS_META[status]?.en || status}: {count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filteredPartners.length && (
                <div className="p-4">
                  <EmptyState>No matching partners found. / பொருந்தக்கூடிய பங்குதாரர்கள் இல்லை.</EmptyState>
                </div>
              )}
            </div>
          )}

          {!hasNextLevel && !partnerCards.length && (
            <EmptyState>No next level or partner records found for this area. / இந்த பகுதிக்கு அடுத்த நிலை அல்லது பங்குதாரர் பதிவுகள் இல்லை.</EmptyState>
          )}

          {currentNode && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Application Status / விண்ணப்ப நிலை</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pageStatusSummary.length ? pageStatusSummary.map(([status, count]) => (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200" key={status}>
                      <StatusPill status={status} />
                      {count}
                    </span>
                  )) : <span className="text-sm text-slate-500">No applications yet. / இன்னும் விண்ணப்பங்கள் இல்லை.</span>}
                </div>
              </div>

              {currentNode.recentApplications?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recent Applications / சமீபத்திய விண்ணப்பங்கள்</p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border-b border-slate-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Application No / விண்ணப்ப எண்</th>
                            <th className="border-b border-slate-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Form / படிவம்</th>
                            <th className="border-b border-slate-200 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Status / நிலை</th>
                            <th className="border-b border-slate-200 px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecentApplications.map((application) => (
                            <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#eef8ff]/60" key={application.id}>
                              <td className="break-all px-3 py-2.5 font-bold text-slate-950">{application.applicationNo}</td>
                              <td className="px-3 py-2.5 text-xs font-semibold text-slate-600">{application.form?.tamilTitle || application.form?.title}</td>
                              <td className="px-3 py-2.5">
                                <StatusPill status={application.status} />
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#007cba] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#006090]"
                                  onClick={() => openApplication(application)}
                                  type="button"
                                >
                                  <Eye size={14} />
                                  View / பார்க்க
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!filteredRecentApplications.length && (
                      <div className="p-3">
                        <EmptyState>No matching applications found. / பொருந்தக்கூடிய விண்ணப்பங்கள் இல்லை.</EmptyState>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Panel>
    </section>
  )
}

function MetricCardsBar({ isAdmin, loading, onNavigate, role, signupRequests, submissions }) {
  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])

  const roleLevel = { VILLAGE_ADMIN: 1, TALUK_ADMIN: 2, DISTRICT_ADMIN: 3, STATE_ADMIN: 4, SUPER_ADMIN: null }
  const myLevel = roleLevel[role]
  const actionableStatuses = ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'FORWARDED_TO_TALUK', 'FORWARDED_TO_DISTRICT', 'FORWARDED_TO_STATE']

  const timeStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0
    let yearCount = 0

    submissions.forEach((sub) => {
      const d = new Date(sub.createdAt || sub.submittedAt || Date.now())
      if (d >= today) todayCount++
      if (d >= startOfWeek) weekCount++
      if (d >= startOfMonth) monthCount++
      if (d >= startOfYear) yearCount++
    })
    return { todayCount, weekCount, monthCount, yearCount }
  }, [submissions])

  const stats = useMemo(() => {
    let baseStats = []
    if (isAdmin) {
      const pendingReview = submissions.filter((submission) => {
        if (!actionableStatuses.includes(submission.status)) return false
        if (myLevel === null) return true
        return submission.currentReviewLevel <= myLevel
      }).length
      const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
      const returned = submissions.filter((submission) => submission.status === 'NEEDS_CORRECTION').length
      baseStats = [
        ['Pending Signups', pendingRequests.length, Users, 'amber', 'Requires Review', { mainTab: 'signups', appFilter: 'ALL' }],
        ['Applications to Review', pendingReview, Activity, 'blue', 'Action Needed', { mainTab: 'applications', appFilter: 'UNDER_REVIEW' }],
        ['Returned Applications', returned, ClipboardCheck, 'rose', 'Needs Fix', { mainTab: 'applications', appFilter: 'NEEDS_CORRECTION' }],
        ['Approved Applications', approved, BadgeCheck, 'green', 'Completed', { mainTab: 'applications', appFilter: 'APPROVED' }],
      ]
    } else {
      const needsCorrection = submissions.filter((submission) => ['NEEDS_CORRECTION', 'REJECTED'].includes(submission.status)).length
      const approved = submissions.filter((submission) => submission.status === 'APPROVED').length
      const inProgress = submissions.filter((submission) => ['DRAFT', 'SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'FORWARDED_TO_TALUK', 'FORWARDED_TO_DISTRICT', 'FORWARDED_TO_STATE'].includes(submission.status)).length
      baseStats = [
        ['My Applications', submissions.length, FileText, 'blue', 'Total Submitted', { mainTab: 'applications', appFilter: 'MY_SUBMISSIONS' }],
        ['In Progress', inProgress, Activity, 'amber', 'Under Review', { mainTab: 'applications', appFilter: 'UNDER_REVIEW' }],
        ['Needs Correction', needsCorrection, ClipboardCheck, 'rose', 'Action Required', { mainTab: 'applications', appFilter: 'NEEDS_CORRECTION' }],
        ['Approved Applications', approved, BadgeCheck, 'green', 'Verified', { mainTab: 'applications', appFilter: 'APPROVED' }],
      ]
    }

    return [
      ...baseStats,
      ['Today\'s Applications', timeStats.todayCount, Activity, 'cyan', 'Today', { mainTab: 'applications', appFilter: 'ALL' }],
      ['This Week', timeStats.weekCount, Layers3, 'blue', 'This Week', { mainTab: 'applications', appFilter: 'ALL' }],
      ['This Month', timeStats.monthCount, FileText, 'indigo', 'This Month', { mainTab: 'applications', appFilter: 'ALL' }],
      ['This Year', timeStats.yearCount, History, 'violet', 'This Year', { mainTab: 'applications', appFilter: 'ALL' }],
    ]
  }, [isAdmin, pendingRequests.length, submissions, timeStats])

  return (
    <div className="grid w-full gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value, Icon, tone, subtitle, target]) => (
        <StatCard
          icon={Icon}
          key={label}
          label={label}
          loading={loading}
          onClick={target ? () => onNavigate?.(target.mainTab, target.appFilter) : undefined}
          subtitle={subtitle}
          tone={tone}
          value={value}
        />
      ))}
    </div>
  )
}

function FullWorkPanel({ isAdmin, initialAppFilter = 'ALL', initialMainTab = 'applications', loading, onNewApplication, onRefresh, onSelectSubmission, signupRequests, submissions, user }) {
  const [selectedSignup, setSelectedSignup] = useState(null)
  const [reviewReason, setReviewReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [mainTab, setMainTab] = useState(initialMainTab)
  const [signupTab, setSignupTab] = useState('pending')
  const [appFilter, setAppFilter] = useState(initialAppFilter)
  const [formFilter, setFormFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [areaFilter, setAreaFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('list')
  const { notify } = useNotifications()
  const [appPage, setAppPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [myAppPage, setMyAppPage] = useState(1)
  
  const ITEMS_PER_PAGE = 10
  const currentUserId = useMemo(() => getSession()?.user?.id, [])

  useEffect(() => {
    setAppPage(1)
    setMyAppPage(1)
  }, [appFilter, formFilter, searchQuery, areaFilter, sortBy])

  const formOptions = useMemo(() => {
    const seen = new Map()
    for (const sub of submissions) {
      if (sub.form?.key && !seen.has(sub.form.key)) {
        seen.set(sub.form.key, sub.form.tamilTitle || sub.form.title)
      }
    }
    return [...seen.entries()].map(([key, label]) => ({ key, label }))
  }, [submissions])

  const areaOptions = useMemo(() => {
    const areas = new Set()
    for (const sub of submissions) {
      const district = sub.applicantData?.district || sub.applicantData?.area
      if (typeof district === 'string' && district.trim()) areas.add(district.trim())
    }
    return [...areas].sort((a, b) => a.localeCompare(b))
  }, [submissions])

  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])
  const historyRequests = useMemo(() => signupRequests.filter((item) => item.status !== 'PENDING'), [signupRequests])

  const pendingActionStatuses = ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW', 'FORWARDED_TO_TALUK', 'FORWARDED_TO_DISTRICT', 'FORWARDED_TO_STATE']

  const mySubmissionsCount = useMemo(() => submissions.filter((s) => s.userId === currentUserId || s.user?.id === currentUserId).length, [submissions, currentUserId])
  const underReviewCount = useMemo(() => submissions.filter((s) => pendingActionStatuses.includes(s.status)).length, [submissions])
  const needsCorrectionCount = useMemo(() => submissions.filter((s) => s.status === 'NEEDS_CORRECTION').length, [submissions])
  const approvedCount = useMemo(() => submissions.filter((s) => s.status === 'APPROVED').length, [submissions])
  const rejectedCount = useMemo(() => submissions.filter((s) => s.status === 'REJECTED').length, [submissions])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (appFilter === 'MY_SUBMISSIONS' && sub.userId !== currentUserId && sub.user?.id !== currentUserId) return false
      if (appFilter === 'UNDER_REVIEW' && !pendingActionStatuses.includes(sub.status)) return false
      if (appFilter === 'NEEDS_CORRECTION' && sub.status !== 'NEEDS_CORRECTION') return false
      if (appFilter === 'APPROVED' && sub.status !== 'APPROVED') return false
      if (appFilter === 'REJECTED' && sub.status !== 'REJECTED') return false

      if (formFilter !== 'ALL' && sub.form?.key !== formFilter) return false

      if (areaFilter !== 'ALL') {
        const district = sub.applicantData?.district || sub.applicantData?.area
        if ((typeof district !== 'string' || district.trim() !== areaFilter)) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const appNo = (sub.applicationNo || '').toLowerCase()
        const workerName = (sub.applicantData?.workerName || sub.applicantData?.childName || sub.applicantName || '').toLowerCase()
        const userName = (sub.user?.username || sub.user?.firstName || '').toLowerCase()
        const formTitle = (sub.form?.tamilTitle || sub.form?.title || sub.tamilFormTitle || sub.formTitle || '').toLowerCase()
        const phone = (sub.applicantData?.phone || sub.user?.phone || '').toLowerCase()
        const upi = (sub.paymentReference || sub.paymentData?.upiTransactionId || '').toLowerCase()

        return appNo.includes(q) || workerName.includes(q) || userName.includes(q) || formTitle.includes(q) || phone.includes(q) || upi.includes(q)
      }
      return true
    })
  }, [submissions, appFilter, formFilter, searchQuery, areaFilter, currentUserId])

  const sortedSubmissions = useMemo(() => {
    const list = [...filteredSubmissions]
    const workerName = (sub) => (sub.applicantData?.workerName || sub.applicantData?.childName || sub.applicantName || sub.user?.firstName || sub.user?.username || '').toLowerCase()
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    else if (sortBy === 'name-asc') list.sort((a, b) => workerName(a).localeCompare(workerName(b)))
    else if (sortBy === 'name-desc') list.sort((a, b) => workerName(b).localeCompare(workerName(a)))
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return list
  }, [filteredSubmissions, sortBy])

  const paginatedSubmissions = useMemo(() => {
    const start = (appPage - 1) * ITEMS_PER_PAGE
    return sortedSubmissions.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedSubmissions, appPage])

  const totalPages = Math.ceil(sortedSubmissions.length / ITEMS_PER_PAGE)

  const paginatedPendingRequests = useMemo(() => {
    const start = (pendingPage - 1) * ITEMS_PER_PAGE
    return pendingRequests.slice(start, start + ITEMS_PER_PAGE)
  }, [pendingRequests, pendingPage])

  const totalPendingPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE)

  const paginatedHistoryRequests = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE
    return historyRequests.slice(start, start + ITEMS_PER_PAGE)
  }, [historyRequests, historyPage])

  const totalHistoryPages = Math.ceil(historyRequests.length / ITEMS_PER_PAGE)

  const paginatedMySubmissions = useMemo(() => {
    const start = (myAppPage - 1) * ITEMS_PER_PAGE
    return filteredSubmissions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredSubmissions, myAppPage])

  const totalMyAppPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)

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

  if (!isAdmin) {
    return (
      <Panel>
        <PanelHeader
          eyebrow="Work Panel"
          title="All My Submitted Applications"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#007cba] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]"
                onClick={onNewApplication}
                type="button"
              >
                <FilePlus2 size={14} />
                New Application / புதிய விண்ணப்பம்
              </button>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold border border-slate-200 shadow-2xs">
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'list' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('list')}
                  type="button"
                >
                  List / பட்டியல்
                </button>
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'grid' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('grid')}
                  type="button"
                >
                  Grid / கட்டம்
                </button>
              </div>
            </div>
          }
        />

        {/* Search input for partners / VPP */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TNW-xxxx number, applicant name, phone..."
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className={viewMode === 'grid' ? "grid gap-4 p-4 sm:p-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid gap-3 p-4 sm:p-5"}>
          {paginatedMySubmissions.length ? (
            paginatedMySubmissions.map((submission) => (
              <div
                className={`rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:border-[#007cba] hover:shadow-md ${
                  viewMode === 'list' ? 'p-3.5 sm:py-3 sm:px-4' : 'p-4 flex flex-col justify-between h-full'
                }`}
                key={submission.id}
              >
                {viewMode === 'list' ? (
                  // Tighter, aligned horizontal List item layout
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <p className="break-all font-bold text-slate-950 text-sm">{submission.applicationNo}</p>
                        <StatusPill status={submission.status} />
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{submission.form?.tamilTitle || submission.form?.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {submission.geoUnit?.name || '-'} • Updated: {formatDate(submission.updatedAt)}
                      </p>
                    </div>

                    <button
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#007cba] px-4 py-2 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]"
                      onClick={() => onSelectSubmission?.(submission)}
                      type="button"
                    >
                      <FileText className="shrink-0" size={13} />
                      <span>View Details / காண்க</span>
                    </button>
                  </div>
                ) : (
                  // Elegant vertical Grid item layout
                  <div className="flex flex-col justify-between h-full gap-4">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="break-all font-bold text-slate-950 text-sm">{submission.applicationNo}</p>
                        <StatusPill status={submission.status} />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-700">{submission.form?.tamilTitle || submission.form?.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{submission.geoUnit?.name || '-'}</p>
                      {submission.currentReviewReason && (
                        <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] font-semibold text-rose-800 line-clamp-2">
                          {submission.currentReviewReason}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                      <p className="text-[10px] text-slate-400">Updated: {formatDate(submission.updatedAt)}</p>
                      <button
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#007cba] py-2 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]"
                        onClick={() => onSelectSubmission?.(submission)}
                        type="button"
                      >
                        <FileText className="shrink-0" size={14} />
                        <span>View Details / விவரங்களை காண்க</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState>No applications submitted yet.</EmptyState>
          )}
        </div>

        {totalMyAppPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-4 rounded-b-2xl">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={myAppPage === 1}
              onClick={() => setMyAppPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page <span className="font-bold text-slate-900">{myAppPage}</span> of <span className="font-bold text-slate-900">{totalMyAppPages}</span>
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={myAppPage === totalMyAppPages}
              onClick={() => setMyAppPage((prev) => Math.min(totalMyAppPages, prev + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        )}
      </Panel>
    )
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex rounded-xl bg-slate-200/50 p-1.5 w-full sm:w-auto self-start text-sm font-bold border border-slate-200 shadow-xs">
        <span className="flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg bg-white text-[#007cba] shadow-xs whitespace-nowrap">
          {mainTab === 'applications'
            ? `Applications Queue (${submissions.length})`
            : mainTab === 'signups'
              ? `Signup Requests (${signupRequests.length})`
              : 'Create User'}
        </span>
        {mainTab === 'signups' && user?.role === 'SUPER_ADMIN' && (
          <button
            className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${mainTab === 'create-user' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setMainTab('create-user')}
            type="button"
          >
            Create User
          </button>
        )}
      </div>

      {mainTab === 'signups' && (
      <Panel>
        <PanelHeader
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200 shadow-2xs">
                <button
                  className={`rounded-lg px-3 py-1.5 transition ${signupTab === 'pending' ? 'bg-[#007cba] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setSignupTab('pending')}
                  type="button"
                >
                  Pending ({pendingRequests.length})
                </button>
                <button
                  className={`rounded-lg px-3 py-1.5 transition ${signupTab === 'history' ? 'bg-[#007cba] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setSignupTab('history')}
                  type="button"
                >
                  History ({historyRequests.length})
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold border border-slate-200 shadow-2xs">
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'list' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('list')}
                  type="button"
                >
                  List
                </button>
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'grid' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('grid')}
                  type="button"
                >
                  Grid
                </button>
              </div>
            </div>
          }
          eyebrow="Signup Approval Management"
          title={signupTab === 'pending' ? 'User Signup Requests Queue' : 'Signup Approval & Review History'}
        />


        <div className={viewMode === 'grid' ? "grid gap-4 p-4 sm:p-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid gap-3 p-4 sm:p-5"}>
          {signupTab === 'pending' ? (
            paginatedPendingRequests.length ? (
              paginatedPendingRequests.map((request) => (
                <div className={`rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:border-[#007cba] hover:shadow-md ${
                  viewMode === 'list' ? 'p-3.5 sm:py-3 sm:px-4' : 'p-4 flex flex-col justify-between h-full'
                }`} key={request.id}>
                  {viewMode === 'list' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-950">{request.fullName}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{request.requestNo} - {roleLabels[request.requestedRole] || request.requestedRole}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{request.district} | {request.taluk} | {request.village} • {formatDate(request.createdAt)}</p>
                        <SignupRejectedHistory history={request.rejectedHistory} />
                      </div>
                      <button className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#007cba] px-4 py-2 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]" onClick={() => setSelectedSignup(request)} type="button">
                        View Details
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-950 text-sm">{request.fullName}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-700">{request.requestNo} - {roleLabels[request.requestedRole] || request.requestedRole}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{request.district} | {request.taluk} | {request.village}</p>
                        <p className="mt-1 text-[10px] text-slate-400">Date: {formatDate(request.createdAt)}</p>
                        <SignupRejectedHistory history={request.rejectedHistory} />
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#007cba] py-2 text-center text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]" onClick={() => setSelectedSignup(request)} type="button">
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState>No pending signup requests for your scope.</EmptyState>
            )
          ) : (
            paginatedHistoryRequests.length ? (
              paginatedHistoryRequests.map((request) => (
                <div className={`rounded-2xl border border-slate-200 bg-slate-50/50 shadow-2xs transition hover:border-[#007cba] hover:shadow-md ${
                  viewMode === 'list' ? 'p-3.5 sm:py-3 sm:px-4' : 'p-4 flex flex-col justify-between h-full'
                }`} key={request.id}>
                  {viewMode === 'list' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-950">{request.fullName}</p>
                          <StatusPill status={request.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">{request.requestNo} • {roleLabels[request.requestedRole] || request.requestedRole}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{request.district} | {request.taluk} | {request.village}</p>
                        {request.reviewReason && (
                          <p className="mt-1.5 rounded-lg bg-rose-50 p-2 text-[10px] font-semibold text-rose-800 border border-rose-200">
                            Reason: {request.reviewReason}
                          </p>
                        )}
                        {request.reviewedBy && (
                          <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                            Reviewed by {request.reviewedBy.username} on {formatDate(request.reviewedAt || request.updatedAt)}
                          </p>
                        )}
                      </div>
                      <button className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#007cba] hover:text-[#007cba]" onClick={() => setSelectedSignup(request)} type="button">
                        View Details
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between h-full gap-4">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-950 text-sm">{request.fullName}</p>
                          <StatusPill status={request.status} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-700">{request.requestNo} • {roleLabels[request.requestedRole] || request.requestedRole}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{request.district} | {request.taluk} | {request.village}</p>
                        {request.reviewReason && (
                          <p className="mt-2 rounded-lg bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-800 border border-rose-200">
                            Reason: {request.reviewReason}
                          </p>
                        )}
                        {request.reviewedBy && (
                          <p className="mt-2 text-[10px] font-semibold text-slate-500">
                            Reviewed by {request.reviewedBy.username} on {formatDate(request.reviewedAt || request.updatedAt)}
                          </p>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <button className="inline-flex w-full justify-center items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-[#007cba] hover:text-[#007cba]" onClick={() => setSelectedSignup(request)} type="button">
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState>No processed signup history recorded yet.</EmptyState>
            )
          )}
        </div>
        
        {/* Pagination for Pending Signups */}
        {signupTab === 'pending' && totalPendingPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-4 rounded-b-2xl">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pendingPage === 1}
              onClick={() => setPendingPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page <span className="font-bold text-slate-900">{pendingPage}</span> of <span className="font-bold text-slate-900">{totalPendingPages}</span>
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pendingPage === totalPendingPages}
              onClick={() => setPendingPage((prev) => Math.min(totalPendingPages, prev + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        )}

        {/* Pagination for History Signups */}
        {signupTab === 'history' && totalHistoryPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-4 rounded-b-2xl">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyPage === 1}
              onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page <span className="font-bold text-slate-900">{historyPage}</span> of <span className="font-bold text-slate-900">{totalHistoryPages}</span>
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyPage === totalHistoryPages}
              onClick={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        )}
      </Panel>
      )}

      {mainTab === 'create-user' && user?.role === 'SUPER_ADMIN' && (
        <CreateUserPanel user={user} />
      )}

      {mainTab === 'applications' && (
      <Panel>
        <PanelHeader 
          eyebrow="Work Queue" 
          title="All Applications Review Queue" 
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#007cba] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006090]"
                onClick={onNewApplication}
                type="button"
              >
                <FilePlus2 size={14} />
                New Application / புதிய விண்ணப்பம்
              </button>
              <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-bold border border-slate-200 shadow-2xs">
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'list' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('list')}
                  type="button"
                >
                  List
                </button>
                <button
                  className={`rounded-lg px-2.5 py-1.5 transition ${viewMode === 'grid' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  onClick={() => setViewMode('grid')}
                  type="button"
                >
                  Grid
                </button>
              </div>
            </div>
          }
        />
        
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              onChange={(e) => { setSearchQuery(e.target.value); setAppPage(1); }}
              placeholder="Search TNW-xxxx number, applicant name, phone..."
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              onChange={(e) => { setFormFilter(e.target.value); setAppPage(1); }}
              value={formFilter}
            >
              <option value="ALL">All Forms / அனைத்து படிவங்கள்</option>
              {formOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              onChange={(e) => { setAreaFilter(e.target.value); setAppPage(1); }}
              value={areaFilter}
            >
              <option value="ALL">All Areas / அனைத்து மாவட்டங்கள்</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20"
              onChange={(e) => { setSortBy(e.target.value); setAppPage(1); }}
              value={sortBy}
            >
              <option value="newest">Newest First / புதியது முதலில்</option>
              <option value="oldest">Oldest First / பழையது முதலில்</option>
              <option value="name-asc">Name A-Z / பெயர் A-Z</option>
              <option value="name-desc">Name Z-A / பெயர் Z-A</option>
            </select>

            <span className="ml-auto rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 border border-slate-200">
              {sortedSubmissions.length} applications
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'ALL' ? 'bg-[#007cba] text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('ALL'); setAppPage(1); }}
              type="button"
            >
              All ({submissions.length})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'MY_SUBMISSIONS' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('MY_SUBMISSIONS'); setAppPage(1); }}
              type="button"
            >
              Submitted by Me ({mySubmissionsCount})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'UNDER_REVIEW' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('UNDER_REVIEW'); setAppPage(1); }}
              type="button"
            >
              Under Review ({underReviewCount})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'NEEDS_CORRECTION' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('NEEDS_CORRECTION'); setAppPage(1); }}
              type="button"
            >
              Needs Correction ({needsCorrectionCount})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('APPROVED'); setAppPage(1); }}
              type="button"
            >
              Approved ({approvedCount})
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 transition ${appFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              onClick={() => { setAppFilter('REJECTED'); setAppPage(1); }}
              type="button"
            >
              Rejected ({rejectedCount})
            </button>
          </div>
        </div>

        <div className={viewMode === 'grid' ? "grid gap-4 p-4 sm:p-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid gap-3 p-4 sm:p-5"}>
          {paginatedSubmissions.length ? paginatedSubmissions.map((submission) => {
            const isPendingAction = pendingActionStatuses.includes(submission.status)
            const isSubmittedByMe = submission.userId === currentUserId || submission.user?.id === currentUserId
            return (
              <div className={`rounded-2xl border transition ${isPendingAction ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white shadow-2xs hover:border-[#007cba] hover:shadow-md'} ${
                viewMode === 'list' ? 'p-3.5 sm:p-4' : 'p-4 flex flex-col justify-between h-full'
              }`} key={submission.id}>
                {viewMode === 'list' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all font-bold text-slate-950 text-base">{submission.applicationNo}</p>
                          {isPendingAction && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300/50 shadow-sm">
                              <span className="relative flex size-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex size-1.5 rounded-full bg-amber-500"></span>
                              </span>
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{submission.form?.tamilTitle || submission.form?.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Applicant: <span className="font-bold text-slate-800">{submission.applicantData?.workerName || submission.user?.firstName || submission.user?.username || 'Applicant'}</span>
                        </p>
                        <SubmissionSourceLine submission={submission} />
                        <p className="mt-0.5 text-[11px] text-slate-400">Updated: {formatDate(submission.updatedAt)}</p>
                      </div>
                      <div className="shrink-0">
                        <StatusPill status={submission.status} />
                      </div>
                    </div>
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#007cba] px-4 py-2.5 text-center text-xs font-bold text-white shadow-md transition hover:bg-[#006090]"
                      onClick={() => onSelectSubmission?.(submission)}
                      type="button"
                    >
                      <FileText className="shrink-0" size={15} />
                      <span>View &amp; Review Application / விவரங்களை காண்க</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full gap-4">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="break-all font-bold text-slate-950 text-base">{submission.applicationNo}</p>
                          {isPendingAction && (
                            <span className="inline-flex mt-1 items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300/50 shadow-sm">
                              <span className="relative flex size-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex size-1.5 rounded-full bg-amber-500"></span>
                              </span>
                              Action Required
                            </span>
                          )}
                        </div>
                        <StatusPill status={submission.status} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700 line-clamp-2">{submission.form?.tamilTitle || submission.form?.title}</p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Applicant: <span className="font-bold text-slate-800">{submission.applicantData?.workerName || submission.user?.firstName || submission.user?.username || 'Applicant'}</span>
                      </p>
                      <SubmissionSourceLine submission={submission} />
                      <p className="mt-1 text-[10px] text-slate-400">Updated: {formatDate(submission.updatedAt)}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#007cba] px-4 py-2 text-center text-xs font-bold text-white shadow-md transition hover:bg-[#006090]"
                        onClick={() => onSelectSubmission?.(submission)}
                        type="button"
                      >
                        <FileText className="shrink-0" size={14} />
                        <span>View / காண்க</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          }) : (
            <EmptyState>No applications matching filter / search.</EmptyState>
          )}
        </div>


        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 p-4 rounded-b-2xl">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={appPage === 1}
              onClick={() => setAppPage((prev) => Math.max(1, prev - 1))}
              type="button"
            >
              ← Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page <span className="font-bold text-slate-900">{appPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={appPage === totalPages}
              onClick={() => setAppPage((prev) => Math.min(totalPages, prev + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        )}
      </Panel>
      )}

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

function PaymentReceiptPlaceholder() {
  return (
    <section id="payment-receipt" className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Payment Receipt / கட்டண ரசீது</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">Payment Receipt</h2>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center sm:p-16">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba]">
          <ReceiptText size={28} />
        </span>
        <p className="text-sm font-bold text-slate-900">Payment Receipt / கட்டண ரசீது</p>
        <p className="max-w-md text-xs leading-6 text-slate-500">
          This section is under preparation. Payment receipts for submitted applications will be available here soon. /
          இந்த பிரிவு தயாரிப்பில் உள்ளது. சமர்ப்பிக்கப்பட்ட விண்ணப்பங்களுக்கான கட்டண ரசீதுகள் விரைவில் இங்கே கிடைக்கும்.
        </p>
      </div>
    </section>
  )
}

export default function DashboardPage() {
  if (!isAuthenticated()) return <AuthRequired />
  const [user, setUser] = useState(() => getSession()?.user)
  const isAdmin = adminRoles.has(user?.role)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard-overview')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(() => getProfilePhoto(user))
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null)
  const [workPanelView, setWorkPanelView] = useState({ mainTab: 'applications', appFilter: 'ALL' })
  const [workPanelKey, setWorkPanelKey] = useState(0)

  const dashboardCacheKey = `tn_nalavariyam_dashboard_${getSession()?.user?.id || 'guest'}`
  const cachedDashboard = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(dashboardCacheKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [dashboardCacheKey])

  const [signupRequests, setSignupRequests] = useState(cachedDashboard?.signupRequests || [])
  const [submissions, setSubmissions] = useState(cachedDashboard?.submissions || [])
  const [hierarchyOverview, setHierarchyOverview] = useState(cachedDashboard?.hierarchy || null)
  const [loading, setLoading] = useState(!cachedDashboard)
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      if (!cachedDashboard) setLoading(true)

      try {
        const meRes = await api.get('/auth/me')
        if (meRes.data?.user) {
          updateSessionUser(meRes.data.user)
          setUser(meRes.data.user)
        }
      } catch {
        // Fallback to local session user
      }

      if (isAdmin) {
        const [signupResponse, submissionResponse, hierarchyResponse] = await Promise.all([
          api.get('/auth/signup-requests'),
          api.get('/applications/submissions'),
          api.get('/admin/hierarchy-applications'),
        ])
        setSignupRequests(signupResponse.data.requests || [])
        setSubmissions(submissionResponse.data.submissions || [])
        setHierarchyOverview(hierarchyResponse.data.hierarchy || null)
        try {
          sessionStorage.setItem(
            dashboardCacheKey,
            JSON.stringify({
              signupRequests: signupResponse.data.requests || [],
              submissions: submissionResponse.data.submissions || [],
              hierarchy: hierarchyResponse.data.hierarchy || null,
            })
          )
        } catch {
          // Cache full, ignore
        }
      } else {
        const response = await api.get('/applications/submissions')
        setSubmissions(response.data.submissions || [])
        setHierarchyOverview(null)
        try {
          sessionStorage.setItem(
            dashboardCacheKey,
            JSON.stringify({ submissions: response.data.submissions || [] })
          )
        } catch {
          // Cache full, ignore
        }
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
  }, [cachedDashboard, dashboardCacheKey, isAdmin, notify])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const syncProfilePhoto = () => {
      const u = getSession()?.user
      setUser(u)
      setProfilePhotoUrl(getProfilePhoto(u))
    }
    syncProfilePhoto()
    window.addEventListener('authchange', syncProfilePhoto)
    window.addEventListener('storage', syncProfilePhoto)
    return () => {
      window.removeEventListener('authchange', syncProfilePhoto)
      window.removeEventListener('storage', syncProfilePhoto)
    }
  }, [])

  const reviewApplication = useCallback(async (submission, status, reason = '') => {
    try {
      const response = await api.patch(`/applications/submissions/${submission.id}/review`, {
        status,
        reason,
      })
      const resolvedStatus = response.data?.submission?.status || status
      notify({
        type: 'success',
        title: 'Application Updated',
        message: `Application ${submission.applicationNo} updated to ${resolvedStatus}.`,
      })
      loadDashboard()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Review Failed',
        message: error.response?.data?.message || 'Could not update application review.',
      })
      throw error
    }
  }, [loadDashboard, notify])

  const handleLogout = useCallback(() => {
    clearSession()
    navigate('/login')
  }, [])

  const navigateToWorkPanel = useCallback((mainTab, appFilter) => {
    setWorkPanelView({ mainTab, appFilter })
    setWorkPanelKey((key) => key + 1)
    setActiveTab('work-panel')
  }, [])

  const handleSidebarNav = useCallback((tabId) => {
    if (tabId === 'work-panel') {
      navigateToWorkPanel('applications', 'ALL')
      return
    }
    if (tabId === 'signup-queue') {
      navigateToWorkPanel('signups', 'ALL')
      return
    }
    setActiveTab(tabId)
  }, [navigateToWorkPanel])

  const navLabels = {
    'dashboard-overview': 'My Dashboard / என் டாஷ்போர்டு',
    'new-application': 'New Application / புதிய விண்ணப்பம்',
    'work-panel': 'Applications / விண்ணப்பங்கள்',
    'signup-queue': 'Signup Requests / பதிவு கோரிக்கைகள்',
    'check-status': 'Check Status / நிலையை சரிபார்க்க',
    'payment-receipt': 'Payment Receipt / பண ரசீது',
    'profile-image': 'Profile / சுயவிவரம்',
  }

  const activeNavId =
    activeTab === 'work-panel' ? (workPanelView.mainTab === 'signups' ? 'signup-queue' : 'work-panel') : activeTab

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 lg:flex-row">
      <DashboardSidebar
        activeTab={activeNavId}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((current) => !current)}
        onNavigate={handleSidebarNav}
        user={user}
      />

      <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto p-3 sm:p-5 lg:h-screen lg:p-6 xl:p-8">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3.5 shadow-sm backdrop-blur sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#007cba]">TN NALAVARIYAM</p>
            <p className="truncate text-lg font-bold leading-tight text-slate-950 sm:text-xl">{navLabels[activeNavId] || 'Dashboard'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-2 pr-4 sm:flex">
              {profilePhotoUrl ? (
                <img alt={getUserDisplayName(user)} className="size-14 shrink-0 rounded-xl object-cover ring-2 ring-[#007cba]/30" src={profilePhotoUrl} />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#007cba] text-base font-black text-white">
                  {getUserInitials(user)}
                </div>
              )}
              <div className="min-w-0">
                <p className="max-w-44 truncate text-base font-bold leading-tight text-slate-950">{getUserDisplayName(user)}</p>
                <p className="text-xs font-bold leading-tight text-[#007cba]">{roleLabels[user?.role] || user?.role}</p>
                <p className="flex items-center gap-1 text-xs font-semibold leading-tight text-slate-500">
                  <MapPin size={11} />
                  <span className="max-w-40 truncate">{getJurisdictionName(user)}</span>
                </p>
              </div>
            </div>
            <button
              aria-label="Refresh"
              className="inline-flex size-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-950 text-white shadow-xs transition hover:bg-slate-800"
              onClick={() => loadDashboard()}
              title="Refresh / புதுப்பிக்க"
              type="button"
            >
              <RefreshCw size={18} />
            </button>
            <button
              aria-label="Logout"
              className="inline-flex size-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 shadow-xs transition hover:bg-rose-100"
              onClick={handleLogout}
              title="Logout / வெளியேறு"
              type="button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {loading && activeTab === 'dashboard-overview' ? (
          <DashboardSkeleton />
        ) : activeTab === 'dashboard-overview' && (
          <>
            {/* Header Banner */}
            <section id="dashboard-overview" className="w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">User Dashboard / பயனர் டாஷ்போர்டு</p>
              <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-slate-950">My Dashboard</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Welcome back, <span className="font-bold text-slate-900">{getUserDisplayName(user)}</span> ({roleLabels[user?.role] || user?.role}).
              </p>
            </section>

            {/* 1. METRICS / STAT CARDS BAR FIRST */}
            <section id="dashboard-metrics" className="w-full">
              <MetricCardsBar
                isAdmin={isAdmin}
                loading={loading}
                onNavigate={navigateToWorkPanel}
                role={user?.role}
                signupRequests={signupRequests}
                submissions={submissions}
              />
            </section>

            {/* 2. FULL HIERARCHY BELOW THE CARDS */}
            {isAdmin && (
              <section id="dashboard-hierarchy" className="w-full">
                <HierarchyApplicationsPanel
                  hierarchy={hierarchyOverview}
                  loading={loading}
                  onSelectSubmission={setSelectedSubmissionDetails}
                  onRefresh={loadDashboard}
                  submissions={submissions}
                />
              </section>
            )}
          </>
        )}

        {activeTab === 'new-application' && <NewApplicationList />}

        {activeTab === 'work-panel' && (
          <FullWorkPanel
            initialAppFilter={workPanelView.appFilter}
            initialMainTab={workPanelView.mainTab}
            isAdmin={isAdmin}
            key={workPanelKey}
            loading={loading}
            onNewApplication={() => setActiveTab('new-application')}
            onRefresh={loadDashboard}
            onSelectSubmission={setSelectedSubmissionDetails}
            signupRequests={signupRequests}
            submissions={submissions}
            user={user}
          />
        )}

        {activeTab === 'profile-image' && (
          <UserImageCard onProfilePhotoChange={setProfilePhotoUrl} onUserUpdated={updateSessionUser} user={user} />
        )}

        {activeTab === 'payment-receipt' && <PaymentReceiptPlaceholder />}

        {activeTab === 'check-status' && (
          <section id="check-status">
            <CheckStatusPanel onSelectSubmission={setSelectedSubmissionDetails} />
          </section>
        )}

        {selectedSubmissionDetails && (
          <SubmissionDetailsModal
            onClose={() => setSelectedSubmissionDetails(null)}
            onReview={isAdmin ? reviewApplication : undefined}
            submission={selectedSubmissionDetails}
            viewerRole={user?.role}
          />
        )}
      </main>
    </div>
  )
}
