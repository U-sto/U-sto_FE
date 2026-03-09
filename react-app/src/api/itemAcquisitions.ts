/**
 * 물품 취득 목록 조회 API (GET /api/item/acquisitions)
 * 물품취득확정관리·물품취득관리 두 페이지에서 동일 API 사용.
 * searchRequest로 필터(취득일/승인일/상태 등), pageable로 페이지네이션 전달.
 */

/** 요청: 필터 조건 (query 파라미터 searchRequest) */
export type ItemAcquisitionSearchRequest = {
  g2bDCd?: string
  deptCd?: string
  startAcqAt?: string
  endAcqAt?: string
  startApprAt?: string
  endApprAt?: string
  apprSts?: string
}

/** 요청: 페이지네이션 (query 파라미터 pageable) */
export type ItemAcquisitionPageable = {
  page?: number
  size?: number
  sort?: string[]
}

/** 응답: content[] 한 건 */
export type ItemAcquisitionContent = {
  acqId: string
  g2bItemNo: string
  g2bItemNm: string
  acqAt: string
  acqUpr: number
  apprAt: string
  deptNm: string
  operSts: string
  drbYr: string
  acqQty: number
  apprSts: string
}

/** 응답: data 내부 (페이지네이션 + content) */
export type ItemAcquisitionsData = {
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
  size: number
  number: number
  numberOfElements: number
  content: ItemAcquisitionContent[]
  pageable?: {
    paged: boolean
    pageNumber: number
    pageSize: number
    offset: number
    sort?: { sorted: boolean; empty: boolean; unsorted: boolean }
    unpaged: boolean
  }
  sort?: {
    sorted: boolean
    empty: boolean
    unsorted: boolean
  }
}

/** 응답: success/message/data 래퍼 */
export type ItemAcquisitionsApiResponse = {
  success: boolean
  message: string
  data: ItemAcquisitionsData
}
