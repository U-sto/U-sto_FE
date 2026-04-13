import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import FindIdTabs from '../../components/FindIdTabs'
import TextField from '../../components/TextField'
import EmailAuthField from '../../components/EmailAuthField'
import Button from '../../components/Button'
import './FindIdPage.css'

const DUMMY_USER_ID = 'user_found_id'

const FindIdPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSendCode = () => {
    console.log('인증번호 전송:', email)
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    console.log('인증하기:', { name, email, authCode })
    navigate('/find-id/result', { state: { userId: DUMMY_USER_ID } })
  }

  return (
    <AuthLayout
      header={<FindIdTabs activeTab="id" />}
      subtitle="계정에 등록한 이름과 이메일을 입력해 주세요"
      footer={
        <>
          <Link to="/signup" className="auth-layout-footer-link">회원가입</Link>
          <Link to="/login" className="auth-layout-footer-link">기존 계정 로그인</Link>
        </>
      }
    >
      <form className="find-id-form" onSubmit={handleAuth}>
        <TextField
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <div className="find-id-email-section">
          <EmailAuthField
            email={email}
            onEmailChange={(e) => setEmail(e.target.value)}
            onSendCode={handleSendCode}
          />
          <TextField
            placeholder="인증번호를 입력해 주세요"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            inputMode="numeric"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit">인증하기</Button>
      </form>
    </AuthLayout>
  )
}

export default FindIdPage
