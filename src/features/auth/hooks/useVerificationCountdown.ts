import { useEffect, useState } from 'react'

/** 백엔드 이메일·SMS 인증번호 유효 시간(초) */
export const VERIFICATION_TIME_LIMIT_SECONDS = 5 * 60

export function formatVerificationCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** timerKey가 바뀔 때마다 5분 카운트다운을 처음부터 시작 */
export function useVerificationCountdown(timerKey: number, active: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!active) {
      setSecondsLeft(0)
      return
    }

    setSecondsLeft(VERIFICATION_TIME_LIMIT_SECONDS)
    const endAt = Date.now() + VERIFICATION_TIME_LIMIT_SECONDS * 1000
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        window.clearInterval(id)
      }
    }, 1000)

    return () => window.clearInterval(id)
  }, [active, timerKey])

  const formatted = formatVerificationCountdown(secondsLeft)
  const isExpired = active && secondsLeft <= 0

  return { secondsLeft, formatted, isExpired }
}
