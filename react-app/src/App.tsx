import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import SignupPage from './pages/Signup/SignupPage'
import SignupStep2Page from './pages/Signup/SignupStep2Page'
import SignupStep3Page from './pages/Signup/SignupStep3Page'
import SignupCompletePage from './pages/Signup/SignupCompletePage'
import FindIdPage from './pages/FindId/FindIdPage'
import FindIdResultPage from './pages/FindId/FindIdResultPage'
import FindPasswordPage from './pages/FindPW/FindPasswordPage'
import FindPasswordResetPage from './pages/FindPW/FindPasswordResetPage'
import FindPasswordCompletePage from './pages/FindPW/FindPasswordCompletePage'
import HomePage from './pages/Home/HomePage'
import './styles/variables.css'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/step2" element={<SignupStep2Page />} />
        <Route path="/signup/step3" element={<SignupStep3Page />} />
        <Route path="/signup/complete" element={<SignupCompletePage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        <Route path="/find-id/result" element={<FindIdResultPage />} />
        <Route path="/find-password" element={<FindPasswordPage />} />
        <Route path="/find-password/reset" element={<FindPasswordResetPage />} />
        <Route path="/find-password/complete" element={<FindPasswordCompletePage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
