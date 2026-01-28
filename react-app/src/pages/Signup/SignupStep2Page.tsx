import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import ProgressBar from '../../components/ProgressBar'
import IDCheckField from '../../components/IDCheckField'
import PasswordField from '../../components/PasswordField'
import Button from '../../components/Button'
import './SignupStep2Page.css'

const SignupStep2Page = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const handleCheckDuplicate = () => {
    console.log('아이디 중복확인:', userId)
    // 여기에 중복확인 로직을 추가하세요
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('다음 단계:', { userId, password, passwordConfirm })
    // 다음 단계로 이동
    navigate('/signup/step3')
  }

  return (
    <div className="signup-step2-page">
      <GNB />
      <div className="signup-step2-wrapper">
        <h1 className="signup-step2-title">회원가입</h1>
        <ProgressBar step={2} />
        
        <form className="signup-step2-form" onSubmit={handleNext}>
          <div className="signup-step2-fields">
            <IDCheckField
              userId={userId}
              onUserIdChange={(e) => setUserId(e.target.value)}
              onCheckDuplicate={handleCheckDuplicate}
            />
            
            <div className="password-fields">
              <PasswordField
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordField
                placeholder="비밀번호 재입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="signup-step2-bottom">
            <Button type="submit">다음</Button>
            <div className="signup-step2-footer">
              <Link to="/login" className="signup-step2-link">기존 계정 로그인</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupStep2Page
