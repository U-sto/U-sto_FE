import { useEffect, useState } from 'react'
import { fetchCurrentUsrId } from '../api/users'

/**
 * 로그인 사용자 ID — `GET /api/users/info` → `usrId`.
 * 등록 페이지 등록자ID(읽기 전용) 표시·저장에 사용한다.
 */
export function useRegistrantIdFromSession(): string {
  const [usrId, setUsrId] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchCurrentUsrId()
      .then((id) => {
        if (!cancelled) setUsrId(id)
      })
      .catch(() => {
        if (!cancelled) setUsrId('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return usrId
}

/** 등록(신규) 화면 등록자ID 표시 — API usrId 우선, 수정 모드는 저장값 */
export function registrantIdForDisplay(
  stored: string,
  sessionId: string,
  isEditMode: boolean,
): string {
  if (isEditMode) return stored
  return sessionId.trim() || stored.trim()
}
