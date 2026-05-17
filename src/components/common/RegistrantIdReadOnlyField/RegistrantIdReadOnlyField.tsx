import { useEffect, useRef, useState } from 'react'
import TextField from '../TextField/TextField'
import { fetchCurrentUsrId } from '../../../api/users'

type RegistrantIdReadOnlyFieldProps = {
  /** 수정 모드일 때 서버에서 불러온 등록자ID */
  storedValue?: string
  isEditMode?: boolean
  className?: string
  placeholder?: string
  /** 신규 등록: API usrId를 부모 state(저장 payload)에 반영 */
  onUsrIdResolved?: (usrId: string) => void
}

/**
 * 등록자ID 읽기 전용 — 마운트 시 GET /api/users/info → usrId 표시.
 */
export default function RegistrantIdReadOnlyField({
  storedValue = '',
  isEditMode = false,
  className = '',
  placeholder = '등록자ID',
  onUsrIdResolved,
}: RegistrantIdReadOnlyFieldProps) {
  const [apiUsrId, setApiUsrId] = useState('')
  const [loading, setLoading] = useState(!isEditMode)
  const onResolvedRef = useRef(onUsrIdResolved)
  onResolvedRef.current = onUsrIdResolved

  useEffect(() => {
    if (isEditMode) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchCurrentUsrId()
      .then((id) => {
        if (cancelled) return
        setApiUsrId(id)
        if (id) onResolvedRef.current?.(id)
      })
      .catch(() => {
        if (!cancelled) setApiUsrId('')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEditMode])

  const display = isEditMode ? storedValue : apiUsrId || storedValue

  return (
    <TextField
      value={display}
      readOnly
      placeholder={loading && !isEditMode ? '불러오는 중…' : placeholder}
      className={className}
    />
  )
}
