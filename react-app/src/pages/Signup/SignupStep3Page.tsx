import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GNB from '../../components/GNB'
import ProgressBar from '../../components/ProgressBar'
import TextField from '../../components/TextField'
import Dropdown from '../../components/Dropdown'
import PhoneAuthField from '../../components/PhoneAuthField'
import Button from '../../components/Button'
import { DEPARTMENTS } from '../../constants/departments'
import './SignupStep3Page.css'

const SignupStep3Page = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')

  const handleSendCode = () => { /* TODO */ }
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/signup/complete')
  }

  return (
    <div className="signup-step3-page">
      <GNB />
      <div className="signup-step3-wrapper">
        <h1 className="signup-step3-title">회원가입</h1>
        <ProgressBar step={3} />
        <form className="signup-step3-form" onSubmit={handleSignup}>
          <div className="signup-step3-fields">
            <TextField placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
            <Dropdown placeholder="소속" value={department} onChange={setDepartment} options={DEPARTMENTS} />
            <div className="phone-auth-section">
              <PhoneAuthField phone={phone} onPhoneChange={(e) => setPhone(e.target.value)} onSendCode={handleSendCode} />
              <TextField placeholder="인증번호를 입력해 주세요" value={authCode} onChange={(e) => setAuthCode(e.target.value)} />
            </div>
          </div>
          <div className="signup-step3-bottom">
            <Button type="submit">가입하기</Button>
            <div className="signup-step3-footer">
              <Link to="/login" className="signup-step3-link">기존 계정 로그인</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupStep3Page
