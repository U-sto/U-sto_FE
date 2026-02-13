import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import './EmailAuthField.css'

interface EmailAuthFieldProps {
  email: string
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
}

const EmailAuthField = ({ email, onEmailChange, onSendCode }: EmailAuthFieldProps) => {
  return (
    <div className="email-auth-field">
      <div className="email-auth-wrapper">
        <div className="email-input-group">
          <TextField
            type="text"
            inputMode="email"
            placeholder="이메일"
            value={email}
            onChange={onEmailChange}
            className="email-input"
          />
          <span className="email-domain">@hanyang.ac.kr</span>
        </div>
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

export default EmailAuthField
