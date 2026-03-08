import type { ChangeEvent } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import './IDCheckField.css'

interface IDCheckFieldProps {
  userId: string
  onUserIdChange: (e: ChangeEvent<HTMLInputElement>) => void
  onCheckDuplicate: () => void
  /** ID 중복 확인 완료 여부 - 시각적 피드백 및 다음 단계 진행 제어용 */
  isIdChecked?: boolean
  /** 중복확인 API 호출 중 여부 */
  isChecking?: boolean
}

const IDCheckField = ({ userId, onUserIdChange, onCheckDuplicate, isIdChecked, isChecking }: IDCheckFieldProps) => {
  return (
    <div className={`id-check-field ${isIdChecked ? 'id-check-field--verified' : ''}`} aria-describedby={isIdChecked ? 'id-check-status' : undefined}>
      <div className="id-check-wrapper">
        <TextField
          placeholder="아이디"
          value={userId}
          onChange={onUserIdChange}
          className="id-input"
        />
        <Button
          type="button"
          onClick={onCheckDuplicate}
          className="check-duplicate-button"
          disabled={isChecking}
        >
          {isChecking ? '확인 중...' : '중복확인'}
        </Button>
      </div>
      {isIdChecked && (
        <span id="id-check-status" className="id-check-verified-text" role="status">
          사용 가능한 아이디입니다.
        </span>
      )}
    </div>
  )
}

export default IDCheckField
