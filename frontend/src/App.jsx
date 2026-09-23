import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ChoosePlan from './pages/ChoosePlan'
import Dashboard from './pages/Dashboard'
import AnalyticsPage from './pages/AnalyticsPage'
import { RequireAuth, RequireGuest } from './auth/AuthContext'
import { DashboardProvider } from './context/DashboardContext'

// A layout that provides the dashboard context to its children
function DashboardLayout() {
  return (
    <RequireAuth>
      <DashboardProvider>
        <Outlet />
      </DashboardProvider>
    </RequireAuth>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Guest Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/signup"
          element={(
            <RequireGuest>
              <SignUp />
            </RequireGuest>
          )}
        />
        <Route
          path="/choose-plan"
          element={(
            <RequireGuest>
              <ChoosePlan />
            </RequireGuest>
          )}
        />
        <Route
          path="/login"
          element={(
            <RequireGuest>
              <Login />
            </RequireGuest>
          )}
        />

        {/* Protected Routes sharing DashboardContext */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics/:code" element={<AnalyticsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
