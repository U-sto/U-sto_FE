import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import CheckCircle from '../../components/common/CheckCircle/CheckCircle'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './ChangePasswordCompletePage.css'

const ChangePasswordCompletePage = () => {
  const navigate = useNavigate()

  return (
    <div className="change-password-complete-page">
      <GNBWithMenu />
      <div className="change-password-complete-content">
        <div className="change-password-complete-cta">
          <div className="change-password-complete-text">
            <div className="change-password-complete-head">
              <CheckCircle size={100} />
              <h1 className="change-password-complete-title">
                비밀번호 변경이 완료되었습니다.
              </h1>
            </div>
            <p className="change-password-complete-subtitle">
              새 비밀번호로 다시 로그인해주세요.
            </p>
          </div>
          <Button
            type="button"
            className="change-password-complete-btn"
            onClick={() => navigate('/login')}
          >
            로그인
          </Button>
        </div>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ChangePasswordCompletePage
