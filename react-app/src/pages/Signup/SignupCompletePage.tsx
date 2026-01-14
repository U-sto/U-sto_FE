import { useNavigate } from 'react-router-dom'
import GNB from '../../components/GNB'
import CheckCircle from '../../components/CheckCircle'
import Button from '../../components/Button'
import './SignupCompletePage.css'

const SignupCompletePage = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="signup-complete-page">
      <GNB />
      <div className="signup-complete-wrapper">
        <div className="signup-complete-content">
          <div className="signup-complete-text">
            <div className="signup-complete-title-section">
              <CheckCircle size={100} />
              <h1 className="signup-complete-title">회원가입이 완료되었습니다.</h1>
            </div>
            <p className="signup-complete-subtitle">로그인 후 이용해 주세요.</p>
          </div>
          <Button onClick={handleLogin} className="signup-complete-button">
            로그인
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SignupCompletePage
