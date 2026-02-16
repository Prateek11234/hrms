import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/http'
import { createEmployee, deleteEmployee, listEmployees } from '../api/hrms'
import type { Employee } from '../api/hrms'
import { useToast } from '../components/ToastProvider'

type FormState = {
  employee_id: string
  full_name: string
  email: string
  department: string
}

const initialForm: FormState = { employee_id: '', full_name: '', email: '', department: '' }

export default function EmployeesPage() {
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)

  const sorted = useMemo(() => employees.slice(), [employees])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const rows = await listEmployees()
      setEmployees(rows)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load employees'
      setError(msg)
      showToast({ title: 'Employees error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await createEmployee({
        employee_id: form.employee_id.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
      })
      showToast({ title: 'Employee added', message: `${created.full_name} (${created.employee_id})` })
      setForm(initialForm)
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to add employee'
      showToast({ title: 'Create failed', message: msg })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(emp: Employee) {
    const ok = window.confirm(`Delete employee ${emp.full_name} (${emp.employee_id})?`)
    if (!ok) return
    try {
      await deleteEmployee(emp.employee_id)
      showToast({ title: 'Employee deleted', message: emp.employee_id })
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to delete employee'
      showToast({ title: 'Delete failed', message: msg })
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h2 className="cardTitle">Employees</h2>
            <div className="muted" style={{ fontSize: 13 }}>
              View all employees and manage attendance.
            </div>
          </div>
          <button className="btn" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
        <div className="cardBody">
          {loading ? <div className="muted">Loading employees…</div> : null}
          {error ? <div className="muted">{error}</div> : null}

          {!loading && !error && sorted.length === 0 ? (
            <div className="muted">
              No employees yet. Add your first employee on the right.
            </div>
          ) : null}

          {!loading && !error && sorted.length > 0 ? (
            <div className="tableWrap" aria-label="Employees table">
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((e) => (
                    <tr key={e.employee_id}>
                      <td style={{ fontWeight: 700 }}>{e.employee_id}</td>
                      <td>{e.full_name}</td>
                      <td className="muted">{e.email}</td>
                      <td>{e.department}</td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
                          <Link className="btn btnPrimary" to={`/employees/${encodeURIComponent(e.employee_id)}`}>
                            Attendance
                          </Link>
                          <button className="btn btnDanger" onClick={() => onDelete(e)}>
                            Delete
                          </button>
                        </div>
                      </td>
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
            <h2 className="cardTitle">Add employee</h2>
            <div className="muted" style={{ fontSize: 13 }}>
              Employee ID must be unique.
            </div>
          </div>
        </div>
        <div className="cardBody">
          <form onSubmit={onCreate}>
            <div className="row">
              <div className="field">
                <div className="label">Employee ID</div>
                <input
                  value={form.employee_id}
                  onChange={(e) => setForm((s) => ({ ...s, employee_id: e.target.value }))}
                  placeholder="e.g. EMP-001"
                  required
                />
              </div>
              <div className="field">
                <div className="label">Full name</div>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
                  placeholder="e.g. Ayesha Khan"
                  required
                />
              </div>
              <div className="field">
                <div className="label">Email</div>
                <input
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="name@company.com"
                  type="email"
                  required
                />
              </div>
              <div className="field">
                <div className="label">Department</div>
                <input
                  value={form.department}
                  onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  required
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn btnPrimary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add employee'}
              </button>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Server-side validation includes: required fields, valid email format, and duplicate handling.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

