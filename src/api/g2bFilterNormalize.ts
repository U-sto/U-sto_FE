/**
 * G2B 목록번호 필터(앞칸·뒤칸) → API 검색 파라미터로 정규화.
 * - 취득 등록과 동일: 첫 `-` 기준 분리 후 각 구간에서 하이픈 제거
 * - 앞칸만 있고 `1234-5678` 형태면 분리 / 뒤칸만 있고 동일 형태면 분리(복붙 대응)
 */

const stripHyphens = (s: string) => s.replace(/-/g, '').trim()

export type AcquisitionG2bSearchFields = {
  g2b0Cd?: string
  g2bDCd?: string
  g2bCd?: string
}

/**
 * 앞·뒤 입력값 → g2b0Cd / g2bDCd (물품취득 목록 조회 등)
 */
export function parseG2bListNumberParts(
  fromRaw: string,
  toRaw: string,
): { g2b0Cd?: string; g2bDCd?: string } | null {
  const from = fromRaw?.trim() ?? ''
  const to = toRaw?.trim() ?? ''
  if (!from && !to) return null

  if (from && !to) {
    const dash = from.indexOf('-')
    if (dash !== -1) {
      const a = stripHyphens(from.slice(0, dash))
      const b = stripHyphens(from.slice(dash + 1))
      const out: { g2b0Cd?: string; g2bDCd?: string } = {}
      if (a) out.g2b0Cd = a
      if (b) out.g2bDCd = b
      return Object.keys(out).length ? out : null
    }
    const only = stripHyphens(from)
    return only ? { g2b0Cd: only } : null
  }

  if (!from && to) {
    const dash = to.indexOf('-')
    if (dash !== -1) {
      const a = stripHyphens(to.slice(0, dash))
      const b = stripHyphens(to.slice(dash + 1))
      const out: { g2b0Cd?: string; g2bDCd?: string } = {}
      if (a) out.g2b0Cd = a
      if (b) out.g2bDCd = b
      return Object.keys(out).length ? out : null
    }
    const only = stripHyphens(to)
    return only ? { g2bDCd: only } : null
  }

  const a = stripHyphens(from)
  const b = stripHyphens(to)
  const out: { g2b0Cd?: string; g2bDCd?: string } = {}
  if (a) out.g2b0Cd = a
  if (b) out.g2bDCd = b
  return Object.keys(out).length ? out : null
}

/** GET /api/item/acquisitions searchRequest용 */
export function buildAcquisitionG2bSearchFields(
  fromRaw: string,
  toRaw: string,
): AcquisitionG2bSearchFields {
  const p = parseG2bListNumberParts(fromRaw, toRaw)
  if (!p) return {}
  const { g2b0Cd, g2bDCd } = p
  const o: AcquisitionG2bSearchFields = {}
  if (g2b0Cd) o.g2b0Cd = g2b0Cd
  if (g2bDCd) o.g2bDCd = g2bDCd
  if (g2b0Cd && g2bDCd) o.g2bCd = `${g2b0Cd}-${g2bDCd}`
  else if (g2b0Cd) o.g2bCd = g2b0Cd
  return o
}

/**
 * 단일 필드 검색용 (g2bDcd, g2bItemNo, g2bNo 등) — 표시와 맞춘 `앞-뒤` 조합
 */
export function buildCombinedG2bListNoForFilter(
  fromRaw: string,
  toRaw: string,
): string | undefined {
  const p = parseG2bListNumberParts(fromRaw, toRaw)
  if (!p) return undefined
  return [p.g2b0Cd, p.g2bDCd].filter(Boolean).join('-') || undefined
}
