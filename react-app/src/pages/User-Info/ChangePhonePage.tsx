import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './ChangePhonePage.css'

const ChangePhonePage = () => {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSendCode = () => {
    const trimmed = phone.trim()
    if (!trimmed) {
      setError('전화번호를 입력해 주세요.')
      return
    }
    setError(null)
    // TODO: 인증번호 발송 API 연동
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedPhone = phone.trim()
    const trimmedCode = authCode.trim()

    if (!trimmedPhone) {
      setError('전화번호를 입력해 주세요.')
      return
    }
    if (!trimmedCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }

    setError(null)
    // TODO: 전화번호 변경 API 연동
    navigate('/user-info/change-phone/complete')
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
                onChange={(e) => setPhone(e.target.value)}
                className="change-phone-input"
                inputMode="tel"
              />
              <Button
                type="button"
                className="change-phone-send-btn"
                onClick={handleSendCode}
              >
                인증번호
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
          <Button type="submit" className="change-phone-submit-btn">
            변경
          </Button>
        </form>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ChangePhonePage
