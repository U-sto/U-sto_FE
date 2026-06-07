import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import EmailAuthField from '../../../features/auth/components/EmailAuthField/EmailAuthField'
import Button from '../../../components/common/Button/Button'
import { sendEmailVerificationEmail, checkEmailVerificationCode } from '../../../api/auth'
import { checkEmailExists } from '../../../api/users'

/** @ 앞부분만 검증 (도메인 @hanyang.ac.kr 은 고정) */
const LOCAL_PART_REGEX = /^[0-9a-zA-Z._%+-]+$/

const SignupPage = () => {
  const navigate = useNavigate()
  const [emailLocal, setEmailLocal] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verificationKey, setVerificationKey] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid =
    emailLocal.trim().length > 0 && LOCAL_PART_REGEX.test(emailLocal.trim())

  useEffect(() => {
    setCodeSent(false)
    setAuthCode('')
    setVerificationKey(0)
  }, [emailLocal])

  const handleSendCode = async () => {
    if (!isEmailValid) {
      setError('이메일 @ 앞부분을 입력해 주세요.')
      return
    }
    setError(null)
    setIsSendingCode(true)
    try {
      const emailId = emailLocal.trim()
      await checkEmailExists(emailId)
      await sendEmailVerificationEmail({
        usrNm: '',
        usrId: '',
        emailId,
      })
      setAuthCode('')
      setCodeSent(true)
      setVerificationKey((key) => key + 1)
    } catch (e) {
      const message = e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.'
      setError(message)
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
      navigate('/signup/step2')
    } catch (e) {
      const message = e instanceof Error ? e.message : '인증번호 확인에 실패했습니다.'
      setError(message)
    } finally {
      setIsVerifying(false)
    }
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
        isSending={isSendingCode}
        authCode={authCode}
        onAuthCodeChange={(e) => setAuthCode(e.target.value)}
        codeSent={codeSent}
        verificationKey={verificationKey}
      />
      {error && <p className="form-error">{error}</p>}
      <Button type="submit" disabled={isSendingCode || isVerifying || !codeSent}>
        {isVerifying ? '확인 중...' : '인증하기'}
      </Button>
    </SignupLayout>
  )
}

export default SignupPage
