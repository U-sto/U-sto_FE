/**
 * 물품 취득정리구분 — API `acqArrgTy` / `arrgTy` 코드 → 화면 표시명.
 * 공통코드(ACQ_ARRANGEMENT_TYPE)가 없을 때 취득 등록 등에서 폴백으로도 사용한다.
 */
export const ACQ_ARRG_TY_LABEL: Record<string, string> = {
  BUY: '자체구입',
  MAKE: '자체제작',
  SELF_MAKE: '자체제작',
  PRD: '자체제작',
  DONATE: '기증',
  ARRG: '정리',
  ETC: '기타',
}

export function labelForAcqArrangementCode(code: string | undefined | null): string {
  const raw = String(code ?? '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  return ACQ_ARRG_TY_LABEL[upper] ?? raw
}
