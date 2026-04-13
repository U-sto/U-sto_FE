import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import FindIdTabs from '../../../features/auth/components/FindIdTabs/FindIdTabs'
import PasswordField from '../../../components/common/PasswordField/PasswordField'
import Button from '../../../components/common/Button/Button'
import { resetPassword } from '../../../api/auth'
import './FindPasswordResetPage.css'

const MIN_PASSWORD_LENGTH = 8

interface LocationState {
  _fromFindPassword?: boolean
}

const FindPasswordResetPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state == null || !state._fromFindPassword) {
      navigate('/find-password', { replace: true })
    }
  }, [state, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedPassword || !trimmedConfirm) {
      setError('비밀번호를 모두 입력해 주세요.')
      return
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await resetPassword({ pwd: trimmedPassword, pwdConfirm: trimmedConfirm })
      navigate('/find-password/complete')
    } catch (e) {
      setError(e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state == null || !state._fromFindPassword) {
    return null
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '변경 중...' : '변경하기'}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default FindPasswordResetPage
