/** 불용 등록 대상 운용상태 — 운용중·반납 (API 코드·화면 라벨) */
export const DISUSE_REGISTRATION_ELIGIBLE_OPER_LABELS = ['운용중', '반납'] as const

const DISUSE_REGISTRATION_ELIGIBLE_OPER_CODES = new Set(['OPER', 'OPE', 'RTN', 'RET'])

export function isDisuseEligibleOperatingStatus(status: string | undefined | null): boolean {
  const s = String(status ?? '').trim()
  if (!s) return false
  if ((DISUSE_REGISTRATION_ELIGIBLE_OPER_LABELS as readonly string[]).includes(s)) return true
  return DISUSE_REGISTRATION_ELIGIBLE_OPER_CODES.has(s.toUpperCase())
}
