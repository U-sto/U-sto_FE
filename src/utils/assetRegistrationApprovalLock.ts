/**
 * 자산관리 반납·처분·불용·운용전환 등 — 승인 완료/반려 건은 수정 화면 진입·저장 불가.
 * API `apprSts` 코드 및 목록 표시용 한글 라벨 모두 대응.
 */
const LOCKED_APPR_CODES = new Set([
  'REJECT',
  'REJECTED',
  'CONFIRM',
  'CONFIRMED',
  'APPROVED',
])

export function isAssetRegistrationEditLockedByApprCode(apprSts: string | undefined | null): boolean {
  const c = String(apprSts ?? '').trim().toUpperCase()
  return c !== '' && LOCKED_APPR_CODES.has(c)
}

export function isAssetRegistrationEditLockedByApprLabel(label: string | undefined | null): boolean {
  const s = String(label ?? '').trim()
  return s === '반려' || s === '확정'
}

export function isAssetRegistrationEditLockedByAppr(
  label: string | undefined | null,
  code?: string | undefined | null,
): boolean {
  return (
    isAssetRegistrationEditLockedByApprLabel(label) ||
    isAssetRegistrationEditLockedByApprCode(code) ||
    isAssetRegistrationEditLockedByApprCode(label)
  )
}

export const ASSET_REGISTRATION_EDIT_LOCKED_MESSAGE = '반려·확정된 건은 수정할 수 없습니다.'
