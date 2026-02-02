import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../components/SignupLayout'
import EmailAuthField from '../../components/EmailAuthField'
import TextField from '../../components/TextField'
import Button from '../../components/Button'

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
    <SignupLayout
      step={1}
      title="회원가입"
      subtitle="이메일 인증을 완료해 주세요"
      onSubmit={handleAuth}
    >
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
      <Button type="submit" disabled={isSendingCode}>
        {isSendingCode ? '전송 중...' : '인증하기'}
      </Button>
    </SignupLayout>
  )
}

export default SignupPage
