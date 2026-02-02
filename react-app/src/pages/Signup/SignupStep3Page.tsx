import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../components/SignupLayout'
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
  const [error, setError] = useState<string | null>(null)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    let formatted = rawValue
    if (rawValue.length > 3 && rawValue.length <= 7) {
      formatted = `${rawValue.slice(0, 3)}-${rawValue.slice(3)}`
    } else if (rawValue.length > 7) {
      formatted = `${rawValue.slice(0, 3)}-${rawValue.slice(3, 7)}-${rawValue.slice(7, 11)}`
    }
    setPhone(formatted)
  }

  const handleSendCode = () => {
    if (!/^[0-9-]{10,13}$/.test(phone)) {
      setError('올바른 전화번호를 입력해 주세요.')
      return
    }
    setError(null)
    // TODO: 전화 인증번호 전송 API 연동
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    navigate('/signup/complete')
  }

  return (
    <SignupLayout
      step={3}
      title="회원가입"
      onSubmit={handleSignup}
      formClassName="signup-layout-form--step3"
    >
      <div className="signup-step3-fields">
        <TextField
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <Dropdown
          placeholder="소속"
          value={department}
          onChange={setDepartment}
          options={DEPARTMENTS}
        />
        <div className="phone-auth-section">
          <PhoneAuthField
            phone={phone}
            onPhoneChange={handlePhoneChange}
            onSendCode={handleSendCode}
          />
          <TextField
            placeholder="인증번호를 입력해 주세요"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <Button type="submit">가입하기</Button>
    </SignupLayout>
  )
}

export default SignupStep3Page
