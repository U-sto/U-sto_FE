import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import FindIdTabs from '../../../features/auth/components/FindIdTabs/FindIdTabs'
import TextField from '../../../components/common/TextField/TextField'
import EmailAuthField from '../../../features/auth/components/EmailAuthField/EmailAuthField'
import Button from '../../../components/common/Button/Button'
import { sendEmailVerificationEmail, checkEmailVerificationCode } from '../../../api/auth'
import './FindPasswordPage.css'

const LOCAL_PART_REGEX = /^[0-9a-zA-Z._%+-]+$/

const FindPasswordPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verificationKey, setVerificationKey] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid =
    email.trim().length > 0 && LOCAL_PART_REGEX.test(email.trim())

  useEffect(() => {
    setCodeSent(false)
    setAuthCode('')
    setVerificationKey(0)
  }, [email])

  const handleSendCode = async () => {
    if (!isEmailValid) {
      setError('이메일 @ 앞부분을 입력해 주세요.')
      return
    }
    setError(null)
    setIsSendingCode(true)
    try {
      const emailId = email.trim()
      await sendEmailVerificationEmail({
        usrNm: '',
        usrId: userId.trim(),
        emailId,
      })
      setAuthCode('')
      setCodeSent(true)
      setVerificationKey((key) => key + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    if (!codeSent) {
      setError('인증번호 보내기를 먼저 진행해 주세요.')
      return
    }
    const trimmedCode = authCode.trim()
    if (!trimmedCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }
    setError(null)
    setIsVerifying(true)
    try {
      await checkEmailVerificationCode({ code: trimmedCode })
      navigate('/find-password/reset', { state: { _fromFindPassword: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 확인에 실패했습니다.')
    } finally {
      setIsVerifying(false)
    }
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
          placeholder="아이디를 입력해 주세요"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          autoComplete="username"
        />
        <div className="find-password-email-section">
          <EmailAuthField
            email={email}
            onEmailChange={(e) => setEmail(e.target.value)}
            onSendCode={handleSendCode}
            isSending={isSendingCode}
            authCode={authCode}
            onAuthCodeChange={(e) => setAuthCode(e.target.value)}
            codeSent={codeSent}
            verificationKey={verificationKey}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={isSendingCode || isVerifying || !codeSent}>
          {isVerifying ? '확인 중...' : '인증하기'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default FindPasswordPage
