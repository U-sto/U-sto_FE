import type { ChangeEvent } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import './PhoneAuthField.css'

interface PhoneAuthFieldProps {
  phone: string
  onPhoneChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
  /** 인증번호 전송 API 호출 중 여부 */
  isSending?: boolean
}

const PhoneAuthField = ({ phone, onPhoneChange, onSendCode, isSending }: PhoneAuthFieldProps) => {
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
        <Button
          type="button"
          onClick={onSendCode}
          className="send-code-button"
          disabled={isSending}
        >
          {isSending ? '전송 중...' : '인증번호'}
        </Button>
      </div>
    </div>
  )
}

export default PhoneAuthField
