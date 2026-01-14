import { useNavigate } from 'react-router-dom'
import GNB from '../../components/GNB'
import FindIdTabs from '../../components/FindIdTabs'
import IdDisplayField from '../../components/IdDisplayField'
import Button from '../../components/Button'
import './FindIdResultPage.css'

const FindIdResultPage = () => {
  const navigate = useNavigate()
  // 실제로는 API에서 받아온 아이디를 표시해야 합니다
  const foundUserId = ''

  const handleLogin = () => {
    navigate('/login')
  }

  const handleFindPassword = () => {
    navigate('/find-password')
  }

  return (
    <div className="find-id-result-page">
      <GNB />
      <div className="find-id-result-wrapper">
        <FindIdTabs activeTab="id" />
        <p className="find-id-result-title">아이디 찾기가 완료 되었습니다.</p>
        <IdDisplayField value={foundUserId} />
        
        <div className="find-id-result-buttons">
          <Button onClick={handleLogin} className="find-id-login-button">
            로그인
          </Button>
          <Button onClick={handleFindPassword} className="find-id-password-button">
            비밀번호 찾기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FindIdResultPage
