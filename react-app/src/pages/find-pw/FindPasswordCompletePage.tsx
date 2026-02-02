import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import CheckCircle from '../../components/CheckCircle'
import Button from '../../components/Button'
import './FindPasswordCompletePage.css'

const FindPasswordCompletePage = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <AuthLayout contentClassName="auth-layout-completion">
      <div className="auth-layout-completion-header">
        <CheckCircle size={100} />
        <h1 className="auth-layout-completion-title">
          비밀번호 재설정이 완료되었습니다.
        </h1>
      </div>
      <p className="auth-layout-completion-subtitle">
        로그인 후 이용해 주세요.
      </p>
      <Button onClick={handleLogin} className="auth-layout-auth-button">
        로그인
      </Button>
    </AuthLayout>
  )
}

export default FindPasswordCompletePage
