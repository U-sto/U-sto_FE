/**
 * 물품 취득 확정 관리 API 추상화
 * 실제 백엔드: GET /api/item/acquisitions (물품취득목록조회)
 * searchRequest: 필터(취득일/승인일/apprSts 등), pageable: 페이지네이션.
 * 물품취득관리 페이지도 동일 API 사용 가능.
 */

import http from './http'
import type { ApiResponse } from './types'
import type {
  ItemAcquisitionContent,
  ItemAcquisitionSearchRequest,
  ItemAcquisitionPageable,
  ItemAcquisitionsData,
} from './itemAcquisitions'
import { applyDeptLabelToSearchRequest } from '../constants/departments'
import { buildAcquisitionG2bSearchFields } from './g2bFilterNormalize'

export type AcqConfirmationFilters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  /** 운용부서(드롭다운 표시명, 전체 제외 시 API deptCd/deptNm으로 전달) */
  operatingDept: string
}

export type AcqConfirmationRow = {
  id: number
  /** 취득 건 UUID — 승인요청 API path */
  acqId: string
  g2bNumber: string
  g2bName: string
  acquireDate: string
  acquireAmount: number
  sortDate: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
  quantity: number
  approvalStatus: string
}

export type FetchAcqConfirmationParams = {
  page: number
  pageSize: number
  filters: AcqConfirmationFilters
  /** GET /api/codes 승인상태 그룹 기준 description→code (없으면 DEFAULT 사용) */
  approvalDescToCode?: Record<string, string>
}

export type FetchAcqConfirmationResponse = {
  data: AcqConfirmationRow[]
  totalCount: number
}

/**
 * GET /api/item/acquisitions 응답 content 한 건 → 취득확정관리 테이블 행으로 변환
 * 실제 API 연동 시 응답 data.content.map(mapItemAcquisitionToRow) 후 사용
 */
export function mapItemAcquisitionToAcqConfirmationRow(
  item: ItemAcquisitionContent,
  index: number,
  offset = 0,
): AcqConfirmationRow {
  return {
    id: offset + index + 1,
    acqId: item.acqId ?? '',
    g2bNumber: item.g2bItemNo,
    g2bName: item.g2bItemNm,
    acquireDate: item.acqAt,
    acquireAmount: item.acqUpr,
    sortDate: item.apprAt,
    operatingDept: item.deptNm,
    operatingStatus: item.operSts,
    usefulLife: item.drbYr
      ? item.drbYr.endsWith('년')
        ? item.drbYr
        : `${item.drbYr}년`
      : '',
    quantity: item.acqQty,
    approvalStatus: item.apprSts,
  }
}

/** 승인상태 화면 라벨 → API 코드 (공통코드 API 실패 시 폴백) */
export const DEFAULT_APPR_STS_DESCRIPTION_TO_CODE: Record<string, string> = {
  대기: 'WAIT',
  반려: 'REJECT',
  확정: 'CONFIRM',
}

/** 화면 필터 → API searchRequest 변환 (물품 취득 목록 조회 스웨거 기준) */
function filtersToSearchRequest(
  filters: AcqConfirmationFilters,
  approvalDescToCode: Record<string, string> = DEFAULT_APPR_STS_DESCRIPTION_TO_CODE,
): ItemAcquisitionSearchRequest {
  const req: ItemAcquisitionSearchRequest = {}
  const from = filters.g2bNumberFrom?.trim() ?? ''
  const to = filters.g2bNumberTo?.trim() ?? ''

  const g2bParts = buildAcquisitionG2bSearchFields(from, to)
  if (g2bParts.g2b0Cd) req.g2b0Cd = g2bParts.g2b0Cd
  if (g2bParts.g2bDCd) req.g2bDCd = g2bParts.g2bDCd
  if (g2bParts.g2bCd) req.g2bCd = g2bParts.g2bCd

  if (filters.g2bName?.trim()) {
    req.g2bItemNm = filters.g2bName.trim()
  }

  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) req.startApprAt = filters.sortDateFrom
  if (filters.sortDateTo) req.endApprAt = filters.sortDateTo
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    req.apprSts =
      approvalDescToCode[filters.approvalStatus] ?? filters.approvalStatus
  }
  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }
  return req
}

/** 물품 취득 목록 조회 API 연동 (GET /api/item/acquisitions) */
export async function fetchAcqConfirmationList(
  params: FetchAcqConfirmationParams
): Promise<FetchAcqConfirmationResponse> {
  const { page, pageSize, filters, approvalDescToCode } = params

  const searchRequest = filtersToSearchRequest(
    filters,
    approvalDescToCode ?? DEFAULT_APPR_STS_DESCRIPTION_TO_CODE,
  )
  const pageable: ItemAcquisitionPageable = {
    page: page - 1,
    size: pageSize,
  }

  const res = await http.get<ApiResponse<ItemAcquisitionsData>>(
    '/api/item/acquisitions',
    {
      params: {
        searchRequest: JSON.stringify(searchRequest),
        pageable: JSON.stringify(pageable),
        ...searchRequest,
        ...pageable,
      },
    },
  )

  const payload = res.data.data
  if (!payload) {
    return { data: [], totalCount: 0 }
  }

  const offset = (page - 1) * pageSize
  const data = payload.content.map((item, index) =>
    mapItemAcquisitionToAcqConfirmationRow(item, index, offset),
  )
  const totalCount = payload.totalElements ?? 0

  return { data, totalCount }
}
