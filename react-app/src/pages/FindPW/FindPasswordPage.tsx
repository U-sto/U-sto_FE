import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import FindIdTabs from '../../components/FindIdTabs'
import TextField from '../../components/TextField'
import EmailAuthField from '../../components/EmailAuthField'
import Button from '../../components/Button'
import './FindPasswordPage.css'

const FindPasswordPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')

  const handleSendCode = () => {
    console.log('인증번호 전송:', email)
    // 여기에 인증번호 전송 로직을 추가하세요
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('인증하기:', { userId, email, authCode })
    // 여기에 비밀번호 찾기 로직을 추가하세요
    // 인증 성공 시 비밀번호 재설정 페이지로 이동
    navigate('/find-password/reset')
  }

  return (
    <div className="find-password-page">
      <GNB />
      <div className="find-password-wrapper">
        <FindIdTabs activeTab="password" />
        <p className="find-password-subtitle">
          계정에 등록한 이메일 인증 후,
          <br />
          비밀번호 재설정이 가능합니다.
        </p>
        
        <form className="find-password-form" onSubmit={handleAuth}>
          <TextField
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          
          <div className="email-auth-section">
            <EmailAuthField
              email={email}
              onEmailChange={(e) => setEmail(e.target.value)}
              onSendCode={handleSendCode}
            />
            
            <TextField
              placeholder="인증번호를 입력해 주세요"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
            />
          </div>
          
          <Button type="submit">인증하기</Button>
        </form>
        
        <div className="find-password-footer">
          <Link to="/signup" className="find-password-link">회원가입</Link>
          <Link to="/login" className="find-password-link">기존 계정 로그인</Link>
        </div>
      </div>
    </div>
  )
}

export default FindPasswordPage
