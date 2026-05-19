/**
 * 공통코드 API
 * - GET /api/codes/{groupName}: 특정 공통코드 그룹 (스웨거 path 파라미터)
 * - GET /api/codes: 전체 그룹 (필요 시)
 */

import http from './http'
import type { ApiResponse } from './types'

export type CommonCodeEntry = {
  code?: string
  description?: string
}

export type CommonCodeGroup = {
  groupName?: string
  codes?: CommonCodeEntry[]
}

/** 스웨거 code-controller에 정의된 groupName 값 */
export const CODE_GROUP = {
  APPR_STATUS: 'APPR_STATUS',
  OPER_STATUS: 'OPER_STATUS',
  ITEM_STATUS: 'ITEM_STATUS',
  ACQ_ARRANGEMENT_TYPE: 'ACQ_ARRANGEMENT_TYPE',
  RETURNING_REASON: 'RETURNING_REASON',
  DISUSE_REASON: 'DISUSE_REASON',
  DISPOSAL_ARRANGEMENT_TYPE: 'DISPOSAL_ARRANGEMENT_TYPE',
} as const

export type CodeGroupKey = (typeof CODE_GROUP)[keyof typeof CODE_GROUP]

/**
 * GET /api/codes/{groupName}
 * data: 단일 그룹 { groupName, codes }
 */
export async function fetchCommonCodeGroup(groupName: string): Promise<CommonCodeGroup | null> {
  const encoded = encodeURIComponent(groupName)
  const res = await http.get<ApiResponse<CommonCodeGroup>>(`/api/codes/${encoded}`)
  const raw = res.data.data
  if (raw != null && typeof raw === 'object' && Array.isArray((raw as CommonCodeGroup).codes)) {
    return raw as CommonCodeGroup
  }
  return null
}

export async function fetchCommonCodeGroups(): Promise<CommonCodeGroup[]> {
  const res = await http.get<ApiResponse<CommonCodeGroup[]>>('/api/codes')
  const raw = res.data.data
  return Array.isArray(raw) ? raw : []
}

const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()

/** 전체 조회 결과에서 groupName 힌트로 그룹 찾기 (레거시·보조) */
export function findCodeGroupByHints(
  groups: CommonCodeGroup[],
  hints: string[],
): CommonCodeGroup | undefined {
  const hintsN = hints.map(norm)
  for (const g of groups) {
    const gn = norm(g.groupName ?? '')
    if (hintsN.some((h) => h.length > 0 && gn.includes(h))) {
      return g
    }
  }
  return undefined
}

/**
 * 그룹 → API code → description(화면 라벨)
 * 저장 시 보낸 코드로 다시 드롭다운 값을 맞출 때 사용
 */
export function buildCodeToDescriptionMap(
  group: CommonCodeGroup | undefined,
): Record<string, string> {
  const map: Record<string, string> = {}
  if (!group?.codes?.length) return map
  for (const c of group.codes) {
    const code = typeof c.code === 'string' ? c.code.trim() : ''
    const desc = typeof c.description === 'string' ? c.description.trim() : ''
    if (code && desc) map[code] = desc
  }
  return map
}

/**
 * 그룹 → description(화면 라벨) → API code
 * 동일 description 여러 개면 "설명 (코드)" 로 구분
 */
export function buildDescriptionToCodeMap(
  group: CommonCodeGroup | undefined,
): Record<string, string> {
  if (!group?.codes?.length) return {}
  const valid = group.codes.filter(
    (c) => typeof c.code === 'string' && c.code.trim() !== '' && typeof c.description === 'string',
  )
  const descCount = new Map<string, number>()
  for (const c of valid) {
    const d = (c.description ?? '').trim()
    descCount.set(d, (descCount.get(d) ?? 0) + 1)
  }
  const map: Record<string, string> = {}
  for (const c of valid) {
    const desc = (c.description ?? '').trim()
    const code = (c.code ?? '').trim()
    const label = (descCount.get(desc) ?? 0) > 1 ? `${desc} (${code})` : desc
    map[label] = code
  }
  return map
}

/** 필터용: ['전체', ...라벨] (가나다순) */
export function buildFilterOptionsWithAll(
  labelToCode: Record<string, string>,
  allLabel = '전체',
): string[] {
  const labels = Object.keys(labelToCode).sort((a, b) => a.localeCompare(b, 'ko-KR'))
  return [allLabel, ...labels]
}

/** 조회 섹션 운용상태 드롭다운 표시 순서 (전체 제외) */
export const OPER_STATUS_FILTER_LABEL_ORDER = ['운용중', '반납', '불용', '처분'] as const

/** API 라벨이 「운용」 등으로 올 때 동일 슬롯으로 매칭 */
const OPER_STATUS_FILTER_LABEL_ALIASES: readonly (readonly string[])[] = [
  ['운용중', '운용'],
  ['반납'],
  ['불용'],
  ['처분'],
]

/**
 * 필터용: ['전체', ...] — 지정 순서 우선, API에만 있는 항목은 뒤에 가나다순
 */
export function buildOperatingStatusFilterOptions(
  labelToCode: Record<string, string>,
  allLabel = '전체',
): string[] {
  const used = new Set<string>()
  const ordered: string[] = []

  for (const aliases of OPER_STATUS_FILTER_LABEL_ALIASES) {
    const hit = aliases.find((label) => label in labelToCode)
    if (hit && !used.has(hit)) {
      ordered.push(hit)
      used.add(hit)
    }
  }

  const rest = Object.keys(labelToCode)
    .filter((label) => !used.has(label))
    .sort((a, b) => a.localeCompare(b, 'ko-KR'))
  return [allLabel, ...ordered, ...rest]
}

/** 드롭다운용: ['선택', ...라벨] */
export function buildSelectOptionsWithPlaceholder(
  labelToCode: Record<string, string>,
  placeholderLabel = '선택',
): string[] {
  const labels = Object.keys(labelToCode).sort((a, b) => a.localeCompare(b, 'ko-KR'))
  return [placeholderLabel, ...labels]
}

/** 레거시: 힌트 기반 그룹 매칭 (GET /api/codes 전체용) */
export const APPROVAL_STATUS_GROUP_HINTS = ['승인상태', '승인', 'appr']
export const ARRG_TYPE_GROUP_HINTS = ['취득정리', '정리구분', 'arrg', '물품취득', '취득정리구분']
