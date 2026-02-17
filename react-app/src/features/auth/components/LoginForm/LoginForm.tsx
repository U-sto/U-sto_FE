import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import PasswordField from '../../../../components/common/PasswordField/PasswordField'
import Checkbox from '../../../../components/common/Checkbox/Checkbox'
import Button from '../../../../components/common/Button/Button'
import './LoginForm.css'

const LoginForm = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = userId.trim().length > 0 && password.trim().length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isFormValid) {
      return
    }
    // TODO: API 연동 시 isFormValid 검사 후 로그인 성공 시에만 navigate
    navigate('/home')
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

      <Button type="submit" disabled={!isFormValid}>
        로그인
      </Button>

      <div className="login-form-footer">
        <Link to="/signup" className="login-link">회원가입</Link>
        <Link to="/find-id" className="login-link">아이디/비밀번호 찾기</Link>
      </div>
    </form>
  )
}

export default LoginForm
