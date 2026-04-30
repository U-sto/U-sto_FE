import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import TextField from '../../components/common/TextField/TextField'
import './AiForecastRenameModal.css'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export type AiForecastRenameModalProps = {
  isOpen: boolean
  onClose: () => void
  /** 모달을 열 때의 초기 제목 */
  initialTitle: string
  /** 확인 시 서버 반영 후 호출 (실패는 throw) */
  onConfirm: (title: string) => Promise<void>
}

const AiForecastRenameModal = ({
  isOpen,
  onClose,
  initialTitle,
  onConfirm,
}: AiForecastRenameModalProps) => {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(initialTitle)
      setSubmitting(false)
    }
  }, [isOpen, initialTitle])

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
    const input = panelRef.current.querySelector<HTMLInputElement>('input[type="text"], input:not([type])')
    if (input) {
      input.focus()
      input.select()
    } else if (first) {
      first.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!submitting) onClose()
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
  }, [isOpen, onClose, submitting])

  useEffect(() => {
    if (!isOpen && previousActiveElement.current?.focus) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onConfirm(trimmed)
      onClose()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '이름 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="ai-forecast-rename-modal-overlay"
      onClick={() => !submitting && onClose()}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="ai-forecast-rename-modal"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-forecast-rename-modal-title"
      >
        <div className="ai-forecast-rename-modal__accent" aria-hidden />
        <button
          type="button"
          className="ai-forecast-rename-modal__close"
          onClick={() => !submitting && onClose()}
          aria-label="닫기"
          disabled={submitting}
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

        <h2 id="ai-forecast-rename-modal-title" className="ai-forecast-rename-modal__title">
          이름 수정
        </h2>
        <p className="ai-forecast-rename-modal__desc">분석 기록 목록에 표시될 이름을 입력해 주세요.</p>

        <form onSubmit={handleSubmit}>
          <label className="ai-forecast-rename-modal__label" htmlFor="ai-forecast-rename-input">
            분석 제목
          </label>
          <TextField
            id="ai-forecast-rename-input"
            className="ai-forecast-rename-modal__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="제목을 입력하세요"
            autoComplete="off"
          />

          <div className="ai-forecast-rename-modal__actions">
            <button
              type="button"
              className="ai-forecast-rename-modal__btn ai-forecast-rename-modal__btn--outline"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="ai-forecast-rename-modal__btn ai-forecast-rename-modal__btn--primary"
              disabled={submitting || !value.trim()}
            >
              {submitting ? '저장 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default AiForecastRenameModal
