import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import PasswordField from '../../components/common/PasswordField/PasswordField'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import { withdrawUser } from '../../api/users'
import { clearLoginToken } from '../../api/auth'
import './WithdrawPage.css'

const WithdrawPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedId = userId.trim()
    const trimmedPw = password.trim()
    const trimmedConfirm = passwordConfirm.trim()

    if (!trimmedId) {
      setError('아이디를 입력해 주세요.')
      return
    }
    if (!trimmedPw || !trimmedConfirm) {
      setError('비밀번호를 모두 입력해 주세요.')
      return
    }
    if (trimmedPw !== trimmedConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await withdrawUser({ currentPw: trimmedPw })
      clearLoginToken()
      navigate('/user-info/withdraw/complete')
    } catch (e) {
      setError(e instanceof Error ? e.message : '회원 탈퇴에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="withdraw-page">
      <GNBWithMenu />
      <div className="withdraw-content">
        <div className="withdraw-topbar">
          <button
            type="button"
            className="withdraw-back"
            onClick={() => navigate('/user-info')}
            aria-label="회원정보로 돌아가기"
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32.5 13L19.5 26L32.5 39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="withdraw-title">회원탈퇴</h1>
        </div>
        <div className="withdraw-divider" aria-hidden="true" />
        <form className="withdraw-form" onSubmit={handleSubmit}>
          <div className="withdraw-section">
            <p className="withdraw-hint">회원탈퇴 시 복구가 불가능합니다.</p>
            <TextField
              placeholder="아이디"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="withdraw-section withdraw-pw">
            <PasswordField
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <PasswordField
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="withdraw-error">{error}</p>}
          <Button type="submit" className="withdraw-btn" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '탈퇴'}
          </Button>
        </form>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default WithdrawPage
