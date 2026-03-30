/**
 * 소속 선택용 부서/기관 목록
 * - 한글 항목: 가나다 순 (오름차순)
 * - 영어/로마자 시작 항목: 배열의 마지막에 배치
 */
const RAW_DEPARTMENTS: string[] = [
  '강소연구개발특구지원단',
  '경상대학',
  '경상대학RC',
  '공학대학',
  '공학대학RC',
  '교무처',
  '교책연구센터',
  '교육혁신처',
  '국제교육원',
  '국제처',
  '기획처',
  '기타부설기관',
  '대외협력실',
  '디자인대학',
  '디자인대학RC',
  '미래인재양성단',
  '부설교육기관',
  '부설연구소',
  '산학연협력단지사업단',
  '산학협력기관',
  '사회봉사단',
  '사회교육원(ERICA)',
  '소프트웨어융합대학',
  '소프트웨어융합대학RC',
  '약학대학',
  '약학대학RC',
  '예체능대학',
  '예체능대학RC',
  '외부지정연구센터',
  '입학처',
  '인권센터',
  '융합산업대학원',
  '융합산업대학원RC',
  '창의융합교육원',
  '창의인재원',
  '창업지원단',
  '총무관리처',
  '캠퍼스혁신파크 사업단',
  '커뮤니케이션&컬처대학',
  '커뮤니케이션&컬처대학RC',
  '한대방송국',
  '한양AI융합연구원',
  '한양국방연구원(ERICA)',
  '한양맞춤의약연구원',
  '한양환경에너지기술연구원',
  '학술연구처',
  '학생군사교육단',
  '학생인재개발처',
  '조기취업형계약학과 선도대학육성사업단',
  '지능형로봇사업단',
  '(일반)대학원',
  '첨단융합대학',
  '첨단융합대학RC',
  '글로벌문화통상대학',
  '글로벌문화통상대학RC',
  'ERICA기술지주회사',
  'ERICA산학협력단',
  'ERICA융합원',
  'ERICA학술정보관',
  'LIONS칼리지',
  'LIONS칼리지RC',
  'RISE지산학협력단',
  'SW-AI융합교육원',
]

/** 모든 소속 이름 뒤에 (ERICA)가 없으면 붙여서 일관된 표기 사용 */
const withCampusSuffix = RAW_DEPARTMENTS.map((name) =>
  name.includes('(ERICA)') ? name : `${name} (ERICA)`,
)

const isEnglishLeading = (name: string) => /^[A-Za-z]/.test(name)

const koreanDepartments = withCampusSuffix.filter((name) => !isEnglishLeading(name)).sort(
  (a, b) => a.localeCompare(b, 'ko-KR'),
)

const englishDepartments = withCampusSuffix.filter((name) => isEnglishLeading(name)).sort((a, b) =>
  a.localeCompare(b, 'en'),
)

export const DEPARTMENTS: string[] = [...koreanDepartments, ...englishDepartments]

/** 운용부서 필터용 옵션 (맨 앞에 '전체' 추가) */
export const OPERATING_DEPARTMENT_FILTER_OPTIONS: string[] = [
  '전체',
  ...DEPARTMENTS,
]

/** 폼 등에서 운용부서 선택용 옵션 (맨 앞에 '선택' 추가) */
export const OPERATING_DEPARTMENT_SELECT_OPTIONS: string[] = [
  '선택',
  ...DEPARTMENTS,
]

/**
 * 운용 전환 등록 API `deptCd` — 화면 부서명(라벨) → 백엔드 부서코드.
 * 실제 코드는 백엔드/공통코드와 맞춰 채움. 비어 있으면 `resolveDeptCdForOperation`은 빈 문자열을 반환할 수 있음.
 */
export const DEPARTMENT_NAME_TO_DEPT_CD: Record<string, string> = {
  // 예: '교무처 (ERICA)': 'A001',
}

/** 운용 전환 등록 시 드롭다운 라벨을 deptCd로 변환 (매핑 없으면 코드 형태 문자열만 통과) */
export function resolveDeptCdForOperation(deptLabel: string): string {
  const t = deptLabel?.trim() ?? ''
  if (!t || t === '선택') return ''
  const mapped = DEPARTMENT_NAME_TO_DEPT_CD[t]
  if (mapped) return mapped
  if (/^[A-Za-z0-9_-]{2,32}$/.test(t)) return t
  return ''
}

/** 목록 searchRequest: 한글 부서명을 deptCd에 넣지 않도록 (매핑 있으면 코드만, 항상 deptNm) */
export function applyDeptLabelToSearchRequest(
  target: { deptCd?: string; deptNm?: string },
  label: string,
  options?: { allLabel?: string },
): void {
  const all = options?.allLabel ?? '전체'
  const t = label?.trim() ?? ''
  if (!t || t === all) return
  const cd = resolveDeptCdForOperation(t)
  if (cd) target.deptCd = cd
  target.deptNm = t
}

