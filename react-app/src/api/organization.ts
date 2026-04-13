/**
 * 조직·부서 API
 * - GET /api/organization/organizations: 시스템 등록 전체 조직 (회원가입 소속 선택)
 * - GET /api/organization/departments: 로그인 사용자 소속 조직의 운용부서 목록 (드롭다운용)
 */

import http from './http'
import type { ApiResponse } from './types'

/** 조직 한 건 (회원가입 소속 API) */
export type OrganizationDto = {
  orgCd?: string
  orgNm?: string
}

export async function fetchOrganizations(): Promise<OrganizationDto[]> {
  const res = await http.get<ApiResponse<OrganizationDto[]>>('/api/organization/organizations')
  const raw = res.data.data
  return Array.isArray(raw) ? raw : []
}

/** 회원가입 드롭다운: orgNm 표시, orgCd 매핑. 동일 조직명이 여러 건이면 라벨에 orgCd를 붙여 구분 */
export function buildOrganizationSelect(rows: OrganizationDto[]): {
  options: string[]
  labelToOrgCd: Record<string, string>
} {
  const valid = rows.filter(
    (r) =>
      typeof r.orgCd === 'string' &&
      r.orgCd.trim() !== '' &&
      typeof r.orgNm === 'string' &&
      r.orgNm.trim() !== '',
  )
  const sorted = [...valid].sort((a, b) =>
    (a.orgNm ?? '').localeCompare(b.orgNm ?? '', 'ko-KR'),
  )

  const nameCount = new Map<string, number>()
  for (const r of sorted) {
    const nm = r.orgNm ?? ''
    nameCount.set(nm, (nameCount.get(nm) ?? 0) + 1)
  }

  const labelToOrgCd: Record<string, string> = {}
  const labels: string[] = []

  for (const r of sorted) {
    const nm = r.orgNm ?? ''
    const cd = (r.orgCd ?? '').trim()
    const label = (nameCount.get(nm) ?? 0) > 1 ? `${nm} (${cd})` : nm
    labelToOrgCd[label] = cd
    labels.push(label)
  }

  return { options: labels, labelToOrgCd }
}

export type OperatingDepartmentDto = {
  orgCd?: string
  deptCd?: string
  deptNm?: string
  upDeptNm?: string
}

export async function fetchOperatingDepartments(): Promise<OperatingDepartmentDto[]> {
  const res = await http.get<ApiResponse<OperatingDepartmentDto[]>>(
    '/api/organization/departments',
  )
  const raw = res.data.data
  return Array.isArray(raw) ? raw : []
}

/** 드롭다운용: deptNm 표시, deptCd 매핑. 동일 부서명이 여러 건이면 라벨에 deptCd를 붙여 구분 */
export function buildOperatingDepartmentSelect(
  rows: OperatingDepartmentDto[],
): { options: string[]; labelToDeptCd: Record<string, string> } {
  const valid = rows.filter(
    (r) => typeof r.deptCd === 'string' && r.deptCd.trim() !== '' && typeof r.deptNm === 'string' && r.deptNm.trim() !== '',
  )
  const sorted = [...valid].sort((a, b) =>
    (a.deptNm ?? '').localeCompare(b.deptNm ?? '', 'ko-KR'),
  )

  const nameCount = new Map<string, number>()
  for (const r of sorted) {
    const nm = r.deptNm ?? ''
    nameCount.set(nm, (nameCount.get(nm) ?? 0) + 1)
  }

  const labelToDeptCd: Record<string, string> = {}
  const labels: string[] = []

  for (const r of sorted) {
    const nm = r.deptNm ?? ''
    const cd = (r.deptCd ?? '').trim()
    const label = (nameCount.get(nm) ?? 0) > 1 ? `${nm} (${cd})` : nm
    labelToDeptCd[label] = cd
    labels.push(label)
  }

  return {
    options: ['선택', ...labels],
    labelToDeptCd,
  }
}
