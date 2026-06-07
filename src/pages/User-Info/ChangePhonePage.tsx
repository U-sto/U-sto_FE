import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import VerificationCodeInput from '../../features/auth/components/VerificationCodeInput/VerificationCodeInput'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import { formatPhoneNumber } from '../../utils/formatPhoneNumber'
import { sendSmsVerificationCode, checkSmsVerificationCode } from '../../api/auth'
import { updateUserSms } from '../../api/users'
import './ChangePhonePage.css'

const ChangePhonePage = () => {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verificationKey, setVerificationKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

  useEffect(() => {
    setCodeSent(false)
    setAuthCode('')
    setVerificationKey(0)
  }, [phone])

  const handleSendCode = async () => {
    const trimmed = phone.replace(/\s/g, '').trim()
    if (!/^010-\d{4}-\d{4}$/.test(trimmed)) {
      setError('올바른 전화번호를 입력해 주세요. (010-XXXX-XXXX)')
      return
    }
    setError(null)
    setIsSendingCode(true)
    try {
      const target = trimmed.replace(/-/g, '')
      await sendSmsVerificationCode({ target, purpose: 'RESET_PASSWORD' })
      setAuthCode('')
      setCodeSent(true)
      setVerificationKey((key) => key + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedPhone = phone.replace(/\s/g, '').trim()
    const trimmedCode = authCode.trim()

    if (!/^010-\d{4}-\d{4}$/.test(trimmedPhone)) {
      setError('올바른 전화번호를 입력해 주세요. (010-XXXX-XXXX)')
      return
    }
    if (!codeSent) {
      setError('인증번호 보내기를 먼저 진행해 주세요.')
      return
    }
    if (!trimmedCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await checkSmsVerificationCode({ code: trimmedCode })
      await updateUserSms({ sms: trimmedPhone.replace(/-/g, '') })
      navigate('/user-info/change-phone/complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : '전화번호 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="change-phone-page">
      <GNBWithMenu />
      <div className="change-phone-content">
        <div className="change-phone-topbar">
          <button
            type="button"
            className="change-phone-back"
            onClick={() => navigate('/user-info')}
            aria-label="회원정보로 돌아가기"
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32.5 13L19.5 26L32.5 39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="change-phone-title">전화번호 변경</h1>
        </div>
        <div className="change-phone-divider" aria-hidden="true" />
        <form className="change-phone-form" onSubmit={handleSubmit}>
          <div className="change-phone-auth-section">
            <div className="change-phone-auth-row">
              <TextField
                type="tel"
                placeholder="전화번호"
                value={phone}
                onChange={handlePhoneChange}
                className="change-phone-input"
                inputMode="numeric"
              />
              {!codeSent ? (
                <Button
                  type="button"
                  className="change-phone-send-btn"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? '전송 중...' : '인증번호 보내기'}
                </Button>
              ) : null}
            </div>
            {codeSent ? (
              <div className="change-phone-auth-code-wrap">
                <VerificationCodeInput
                  visible={codeSent}
                  authCode={authCode}
                  onAuthCodeChange={(e) => setAuthCode(e.target.value)}
                  timerKey={verificationKey}
                  inputClassName="change-phone-input"
                  onResendCode={handleSendCode}
                  isResending={isSendingCode}
                />
              </div>
            ) : null}
            {error && <p className="change-phone-error">{error}</p>}
          </div>
          <Button
            type="submit"
            className="change-phone-submit-btn"
            disabled={isSendingCode || isSubmitting || !codeSent}
          >
            {isSubmitting ? '변경 중...' : '변경'}
          </Button>
        </form>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ChangePhonePage
