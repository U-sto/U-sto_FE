import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import FindIdTabs from '../../components/FindIdTabs'
import IdDisplayField from '../../components/IdDisplayField'
import Button from '../../components/Button'
import './FindIdResultPage.css'

interface LocationState {
  userId?: string
}

const FindIdResultPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const foundUserId = state?.userId ?? ''

  useEffect(() => {
    if (state == null) {
      navigate('/find-id', { replace: true })
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
        <IdDisplayField value={foundUserId} />
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
