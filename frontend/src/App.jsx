import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ChoosePlan from './pages/ChoosePlan'
import Dashboard from './pages/Dashboard'
import { RequireAuth, RequireGuest } from './auth/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
