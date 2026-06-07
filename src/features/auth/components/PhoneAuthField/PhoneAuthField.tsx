import type { ChangeEvent } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import VerificationCodeInput from '../VerificationCodeInput/VerificationCodeInput'
import './PhoneAuthField.css'

interface PhoneAuthFieldProps {
  phone: string
  onPhoneChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
  isSending?: boolean
  authCode?: string
  onAuthCodeChange?: (e: ChangeEvent<HTMLInputElement>) => void
  codeSent?: boolean
  verificationKey?: number
  inputClassName?: string
}

const PhoneAuthField = ({
  phone,
  onPhoneChange,
  onSendCode,
  isSending = false,
  authCode = '',
  onAuthCodeChange,
  codeSent = false,
  verificationKey = 0,
  inputClassName,
}: PhoneAuthFieldProps) => {
  return (
    <div className="phone-auth-field">
      <div className="phone-auth-wrapper">
        <TextField
          type="tel"
          inputMode="numeric"
          placeholder="전화번호"
          value={phone}
          onChange={onPhoneChange}
          className="phone-input"
        />
        {!codeSent ? (
          <Button
            type="button"
            onClick={onSendCode}
            className="send-code-button"
            disabled={isSending}
          >
            {isSending ? '전송 중...' : '인증번호 보내기'}
          </Button>
        ) : null}
      </div>
      {onAuthCodeChange ? (
        <VerificationCodeInput
          visible={codeSent}
          authCode={authCode}
          onAuthCodeChange={onAuthCodeChange}
          timerKey={verificationKey}
          inputClassName={inputClassName}
          onResendCode={onSendCode}
          isResending={isSending}
        />
      ) : null}
    </div>
  )
}

export default PhoneAuthField
