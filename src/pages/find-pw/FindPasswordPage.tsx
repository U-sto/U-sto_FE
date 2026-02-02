import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
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
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('인증하기:', { userId, email, authCode })
    navigate('/find-password/reset')
  }

  return (
    <AuthLayout
      header={<FindIdTabs activeTab="password" />}
      subtitleAlign="left"
      subtitle={
        <>
          계정에 등록한 이메일 인증 후,
          <br />
          비밀번호 재설정이 가능합니다.
        </>
      }
      footer={
        <>
          <Link to="/signup" className="auth-layout-footer-link">회원가입</Link>
          <Link to="/login" className="auth-layout-footer-link">기존 계정 로그인</Link>
        </>
      }
    >
      <form className="find-password-form" onSubmit={handleAuth}>
        <TextField
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <div className="find-password-email-section">
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
    </AuthLayout>
  )
}

export default FindPasswordPage
