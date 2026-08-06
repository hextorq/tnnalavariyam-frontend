import { CheckCircle2, Eye, LoaderCircle, Plus, Printer, ReceiptText, RefreshCw, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  return user?.fullName || user?.firstName || user?.name || user?.username || 'User'
}

function BillPrintSheet({ user, bill }) {
  const items = Array.isArray(bill.items) ? bill.items : []
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <div className="bill-print-sheet mx-auto w-full max-w-[210mm] rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-2xl sm:px-10 sm:py-8 min-h-[1123px] text-slate-900">
      {/* Letterhead navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#007cba] pb-4">
        <div className="flex items-center gap-3 pr-2">
          <img alt="Logo" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover" src={images.logoLeft} />
          <div className="min-w-0 max-w-[calc(210mm-8rem)]">
            <p className="text-sm font-black leading-snug text-slate-950 sm:text-lg">{brandName}</p>
            <p className="mt-1 text-xs font-semibold leading-snug text-slate-600">{associationName}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-950 px-4 py-2 text-right text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill No / பில் எண்</p>
          <p className="text-sm font-black tracking-wide text-[#f0ad4e]">{bill.billNo}</p>
        </div>
      </div>

      {/* Issued by (logged-in user contact) */}
      <div className="mt-4 grid gap-1 border-b border-slate-200 pb-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Issued By / வழங்கியவர்</p>
        <p className="font-extrabold text-slate-950">{userDisplayName(user)} <span className="font-semibold text-[#007cba]">({ROLES[user?.role] || user?.role || '-'})</span></p>
        {user?.addressLine && <p className="max-w-xl leading-5 text-slate-700">{user.addressLine}{user?.pincode ? `, ${user.pincode}` : ''}</p>}
        <p className="text-slate-700">
          Phone: <span className="font-bold">{user?.phone || '-'}</span>
          <span className="mx-2 text-slate-300">|</span>
          Email: <span className="font-bold">{user?.email || '-'}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Date / தேதி: <span className="text-slate-700">{formatDate(bill.createdAt)}</span></p>
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
          <p className="mt-1.5 font-extrabold text-slate-900">{userDisplayName(user)}</p>
          <p className="text-xs font-bold text-[#007cba]">{ROLES[user?.role] || user?.role || '-'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentReceiptPage() {
  const { notify } = useNotifications()
  const user = useMemo(() => getSession()?.user || {}, [])
  const userName = userDisplayName(user)

  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [rows, setRows] = useState([newEmptyRow(), newEmptyRow()])
  const [printBill, setPrintBill] = useState(null)
  const [printOpen, setPrintOpen] = useState(false)

  const total = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [rows])
  const hasValidRows = rows.some((row) => String(row.particulars || '').trim() && Number(row.amount) > 0)

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
            <h3 className="mt-1 text-lg font-bold text-slate-950">Created Bills ({bills.length})</h3>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Bill No / பில் எண்</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Date / தேதி</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Entries</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Total Amount</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const count = Array.isArray(bill.items) ? bill.items.length : 0
                  return (
                    <tr className="border-b border-slate-100 transition hover:bg-[#eef8ff]/60" key={bill.id}>
                      <td className="px-4 py-3 font-black text-[#007cba]">{bill.billNo}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">{formatDate(bill.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{count} entries</td>
                      <td className="px-4 py-3 text-right text-base font-black text-slate-950">{money(bill.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                            onClick={() => openPreview(bill)}
                            type="button"
                          >
                            <Eye size={13} />
                            Preview / முன்னோட்டம்
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                            onClick={() => handlePrint(bill)}
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
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#007cba]">Preview & Print / முன்னோட்டம் மற்றும் அச்சிடு</p>
                <h2 className="text-lg font-extrabold text-slate-950">{printBill.billNo}</h2>
              </div>
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
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4">
              <BillPrintSheet bill={printBill} user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}