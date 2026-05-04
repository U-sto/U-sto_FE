/**
 * GET /api/users/info 의 roleNm 기준.
 * 관리자 메뉴(취득 확정·운용/반납/불용/처분 등록 관리)는 조직 관리자만 허용.
 */
export function isOrganizationAdministrator(roleNm: string | null | undefined): boolean {
  const t = (roleNm ?? '').trim()
  if (!t) return false
  if (t === '조직 관리자') return true
  if (t.replace(/\s+/g, '') === '조직관리자') return true
  return false
}
