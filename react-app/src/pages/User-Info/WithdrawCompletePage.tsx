import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import CheckCircle from '../../components/common/CheckCircle/CheckCircle'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './WithdrawCompletePage.css'

const WithdrawCompletePage = () => {
  const navigate = useNavigate()

  return (
    <div className="withdraw-complete-page">
      <GNBWithMenu />
      <div className="withdraw-complete-content">
        <div className="withdraw-complete-cta">
          <div className="withdraw-complete-head">
            <CheckCircle size={100} />
            <h1 className="withdraw-complete-title">
              회원탈퇴가 완료되었습니다.
            </h1>
          </div>
          <Button
            type="button"
            className="withdraw-complete-btn"
            onClick={() => navigate('/login')}
          >
            확인
          </Button>
        </div>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default WithdrawCompletePage
