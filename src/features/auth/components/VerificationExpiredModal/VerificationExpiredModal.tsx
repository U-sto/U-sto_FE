import Modal from '../../../../components/common/Modal/Modal'
import Button from '../../../../components/common/Button/Button'
import './VerificationExpiredModal.css'

interface VerificationExpiredModalProps {
  isOpen: boolean
  onConfirm: () => void
  onResend: () => void
  isResending?: boolean
}

const VerificationExpiredModal = ({
  isOpen,
  onConfirm,
  onResend,
  isResending = false,
}: VerificationExpiredModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onConfirm}
      title="인증 시간 만료"
      size="small"
      showCloseButton={false}
      className="verification-expired-modal"
    >
      <p className="verification-expired-modal__message">
        인증 시간이 만료되었습니다.
        <br />
        인증번호를 다시 요청해 주세요.
      </p>
      <div className="verification-expired-modal__actions">
        <Button
          type="button"
          className="verification-expired-modal__btn verification-expired-modal__btn--outline"
          onClick={onConfirm}
          disabled={isResending}
        >
          확인
        </Button>
        <Button
          type="button"
          className="verification-expired-modal__btn verification-expired-modal__btn--primary"
          onClick={onResend}
          disabled={isResending}
        >
          {isResending ? '전송 중...' : '인증번호 재요청'}
        </Button>
      </div>
    </Modal>
  )
}

export default VerificationExpiredModal
