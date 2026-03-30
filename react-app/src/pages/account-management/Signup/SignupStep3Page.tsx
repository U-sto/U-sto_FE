import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import PhoneAuthField from '../../../features/auth/components/PhoneAuthField/PhoneAuthField'
import Button from '../../../components/common/Button/Button'
import { sendSmsVerificationCode, checkSmsVerificationCode } from '../../../api/auth'
import { fetchOrganizations, buildOrganizationSelect } from '../../../api/organization'
import { signUp, checkSmsExists } from '../../../api/users'
import { formatPhoneNumber } from '../../../utils/formatPhoneNumber'
import './SignupStep3Page.css'

export interface SignupStep2State {
  userId: string
  password: string
}

/** API 실패 시에만 사용하는 소속 폴백 (기존 하드코딩) */
const SIGNUP_ORG_FALLBACK_BY_CAMPUS: Record<string, string> = {
  '한양대학교 서울캠퍼스': '7002282',
  '한양대학교 ERICA캠퍼스': '7008277',
}
const SIGNUP_ORG_FALLBACK_OPTIONS = Object.keys(SIGNUP_ORG_FALLBACK_BY_CAMPUS)

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
  const [orgOptions, setOrgOptions] = useState<string[]>(() => [...SIGNUP_ORG_FALLBACK_OPTIONS])
  const [orgLabelToCd, setOrgLabelToCd] = useState<Record<string, string>>(() => ({
    ...SIGNUP_ORG_FALLBACK_BY_CAMPUS,
  }))

  useEffect(() => {
    if (!step2State?.userId || !step2State?.password) {
      navigate('/signup/step2', { replace: true })
    }
  }, [step2State, navigate])

  /** GET /api/organization/organizations — 회원가입 소속 목록 */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchOrganizations()
        if (cancelled) return
        const { options, labelToOrgCd } = buildOrganizationSelect(rows)
        if (options.length > 0) {
          setOrgOptions(options)
          setOrgLabelToCd(labelToOrgCd)
        }
      } catch {
        if (!cancelled) {
          setOrgOptions([...SIGNUP_ORG_FALLBACK_OPTIONS])
          setOrgLabelToCd({ ...SIGNUP_ORG_FALLBACK_BY_CAMPUS })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      await checkSmsExists(target)
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

    const orgCd = orgLabelToCd[trimmedDepartment]
    if (!orgCd) {
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
        orgCd,
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
          options={orgOptions}
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
