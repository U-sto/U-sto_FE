import TextField from './TextField'
import Button from './Button'
import './IDCheckField.css'

interface IDCheckFieldProps {
  userId: string
  onUserIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCheckDuplicate: () => void
}

const IDCheckField = ({ userId, onUserIdChange, onCheckDuplicate }: IDCheckFieldProps) => {
  return (
    <div className="id-check-field">
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
        >
          중복확인
        </Button>
      </div>
    </div>
  )
}

export default IDCheckField
