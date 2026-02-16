import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import {
  listAttendance,
  markAttendance,
} from '../api/hrms'
import type { AttendanceRecord, AttendanceStatus } from '../api/hrms'
import { useToast } from '../components/ToastProvider'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function AttendancePage() {
  const { showToast } = useToast()
  const params = useParams()
  const employeeId = params.employeeId ? decodeURIComponent(params.employeeId) : ''

  const [rows, setRows] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [status, setStatus] = useState<'' | AttendanceStatus>('')

  const [markDate, setMarkDate] = useState<string>(todayISO())
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>('Present')
  const [saving, setSaving] = useState(false)

  const presentCount = useMemo(
    () => rows.filter((r) => r.status === 'Present').length,
    [rows],
  )

  async function refresh() {
    if (!employeeId) return
    setLoading(true)
    setError(null)
    try {
      const data = await listAttendance({
        employee_id: employeeId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: status || undefined,
      })
      setRows(data)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load attendance'
      setError(msg)
      showToast({ title: 'Attendance error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  async function onMark(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) return
    setSaving(true)
    try {
      await markAttendance({ employee_id: employeeId, date: markDate, status: markStatus })
      showToast({ title: 'Attendance saved', message: `${employeeId} • ${markDate} • ${markStatus}` })
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to mark attendance'
      showToast({ title: 'Mark failed', message: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Attendance</h2>
            <div className="muted" style={{ fontSize: 13 }}>
              Employee: <span style={{ fontWeight: 750 }}>{employeeId || '—'}</span>
              {rows.length ? (
                <>
                  {' '}
                  • <span style={{ fontWeight: 750 }}>{presentCount}</span> present day(s) in this view
                </>
              ) : null}
            </div>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <Link className="btn" to="/employees">
              Back
            </Link>
            <button className="btn" onClick={refresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
        <div className="cardBody">
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="field">
              <div className="label">Start date</div>
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" />
            </div>
            <div className="field">
              <div className="label">End date</div>
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" />
            </div>
            <div className="field">
              <div className="label">Status</div>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="">All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="field" style={{ alignSelf: 'end' }}>
              <button className="btn btnPrimary" onClick={refresh} type="button" disabled={loading}>
                Apply filters
              </button>
            </div>
          </div>

          {loading ? <div className="muted">Loading attendance…</div> : null}
          {error ? <div className="muted">{error}</div> : null}

          {!loading && !error && rows.length === 0 ? (
            <div className="muted">No attendance records found for this employee (with the current filters).</div>
          ) : null}

          {!loading && !error && rows.length > 0 ? (
            <div className="tableWrap" aria-label="Attendance table">
              <table style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Recorded at</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.date}-${r.created_at}`}>
                      <td style={{ fontWeight: 700 }}>{r.date}</td>
                      <td>
                        <span
                          className={`pill ${r.status === 'Present' ? 'pillPresent' : 'pillAbsent'}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="muted">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Mark attendance</h2>
            <div className="muted" style={{ fontSize: 13 }}>
              One mark per employee per date.
            </div>
          </div>
        </div>
        <div className="cardBody">
          <form onSubmit={onMark}>
            <div className="field" style={{ marginBottom: 12 }}>
              <div className="label">Date</div>
              <input value={markDate} onChange={(e) => setMarkDate(e.target.value)} type="date" required />
            </div>
            <div className="field">
              <div className="label">Status</div>
              <select value={markStatus} onChange={(e) => setMarkStatus(e.target.value as AttendanceStatus)}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="actions">
              <button className="btn btnPrimary" type="submit" disabled={saving || !employeeId}>
                {saving ? 'Saving…' : 'Save attendance'}
              </button>
            </div>
            {!employeeId ? <div className="muted">Missing employee ID.</div> : null}
          </form>
        </div>
      </div>
    </div>
  )
}

