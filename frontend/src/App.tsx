import { NavLink, Route, Routes } from 'react-router-dom'
import { getApiBaseUrl } from './api/http'
import { ToastProvider } from './components/ToastProvider'
import AttendancePage from './pages/AttendancePage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'

function cxNav({ isActive }: { isActive: boolean }) {
  return isActive ? 'active' : ''
}

export default function App() {
  return (
    <ToastProvider>
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <div className="brandTitle">HRMS Lite</div>
            <div className="brandSub">Employees • Attendance • Admin tool</div>
          </div>
          <div className="nav" aria-label="Primary navigation">
            <NavLink to="/" className={cxNav} end>
              Dashboard
            </NavLink>
            <NavLink to="/employees" className={cxNav}>
              Employees
            </NavLink>
          </div>
        </div>

        <div style={{ marginBottom: 12 }} className="muted">
          API: <span style={{ fontWeight: 700 }}>{getApiBaseUrl()}</span>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:employeeId" element={<AttendancePage />} />
          <Route
            path="*"
            element={
              <div className="card">
                <div className="cardHeader">
                  <h2 className="cardTitle">Page not found</h2>
                </div>
                <div className="cardBody">
                  <div className="muted">That route doesn’t exist.</div>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </ToastProvider>
  )
}

