import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import IDCheckField from '../../../features/auth/components/IDCheckField/IDCheckField'
import PasswordField from '../../../components/common/PasswordField/PasswordField'
import Button from '../../../components/common/Button/Button'
import './SignupStep2Page.css'

const SignupStep2Page = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isIdChecked, setIsIdChecked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckDuplicate = () => {
    if (!userId.trim()) {
      setError('아이디를 입력해 주세요.')
      setIsIdChecked(false)
      return
    }
    setError(null)
    setIsIdChecked(true)
    // TODO: 실제 중복 검사 API 호출
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim() || !passwordConfirm.trim()) {
      setError('비밀번호를 모두 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError(null)
    navigate('/signup/step3')
  }

  return (
    <SignupLayout step={2} title="회원가입" onSubmit={handleNext}>
      <div className="signup-step2-fields">
        <IDCheckField
          userId={userId}
          onUserIdChange={(e) => {
            setUserId(e.target.value)
            setIsIdChecked(false)
          }}
          onCheckDuplicate={handleCheckDuplicate}
        />
        <div className="password-fields">
          <PasswordField
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="비밀번호 재입력"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <Button type="submit">다음</Button>
    </SignupLayout>
  )
}

export default SignupStep2Page
