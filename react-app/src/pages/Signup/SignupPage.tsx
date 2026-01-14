import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import ProgressBar from '../../components/ProgressBar'
import EmailAuthField from '../../components/EmailAuthField'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import './SignupPage.css'

const SignupPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')

  const handleSendCode = () => {
    console.log('인증번호 전송:', email)
    // 여기에 인증번호 전송 로직을 추가하세요
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('인증하기:', { email, authCode })
    // 여기에 인증 로직을 추가하세요
    // 인증 성공 시 다음 단계로 이동
    navigate('/signup/step2')
  }

  return (
    <div className="signup-page">
      <GNB />
      <div className="signup-wrapper">
        <h1 className="signup-title">회원가입</h1>
        <ProgressBar step={1} />
        <p className="signup-subtitle">이메일 인증을 완료해 주세요</p>
        
        <form className="signup-form" onSubmit={handleAuth}>
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
          
          <Button type="submit">인증하기</Button>
        </form>
        
        <div className="signup-footer">
          <Link to="/login" className="signup-link">기존 계정 로그인</Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
