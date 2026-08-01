import AuthRequired from '../components/AuthRequired.jsx'
import { DashboardSkeleton } from '../components/SkeletonLoader.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { bilingualName, requestedRoles, tamilNaduDistricts, tamilNaduState } from '../data/signup.js'
import { api } from '../lib/api.js'
import { clearProfilePhoto, clearSession, getProfilePhoto, getSession, isAuthenticated, saveProfilePhoto, updateSessionUser } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { normalizePhone, phoneInputProps } from '../lib/phone.js'
import { Link, navigate } from '../lib/router.jsx'
import { Activity, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Download, ExternalLink, Eye, EyeOff, FileText, History, IdCard, Image as ImageIcon, Layers3, LayoutDashboard, LoaderCircle, LogOut, MapPin, Menu, RefreshCw, Search, ShieldCheck, Upload, User, UserPlus, Users, X } from 'lucide-react'
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
    <div className={`group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${t.cardBorder}`}>
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = [
    { id: 'dashboard-overview', icon: LayoutDashboard, label: 'Dashboard', description: 'Summary & Forms' },
    { id: 'work-panel', icon: BriefcaseBusiness, label: 'Work Panel', description: 'Admin or partner' },
    { id: 'check-status', icon: ClipboardCheck, label: 'Check Status', description: 'Track request' },
  ]

  const profilePhoto = getProfilePhoto(user)

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
                    <div>
                      <p className="text-base">{item.label}</p>
                      <p className="text-xs font-normal opacity-80">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-slate-800 p-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-semibold text-slate-200"
              onClick={() => handleSelectTab('profile-image')}
              type="button"
            >
              <User className="text-[#007cba]" size={16} />
              <span>Profile Update / சுயவிவரம்</span>
            </button>
            <button
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600/90 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setMobileOpen(false)
                onLogout()
              }}
              type="button"
            >
              <LogOut size={16} />
              <span>Logout / வெளியேறு</span>
            </button>
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
                      <span className={`block text-[11px] font-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{item.description}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-800 pt-4">
            {collapsed ? (
              <div className="flex flex-col items-center justify-center pt-2">
                <button
                  className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-2 ring-[#007cba]/50 transition hover:scale-105"
                  onClick={() => onNavigate('profile-image')}
                  title={`${getUserDisplayName(user)} - Profile Update`}
                  type="button"
                >
                  {profilePhoto ? (
                    <img alt="" className="h-full w-full object-cover" src={profilePhoto} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">{getUserInitials(user)}</span>
                  )}
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3.5 backdrop-blur-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-2 ring-[#007cba]/50 shadow-md">
                    {profilePhoto ? (
                      <img alt="" className="h-full w-full object-cover" src={profilePhoto} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">{getUserInitials(user)}</span>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{getUserDisplayName(user)}</p>
                    <p className="truncate text-xs font-medium text-slate-400">{roleLabels[user?.role] || user?.role}</p>
                  </div>
                  <button
                    aria-label="Logout"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 transition hover:bg-rose-600 hover:text-white"
                    onClick={onLogout}
                    type="button"
                  >
                    <LogOut size={15} />
                  </button>
                </div>

                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-[#007cba]/50 hover:bg-slate-800 hover:text-white"
                  onClick={() => onNavigate('profile-image')}
                  type="button"
                >
                  <User className="text-[#007cba]" size={14} />
                  <span>Profile Update</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
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

  return (
    <section id="profile-image" className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Profile Management / சுயவிவர மேலாண்மை</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">Update Profile Photo / சுயவிவர புகைப்படம்</h2>
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
        </div>

        <div className="grid content-start gap-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo Details & Settings</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your profile photo is displayed across your dashboard, sidebar, and application submissions. Uploading a clear passport-size photo ensures quick verification by officials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f0ad4e] px-6 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-[#f78a0c]"
              onClick={openPicker}
              type="button"
            >
              <Upload size={16} />
              Upload New Photo / புதிய புகைப்படம்
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-950"
              onClick={clearImage}
              type="button"
            >
              Reset to Default / இயல்புநிலைக்கு மாற்றுக
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-950">
            <span className="font-bold text-amber-700 shrink-0">⚠️ Disclaimer / குறிப்பு:</span>
            <span>Only JPEG (.jpg, .jpeg) or PNG (.png) images allowed. Maximum file size is strictly 2 MB.</span>
          </div>
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

function SubmissionDetailsModal({ onClose, onReview, submission }) {
  const [reviewReason, setReviewReason] = useState('')
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  const { notify } = useNotifications()

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
            entries.push([key, val])
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
  const district = rawApplicantData.district || submission.geoUnit?.name || '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 p-4 pb-4 sm:p-7 sm:pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#007cba]">Application Review Details</span>
              <StatusPill status={submission.status} />
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
          {['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status) && (
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

          {/* Applicant Details Cards Grid */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#007cba] mb-3 flex items-center gap-2">
              <Users size={16} />
              Applicant Worker Information / தொழிலாளி விவரங்கள்
            </h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <SignupDetailRow label="Worker Name / தொழிலாளி பெயர்" value={workerName} />
              <SignupDetailRow label="Mobile Number / அலைபேசி எண்" value={phone} />
              <SignupDetailRow label="District / மாவட்டம்" value={district} />
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
              <SignupDetailRow label="Fee Amount" value={submission.paymentAmount ? `₹${submission.paymentAmount}` : (submission.paymentData?.amount ? `₹${submission.paymentData.amount}` : 'Free / இலவசம்')} />
              <SignupDetailRow label="UPI Transaction ID / UTR" value={submission.paymentReference || submission.paymentData?.upiTransactionId || 'N/A'} />
            </div>

            {/* Check Payment Checkbox */}
            {onReview && (submission.paymentAmount || submission.paymentReference) && (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-3.5 shadow-2xs">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    checked={paymentVerified}
                    className="mt-0.5 size-5 shrink-0 accent-emerald-600 rounded"
                    onChange={(e) => setPaymentVerified(e.target.checked)}
                    type="checkbox"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Verify UPI Payment Details / கட்டண விவரங்களை சரிபார்த்தேன்
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Check that the UPI Transaction ID ({submission.paymentReference || 'UTR'}) matches the payment receipt image before approving this application.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Officer Verification & Forwarding Controls */}
          {onReview && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Activity size={16} />
                  Officer Verification & Decision Controls / அதிகாரியின் மதிப்பீட்டு முடிவு
                </p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-300">
                  Officer Action Required
                </span>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                <span>Review Remarks / Reason for Return or Rejection (குறிப்புகள்)</span>
                <textarea
                  className="rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20 text-sm font-normal"
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Enter officer remarks or reason if returning/rejecting..."
                  rows={2}
                  value={reviewReason}
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                  disabled={submitting}
                  onClick={() => handleAction('UNDER_REVIEW')}
                  type="button"
                >
                  <span>Start Review / மதிப்பாய்வு</span>
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-600 transition disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => handleAction('NEEDS_CORRECTION')}
                  type="button"
                >
                  <span>Return for Correction / திருத்தம்</span>
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => handleAction('REJECTED')}
                  type="button"
                >
                  <span>Reject / நிராகரிப்பு</span>
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => handleAction('APPROVED')}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  <span>Verify Payment & Approve to Next Level / அடுத்த நிலைக்கு அனுப்புக</span>
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
    <div className="grid w-full gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value, Icon, tone, subtitle]) => (
        <StatCard icon={Icon} key={label} label={label} loading={loading} subtitle={subtitle} tone={tone} value={value} />
      ))}
    </div>
  )
}

function OverviewWorkPanels({ isAdmin, loading, onNavigateWorkPanel, signupRequests, submissions }) {
  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])
  const recentSignups = useMemo(() => pendingRequests.slice(0, 3), [pendingRequests])
  const recentSubmissions = useMemo(() => submissions.slice(0, 3), [submissions])
  const [overviewTab, setOverviewTab] = useState('applications')

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
          title="Recent Applications (Latest)"
        />
        <div className="grid gap-3 p-4 sm:p-5">
          {recentSubmissions.length ? (
            recentSubmissions.map((submission) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs" key={submission.id}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-bold text-slate-950 text-base">{submission.applicationNo}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{submission.form?.tamilTitle || submission.form?.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Updated: {formatDate(submission.updatedAt)}</p>
                    </div>
                    <StatusPill status={submission.status} />
                  </div>
                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#007cba] px-4 py-2.5 text-center text-xs font-bold text-white shadow-md transition hover:bg-[#006090]"
                    onClick={() => onSelectSubmission?.(submission)}
                    type="button"
                  >
                    <FileText className="shrink-0" size={15} />
                    <span>View Application / விவரங்களை காண்க</span>
                  </button>
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
    <div className="flex flex-col w-full gap-6">
      <div className="flex rounded-xl bg-slate-200/50 p-1.5 w-full sm:w-auto self-start text-sm font-bold border border-slate-200 shadow-xs">
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${overviewTab === 'applications' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setOverviewTab('applications')}
          type="button"
        >
          Recent Applications
        </button>
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${overviewTab === 'signups' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setOverviewTab('signups')}
          type="button"
        >
          Recent Signups
        </button>
      </div>

      {overviewTab === 'signups' && (
      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#007cba] hover:underline" onClick={onNavigateWorkPanel} type="button">
              Work Panel ({pendingRequests.length}) <ArrowRight size={14} />
            </button>
          }
          eyebrow="Signup Approval"
          title="User Signup Requests (Recent)"
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
      )}

      {overviewTab === 'applications' && (
      <Panel>
        <PanelHeader
          action={
            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#007cba] hover:underline" onClick={onNavigateWorkPanel} type="button">
              Work Panel <ArrowRight size={14} />
            </button>
          }
          eyebrow="Work Queue"
          title="Applications Queue (Recent)"
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
      )}
    </div>
  )
}

function FullWorkPanel({ isAdmin, loading, onRefresh, onSelectSubmission, signupRequests, submissions, user }) {
  const [selectedSignup, setSelectedSignup] = useState(null)
  const [reviewReason, setReviewReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [mainTab, setMainTab] = useState('applications')
  const [signupTab, setSignupTab] = useState('pending')
  const [appFilter, setAppFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
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
  }, [appFilter, searchQuery])

  const pendingRequests = useMemo(() => signupRequests.filter((item) => item.status === 'PENDING'), [signupRequests])
  const historyRequests = useMemo(() => signupRequests.filter((item) => item.status !== 'PENDING'), [signupRequests])

  const mySubmissionsCount = useMemo(() => submissions.filter((s) => s.userId === currentUserId || s.user?.id === currentUserId).length, [submissions, currentUserId])
  const underReviewCount = useMemo(() => submissions.filter((s) => ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(s.status)).length, [submissions])
  const needsCorrectionCount = useMemo(() => submissions.filter((s) => s.status === 'NEEDS_CORRECTION').length, [submissions])
  const approvedCount = useMemo(() => submissions.filter((s) => s.status === 'APPROVED').length, [submissions])
  const rejectedCount = useMemo(() => submissions.filter((s) => s.status === 'REJECTED').length, [submissions])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (appFilter === 'MY_SUBMISSIONS' && sub.userId !== currentUserId && sub.user?.id !== currentUserId) return false
      if (appFilter === 'UNDER_REVIEW' && !['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(sub.status)) return false
      if (appFilter === 'NEEDS_CORRECTION' && sub.status !== 'NEEDS_CORRECTION') return false
      if (appFilter === 'APPROVED' && sub.status !== 'APPROVED') return false
      if (appFilter === 'REJECTED' && sub.status !== 'REJECTED') return false

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
  }, [submissions, appFilter, searchQuery, currentUserId])

  const paginatedSubmissions = useMemo(() => {
    const start = (appPage - 1) * ITEMS_PER_PAGE
    return filteredSubmissions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredSubmissions, appPage])

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)

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
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${mainTab === 'applications' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setMainTab('applications')}
          type="button"
        >
          Applications Queue ({submissions.length})
        </button>
        <button
          className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 rounded-lg transition ${mainTab === 'signups' ? 'bg-white text-[#007cba] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setMainTab('signups')}
          type="button"
        >
          Signup Requests ({signupRequests.length})
        </button>
        {user?.role === 'SUPER_ADMIN' && (
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
            const isPendingAction = ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'].includes(submission.status)
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
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{submission.form?.tamilTitle || submission.form?.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Applicant: <span className="font-bold text-slate-800">{submission.applicantData?.workerName || submission.user?.firstName || submission.user?.username || 'Applicant'}</span> • {submission.geoUnit?.name || '-'}
                        </p>
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
                            <span className="inline-block mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300">
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
                      <p className="mt-0.5 text-xs text-slate-500">{submission.geoUnit?.name || '-'}</p>
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

export default function DashboardPage() {
  if (!isAuthenticated()) return <AuthRequired />
  const [user, setUser] = useState(() => getSession()?.user)
  const isAdmin = adminRoles.has(user?.role)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard-overview')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(() => getProfilePhoto(user))
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null)

  const [signupRequests, setSignupRequests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const { notify } = useNotifications()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)

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
      await api.patch(`/applications/submissions/${submission.id}/review`, {
        status,
        reason,
      })
      notify({
        type: 'success',
        title: 'Application Updated',
        message: `Application ${submission.applicationNo} updated to ${status}.`,
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
        {loading && activeTab === 'dashboard-overview' ? (
          <DashboardSkeleton />
        ) : activeTab === 'dashboard-overview' && (
          <>
            {/* Header Banner */}
            <section id="dashboard-overview" className="w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">User Dashboard / பயனர் டாஷ்போர்டு</p>
                  <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-slate-950">My Dashboard</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Welcome back, <span className="font-bold text-slate-900">{getUserDisplayName(user)}</span> ({roleLabels[user?.role] || user?.role}).
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-200 text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1 font-bold text-[#007cba]">
                      <MapPin size={15} /> Assigned Jurisdiction / அதிகார வரம்பு:
                    </span>
                    <span className="rounded-md bg-white px-2.5 py-1 font-bold text-slate-900 shadow-2xs border border-slate-200">
                      State: {user?.state || 'Tamil Nadu'}
                    </span>
                    {user?.district && (
                      <span className="rounded-md bg-white px-2.5 py-1 font-bold text-slate-900 shadow-2xs border border-slate-200">
                        District: {user.district}
                      </span>
                    )}
                    {user?.taluk && (
                      <span className="rounded-md bg-white px-2.5 py-1 font-bold text-slate-900 shadow-2xs border border-slate-200">
                        Taluk: {user.taluk}
                      </span>
                    )}
                    {user?.village && (
                      <span className="rounded-md bg-white px-2.5 py-1 font-bold text-slate-900 shadow-2xs border border-slate-200">
                        Village: {user.village}
                      </span>
                    )}
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
              <div className="grid w-full gap-3 p-3 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                onSelectSubmission={setSelectedSubmissionDetails}
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
            onSelectSubmission={setSelectedSubmissionDetails}
            signupRequests={signupRequests}
            submissions={submissions}
            user={user}
          />
        )}

        {activeTab === 'profile-image' && (
          <UserImageCard onProfilePhotoChange={setProfilePhotoUrl} user={user} />
        )}

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
          />
        )}
      </main>
    </div>
  )
}
