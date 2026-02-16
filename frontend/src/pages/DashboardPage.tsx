import { useEffect, useState } from 'react'
import { ApiError } from '../api/http'
import { getDashboard } from '../api/hrms'
import type { Dashboard } from '../api/hrms'
import { useToast } from '../components/ToastProvider'

export default function DashboardPage() {
  const { showToast } = useToast()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await getDashboard()
        if (!alive) return
        setData(d)
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Failed to load dashboard'
        if (!alive) return
        setError(msg)
        showToast({ title: 'Dashboard error', message: msg })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [showToast])

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">Dashboard</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            Quick snapshot of employees and today’s attendance.
          </div>
        </div>
      </div>
      <div className="cardBody">
        {loading ? <div className="muted">Loading dashboard…</div> : null}
        {error ? (
          <div className="muted">
            {error} <button className="btn" onClick={() => window.location.reload()}>Reload</button>
          </div>
        ) : null}
        {!loading && !error && data ? (
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat title="Employees" value={String(data.employee_count)} sub="Total employees in the system" />
            <Stat
              title="Attendance records"
              value={String(data.attendance_records)}
              sub="All attendance marks saved"
            />
            <Stat title="Today: Present" value={String(data.today_present)} sub={`Date: ${data.today_date}`} accent="ok" />
            <Stat title="Today: Absent" value={String(data.today_absent)} sub={`Date: ${data.today_date}`} accent="bad" />
          </div>
        ) : null}
        {!loading && !error && !data ? <div className="muted">No data.</div> : null}
      </div>
    </div>
  )
}

function Stat(props: { title: string; value: string; sub?: string; accent?: 'ok' | 'bad' }) {
  const border =
    props.accent === 'ok'
      ? 'rgba(77, 212, 172, 0.55)'
      : props.accent === 'bad'
        ? 'rgba(255, 107, 107, 0.55)'
        : 'rgba(255,255,255,0.14)'
  const bg =
    props.accent === 'ok'
      ? 'rgba(77, 212, 172, 0.08)'
      : props.accent === 'bad'
        ? 'rgba(255, 107, 107, 0.07)'
        : 'rgba(255,255,255,0.04)'

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        background: bg,
        borderRadius: 16,
        padding: 14,
        minHeight: 88,
      }}
    >
      <div className="muted" style={{ fontSize: 12, fontWeight: 650, letterSpacing: 0.2 }}>
        {props.title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 780, marginTop: 4 }}>{props.value}</div>
      {props.sub ? (
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          {props.sub}
        </div>
      ) : null}
    </div>
  )
}

