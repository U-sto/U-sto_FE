import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import ProgressBar from '../../components/ProgressBar'
import EmailAuthField from '../../components/EmailAuthField'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import './SignupPage.css'

/** @ 앞부분만 검증 (도메인 @hanyang.ac.kr 은 고정) */
const LOCAL_PART_REGEX = /^[0-9a-zA-Z._%+-]+$/

const SignupPage = () => {
  const navigate = useNavigate()
  const [emailLocal, setEmailLocal] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid =
    emailLocal.trim().length > 0 && LOCAL_PART_REGEX.test(emailLocal.trim())
  const isAuthCodeValid = authCode.trim().length >= 4
  const isFormValid = isEmailValid && isAuthCodeValid

  const handleSendCode = () => {
    if (!isEmailValid) {
      setError('이메일 @ 앞부분을 입력해 주세요.')
      return
    }
    setError(null)
    setIsSendingCode(true)
    // TODO: 실제 인증번호 전송 API 연동
    setTimeout(() => {
      setIsSendingCode(false)
    }, 300)
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
            email={emailLocal}
            onEmailChange={(e) => setEmailLocal(e.target.value)}
            onSendCode={handleSendCode}
          />
          <TextField
            placeholder="인증번호를 입력해 주세요"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit">인증하기</Button>
        </form>
        <div className="signup-footer">
          <Link to="/login" className="signup-link">
            기존 계정 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
