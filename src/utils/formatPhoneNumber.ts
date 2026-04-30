/**
 * 전화번호 입력값을 010-XXXX-XXXX 형식으로 포맷.
 * 숫자 외 문자는 제거 후, 3자리·7자리 구간에 하이픈 삽입 (최대 11자리).
 */
export function formatPhoneNumber(value: string): string {
  const raw = value.replace(/[^0-9]/g, '')
  if (raw.length <= 3) return raw
  if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`
  return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`
}
