import { useNavigate } from 'react-router-dom'
import GNB from '../../components/GNB'
import CheckCircle from '../../components/CheckCircle'
import Button from '../../components/Button'
import './FindPasswordCompletePage.css'

const FindPasswordCompletePage = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="find-password-complete-page">
      <GNB />
      <div className="find-password-complete-wrapper">
        <div className="find-password-complete-content">
          <div className="find-password-complete-text">
            <div className="find-password-complete-header">
              <CheckCircle size={100} />
              <h1 className="find-password-complete-title">
                비밀번호 재설정이 완료되었습니다.
              </h1>
            </div>
            <p className="find-password-complete-subtitle">
              로그인 후 이용해 주세요.
            </p>
          </div>
          
          <Button onClick={handleLogin} className="find-password-complete-button">
            로그인
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FindPasswordCompletePage
