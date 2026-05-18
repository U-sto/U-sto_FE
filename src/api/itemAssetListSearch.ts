/**
 * 물품 운용대장·보유현황 목록 조회 공통 searchRequest
 * (GET /api/item/assets, GET /api/item/asset-inventory-status 동일 필터 키)
 */
import { applyDeptLabelToSearchRequest } from '../constants/departments'
import { resolveOperStsSearchCode } from '../utils/operStsSearch'
import { buildCombinedG2bListNoForFilter } from './g2bFilterNormalize'

export type ItemAssetListFilters = {
  g2bNumberPrefix: string
  g2bNumberSuffix: string
  itemUniqueNumber: string
  operatingDept: string
  operatingStatus: string
  acquireDateFrom: string
  acquireDateTo: string
  sortDateFrom: string
  sortDateTo: string
}

export type ItemAssetListSearchRequest = {
  g2bDcd?: string
  g2bCd?: string
  g2bItemNo?: string
  itmNo?: string
  itemUnqNo?: string
  startAcqAt?: string
  endAcqAt?: string
  startArrgAt?: string
  endArrgAt?: string
  startDrgAt?: string
  endDrgAt?: string
  deptCd?: string
  deptNm?: string
  operSts?: string
  itemSts?: string
  [key: string]: unknown
}

/** 운용대장·보유현황 조회 필터 → searchRequest (operSts: OPER|RTN|DSU|DSP) */
export function buildItemAssetListSearchRequest(
  filters: ItemAssetListFilters,
): ItemAssetListSearchRequest {
  const req: ItemAssetListSearchRequest = {}

  const g2bDcd = buildCombinedG2bListNoForFilter(
    filters.g2bNumberPrefix,
    filters.g2bNumberSuffix,
  )
  if (g2bDcd) {
    req.g2bDcd = g2bDcd
    req.g2bCd = g2bDcd
    req.g2bItemNo = g2bDcd
  }
  if (filters.itemUniqueNumber?.trim()) {
    req.itmNo = filters.itemUniqueNumber.trim()
    req.itemUnqNo = filters.itemUniqueNumber.trim()
  }

  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) {
    req.startArrgAt = filters.sortDateFrom
    req.startDrgAt = filters.sortDateFrom
  }
  if (filters.sortDateTo) {
    req.endArrgAt = filters.sortDateTo
    req.endDrgAt = filters.sortDateTo
  }

  const operSts = resolveOperStsSearchCode(filters.operatingStatus)
  if (operSts) {
    req.operSts = operSts
  }

  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }

  return req
}

export type ItemAssetListPageable = {
  page: number
  size: number
  sort?: string[]
}

/** searchRequest + pageable 쿼리 (운용대장·보유현황 공통) */
export function buildItemAssetListQueryParams(
  searchRequest: ItemAssetListSearchRequest,
  pageable: ItemAssetListPageable,
): Record<string, string | number> {
  return {
    searchRequest: JSON.stringify(searchRequest),
    pageable: JSON.stringify(pageable),
    ...searchRequest,
    ...pageable,
  }
}
