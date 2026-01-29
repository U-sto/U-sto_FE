import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
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
    console.log('비밀번호 변경:', { password, confirmPassword })
    // 여기에 비밀번호 변경 로직을 추가하세요
    // 변경 성공 시 완료 페이지로 이동
    navigate('/find-password/complete')
  }

  return (
    <div className="find-password-reset-page">
      <GNB />
      <div className="find-password-reset-wrapper">
        <FindIdTabs activeTab="password" />
        <p className="find-password-reset-title">비밀번호 재설정</p>
        
        <form className="find-password-reset-form" onSubmit={handleSubmit}>
          <div className="password-fields">
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
        
        <div className="find-password-reset-footer">
          <Link to="/signup" className="find-password-reset-link">회원가입</Link>
          <Link to="/login" className="find-password-reset-link">기존 계정 로그인</Link>
        </div>
      </div>
    </div>
  )
}

export default FindPasswordResetPage
