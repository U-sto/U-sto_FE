import { checkUserIdExists, checkEmailExists, checkSmsExists } from '../../../api/users'

/**
 * 이메일 인증번호 발송 전 — sendEmail이 세션 일부를 초기화할 수 있어 exists API를 다시 호출
 * 순서: user-id exists → email exists
 */
export async function refreshExistsBeforeEmailSend(userId: string, emailId: string): Promise<void> {
  const trimmedUserId = userId.trim()
  const trimmedEmailId = emailId.trim()
  if (!trimmedUserId || !trimmedEmailId) {
    throw new Error('아이디·이메일 정보가 없습니다. 1단계부터 다시 진행해 주세요.')
  }
  await checkUserIdExists(trimmedUserId)
  await checkEmailExists(trimmedEmailId)
}

/**
 * SMS 인증번호 발송 전 — 순서: user-id exists → email exists → sms exists
 */
export async function refreshExistsBeforeSmsSend(
  userId: string,
  emailId: string,
  sms: string,
): Promise<void> {
  const trimmedUserId = userId.trim()
  const trimmedEmailId = emailId.trim()
  const digits = sms.replace(/\D/g, '')
  if (!trimmedUserId || !trimmedEmailId || !digits) {
    throw new Error('가입 정보가 유실되었습니다. 처음 단계부터 다시 진행해 주세요.')
  }
  await checkUserIdExists(trimmedUserId)
  await checkEmailExists(trimmedEmailId)
  await checkSmsExists(digits)
}

/**
 * 회원가입 최종 요청 직전 — 세션 exists 플래그 재확인
 */
export async function refreshExistsBeforeSignUp(
  userId: string,
  emailId: string,
  sms: string,
): Promise<void> {
  await refreshExistsBeforeSmsSend(userId, emailId, sms)
}

/** exists/user-id 응답에서 이용 가능 여부 판별 */
export function isUserIdAvailable(data: unknown, fallbackMessage?: string): {
  available: boolean
  message?: string
} {
  const d = data as { exists?: boolean; isAvailable?: boolean } | null
  const available =
    d?.isAvailable === true || (typeof d?.exists === 'boolean' && !d.exists)
  return {
    available,
    message: available ? undefined : fallbackMessage || '이미 사용 중인 아이디입니다.',
  }
}
