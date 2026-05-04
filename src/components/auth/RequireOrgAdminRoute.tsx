import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthUser } from '../../contexts/AuthUserContext'
import { ACCESS_TOKEN_KEY } from '../../api/types'
import { isOrganizationAdministrator } from '../../utils/userRole'

type RequireOrgAdminRouteProps = {
  children: ReactNode
}

/**
 * 조직 관리자(roleNm)만 하위 라우트 접근. 그 외는 /home, 비로그인은 /login.
 */
const RequireOrgAdminRoute = ({ children }: RequireOrgAdminRouteProps) => {
  const { user, loading } = useAuthUser()
  const hasToken =
    typeof localStorage !== 'undefined' && Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))

  if (loading) {
    return <div className="loading-fallback">로딩 중…</div>
  }

  if (!hasToken || !user) {
    return <Navigate to="/login" replace />
  }

  if (!isOrganizationAdministrator(user.roleNm)) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default RequireOrgAdminRoute
