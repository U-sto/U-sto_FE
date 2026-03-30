import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './DeleteConfirmModal.css'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export type DeleteConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  /** 삭제 확정 시 호출 */
  onConfirm: () => void
  /** 제목 (기본: 삭제) */
  title?: string
  /** 본문 안내 (기본: 삭제된 내용은 복구할 수 없습니다.) */
  description?: string
  /** 추가 안내 (예: 선택 건수) */
  extraMessage?: ReactNode
  /** 확인 버튼 비활성 */
  confirmDisabled?: boolean
  /** 확인 버튼 라벨 */
  confirmLabel?: string
}

/**
 * 브라우저 confirm 대신 사용하는 삭제 확인 모달 (흰 테두리·경고 아이콘·취소/삭제)
 */
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '삭제',
  description = '삭제된 내용은 복구할 수 없습니다.',
  extraMessage,
  confirmDisabled = false,
  confirmLabel = '삭제',
}: DeleteConfirmModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      previousActiveElement.current = document.activeElement as HTMLElement | null
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (first) first.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || focusables.length === 0) return
      const current = document.activeElement as HTMLElement
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (current === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen && previousActiveElement.current?.focus) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="delete-confirm-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-modal-title"
        aria-describedby="delete-confirm-modal-desc"
      >
        <button
          type="button"
          className="delete-confirm-modal__close"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="delete-confirm-modal__icon-wrap" aria-hidden="true">
          <span className="delete-confirm-modal__icon-mark">!</span>
        </div>

        <h2 id="delete-confirm-modal-title" className="delete-confirm-modal__title">
          {title}
        </h2>
        <p id="delete-confirm-modal-desc" className="delete-confirm-modal__description">
          {description}
        </p>
        {extraMessage != null && extraMessage !== false && (
          <div className="delete-confirm-modal__extra">{extraMessage}</div>
        )}

        <div className="delete-confirm-modal__actions">
          <button
            type="button"
            className="delete-confirm-modal__btn delete-confirm-modal__btn--outline"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="delete-confirm-modal__btn delete-confirm-modal__btn--primary"
            onClick={() => onConfirm()}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default DeleteConfirmModal
