import { CheckCircle2, ChevronDown, ChevronRight, Eye, LoaderCircle, Plus, Printer, ReceiptText, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import SearchSelect from '../components/SearchSelect.jsx'
import { associationName, brandName, images } from '../data/siteContent.js'
import { api } from '../lib/api.js'
import { getSession } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'

const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  STATE_ADMIN: 'State Admin',
  DISTRICT_ADMIN: 'District Admin',
  TALUK_ADMIN: 'Taluk Admin',
  VILLAGE_ADMIN: 'Village Admin',
  PARTNER: 'Village Partner',
  CITIZEN: 'Citizen',
}

const money = (value) => {
  const n = Number(value) || 0
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function newEmptyRow() {
  return { particulars: '', quantity: 1, amount: '' }
}

function userDisplayName(user) {
  const firstLast = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  return user?.fullName || user?.name || firstLast || user?.username || 'User'
}

function scopeLabel(scope) {
  if (!scope) return ''
  const typeLabel = {
    VILLAGE: 'Village / கிராமம்',
    TALUK: 'Taluk / தாலுகா',
    DISTRICT: 'District / மாவட்டம்',
    STATE: 'State / மாநிலம்',
  }[scope.type] || scope.type
  const englishName = scope.englishName || scope.name
  return `${typeLabel}: ${scope.tamilName || englishName}${scope.englishName && scope.englishName !== scope.name ? ` / ${scope.englishName}` : ''}`
}

const TYPE_LABELS = {
  STATE: 'State / மாநிலம்',
  DISTRICT: 'District / மாவட்டம்',
  TALUK: 'Taluk / தாலுகா',
  VILLAGE: 'Village / கிராமம்',
}

function BillPrintSheet({ user, bill }) {
  const issuer = bill.user || user
  const items = Array.isArray(bill.items) ? bill.items : []
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <div className="bill-print-sheet mx-auto w-full max-w-[210mm] rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-2xl sm:px-10 sm:py-8 min-h-[1123px] text-slate-900">
      {/* Letterhead navbar */}
      <div className="border-b-2 border-[#007cba] pb-4">
        <div className="flex items-center gap-3 pr-2">
          <img alt="Logo" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover" src={images.logoLeft} />
          <div className="min-w-0">
            <p className="text-sm font-black leading-snug text-slate-950 sm:text-lg">{brandName}</p>
            <p className="mt-1 text-xs font-semibold leading-snug text-slate-600">{associationName}</p>
          </div>
        </div>
      </div>

      {/* Issued by (left) and Bill No (right) in one row */}
      <div className="mt-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-4 text-sm">
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Issued By / வழங்கியவர்</p>
          <p className="font-extrabold text-slate-950">{userDisplayName(issuer)} <span className="font-semibold text-[#007cba]">({ROLES[issuer?.role] || issuer?.role || '-'})</span></p>
          {issuer?.addressLine && <p className="max-w-xl leading-5 text-slate-700">{issuer.addressLine}{issuer?.pincode ? `, ${issuer.pincode}` : ''}</p>}
          <p className="text-slate-700">
            Phone: <span className="font-bold">{issuer?.phone || '-'}</span>
            <span className="mx-2 text-slate-300">|</span>
            Email: <span className="font-bold">{issuer?.email || '-'}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Date / தேதி: <span className="text-slate-700">{formatDate(bill.createdAt)}</span></p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill No / பில் எண்</p>
          <p className="text-sm font-bold text-slate-900">{bill.billNo}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-300">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-black uppercase tracking-wide text-slate-700">
              <th className="w-14 border-b-2 border-slate-300 px-3 py-2.5 text-center">S.No</th>
              <th className="border-b-2 border-slate-300 px-3 py-2.5">Particulars / விவரம்</th>
              <th className="w-24 border-b-2 border-slate-300 px-3 py-2.5 text-center">Qty / எண்ணிக்கை</th>
              <th className="w-32 border-b-2 border-slate-300 px-3 py-2.5 text-right">Amount / தொகை</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr className="border-b border-slate-200" key={index}>
                <td className="px-3 py-2.5 text-center font-bold text-slate-600">{index + 1}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-900">{item.particulars}</td>
                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{Number(item.quantity) || 1}</td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-900">{money(item.amount)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="px-3 py-8 text-center text-slate-400" colSpan={4}>No entries</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total / மொத்தம்</p>
          <p className="text-lg font-black text-slate-950">{money(total)}</p>
        </div>
      </div>

      {/* Signature block */}
      <div className="mt-14 flex justify-end">
        <div className="w-56 text-center">
          <div className="border-b-2 border-slate-400" />
          <p className="mt-1.5 font-extrabold text-slate-900">{userDisplayName(issuer)}</p>
          <p className="text-xs font-bold text-[#007cba]">{ROLES[issuer?.role] || issuer?.role || '-'}</p>
        </div>
      </div>
    </div>
  )
}

function BillTreeNode({ collapsedSet, depth, node, onPreview, onPrint, toggleCollapse }) {
  const key = `u-${node.id}`
  const collapsed = collapsedSet.has(key)
  const billCount = node.totalCount || 0

  return (
    <div>
      <button
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-[#eef8ff]/60 sm:px-4"
        onClick={() => toggleCollapse(key)}
        style={{ paddingLeft: `${8 + depth * 22}px` }}
        type="button"
      >
        {node.children.length > 0 || node.bills.length > 0 ? (
          collapsed ? (
            <ChevronRight className="shrink-0 text-slate-400" size={15} />
          ) : (
            <ChevronDown className="shrink-0 text-slate-400" size={15} />
          )
        ) : (
          <span className="w-[15px] shrink-0" />
        )}
        <span className="min-w-0 truncate text-sm font-bold text-slate-800">
          {node.tamilName || node.name}
          {node.englishName && node.englishName !== node.name && (
            <span className="ml-1.5 font-semibold text-slate-500">/ {node.englishName}</span>
          )}
        </span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{TYPE_LABELS[node.type] || node.type}</span>
        <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-[#007cba]/10 px-2 py-0.5 text-[11px] font-black text-[#007cba]">
          {billCount}
        </span>
      </button>

      {!collapsed && (
        <div>
          {node.children.map((child) => (
            <BillTreeNode
              collapsedSet={collapsedSet}
              depth={depth + 1}
              key={`u-${child.id}`}
              node={child}
              onPreview={onPreview}
              onPrint={onPrint}
              toggleCollapse={toggleCollapse}
            />
          ))}
          {node.bills.length > 0 && <BillTable bills={node.bills} onPreview={onPreview} onPrint={onPrint} />}
        </div>
      )}
    </div>
  )
}

function BillTable({ bills, onPreview, onPrint }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Bill No / பில் எண்</th>
            <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Date / தேதி</th>
            <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Entries</th>
            <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Created By / உருவாக்கியவர்</th>
            <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Total Amount</th>
            <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => {
            const creator = bill.user
            const count = Array.isArray(bill.items) ? bill.items.length : 0
            return (
              <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-[#eef8ff]/60" key={bill.id}>
                <td className="px-4 py-3 font-black text-[#007cba]">{bill.billNo}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-600">{formatDate(bill.createdAt)}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">{count} entries</td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-800">{userDisplayName(creator)}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {ROLES[creator?.role] || creator?.role || '-'}
                    {scopeLabel(creator?.scope) && ` • ${scopeLabel(creator?.scope)}`}
                  </p>
                </td>
                <td className="px-4 py-3 text-right text-base font-black text-slate-950">{money(bill.totalAmount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      onClick={() => onPreview(bill)}
                      type="button"
                    >
                      <Eye size={13} />
                      Preview / முன்னோட்டம்
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                      onClick={() => onPrint(bill)}
                      type="button"
                    >
                      <Printer size={13} />
                      Print / Reprint
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PaymentReceiptPage() {
  const { notify } = useNotifications()
  const user = useMemo(() => getSession()?.user || {}, [])
  const userName = userDisplayName(user)

  const [bills, setBills] = useState([])
  const [geoUnits, setGeoUnits] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ STATE: '', DISTRICT: '', TALUK: '', VILLAGE: '' })
  const [collapsedSet, setCollapsedSet] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [rows, setRows] = useState([newEmptyRow(), newEmptyRow()])
  const [printBill, setPrintBill] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)

  const total = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [rows])
  const hasValidRows = rows.some((row) => String(row.particulars || '').trim() && Number(row.amount) > 0)

  const unitMap = useMemo(() => {
    const map = {}
    for (const unit of geoUnits) map[unit.id] = unit
    return map
  }, [geoUnits])

  const filterOptions = useMemo(() => {
    const opts = { STATE: [], DISTRICT: [], TALUK: [], VILLAGE: [] }
    for (const unit of geoUnits) {
      if (!opts[unit.type] || opts[unit.type].some((o) => o.id === unit.id)) continue
      opts[unit.type].push(unit)
    }
    return opts
  }, [geoUnits])

  const childrenByParent = useMemo(() => {
    const map = {}
    for (const unit of geoUnits) {
      if (!unit.parentId) continue
      if (!map[unit.parentId]) map[unit.parentId] = []
      map[unit.parentId].push(unit)
    }
    return map
  }, [geoUnits])

  const stateOptions = filterOptions.STATE
  const districtOptions = filters.STATE ? (childrenByParent[Number(filters.STATE)] || []).filter((u) => u.type === 'DISTRICT') : []
  const talukOptions = filters.DISTRICT ? (childrenByParent[Number(filters.DISTRICT)] || []).filter((u) => u.type === 'TALUK') : []
  const villageOptions = filters.TALUK ? (childrenByParent[Number(filters.TALUK)] || []).filter((u) => u.type === 'VILLAGE') : []

  const selectOptions = (units) => units.map((unit) => ({
    value: String(unit.id),
    label: unit.tamilName && unit.tamilName !== unit.name
      ? `${unit.tamilName} (${unit.englishName || unit.name})`
      : unit.englishName || unit.name,
  }))

  function handleFilterChange(key, value) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'STATE') {
        next.DISTRICT = ''
        next.TALUK = ''
        next.VILLAGE = ''
      } else if (key === 'DISTRICT') {
        next.TALUK = ''
        next.VILLAGE = ''
      } else if (key === 'TALUK') {
        next.VILLAGE = ''
      }
      return next
    })
  }

  const billTree = useMemo(() => {
    const q = search.trim().toLowerCase()
    const activeFilters = Object.values(filters).filter(Boolean)

    const chainFor = (bill) => {
      const chain = []
      let unit = bill.user?.scope?.id ? unitMap[bill.user.scope.id] : null
      while (unit) {
        chain.unshift(unit)
        unit = unit.parentId ? unitMap[unit.parentId] : null
      }
      return chain
    }

    const matching = bills.filter((bill) => {
      if (q && !String(bill.billNo || '').toLowerCase().includes(q)) return false
      if (!activeFilters.length) return true
      const chain = chainFor(bill)
      return Object.entries(filters).every(([type, id]) => {
        if (!id) return true
        return chain.some((unit) => unit.type === type && String(unit.id) === String(id))
      })
    })

    const root = { id: 0, name: 'All', type: 'ROOT', children: [], bills: [], others: [] }
    const nodeByKey = new Map()

    for (const bill of matching) {
      const chain = chainFor(bill)
      if (!chain.length) {
        root.others.push(bill)
        continue
      }
      let parent = root
      for (const unit of chain) {
        const key = `u-${unit.id}`
        let child = nodeByKey.get(key)
        if (!child) {
          child = { id: unit.id, name: unit.name, tamilName: unit.tamilName, englishName: unit.englishName, type: unit.type, children: [], bills: [], totalCount: 0 }
          nodeByKey.set(key, child)
          parent.children.push(child)
        }
        parent = child
      }
      parent.bills.push(bill)
    }

    const computeCount = (node) => {
      node.totalCount = node.bills.length + node.children.reduce((sum, child) => sum + computeCount(child), 0)
      return node.totalCount
    }
    root.children.forEach(computeCount)

    return { root, totalCount: matching.length }
  }, [bills, unitMap, search, filters])

  function toggleCollapse(key) {
    setCollapsedSet((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function resetFilters() {
    setSearch('')
    setFilters({ STATE: '', DISTRICT: '', TALUK: '', VILLAGE: '' })
  }

  useEffect(() => {
    loadBills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (printOpen) {
      document.body.classList.add('bill-print-active')
      return () => document.body.classList.remove('bill-print-active')
    }
    return undefined
  }, [printOpen])

  async function loadBills() {
    try {
      setLoading(true)
      const response = await api.get('/bills')
      setBills(response.data.bills || [])
      setGeoUnits(response.data.geoUnits || [])
    } catch (error) {
      notify({
        type: 'error',
        title: 'Load Failed / ஏற்ற முடியவில்லை',
        message: error.response?.data?.message || 'பில் பட்டியலை ஏற்ற முடியவில்லை. / Could not load the bills.',
      })
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setRows([newEmptyRow(), newEmptyRow()])
    setModalOpen(true)
  }

  function addRow() {
    setRows((prev) => [...prev, newEmptyRow()])
  }

  function removeRow(index) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  async function finalizeBill(event) {
    event.preventDefault()
    const cleaned = rows
      .filter((row) => String(row.particulars || '').trim() && Number(row.amount) > 0)
      .map((row) => ({
        particulars: String(row.particulars).trim(),
        quantity: Math.max(1, Number(row.quantity) || 1),
        amount: Math.round((Number(row.amount) || 0) * 100) / 100,
      }))

    if (!cleaned.length) {
      notify({
        type: 'warning',
        title: 'Entries Required / உள்ளீடுகள் தேவை',
        message: 'குறைந்தது ஒரு வரியாவது பூர்த்தி செய்யவும். / Please fill at least one full row.',
      })
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/bills', { items: cleaned })
      notify({
        type: 'success',
        title: 'Bill Created / பில் உருவாக்கப்பட்டது',
        message: `${response.data?.bill?.billNo || 'Bill'} created successfully. / வெற்றிகரமாக உருவாக்கப்பட்டது.`,
      })
      setModalOpen(false)
      loadBills()
    } catch (error) {
      notify({
        type: 'error',
        title: 'Create Failed / உருவாக்க முடியவில்லை',
        message: error.response?.data?.message || 'பில் உருவாக்க முடியவில்லை. / Could not create the bill.',
      })
    } finally {
      setSaving(false)
    }
  }

  function openPreview(bill) {
    setPrintBill(bill)
    setPrintOpen(true)
  }

  function printNow() {
    window.print()
  }

  function handlePrint(bill) {
    setPrintBill(bill)
    setPrintOpen(true)
    setTimeout(() => window.print(), 400)
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-[#007cba] focus:ring-2 focus:ring-[#007cba]/20'

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Payment Receipt / கட்டண ரசீது</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">Bill Receipts / பில் ரசீதுகள்</h2>
            <p className="mt-1 text-xs text-slate-500">Create, print and reprint bill receipts / பில் ரசீதுகளை உருவாக்கி அச்சிடவும்.</p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007cba] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090]"
            onClick={openModal}
            type="button"
          >
            <Plus size={18} />
            New Bill / புதிய பில்
          </button>
        </div>
      </section>

      {/* Bill history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#007cba]">Bill History / பில் வரலாறு</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">All Bills ({bills.length})</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Your bills and bills from your area appear here / உங்கள் பில்கள் மற்றும் உங்கள் பகுதியின் பில்கள் இங்கே காணப்படும்
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            onClick={loadBills}
            type="button"
          >
            <RefreshCw size={14} />
            Refresh / புதுப்பிக்க
          </button>
        </div>

        {loading && !bills.length ? (
          <div className="grid gap-3 p-5">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : !bills.length ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba]">
              <ReceiptText size={28} />
            </span>
            <p className="text-sm font-bold text-slate-900">No bills yet / இன்னும் பில்கள் இல்லை</p>
            <p className="max-w-md text-xs leading-6 text-slate-500">
              Click "New Bill" to create your first payment receipt / முதல் பில் உருவாக்க "புதிய பில்" என்று கிளிக் செய்யவும்.
            </p>
          </div>
        ) : (
          <div>
            {/* Search + Filters toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    className={`${inputClass} pl-9`}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill number / பில் எண்ணை தேடவும்"
                    type="text"
                    value={search}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                    onClick={() => setCollapsedSet(new Set())}
                    type="button"
                  >
                    <ChevronDown size={13} />
                    Expand All / முழுவதும் விரி
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                    onClick={() => setCollapsedSet(new Set(billTree.root.children.map((n) => `u-${n.id}`)))}
                    type="button"
                  >
                    <ChevronRight size={13} />
                    Collapse All / முழுவதும் சுருக்கு
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <SearchSelect
                  onChange={(value) => handleFilterChange('STATE', value)}
                  options={selectOptions(stateOptions)}
                  placeholder="State தேடவும் / Search state"
                  value={filters.STATE}
                />
                <SearchSelect
                  disabled={!filters.STATE}
                  onChange={(value) => handleFilterChange('DISTRICT', value)}
                  options={selectOptions(districtOptions)}
                  placeholder={filters.STATE ? 'District தேடவும் / Search district' : 'Select state first / முதலில் மாநிலம் தேர்வு செய்யவும்'}
                  value={filters.DISTRICT}
                />
                <SearchSelect
                  disabled={!filters.DISTRICT}
                  onChange={(value) => handleFilterChange('TALUK', value)}
                  options={selectOptions(talukOptions)}
                  placeholder={filters.DISTRICT ? 'Taluk தேடவும் / Search taluk' : 'Select district first / முதலில் மாவட்டம் தேர்வு செய்யவும்'}
                  value={filters.TALUK}
                />
                <SearchSelect
                  disabled={!filters.TALUK}
                  onChange={(value) => handleFilterChange('VILLAGE', value)}
                  options={selectOptions(villageOptions)}
                  placeholder={filters.TALUK ? 'Village தேடவும் / Search village' : 'Select taluk first / முதலில் தாலுகா தேர்வு செய்யவும்'}
                  value={filters.VILLAGE}
                />
                <button
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                  onClick={resetFilters}
                  type="button"
                >
                  <RefreshCw size={13} />
                  Reset / மீட்டமை
                </button>
              </div>

              <p className="text-[11px] font-semibold text-slate-400">
                Showing {billTree.totalCount} of {bills.length} bills / {bills.length} பில்களில் {billTree.totalCount} காணப்படுகிறது
              </p>
            </div>

            {/* Hierarchy tree */}
            {billTree.totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={26} />
                </span>
                <p className="text-sm font-bold text-slate-900">No matching bills / பொருந்தும் பில்கள் இல்லை</p>
                <button className="text-xs font-bold text-[#007cba] underline" onClick={resetFilters} type="button">
                  Clear filters / வடிகட்டிகளை அழிக்கவும்
                </button>
              </div>
            ) : (
              <div>
                {billTree.root.others.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between bg-slate-50/70 px-4 py-2.5 sm:px-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                        My Bills / எனது பில்கள் <span className="ml-1 text-slate-400">({billTree.root.others.length})</span>
                      </p>
                    </div>
                    <BillTable bills={billTree.root.others} onPreview={openPreview} onPrint={handlePrint} />
                  </div>
                )}
                {billTree.root.children.map((child) => (
                  <BillTreeNode
                    collapsedSet={collapsedSet}
                    depth={0}
                    key={`u-${child.id}`}
                    node={child}
                    onPreview={openPreview}
                    onPrint={handlePrint}
                    toggleCollapse={toggleCollapse}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* New Bill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-md">
          <div className="my-6 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#007cba]">Create Bill / பில் உருவாக்கு</p>
                <h2 className="text-lg font-extrabold text-slate-950 sm:text-xl">New Payment Receipt / புதிய கட்டண ரசீது</h2>
                <p className="mt-0.5 text-xs text-slate-500">Issued by {userName} ({ROLES[user?.role] || user?.role || '-'})</p>
              </div>
              <button
                aria-label="Close"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={finalizeBill}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="w-14 border-b border-slate-200 px-3 py-2.5">S.No</th>
                      <th className="border-b border-slate-200 px-3 py-2.5">Particulars / விவரம்</th>
                      <th className="w-24 border-b border-slate-200 px-3 py-2.5">Qty</th>
                      <th className="w-32 border-b border-slate-200 px-3 py-2.5">Amount / தொகை (₹)</th>
                      <th className="w-14 border-b border-slate-200 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr className="border-b border-slate-100" key={index}>
                        <td className="px-3 py-2.5 text-center font-black text-slate-500">{index + 1}</td>
                        <td className="px-2 py-2.5">
                          <input
                            className={inputClass}
                            onChange={(e) => updateRow(index, 'particulars', e.target.value)}
                            placeholder="Enter particulars / விவரம் உள்ளிடவும்"
                            value={row.particulars}
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            className={inputClass}
                            min={1}
                            onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                            type="number"
                            value={row.quantity}
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            className={inputClass}
                            min={0}
                            onChange={(e) => updateRow(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            type="number"
                            value={row.amount}
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            aria-label="Remove row"
                            className="inline-flex size-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 disabled:opacity-30"
                            disabled={rows.length === 1}
                            onClick={() => removeRow(index)}
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#007cba]/40 bg-[#eef8ff] px-5 py-3 text-sm font-bold text-[#007cba] transition hover:bg-[#dff0ff]"
                onClick={addRow}
                type="button"
              >
                <Plus size={16} />
                Add Row / வரிசை சேர்க்க
              </button>

              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  {bills.length} bill{bills.length === 1 ? '' : 's'} created / உருவாக்கப்பட்ட பில்கள்
                </p>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total Amount / மொத்த தொகை</p>
                  <p className="text-2xl font-black text-slate-950">{money(total)}</p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setModalOpen(false)}
                  type="button"
                >
                  Cancel / ரத்து செய்
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007cba] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#006090] disabled:opacity-50"
                  disabled={saving || !hasValidRows}
                  type="submit"
                >
                  {saving ? <LoaderCircle className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                  {saving ? 'Saving...' : 'Finalize Bill / பில் இறுதி செய்'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Preview Modal */}
      {printOpen && printBill && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-5">
          <div className="w-full max-w-[220mm] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#007cba]">Preview & Print / முன்னோட்டம் மற்றும் அச்சிடு</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-slate-900">{printBill.billNo}</p>
                <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                  onClick={printNow}
                  type="button"
                >
                  <Printer size={16} />
                  Print / அச்சிடு
                </button>
                <button
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                  onClick={() => setPrintOpen(false)}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
              <BillPrintSheet bill={printBill} user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}