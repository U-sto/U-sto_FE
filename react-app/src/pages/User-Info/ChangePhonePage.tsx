import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import { formatPhoneNumber } from '../../utils/formatPhoneNumber'
import { sendSmsVerificationCode, checkSmsVerificationCode } from '../../api/auth'
import { updateUserSms } from '../../api/users'
import './ChangePhonePage.css'

const ChangePhonePage = () => {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

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
              <Button
                type="button"
                className="change-phone-send-btn"
                onClick={handleSendCode}
                disabled={isSendingCode}
              >
                {isSendingCode ? '전송 중...' : '인증번호'}
              </Button>
            </div>
            <div className="change-phone-auth-code-wrap">
              <TextField
                placeholder="인증번호를 입력해 주세요"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="change-phone-input"
              />
              {error && <p className="change-phone-error">{error}</p>}
            </div>
          </div>
          <Button
            type="submit"
            className="change-phone-submit-btn"
            disabled={isSendingCode || isSubmitting}
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
