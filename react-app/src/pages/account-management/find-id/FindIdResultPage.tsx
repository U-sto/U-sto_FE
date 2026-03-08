import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import FindIdTabs from '../../../features/auth/components/FindIdTabs/FindIdTabs'
import IdDisplayField from '../../../features/auth/components/IdDisplayField/IdDisplayField'
import Button from '../../../components/common/Button/Button'
import { findUserId } from '../../../api/auth'
import './FindIdResultPage.css'

interface LocationState {
  _fromFindId?: boolean
}

const FindIdResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [foundUserId, setFoundUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state == null) {
      navigate('/find-id', { replace: true })
      return
    }

    let cancelled = false
    findUserId()
      .then((res) => {
        if (cancelled) return
        const id =
          res.data?.usrId ??
          (res.data && 'userId' in res.data ? String((res.data as { userId?: string }).userId) : '') ??
          ''
        setFoundUserId(id)
        if (!id) setError(res.message || '아이디를 찾을 수 없습니다.')
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '아이디 조회에 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [state, navigate])

  const handleLogin = () => {
    navigate('/login')
  }

  const handleFindPassword = () => {
    navigate('/find-password')
  }

  if (state == null) {
    return null
  }

  return (
    <AuthLayout
      header={<FindIdTabs activeTab="id" />}
      title="아이디 찾기가 완료 되었습니다."
    >
      <div className="find-id-result-body">
        {isLoading && <p className="find-id-result-loading">조회 중...</p>}
        {!isLoading && error && <p className="form-error">{error}</p>}
        {!isLoading && !error && <IdDisplayField value={foundUserId} />}
        <div className="find-id-result-buttons">
          <Button onClick={handleLogin} className="auth-layout-auth-button">
            로그인
          </Button>
          <Button onClick={handleFindPassword} className="auth-layout-outline-button">
            비밀번호 찾기
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default FindIdResultPage
