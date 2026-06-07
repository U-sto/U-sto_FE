import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import CheckCircle from '../../../components/common/CheckCircle/CheckCircle'
import Button from '../../../components/common/Button/Button'
import {
  canAccessSignupComplete,
  clearSignupSession,
} from '../../../features/auth/signup/signupSession'
import './SignupCompletePage.css'

const SignupCompletePage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!canAccessSignupComplete()) {
      navigate('/signup', { replace: true })
    }
  }, [navigate])

  const handleGoLogin = () => {
    clearSignupSession()
    navigate('/login')
  }

  return (
    <AuthLayout contentClassName="signup-complete-content">
      <div className="signup-complete-title-section">
        <CheckCircle size={100} />
        <h1 className="signup-complete-title">회원가입이 완료되었습니다.</h1>
      </div>
      <p className="signup-complete-subtitle">로그인 후 이용해 주세요.</p>
      <Button onClick={handleGoLogin} className="signup-complete-button">
        로그인
      </Button>
    </AuthLayout>
  )
}

export default SignupCompletePage
