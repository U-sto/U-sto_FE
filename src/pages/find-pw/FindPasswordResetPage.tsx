import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/AuthLayout'
import FindIdTabs from '../../components/FindIdTabs'
import PasswordField from '../../components/PasswordField'
import Button from '../../components/Button'
import './FindPasswordResetPage.css'

const FindPasswordResetPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
          />
          <PasswordField
            placeholder="비밀번호 재입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit">변경하기</Button>
      </form>
    </AuthLayout>
  )
}

export default FindPasswordResetPage
