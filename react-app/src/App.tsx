import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppResetProvider } from './contexts/AppResetContext'
import { AssetDetailOverridesProvider } from './contexts/AssetDetailOverridesContext'
import AssetManagementRoutes from './routes/AssetManagementRoutes'
import './styles/variables.css'
import './App.css'

// Use correct casing in import paths to avoid duplicated module issues
const LoginPage = lazy(() => import('./pages/account-management/Login/LoginPage'))
const SignupPage = lazy(() => import('./pages/account-management/Signup/SignupPage'))
const SignupStep2Page = lazy(() => import('./pages/account-management/Signup/SignupStep2Page'))
const SignupStep3Page = lazy(() => import('./pages/account-management/Signup/SignupStep3Page'))
const SignupCompletePage = lazy(() => import('./pages/account-management/Signup/SignupCompletePage'))
const FindIdPage = lazy(() => import('./pages/account-management/find-id/FindIdPage'))
const FindIdResultPage = lazy(() => import('./pages/account-management/find-id/FindIdResultPage'))
const FindPasswordPage = lazy(() => import('./pages/account-management/find-pw/FindPasswordPage'))
const FindPasswordResetPage = lazy(
  () => import('./pages/account-management/find-pw/FindPasswordResetPage'),
)
const FindPasswordCompletePage = lazy(
  () => import('./pages/account-management/find-pw/FindPasswordCompletePage'),
)
const HomePage = lazy(() => import('./pages/Home/HomePage'))
const AcqConfirmationPage = lazy(
  () => import('./pages/request-management/acq-confirmation/AcqConfirmationPage'),
)
const OperationManagementPage = lazy(
  () => import('./pages/request-management/operation-management/OperationManagementPage'),
)
const ReturnManagementPage = lazy(
  () => import('./pages/request-management/return-management/ReturnManagementPage'),
)
const DisuseManagementPage = lazy(
  () => import('./pages/request-management/disuse-management/DisuseManagementPage'),
)
const DisposalManagementPage = lazy(
  () => import('./pages/request-management/disposal-management/DisposalManagementPage'),
)
const AiForecastPage = lazy(() => import('./pages/ai-forecast/AiForecastPage'))
const UserInfoPage = lazy(() => import('./pages/User-Info/UserInfoPage'))
const ChangePasswordPage = lazy(() => import('./pages/User-Info/ChangePasswordPage'))
const ChangePasswordCompletePage = lazy(
  () => import('./pages/User-Info/ChangePasswordCompletePage'),
)
const ChangePhonePage = lazy(() => import('./pages/User-Info/ChangePhonePage'))
const ChangePhoneCompletePage = lazy(
  () => import('./pages/User-Info/ChangePhoneCompletePage'),
)
const WithdrawPage = lazy(() => import('./pages/User-Info/WithdrawPage'))
const WithdrawCompletePage = lazy(
  () => import('./pages/User-Info/WithdrawCompletePage'),
)
function App() {
  return (
    <BrowserRouter>
      <AppResetProvider>
        <AssetDetailOverridesProvider>
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
              <Route path="/user-info" element={<UserInfoPage />} />
              <Route path="/user-info/change-password" element={<ChangePasswordPage />} />
              <Route
                path="/user-info/change-password/complete"
                element={<ChangePasswordCompletePage />}
              />
              <Route path="/user-info/change-phone" element={<ChangePhonePage />} />
              <Route
                path="/user-info/change-phone/complete"
                element={<ChangePhoneCompletePage />}
              />
              <Route path="/user-info/withdraw" element={<WithdrawPage />} />
              <Route
                path="/user-info/withdraw/complete"
                element={<WithdrawCompletePage />}
              />
              <Route path="/acq-confirmation" element={<AcqConfirmationPage />} />
              <Route path="/operation-management" element={<OperationManagementPage />} />
              <Route path="/return-management" element={<ReturnManagementPage />} />
              <Route path="/disuse-management" element={<DisuseManagementPage />} />
              <Route path="/disposal-management" element={<DisposalManagementPage />} />
              <Route path="/asset-management/*" element={<AssetManagementRoutes />} />
              <Route path="/ai-forecast" element={<AiForecastPage />} />
            </Routes>
          </Suspense>
        </AssetDetailOverridesProvider>
      </AppResetProvider>
    </BrowserRouter>
  )
}

export default App
