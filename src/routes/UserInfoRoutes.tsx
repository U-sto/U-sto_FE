import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const UserInfoPage = lazy(() => import('../pages/User-Info/UserInfoPage'))
const ChangePasswordPage = lazy(() => import('../pages/User-Info/ChangePasswordPage'))
const ChangePasswordCompletePage = lazy(
  () => import('../pages/User-Info/ChangePasswordCompletePage'),
)
const ChangePhonePage = lazy(() => import('../pages/User-Info/ChangePhonePage'))
const ChangePhoneCompletePage = lazy(
  () => import('../pages/User-Info/ChangePhoneCompletePage'),
)
const WithdrawPage = lazy(() => import('../pages/User-Info/WithdrawPage'))
const WithdrawCompletePage = lazy(
  () => import('../pages/User-Info/WithdrawCompletePage'),
)

const UserInfoRoutes = () => (
  <Suspense fallback={<div className="loading-fallback">로딩 중...</div>}>
    <Routes>
      <Route index element={<UserInfoPage />} />
      <Route path="change-password" element={<ChangePasswordPage />} />
      <Route path="change-password/complete" element={<ChangePasswordCompletePage />} />
      <Route path="change-phone" element={<ChangePhonePage />} />
      <Route path="change-phone/complete" element={<ChangePhoneCompletePage />} />
      <Route path="withdraw" element={<WithdrawPage />} />
      <Route path="withdraw/complete" element={<WithdrawCompletePage />} />
    </Routes>
  </Suspense>
)

export default UserInfoRoutes
