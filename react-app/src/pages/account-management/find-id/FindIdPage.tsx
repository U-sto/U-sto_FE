import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import FindIdTabs from '../../../features/auth/components/FindIdTabs/FindIdTabs'
import TextField from '../../../components/common/TextField/TextField'
import EmailAuthField from '../../../features/auth/components/EmailAuthField/EmailAuthField'
import Button from '../../../components/common/Button/Button'
import { sendEmailVerificationEmail, checkEmailVerificationCode } from '../../../api/auth'
import './FindIdPage.css'

/** @ 앞부분만 검증 (도메인 @hanyang.ac.kr 은 고정) */
const LOCAL_PART_REGEX = /^[0-9a-zA-Z._%+-]+$/

const FindIdPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid =
    email.trim().length > 0 && LOCAL_PART_REGEX.test(email.trim())

  const handleSendCode = async () => {
    if (!isEmailValid) {
      setError('이메일 @ 앞부분을 입력해 주세요.')
      return
    }
    setError(null)
    setIsSendingCode(true)
    try {
      const fullEmail = `${email.trim()}@hanyang.ac.kr`
      await sendEmailVerificationEmail({
        usrNm: name.trim(),
        usrId: '',
        emailId: fullEmail,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedCode = authCode.trim()
    if (!trimmedCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }

    setError(null)
    setIsVerifying(true)
    try {
      await checkEmailVerificationCode({ code: trimmedCode })
      navigate('/find-id/result', { state: { _fromFindId: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 확인에 실패했습니다.')
    } finally {
      setIsVerifying(false)
    }
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
        <Button type="submit" disabled={isSendingCode || isVerifying}>
          {isVerifying ? '확인 중...' : isSendingCode ? '전송 중...' : '인증하기'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default FindIdPage
