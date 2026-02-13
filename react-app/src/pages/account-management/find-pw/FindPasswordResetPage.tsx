import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import FindIdTabs from '../../../features/auth/components/FindIdTabs/FindIdTabs'
import PasswordField from '../../../components/common/PasswordField/PasswordField'
import Button from '../../../components/common/Button/Button'
import './FindPasswordResetPage.css'

const FindPasswordResetPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const hasPassword = password.trim().length > 0
    const hasConfirm = confirmPassword.trim().length > 0
    if (hasPassword && hasConfirm && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError(null)
    // TODO: API 연동 시 비밀번호 일치·규칙 검사 후 navigate
    navigate('/find-password/complete')
  }

  return (
    <AuthLayout
      header={<FindIdTabs activeTab="password" />}
      title="비밀번호 재설정"
      titleAlign="left"
      footer={
        <>
          <Link to="/signup" className="auth-layout-footer-link">회원가입</Link>
          <Link to="/login" className="auth-layout-footer-link">기존 계정 로그인</Link>
        </>
      }
    >
      <form className="find-password-reset-form" onSubmit={handleSubmit}>
        <div className="find-password-reset-fields">
          <PasswordField
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <Button type="submit">변경하기</Button>
      </form>
    </AuthLayout>
  )
}

export default FindPasswordResetPage
