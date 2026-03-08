import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import PasswordField from '../../../../components/common/PasswordField/PasswordField'
import Checkbox from '../../../../components/common/Checkbox/Checkbox'
import Button from '../../../../components/common/Button/Button'
import { login, saveLoginToken } from '../../../../api/auth'
import './LoginForm.css'

const LoginForm = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = userId.trim().length > 0 && password.trim().length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const res = await login({ usrId: userId.trim(), pwd: password })
      saveLoginToken(res.data)
      navigate('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form-fields">
        <TextField
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <PasswordField
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="login-form-options">
        <Checkbox
          checked={autoLogin}
          onChange={(e) => setAutoLogin(e.target.checked)}
          label="자동 로그인"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <Button type="submit" disabled={!isFormValid || isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </Button>

      <div className="login-form-footer">
        <Link to="/signup" className="login-link">회원가입</Link>
        <Link to="/find-id" className="login-link">아이디/비밀번호 찾기</Link>
      </div>
    </form>
  )
}

export default LoginForm
