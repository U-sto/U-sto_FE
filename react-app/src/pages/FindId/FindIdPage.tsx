import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import FindIdTabs from '../../components/FindIdTabs'
import TextField from '../../components/TextField'
import EmailAuthField from '../../components/EmailAuthField'
import Button from '../../components/Button'
import './FindIdPage.css'

const FindIdPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [authCode, setAuthCode] = useState('')

  const handleSendCode = () => {
    console.log('인증번호 전송:', email)
    // 여기에 인증번호 전송 로직을 추가하세요
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('인증하기:', { name, email, authCode })
    // 여기에 아이디 찾기 로직을 추가하세요
    // 인증 성공 시 결과 페이지로 이동
    navigate('/find-id/result')
  }

  return (
    <div className="find-id-page">
      <GNB />
      <div className="find-id-wrapper">
        <FindIdTabs activeTab="id" />
        <p className="find-id-subtitle">계정에 등록한 이름과 이메일을 입력해 주세요</p>
        
        <form className="find-id-form" onSubmit={handleAuth}>
          <TextField
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          <div className="email-auth-section">
            <EmailAuthField
              email={email}
              onEmailChange={(e) => setEmail(e.target.value)}
              onSendCode={handleSendCode}
            />
            
            <TextField
              placeholder="인증번호를 입력해 주세요"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
            />
          </div>
          
          <Button type="submit">인증하기</Button>
        </form>
        
        <div className="find-id-footer">
          <Link to="/signup" className="find-id-link">회원가입</Link>
          <Link to="/login" className="find-id-link">기존 계정 로그인</Link>
        </div>
      </div>
    </div>
  )
}

export default FindIdPage
