/**
 * API 응답 객체에서 keys 순서대로 첫 번째 비어 있지 않은 값을 문자열로 반환합니다.
 * 필드명이 스웨거/버전별로 달라질 때 매핑 중복을 줄이기 위해 사용합니다.
 */
export function pickFirstStringFromRecord(
  obj: Record<string, unknown>,
  keys: string[],
): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && String(v).trim() !== '') {
      return String(v)
    }
  }
  return ''
}
