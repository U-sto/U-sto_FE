import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppResetProvider } from './contexts/AppResetContext'
import LoginPage from './pages/login/LoginPage'
import SignupPage from './pages/signup/SignupPage'
import SignupStep2Page from './pages/signup/SignupStep2Page'
import SignupStep3Page from './pages/signup/SignupStep3Page'
import SignupCompletePage from './pages/signup/SignupCompletePage'
import FindIdPage from './pages/find-id/FindIdPage'
import FindIdResultPage from './pages/find-id/FindIdResultPage'
import FindPasswordPage from './pages/find-pw/FindPasswordPage'
import FindPasswordResetPage from './pages/find-pw/FindPasswordResetPage'
import FindPasswordCompletePage from './pages/find-pw/FindPasswordCompletePage'
import HomePage from './pages/home/HomePage'
import AcqConfirmationPage from './pages/acq-confirmation/AcqConfirmationPage'
import ReturnManagementPage from './pages/return-management/ReturnManagementPage'
import DisuseManagementPage from './pages/disuse-management/DisuseManagementPage'
import DisposalManagementPage from './pages/disposal-management/DisposalManagementPage'
import './styles/variables.css'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AppResetProvider>
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
        <Route path="/acq-confirmation" element={<AcqConfirmationPage />} />
        <Route path="/return-management" element={<ReturnManagementPage />} />
        <Route path="/disuse-management" element={<DisuseManagementPage />} />
        <Route path="/disposal-management" element={<DisposalManagementPage />} />
        </Routes>
      </AppResetProvider>
    </BrowserRouter>
  )
}

export default App
