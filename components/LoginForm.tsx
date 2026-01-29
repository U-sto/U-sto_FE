import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextField from './TextField'
import PasswordField from './PasswordField'
import Checkbox from './Checkbox'
import Button from './Button'
import './LoginForm.css'

const LoginForm = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('로그인 시도:', { userId, password, autoLogin })
    // 여기에 실제 로그인 로직을 추가하세요
    // 로그인 성공 시 홈으로 이동
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
      
      <Button type="submit">로그인</Button>
      
      <div className="login-form-footer">
        <Link to="/signup" className="login-link">회원가입</Link>
        <Link to="/find-id" className="login-link">아이디/비밀번호 찾기</Link>
      </div>
    </form>
  )
}

export default LoginForm
