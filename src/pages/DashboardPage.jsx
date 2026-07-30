import AuthRequired from '../components/AuthRequired.jsx'
import { applicationForms } from '../data/applicationForms.js'
import { api } from '../lib/api.js'
import { getSession, isAuthenticated } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { Link } from '../lib/router.jsx'
import { useCallback, useEffect, useMemo, useState } from 'react'

const adminRoles = new Set(['SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'TALUK_ADMIN', 'VILLAGE_ADMIN'])

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  STATE_ADMIN: 'State Admin',
  DISTRICT_ADMIN: 'District Admin',
  TALUK_ADMIN: 'Taluk Admin',
  VILLAGE_ADMIN: 'Village Admin',
  PARTNER: 'Village Partner',
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('en-IN')
}

function StatusPill({ status }) {
  const color = status === 'APPROVED'
    ? 'bg-green-50 text-green-800'
    : status === 'REJECTED' || status === 'NEEDS_CORRECTION'
      ? 'bg-red-50 text-red-800'
      : 'bg-amber-50 text-amber-900'

  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${color}`}>{status || '-'}</span>
}

function AdminPanel({ user }) {
  const [overview, setOverview] = useState(null)
  const [signupRequests, setSignupRequests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
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
      ['Total Users', overview?.users?.total ?? 0],
      ['Active Users', overview?.users?.active ?? 0],
      ['Pending Signups', pendingSignups],
      ['Pending Review', pendingApplications],
      ['Applications', submissions.length],
      ['Geo Units', (overview?.geoUnits || []).reduce((total, item) => total + item.count, 0)],
      ['Active Forms', overview?.forms?.active ?? applicationForms.length],
      ['Signup Requests', signupRequests.length],
    ]
  }, [overview, signupRequests, submissions])

  return (
    <section className="grid gap-6">
      <div className="bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Admin Panel</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950 sm:text-3xl">நிர்வாக டாஷ்போர்டு</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {user?.username || user?.email} - {roleLabels[user?.role] || user?.role}
            </p>
          </div>
          <button className="border border-neutral-300 px-4 py-2 text-sm font-bold" onClick={loadDashboard} type="button">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div className="bg-white p-4 shadow-sm" key={label}>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-950">{loading ? '-' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
        <section className="min-w-0 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950">User Control Overview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(overview?.users?.byRole || []).map((item) => (
              <div className="border border-neutral-200 p-3" key={item.role}>
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{roleLabels[item.role] || item.role}</p>
                <p className="mt-2 text-2xl font-bold text-neutral-950">{item.count}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Scope</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.users?.recent || []).map((recentUser) => (
                  <tr className="border-b border-neutral-100" key={recentUser.id}>
                    <td className="px-3 py-3">
                      <p className="font-bold text-neutral-950">{recentUser.username}</p>
                      <p className="text-xs text-neutral-500">{recentUser.email}</p>
                    </td>
                    <td className="px-3 py-3">{roleLabels[recentUser.role] || recentUser.role}</td>
                    <td className="px-3 py-3">{recentUser.scope?.name || 'All Tamil Nadu'}</td>
                    <td className="px-3 py-3"><StatusPill status={recentUser.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-3 py-3">{formatDate(recentUser.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950">System Coverage</h2>
          <div className="mt-4 grid gap-3">
            {(overview?.geoUnits || []).map((item) => (
              <div className="flex items-center justify-between border border-neutral-200 p-3" key={item.type}>
                <span className="text-sm font-bold text-neutral-700">{item.type}</span>
                <span className="text-xl font-bold text-neutral-950">{item.count}</span>
              </div>
            ))}
            <div className="border border-neutral-200 p-3">
              <p className="text-sm font-bold text-neutral-700">Application Forms</p>
              <p className="mt-1 text-xl font-bold text-neutral-950">{overview?.forms?.active ?? applicationForms.length} active / {overview?.forms?.total ?? applicationForms.length} total</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950">Signup Approvals</h2>
          <div className="mt-4 grid gap-3">
            {signupRequests.length ? signupRequests.slice(0, 8).map((request) => (
              <div className="border border-neutral-200 p-3" key={request.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-950">{request.fullName}</p>
                    <p className="mt-1 text-sm text-neutral-600">{request.phone} - {request.email}</p>
                    <p className="mt-1 text-sm text-neutral-600">{roleLabels[request.requestedRole] || request.requestedRole} - {request.scope?.name || request.village || request.taluk || request.district}</p>
                  </div>
                  <StatusPill status={request.status} />
                </div>
                {request.status === 'PENDING' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="bg-green-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewSignup(request, 'APPROVED')} type="button">Approve</button>
                    <button className="bg-red-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewSignup(request, 'REJECTED')} type="button">Reject</button>
                  </div>
                )}
              </div>
            )) : (
              <p className="border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">No signup requests found.</p>
            )}
          </div>
        </section>

        <section className="min-w-0 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-neutral-950">Application Review</h2>
          <div className="mt-4 grid gap-3">
            {submissions.length ? submissions.slice(0, 8).map((submission) => (
              <div className="border border-neutral-200 p-3" key={submission.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-neutral-950">{submission.applicationNo}</p>
                    <p className="mt-1 text-sm text-neutral-600">{submission.form?.tamilTitle || submission.form?.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{submission.user?.firstName || submission.user?.username || 'Applicant'} - {submission.geoUnit?.name || '-'}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDate(submission.updatedAt)}</p>
                  </div>
                  <StatusPill status={submission.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="border border-neutral-300 px-3 py-2 text-xs font-bold" onClick={() => reviewApplication(submission, 'UNDER_REVIEW')} type="button">Start Review</button>
                  <button className="bg-green-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'APPROVED')} type="button">Approve</button>
                  <button className="bg-amber-500 px-3 py-2 text-xs font-bold text-neutral-950" onClick={() => reviewApplication(submission, 'NEEDS_CORRECTION')} type="button">Return</button>
                  <button className="bg-red-600 px-3 py-2 text-xs font-bold text-white" onClick={() => reviewApplication(submission, 'REJECTED')} type="button">Reject</button>
                </div>
              </div>
            )) : (
              <p className="border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">No applications found.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

function ServicePortal() {
  return (
    <section className="grid gap-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#007cba]">Online Service Portal</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">விண்ணப்ப சேவை மையம்</h1>
        <p className="mt-2 max-w-3xl text-neutral-600">
          கீழே உள்ள நலவாரிய சேவைகளில் தேவையான விண்ணப்பத்தை தேர்வு செய்து சமர்ப்பிக்கலாம்.
          விண்ணப்ப எண்ணை பயன்படுத்தி நிலையை தொடர்ந்து பார்க்கலாம்.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-neutral-950">விண்ணப்ப சேவைகள்: {applicationForms.length}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {applicationForms.map((form) => (
            <Link className="min-w-0 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6" key={form.id} to={`/app/forms/${form.id}`}>
              <h2 className="text-lg font-bold sm:text-xl">{form.tamilTitle}</h2>
              <p className="mt-2 text-sm text-neutral-600">{form.title}</p>
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

  return (
    <div className="min-h-screen bg-neutral-100 px-3 py-8 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-8">
        {isAdmin && <AdminPanel user={user} />}
        <ServicePortal />
      </div>
    </div>
  )
}
