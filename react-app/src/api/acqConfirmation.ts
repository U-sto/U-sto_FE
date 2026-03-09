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

export type AcqConfirmationFilters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  category: string
}

export type AcqConfirmationRow = {
  id: number
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
): AcqConfirmationRow {
  return {
    id: index + 1,
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

/** 화면 필터 → API searchRequest 변환 */
function filtersToSearchRequest(filters: AcqConfirmationFilters): ItemAcquisitionSearchRequest {
  const req: ItemAcquisitionSearchRequest = {}
  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) req.startApprAt = filters.sortDateFrom
  if (filters.sortDateTo) req.endApprAt = filters.sortDateTo
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    req.apprSts = filters.approvalStatus
  }
  if (filters.g2bNumberFrom) req.g2bDCd = filters.g2bNumberFrom
  return req
}

/** 물품 취득 목록 조회 API 연동 (GET /api/item/acquisitions) */
export async function fetchAcqConfirmationList(
  params: FetchAcqConfirmationParams
): Promise<FetchAcqConfirmationResponse> {
  const { page, pageSize, filters } = params

  const searchRequest = filtersToSearchRequest(filters)
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
      },
    },
  )

  const payload = res.data.data
  if (!payload) {
    return { data: [], totalCount: 0 }
  }

  const data = payload.content.map((item, index) =>
    mapItemAcquisitionToAcqConfirmationRow(item, index),
  )
  const totalCount = payload.totalElements ?? 0

  return { data, totalCount }
}
