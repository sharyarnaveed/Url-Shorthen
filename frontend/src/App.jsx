import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ChoosePlan from './pages/ChoosePlan'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/choose-plan" element={<ChoosePlan />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
