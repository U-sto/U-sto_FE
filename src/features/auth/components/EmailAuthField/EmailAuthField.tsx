import type { ChangeEvent } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import VerificationCodeInput from '../VerificationCodeInput/VerificationCodeInput'
import './EmailAuthField.css'

interface EmailAuthFieldProps {
  email: string
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
  isSending?: boolean
  authCode?: string
  onAuthCodeChange?: (e: ChangeEvent<HTMLInputElement>) => void
  /** 인증번호 전송 성공 후 true — 입력란·타이머 표시 */
  codeSent?: boolean
  verificationKey?: number
  onVerificationExpired?: () => void
}

const EmailAuthField = ({
  email,
  onEmailChange,
  onSendCode,
  isSending = false,
  authCode = '',
  onAuthCodeChange,
  codeSent = false,
  verificationKey = 0,
  onVerificationExpired,
}: EmailAuthFieldProps) => {
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
          onResendCode={onSendCode}
          isResending={isSending}
          onVerificationExpired={onVerificationExpired}
        />
      ) : null}
    </div>
  )
}

export default EmailAuthField
