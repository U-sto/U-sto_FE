import { mapItemStsToDisplayLabel } from '../api/itemOperations'

/** DISUSE_REASON 공통코드 미로딩 시 */
const DISUSE_REASON_CODE_TO_LABEL: Record<string, string> = {
  REPLACE: '교체',
  DISPOSE: '폐기',
  ETC: '기타',
}

/** 처분 물품 사유·정리구분 코드 */
const DISPOSAL_REASON_CODE_TO_LABEL: Record<string, string> = {
  ...DISUSE_REASON_CODE_TO_LABEL,
  DISCARD: '폐기',
  SALE: '매각',
  LOSS: '멸실',
  THEFT: '도난',
}

function lookupCodeLabel(code: string, codeToDesc?: Record<string, string>): string | undefined {
  const c = code.trim()
  if (!c) return undefined
  const u = c.toUpperCase()
  return codeToDesc?.[c] ?? codeToDesc?.[u]
}

/** 물품상태(itemSts/operSts) API 코드 → 한글 */
export function resolveItemStatusLabel(
  code: string | undefined | null,
  codeToDesc?: Record<string, string>,
): string {
  const c = String(code ?? '').trim()
  if (!c) return ''
  return lookupCodeLabel(c, codeToDesc) ?? mapItemStsToDisplayLabel(c)
}

/** 불용 사유(dsuRsn) API 코드 → 한글 */
export function resolveDisuseReasonLabel(
  code: string | undefined | null,
  codeToDesc?: Record<string, string>,
): string {
  const c = String(code ?? '').trim()
  if (!c) return ''
  const u = c.toUpperCase()
  return (
    lookupCodeLabel(c, codeToDesc) ??
    DISUSE_REASON_CODE_TO_LABEL[u] ??
    DISUSE_REASON_CODE_TO_LABEL[c] ??
    c
  )
}

/** 처분 물품 사유(chgRsn/dsuRsn/disdRsn 등) API 코드 → 한글 */
export function resolveDisposalItemReasonLabel(
  code: string | undefined | null,
  codeToDesc?: Record<string, string>,
): string {
  const c = String(code ?? '').trim()
  if (!c) return ''
  const u = c.toUpperCase()
  return (
    lookupCodeLabel(c, codeToDesc) ??
    DISPOSAL_REASON_CODE_TO_LABEL[u] ??
    DISPOSAL_REASON_CODE_TO_LABEL[c] ??
    resolveDisuseReasonLabel(c, codeToDesc)
  )
}
