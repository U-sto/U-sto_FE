import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import CheckCircle from '../../components/common/CheckCircle/CheckCircle'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './ChangePhoneCompletePage.css'

const ChangePhoneCompletePage = () => {
  const navigate = useNavigate()

  return (
    <div className="change-phone-complete-page">
      <GNBWithMenu />
      <div className="change-phone-complete-content">
        <div className="change-phone-complete-cta">
          <div className="change-phone-complete-head">
            <CheckCircle size={100} />
            <h1 className="change-phone-complete-title">
              전화번호 변경이 완료되었습니다.
            </h1>
          </div>
          <Button
            type="button"
            className="change-phone-complete-btn"
            onClick={() => navigate('/user-info')}
          >
            확인
          </Button>
        </div>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ChangePhoneCompletePage
