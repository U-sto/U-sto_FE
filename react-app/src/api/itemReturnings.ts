/**
 * 물품 반납 관리 API
 * - POST /api/item/returnings — 반납 신청 등록 (MANAGER)
 * - POST /api/item/returnings/{rtrnMId}/request — 승인 요청 (MANAGER)
 * - POST /api/item/returnings/{rtrnMId}/cancel — 승인 요청 취소 (MANAGER)
 * - DELETE /api/item/returnings/{rtrnMid} — 작성중(WAIT) 삭제 (MANAGER)
 * - PATCH /api/item/returnings/{rtrnMid} — 작성중(WAIT) 수정 (MANAGER)
 * - GET /api/item/returnings — 반납 등록 목록 (페이징)
 * - GET /api/item/returnings/{rtrnId}/items — 반납 물품 목록 (페이징)
 */

import http from './http'
import type { ApiResponse } from './types'

export type ItemReturningSearchRequest = {
  startAplyAt?: string
  endAplyAt?: string
  apprSts?: string
  /** 단건 조회 시 (백엔드 지원 시) */
  rtrnId?: string
  rtrnMid?: string
}

export type ItemReturningPageable = {
  page?: number
  size?: number
  sort?: string[]
}

/** GET /api/item/returnings — content 한 건 */
export type ItemReturningMaster = {
  /** 반납 마스터 ID (백엔드에 따라 rtrnMId / rtrnMid 등으로만 올 수 있음) */
  rtrnId?: string
  rtrnMId?: string
  rtrnMid?: string
  aplyAt: string
  rtrnApprAt: string
  aplyUsrId: string
  aplyUsrNm: string
  apprSts: string
  itemCount: number
  /** 수정 폼 매핑용 (응답에 있을 때) */
  itemSts?: string
  rtrnRsn?: string
}

/** 목록 응답에서 반납 마스터 행 ID를 하나로 정규화 */
export function resolveItemReturningMasterId(
  item: ItemReturningMaster & Record<string, unknown>,
): string {
  const raw =
    item.rtrnId ??
    item.rtrnMId ??
    item.rtrnMid ??
    (typeof item.rtrn_id === 'string' ? item.rtrn_id : undefined) ??
    (typeof item.rtrn_m_id === 'string' ? item.rtrn_m_id : undefined) ??
    (typeof item.rtrn_mid === 'string' ? item.rtrn_mid : undefined)
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t) return t
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw)
  }
  return ''
}

export type ItemReturningsListData = {
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
  size: number
  number: number
  numberOfElements: number
  content: ItemReturningMaster[]
}

/** GET /api/item/returnings/{rtrnId}/items — content 한 건 */
export type ItemReturningItem = {
  g2bItemNo: string
  g2bNm: string
  itmNo: string
  acqAt: string
  acqUpr: number
  deptNm: string
  itemSts: string
  rtrnRsn: string
}

export type ItemReturningItemsData = {
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
  size: number
  number: number
  numberOfElements: number
  content: ItemReturningItem[]
}

export function formatReturningDateOnly(s: string | undefined | null): string {
  if (s == null || s === '') return ''
  const t = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  try {
    const d = new Date(t)
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  } catch {
    /* ignore */
  }
  return t
}

export type FetchItemReturningListParams = {
  searchRequest: ItemReturningSearchRequest
  page: number
  pageSize: number
}

export async function fetchItemReturningList(
  params: FetchItemReturningListParams,
): Promise<{ data: ItemReturningMaster[]; totalCount: number }> {
  const pageable: ItemReturningPageable = {
    page: params.page - 1,
    size: params.pageSize,
  }
  const res = await http.get<ApiResponse<ItemReturningsListData>>('/api/item/returnings', {
    params: {
      searchRequest: JSON.stringify(params.searchRequest),
      pageable: JSON.stringify(pageable),
    },
  })
  const payload = res.data.data
  if (!payload) {
    return { data: [], totalCount: 0 }
  }
  return {
    data: payload.content ?? [],
    totalCount: payload.totalElements ?? 0,
  }
}

export type FetchItemReturningItemsParams = {
  rtrnId: string
  page: number
  pageSize: number
}

export async function fetchItemReturningItems(
  params: FetchItemReturningItemsParams,
): Promise<{ data: ItemReturningItem[]; totalCount: number }> {
  const id = params.rtrnId.trim()
  if (!id) {
    return { data: [], totalCount: 0 }
  }
  const pageable: ItemReturningPageable = {
    page: params.page - 1,
    size: params.pageSize,
  }
  const res = await http.get<ApiResponse<ItemReturningItemsData>>(
    `/api/item/returnings/${encodeURIComponent(id)}/items`,
    {
      params: {
        pageable: JSON.stringify(pageable),
      },
    },
  )
  const payload = res.data.data
  if (!payload) {
    return { data: [], totalCount: 0 }
  }
  return {
    data: payload.content ?? [],
    totalCount: payload.totalElements ?? 0,
  }
}

/**
 * 단건: GET /api/item/returnings — searchRequest에 rtrnId (백엔드 지원 시)
 * 미지원 시 content에서 id 일치 건 검색
 */
export async function fetchItemReturningByRtrnMid(
  rtrnMid: string,
): Promise<ItemReturningMaster | null> {
  const id = rtrnMid.trim()
  if (!id) return null
  const res = await fetchItemReturningList({
    searchRequest: { rtrnId: id, rtrnMid: id },
    page: 1,
    pageSize: 50,
  })
  const hit = res.data.find((c) => resolveItemReturningMasterId(c) === id)
  return hit ?? null
}

/** 반납에 묶인 물품 전부 (페이지 반복) */
export async function fetchItemReturningAllItems(rtrnId: string): Promise<ItemReturningItem[]> {
  const id = rtrnId.trim()
  if (!id) return []
  const all: ItemReturningItem[] = []
  let page = 1
  const pageSize = 100
  while (true) {
    const res = await fetchItemReturningItems({ rtrnId: id, page, pageSize })
    all.push(...res.data)
    if (res.data.length === 0 || all.length >= res.totalCount) break
    page += 1
    if (page > 100) break
  }
  return all
}

/** POST /api/item/returnings — 반납 신청 등록 */
export type CreateItemReturningBody = {
  /** 신청일 (YYYY-MM-DD) */
  aplyAt: string
  /** 물품상태 코드 (스웨거 예: USED) */
  itemSts: string
  /** 반납 사유 코드 */
  rtrnRsn: string
  /** 물품고유번호 목록 */
  itmNos: string[]
}

export type CreateItemReturningData = {
  /** 등록된 반납 신청 마스터 ID */
  rtrnMid?: string
  [key: string]: unknown
}

export async function createItemReturning(
  body: CreateItemReturningBody,
): Promise<CreateItemReturningData | null> {
  const res = await http.post<ApiResponse<CreateItemReturningData>>(
    '/api/item/returnings',
    body,
  )
  return res.data.data ?? null
}

/** PATCH /api/item/returnings/{rtrnMid} — 작성중(WAIT) 반납 신청 수정 */
export type UpdateItemReturningBody = CreateItemReturningBody

export async function updateItemReturning(
  rtrnMid: string,
  body: UpdateItemReturningBody,
): Promise<void> {
  const id = rtrnMid.trim()
  if (!id) throw new Error('반납 ID가 없습니다.')
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/${encodeURIComponent(id)}`,
    body,
  )
}

/** 반납 마스터 ID — 목록 rtrnId와 동일 UUID */
function assertReturningId(id: string): string {
  const t = id.trim()
  if (!t) throw new Error('반납 ID가 없습니다.')
  return t
}

/** POST /api/item/returnings/{rtrnMId}/request — 승인 요청 */
export async function requestItemReturningApproval(rtrnMId: string): Promise<void> {
  const id = assertReturningId(rtrnMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/${encodeURIComponent(id)}/request`,
  )
}

/** POST /api/item/returnings/{rtrnMId}/cancel — 승인 요청 취소 */
export async function cancelItemReturningRequest(rtrnMId: string): Promise<void> {
  const id = assertReturningId(rtrnMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/${encodeURIComponent(id)}/cancel`,
  )
}

/** DELETE /api/item/returnings/{rtrnMid} — 작성중 건 삭제 */
export async function deleteItemReturning(rtrnMid: string): Promise<void> {
  const id = assertReturningId(rtrnMid)
  await http.delete<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/${encodeURIComponent(id)}`,
  )
}

/** PUT /api/item/returnings/admin/{rtrnMId}/approval — 반납 승인 확정 (ADMIN) */
export async function adminApproveItemReturning(rtrnMId: string): Promise<void> {
  const id = assertReturningId(rtrnMId)
  await http.put<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/admin/${encodeURIComponent(id)}/approval`,
  )
}

/** PUT /api/item/returnings/admin/{rtrnMId}/reject — 반납 요청 반려 (ADMIN) */
export async function adminRejectItemReturning(rtrnMId: string): Promise<void> {
  const id = assertReturningId(rtrnMId)
  await http.put<ApiResponse<Record<string, unknown>>>(
    `/api/item/returnings/admin/${encodeURIComponent(id)}/reject`,
  )
}
