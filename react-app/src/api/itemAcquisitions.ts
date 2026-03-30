/**
 * 물품 취득 목록 조회 API (GET /api/item/acquisitions)
 * 물품취득확정관리·물품취득관리 두 페이지에서 동일 API 사용.
 * searchRequest로 필터(취득일/승인일/상태 등), pageable로 페이지네이션 전달.
 */

import http from './http'
import type { ApiResponse } from './types'

/** POST /api/item/acquisitions — 물품 취득 등록 (MANAGER) */
export type CreateItemAcquisitionBody = {
  /** G2B 목록번호 앞칸(분류/목록 코드 쪽) — 스웨거 필드명은 백엔드와 맞출 것 */
  g2b0Cd: string
  /** 물품식별코드(G2B 목록번호 뒤칸) */
  g2bDCd?: string
  acqAt: string
  acqQty: number
  arrgTy: string
  deptCd: string
  rmk?: string
}

export type CreateItemAcquisitionResult = {
  acqId?: string
  [key: string]: unknown
}

export async function createItemAcquisition(
  body: CreateItemAcquisitionBody,
): Promise<CreateItemAcquisitionResult | null> {
  const payload: Record<string, unknown> = { ...body }
  if (payload.g2bDCd === '' || payload.g2bDCd === undefined) {
    delete payload.g2bDCd
  }
  const res = await http.post<ApiResponse<CreateItemAcquisitionResult>>(
    '/api/item/acquisitions',
    payload as CreateItemAcquisitionBody,
  )
  return res.data.data ?? null
}

/**
 * 물품 취득 승인 요청 (MANAGER) — ADMIN에게 승인 요청
 * POST /api/item/acquisitions/{acqId}/request
 */
export async function requestItemAcquisitionApproval(acqId: string): Promise<void> {
  const id = acqId.trim()
  if (!id) {
    throw new Error('취득 ID가 없습니다.')
  }
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/acquisitions/${encodeURIComponent(id)}/request`,
  )
}

/**
 * 물품 취득 승인 요청 취소 (MANAGER) — REQUEST 상태 건을 취소·삭제
 * POST /api/item/acquisitions/{acqId}/cancel
 */
export async function cancelItemAcquisitionRequest(acqId: string): Promise<void> {
  const id = acqId.trim()
  if (!id) {
    throw new Error('취득 ID가 없습니다.')
  }
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/acquisitions/${encodeURIComponent(id)}/cancel`,
  )
}

/**
 * 물품 취득 삭제 (MANAGER) — 작성중(WAIT) 건 논리 삭제
 * DELETE /api/item/acquisitions/{acqId}
 */
export async function deleteItemAcquisition(acqId: string): Promise<void> {
  const id = acqId.trim()
  if (!id) {
    throw new Error('취득 ID가 없습니다.')
  }
  await http.delete<ApiResponse<Record<string, unknown>>>(
    `/api/item/acquisitions/${encodeURIComponent(id)}`,
  )
}

/**
 * 물품 취득 수정 (MANAGER) — 작성중(WAIT) 건만 수정 가능
 * PATCH /api/item/acquisitions/{acqId}
 */
export type UpdateItemAcquisitionBody = {
  /** 물품식별코드(G2B 목록번호 뒤칸) */
  g2bDCd?: string
  acqAt: string
  acqQty: number
  arrgTy: string
  deptCd: string
  rmk?: string
}

export async function updateItemAcquisition(
  acqId: string,
  body: UpdateItemAcquisitionBody,
): Promise<void> {
  const id = acqId.trim()
  if (!id) {
    throw new Error('취득 ID가 없습니다.')
  }
  const payload: Record<string, unknown> = { ...body }
  if (payload.g2bDCd === '' || payload.g2bDCd === undefined) {
    delete payload.g2bDCd
  }
  if (payload.rmk === '' || payload.rmk === undefined) {
    delete payload.rmk
  }
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/item/acquisitions/${encodeURIComponent(id)}`,
    payload as UpdateItemAcquisitionBody,
  )
}

/** ADMIN — 승인 요청(REQUEST) 건을 일괄 승인(APPROVAL) 처리 */
export type BulkApproveAcquisitionsBody = {
  acqIds: string[]
}

export async function bulkApproveItemAcquisitions(acqIds: string[]): Promise<void> {
  const ids = acqIds.map((id) => id.trim()).filter(Boolean)
  if (ids.length === 0) {
    throw new Error('확정할 취득 건을 선택해 주세요.')
  }
  await http.put<ApiResponse<Record<string, unknown>>>(
    '/api/item/acquisitions/admin/approval',
    { acqIds: ids } satisfies BulkApproveAcquisitionsBody,
  )
}

/** ADMIN — 취득 요청(REQUEST) 건을 일괄 반려(REJECTED) */
export type BulkRejectAcquisitionsBody = {
  acqIds: string[]
}

export async function bulkRejectItemAcquisitions(acqIds: string[]): Promise<void> {
  const ids = acqIds.map((id) => id.trim()).filter(Boolean)
  if (ids.length === 0) {
    throw new Error('반려할 취득 건을 선택해 주세요.')
  }
  await http.put<ApiResponse<Record<string, unknown>>>(
    '/api/item/acquisitions/admin/reject',
    { acqIds: ids } satisfies BulkRejectAcquisitionsBody,
  )
}

/**
 * 단건 조회: GET /api/item/acquisitions — searchRequest에 acqId 지정 (백엔드 지원 시)
 * 미지원 시 content가 비어 null 반환 → 호출부에서 처리
 */
export async function fetchItemAcquisitionByAcqId(
  acqId: string,
): Promise<ItemAcquisitionContent | null> {
  const id = acqId.trim()
  if (!id) return null
  const searchRequest: ItemAcquisitionSearchRequest = { acqId: id }
  const pageable: ItemAcquisitionPageable = { page: 0, size: 1 }
  const res = await http.get<ApiResponse<ItemAcquisitionsData>>('/api/item/acquisitions', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
    },
  })
  const items = res.data.data?.content ?? []
  const hit = items.find((c) => c.acqId === id)
  return hit ?? null
}

/** 요청: 필터 조건 (query 파라미터 searchRequest, Swagger 예: g2bCd / deptCd 등) */
export type ItemAcquisitionSearchRequest = {
  /** 취득 건 ID로 단건 조회 시 */
  acqId?: string
  /** 물품분류코드(목록번호 앞칸) — 등록 API g2b0Cd와 동일 의미 */
  g2b0Cd?: string
  /** Swagger 물품 G2B 코드 (분류-식별 조합 또는 단일) */
  g2bCd?: string
  /** 물품식별코드(목록번호 뒤칸) — 등록 API g2bDCd와 동일 의미 */
  g2bDCd?: string
  /** G2B 목록명 검색 (백엔드 지원 시) */
  g2bItemNm?: string
  deptCd?: string
  deptNm?: string
  startAcqAt?: string
  endAcqAt?: string
  startApprAt?: string
  endApprAt?: string
  apprSts?: string
  [key: string]: unknown
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
  /** 상세/목록에서 내려올 수 있는 확장 필드 (수정 폼 초기값용) */
  deptCd?: string
  arrgTy?: string
  rmk?: string
  g2b0Cd?: string
  g2bDCd?: string
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
