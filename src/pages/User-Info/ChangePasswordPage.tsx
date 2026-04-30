import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import PasswordField from '../../components/common/PasswordField/PasswordField'
import Button from '../../components/common/Button/Button'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import { updatePassword } from '../../api/users'
import './ChangePasswordPage.css'

const MIN_PASSWORD_LENGTH = 8

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedCurrent = currentPassword.trim()
    const trimmedNew = newPassword.trim()
    const trimmedConfirm = newPasswordConfirm.trim()

    if (!trimmedCurrent) {
      setError('기존 비밀번호를 입력해 주세요.')
      return
    }
    if (!trimmedNew || !trimmedConfirm) {
      setError('새 비밀번호를 모두 입력해 주세요.')
      return
    }
    if (trimmedNew !== trimmedConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await updatePassword({ oldPwd: trimmedCurrent, newPwd: trimmedNew })
      navigate('/user-info/change-password/complete')
    } catch (e) {
      setError(e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="change-password-page">
      <GNBWithMenu />
      <div className="change-password-content">
        <div className="change-password-topbar">
          <button
            type="button"
            className="change-password-back"
            onClick={() => navigate('/user-info')}
            aria-label="회원정보로 돌아가기"
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M32.5 13L19.5 26L32.5 39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="change-password-title">비밀번호 변경</h1>
        </div>
        <div className="change-password-divider" aria-hidden="true" />
        <form className="change-password-form" onSubmit={handleSubmit}>
          <div className="change-password-section">
            <p className="change-password-hint">기존 비밀번호를 입력해 주세요.</p>
            <PasswordField
              placeholder="기존 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="change-password-section change-password-new">
            <PasswordField
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              placeholder="새 비밀번호 재입력"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="change-password-error">{error}</p>}
          <Button type="submit" className="change-password-btn" disabled={isSubmitting}>
            {isSubmitting ? '변경 중...' : '변경'}
          </Button>
        </form>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ChangePasswordPage
