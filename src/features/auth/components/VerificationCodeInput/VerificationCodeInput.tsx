import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import { useVerificationCountdown } from '../../hooks/useVerificationCountdown'
import VerificationExpiredModal from '../VerificationExpiredModal/VerificationExpiredModal'
import './VerificationCodeInput.css'

interface VerificationCodeInputProps {
  visible: boolean
  authCode: string
  onAuthCodeChange: (e: ChangeEvent<HTMLInputElement>) => void
  /** 인증번호 재전송 시 타이머를 다시 시작하기 위한 키 */
  timerKey: number
  inputClassName?: string
  onResendCode?: () => void | Promise<void>
  isResending?: boolean
  /** 타이머 만료 시 부모 상태(codeSent 등) 초기화 */
  onVerificationExpired?: () => void
}

const VerificationCodeInput = ({
  visible,
  authCode,
  onAuthCodeChange,
  timerKey,
  inputClassName,
  onResendCode,
  isResending = false,
  onVerificationExpired,
}: VerificationCodeInputProps) => {
  const { formatted, isExpired } = useVerificationCountdown(timerKey, visible)
  const [expiredModalOpen, setExpiredModalOpen] = useState(false)
  const dismissedExpiryKeyRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible || !isExpired) {
      if (!isExpired) {
        setExpiredModalOpen(false)
        dismissedExpiryKeyRef.current = null
      }
      return
    }
    if (dismissedExpiryKeyRef.current === timerKey) return
    setExpiredModalOpen(true)
    onVerificationExpired?.()
  }, [visible, isExpired, timerKey, onVerificationExpired])

  const handleConfirm = () => {
    dismissedExpiryKeyRef.current = timerKey
    setExpiredModalOpen(false)
  }

  const handleResend = async () => {
    dismissedExpiryKeyRef.current = timerKey
    setExpiredModalOpen(false)
    await onResendCode?.()
  }

  if (!visible) return null

  return (
    <>
      <div className="verification-code-field">
        <div className="verification-code-row">
          <TextField
            placeholder="인증번호를 입력해 주세요"
            value={authCode}
            onChange={onAuthCodeChange}
            inputMode="numeric"
            className={['verification-code-input', inputClassName].filter(Boolean).join(' ')}
          />
          <span
            className={`verification-timer ${isExpired ? 'verification-timer--expired' : ''}`}
            aria-live="polite"
            aria-label={`인증 제한 시간 ${formatted}`}
          >
            {formatted}
          </span>
          {onResendCode ? (
            <Button
              type="button"
              className="verification-resend-button"
              onClick={() => void onResendCode()}
              disabled={isResending}
            >
              {isResending ? '전송 중...' : '재전송'}
            </Button>
          ) : null}
        </div>
      </div>
      <VerificationExpiredModal
        isOpen={expiredModalOpen}
        onConfirm={handleConfirm}
        onResend={handleResend}
        isResending={isResending}
      />
    </>
  )
}

export default VerificationCodeInput
