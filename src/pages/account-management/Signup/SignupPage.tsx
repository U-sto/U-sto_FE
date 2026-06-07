import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SignupLayout from '../../../components/layout/auth/SignupLayout/SignupLayout'
import IDCheckField from '../../../features/auth/components/IDCheckField/IDCheckField'
import Button from '../../../components/common/Button/Button'
import { checkUserIdExists } from '../../../api/users'
import { clearLoginToken } from '../../../api/auth'
import { isUserIdAvailable } from '../../../features/auth/signup/signupApiHelpers'
import {
  loadSignupSession,
  saveSignupSession,
  clearSignupSession,
} from '../../../features/auth/signup/signupSession'
import { mapSignupSessionError } from '../../../features/auth/signup/signupErrors'
import './SignupStep2Page.css'

const SignupPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [isIdChecked, setIsIdChecked] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    clearLoginToken()
    const session = loadSignupSession()
    if (session.completed) {
      clearSignupSession()
      return
    }
    if (session.userId) {
      setUserId(session.userId)
      setIsIdChecked(session.isUserIdVerified)
    }
  }, [])

  const handleCheckDuplicate = async () => {
    const trimmed = userId.trim()
    if (!trimmed) {
      setError('아이디를 입력해 주세요.')
      setIsIdChecked(false)
      saveSignupSession({ userId: '', isUserIdVerified: false })
      return
    }
    setError(null)
    setIsCheckingDuplicate(true)
    try {
      const res = await checkUserIdExists(trimmed)
      const { available, message } = isUserIdAvailable(res.data, res.message)
      if (available) {
        setIsIdChecked(true)
        saveSignupSession({
          userId: trimmed,
          isUserIdVerified: true,
          isEmailVerified: false,
          emailId: '',
          password: '',
        })
      } else {
        setIsIdChecked(false)
        saveSignupSession({ userId: trimmed, isUserIdVerified: false })
        setError(message || '이미 사용 중인 아이디입니다.')
      }
    } catch (e) {
      setIsIdChecked(false)
      saveSignupSession({ userId: trimmed, isUserIdVerified: false })
      const message = e instanceof Error ? e.message : '중복 확인에 실패했습니다.'
      setError(mapSignupSessionError(message))
    } finally {
      setIsCheckingDuplicate(false)
    }
  }

  const handleNext = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = userId.trim()
    const session = loadSignupSession()

    if (!isIdChecked || !session.isUserIdVerified || session.userId !== trimmed) {
      setError('아이디 중복 확인을 완료해 주세요.')
      return
    }

    setError(null)
    navigate('/signup/step2')
  }

  return (
    <SignupLayout
      step={1}
      title="회원가입"
      subtitle="아이디 중복 확인을 진행해 주세요"
      onSubmit={handleNext}
    >
      <div className="signup-step2-fields">
        <IDCheckField
          userId={userId}
          onUserIdChange={(e) => {
            setUserId(e.target.value)
            setIsIdChecked(false)
            saveSignupSession({
              userId: e.target.value.trim(),
              isUserIdVerified: false,
              isEmailVerified: false,
              emailId: '',
              password: '',
            })
          }}
          onCheckDuplicate={handleCheckDuplicate}
          isIdChecked={isIdChecked}
          isChecking={isCheckingDuplicate}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <Button type="submit" disabled={!isIdChecked || isCheckingDuplicate}>
        다음
      </Button>
    </SignupLayout>
  )
}

export default SignupPage
