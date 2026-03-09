import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import PhoneAuthField from '../../../features/auth/components/PhoneAuthField/PhoneAuthField'
import Button from '../../../components/common/Button/Button'
import { DEPARTMENTS } from '../../../constants/departments'
import { sendSmsVerificationCode, checkSmsVerificationCode } from '../../../api/auth'
import { signUp } from '../../../api/users'
import { formatPhoneNumber } from '../../../utils/formatPhoneNumber'
import './SignupStep3Page.css'

export interface SignupStep2State {
  userId: string
  password: string
}

const SignupStep3Page = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const step2State = location.state as SignupStep2State | null
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!step2State?.userId || !step2State?.password) {
      navigate('/signup/step2', { replace: true })
    }
  }, [step2State, navigate])

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
  }

  const handleSendCode = async () => {
    const trimmedPhone = phone.replace(/\s/g, '').trim()
    if (!/^010-\d{4}-\d{4}$/.test(trimmedPhone)) {
      setError('올바른 전화번호를 입력해 주세요.')
      return
    }
    setError(null)
    setIsSendingCode(true)
    try {
      const target = trimmedPhone.replace(/-/g, '')
      await sendSmsVerificationCode({ target, purpose: 'SIGNUP' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '인증번호 전송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()

    if (!step2State?.userId || !step2State?.password) {
      setError('이전 단계 정보가 없습니다. 아이디·비밀번호 단계부터 진행해 주세요.')
      navigate('/signup/step2', { replace: true })
      return
    }

    const trimmedName = name.trim()
    const trimmedDepartment = department.trim()
    const trimmedPhone = phone.replace(/\s/g, '').trim()
    const trimmedAuthCode = authCode.trim()

    if (!trimmedName) {
      setError('이름을 입력해 주세요.')
      return
    }

    if (!trimmedDepartment) {
      setError('소속을 선택해 주세요.')
      return
    }

    if (!/^010-\d{4}-\d{4}$/.test(trimmedPhone)) {
      setError('올바른 전화번호를 입력해 주세요.')
      return
    }

    if (!trimmedAuthCode) {
      setError('인증번호를 입력해 주세요.')
      return
    }

    setError(null)
    setIsVerifying(true)
    try {
      await checkSmsVerificationCode({ code: trimmedAuthCode })
      await signUp({
        usrId: step2State.userId,
        usrNm: trimmedName,
        pwd: step2State.password,
        orgCd: trimmedDepartment,
      })
      navigate('/signup/complete')
    } catch (e) {
      setError(e instanceof Error ? e.message : '가입 처리에 실패했습니다.')
    } finally {
      setIsVerifying(false)
    }
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
      <Button type="submit" disabled={isVerifying}>
        {isVerifying ? '확인 중...' : '가입하기'}
      </Button>
    </SignupLayout>
  )
}

export default SignupStep3Page
