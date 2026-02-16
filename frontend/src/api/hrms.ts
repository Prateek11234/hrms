import { apiFetch } from './http'

export type Employee = {
  employee_id: string
  full_name: string
  email: string
  department: string
  created_at: string
}

export type AttendanceStatus = 'Present' | 'Absent'

export type AttendanceRecord = {
  date: string
  status: AttendanceStatus
  created_at: string
}

export type Dashboard = {
  employee_count: number
  attendance_records: number
  today_present: number
  today_absent: number
  today_date: string
}

export function getDashboard(): Promise<Dashboard> {
  return apiFetch('/dashboard')
}

export function listEmployees(): Promise<Employee[]> {
  return apiFetch('/employees')
}

export function createEmployee(payload: {
  employee_id: string
  full_name: string
  email: string
  department: string
}): Promise<Employee> {
  return apiFetch('/employees', { method: 'POST', json: payload })
}

export function deleteEmployee(employeeId: string): Promise<void> {
  return apiFetch(`/employees/${encodeURIComponent(employeeId)}`, { method: 'DELETE' })
}

export function listAttendance(params: {
  employee_id: string
  start_date?: string
  end_date?: string
  status?: AttendanceStatus
}): Promise<AttendanceRecord[]> {
  const qs = new URLSearchParams()
  if (params.start_date) qs.set('start_date', params.start_date)
  if (params.end_date) qs.set('end_date', params.end_date)
  if (params.status) qs.set('status', params.status)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch(`/employees/${encodeURIComponent(params.employee_id)}/attendance${suffix}`)
}

export function markAttendance(payload: {
  employee_id: string
  date: string
  status: AttendanceStatus
}): Promise<AttendanceRecord> {
  return apiFetch(`/employees/${encodeURIComponent(payload.employee_id)}/attendance`, {
    method: 'POST',
    json: { date: payload.date, status: payload.status },
  })
}

