/**
 * 자산관리 반납·처분·불용·운용전환 등 — 확정(승인 완료) 건만 수정·삭제 불가.
 * 반려·작성중·승인요청중 등은 수정·삭제 가능.
 */
const CONFIRMED_APPR_CODES = new Set(['CONFIRM', 'CONFIRMED', 'APPROVED'])

export function isAssetRegistrationEditLockedByApprCode(
  apprSts: string | undefined | null,
): boolean {
  const c = String(apprSts ?? '').trim().toUpperCase()
  return c !== '' && CONFIRMED_APPR_CODES.has(c)
}

export function isAssetRegistrationEditLockedByApprLabel(
  label: string | undefined | null,
): boolean {
  return String(label ?? '').trim() === '확정'
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

export const ASSET_REGISTRATION_EDIT_LOCKED_MESSAGE = '확정된 건은 수정할 수 없습니다.'
export const ASSET_REGISTRATION_DELETE_LOCKED_MESSAGE = '확정된 건은 삭제할 수 없습니다.'
