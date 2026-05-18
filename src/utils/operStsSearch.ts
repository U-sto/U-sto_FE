/** 목록 searchRequest operSts — 백엔드 enum: OPER | RTN | DSU | DSP */

const LABEL_TO_CODE: Record<string, string> = {
  운용중: 'OPER',
  운용: 'OPER',
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

const CODE_ALIAS: Record<string, string> = {
  OPER: 'OPER',
  OPE: 'OPER',
  OPEM: 'OPER',
  USED: 'OPER',
  RTN: 'RTN',
  RET: 'RTN',
  DSU: 'DSU',
  DIS: 'DSU',
  DSP: 'DSP',
}

/** 화면 라벨·공통코드 값 → API operSts (canonical만 반환) */
export function resolveOperStsSearchCode(labelOrCode: string): string | undefined {
  const trimmed = labelOrCode.trim()
  if (!trimmed || trimmed === '전체') return undefined

  if (LABEL_TO_CODE[trimmed]) return LABEL_TO_CODE[trimmed]
  if (trimmed.startsWith('운용')) return 'OPER'
  if (trimmed.startsWith('반납')) return 'RTN'
  if (trimmed.startsWith('불용')) return 'DSU'
  if (trimmed.startsWith('처분')) return 'DSP'

  const upper = trimmed.toUpperCase()
  return CODE_ALIAS[upper]
}
