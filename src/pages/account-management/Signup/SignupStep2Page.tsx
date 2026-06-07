import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import EmailAuthField from '../../../features/auth/components/EmailAuthField/EmailAuthField'
import PasswordField from '../../../components/common/PasswordField/PasswordField'
import Button from '../../../components/common/Button/Button'
import { sendEmailVerificationEmail, checkEmailVerificationCode } from '../../../api/auth'
import { refreshExistsBeforeEmailSend } from '../../../features/auth/signup/signupApiHelpers'
import {
  canAccessSignupStep,
  loadSignupSession,
  saveSignupSession,
} from '../../../features/auth/signup/signupSession'
import { mapSignupSessionError } from '../../../features/auth/signup/signupErrors'
import './SignupStep2Page.css'

/** @ 앞부분만 검증 (도메인 @hanyang.ac.kr 은 고정) */
const LOCAL_PART_REGEX = /^[0-9a-zA-Z._%+-]+$/

const SignupStep2Page = () => {
  const navigate = useNavigate()
  const [emailLocal, setEmailLocal] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationKey, setVerificationKey] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canAccessSignupStep(2)) {
      navigate('/signup', { replace: true })
      return
    }
    const session = loadSignupSession()
    if (session.emailId) {
      setEmailLocal(session.emailId)
      setIsEmailVerified(session.isEmailVerified)
    }
    if (session.password) {
      setPassword(session.password)
      setPasswordConfirm(session.password)
    }
  }, [navigate])

  const isEmailValid =
    emailLocal.trim().length > 0 && LOCAL_PART_REGEX.test(emailLocal.trim())

  useEffect(() => {
    setCodeSent(false)
    setAuthCode('')
    setVerificationKey(0)
    setIsEmailVerified(false)
    saveSignupSession({ emailId: emailLocal.trim(), isEmailVerified: false })
  }, [emailLocal])

  const handleSendCode = async () => {
    if (!isEmailValid) {
      setError('이메일 @ 앞부분을 입력해 주세요.')
      return
    }
    const session = loadSignupSession()
    if (!session.isUserIdVerified || !session.userId.trim()) {
      setError('아이디 중복 확인이 필요합니다. 1단계부터 다시 진행해 주세요.')
      navigate('/signup', { replace: true })
      return
    }

    setError(null)
    setIsSendingCode(true)
    try {
      const emailId = emailLocal.trim()
      await refreshExistsBeforeEmailSend(session.userId, emailId)
      await sendEmailVerificationEmail({
        usrNm: '',
        usrId: session.userId,
        emailId,
      })
      saveSignupSession({ emailId, isEmailVerified: false })
      setAuthCode('')
      setCodeSent(true)
      setIsEmailVerified(false)
      setVerificationKey((key) => key + 1)
    } catch (e) {
      const message = e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.'
      setError(mapSignupSessionError(message))
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleNext = async (e: FormEvent) => {
    e.preventDefault()
    const session = loadSignupSession()

    if (!session.isUserIdVerified || !session.userId.trim()) {
      setError('아이디 중복 확인이 필요합니다.')
      navigate('/signup', { replace: true })
      return
    }

    if (!codeSent) {
      setError('인증번호 보내기를 먼저 진행해 주세요.')
      return
    }

    const trimmedCode = authCode.trim()
    if (!trimmedCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }

    const trimmedPassword = password.trim()
    const trimmedConfirm = passwordConfirm.trim()
    if (!trimmedPassword || !trimmedConfirm) {
      setError('비밀번호를 모두 입력해 주세요.')
      return
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    const emailId = emailLocal.trim()
    if (emailId !== session.emailId) {
      setError('이메일이 변경되었습니다. 인증번호를 다시 발송해 주세요.')
      return
    }

    setError(null)
    setIsVerifying(true)
    try {
      await checkEmailVerificationCode({ code: trimmedCode })
      saveSignupSession({
        emailId,
        isEmailVerified: true,
        password: trimmedPassword,
      })
      setIsEmailVerified(true)
      navigate('/signup/step3')
    } catch (e) {
      const message = e instanceof Error ? e.message : '인증번호 확인에 실패했습니다.'
      setError(mapSignupSessionError(message))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerificationExpired = () => {
    setCodeSent(false)
    setAuthCode('')
    setIsEmailVerified(false)
    saveSignupSession({ isEmailVerified: false })
  }

  return (
    <SignupLayout
      step={2}
      title="회원가입"
      subtitle="이메일 인증을 완료하고 비밀번호를 설정해 주세요"
      onSubmit={handleNext}
    >
      <div className="signup-step2-fields">
        <EmailAuthField
          email={emailLocal}
          onEmailChange={(e) => setEmailLocal(e.target.value)}
          onSendCode={handleSendCode}
          isSending={isSendingCode}
          authCode={authCode}
          onAuthCodeChange={(e) => setAuthCode(e.target.value)}
          codeSent={codeSent}
          verificationKey={verificationKey}
          onVerificationExpired={handleVerificationExpired}
        />
        <div className="password-fields">
          <PasswordField
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="비밀번호 재입력"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <Button
        type="submit"
        disabled={isSendingCode || isVerifying || !codeSent || isEmailVerified}
      >
        {isVerifying ? '확인 중...' : '다음'}
      </Button>
    </SignupLayout>
  )
}

export default SignupStep2Page
