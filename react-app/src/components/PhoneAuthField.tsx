import TextField from './TextField'
import Button from './Button'
import './PhoneAuthField.css'

interface PhoneAuthFieldProps {
  phone: string
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
}

const PhoneAuthField = ({ phone, onPhoneChange, onSendCode }: PhoneAuthFieldProps) => {
  return (
    <div className="phone-auth-field">
      <div className="phone-auth-wrapper">
        <TextField
          placeholder="전화번호"
          value={phone}
          onChange={onPhoneChange}
          className="phone-input"
        />
        <Button
          type="button"
          onClick={onSendCode}
          className="send-code-button"
        >
          인증번호
        </Button>
      </div>
    </div>
  )
}

export default PhoneAuthField
