import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppResetProvider } from './contexts/AppResetContext'
import './styles/variables.css'
import './App.css'

const LoginPage = lazy(() => import('./pages/login/LoginPage'))
const SignupPage = lazy(() => import('./pages/signup/SignupPage'))
const SignupStep2Page = lazy(() => import('./pages/signup/SignupStep2Page'))
const SignupStep3Page = lazy(() => import('./pages/signup/SignupStep3Page'))
const SignupCompletePage = lazy(() => import('./pages/signup/SignupCompletePage'))
const FindIdPage = lazy(() => import('./pages/find-id/FindIdPage'))
const FindIdResultPage = lazy(() => import('./pages/find-id/FindIdResultPage'))
const FindPasswordPage = lazy(() => import('./pages/find-pw/FindPasswordPage'))
const FindPasswordResetPage = lazy(() => import('./pages/find-pw/FindPasswordResetPage'))
const FindPasswordCompletePage = lazy(() => import('./pages/find-pw/FindPasswordCompletePage'))
const HomePage = lazy(() => import('./pages/home/HomePage'))
const AcqConfirmationPage = lazy(() => import('./pages/acq-confirmation/AcqConfirmationPage'))
const ReturnManagementPage = lazy(() => import('./pages/return-management/ReturnManagementPage'))
const DisuseManagementPage = lazy(() => import('./pages/disuse-management/DisuseManagementPage'))
const DisposalManagementPage = lazy(() => import('./pages/disposal-management/DisposalManagementPage'))

function App() {
  return (
    <BrowserRouter>
      <AppResetProvider>
        <Suspense fallback={<div className="loading-fallback">로딩 중...</div>}>
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
            {/* 물품 처분 등록 관리: /disposal-management (disposal-registration 경로는 없음) */}
            <Route path="/disposal-management" element={<DisposalManagementPage />} />
          </Routes>
        </Suspense>
      </AppResetProvider>
    </BrowserRouter>
  )
}

export default App
