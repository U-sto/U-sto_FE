/**
 * 물품 처분(불용/처분) 등록 목록 조회 API
 * 백엔드: GET /api/item/disposals
 * - searchRequest, pageable 를 query 파라미터로 받으며(스웨거 기준 required), 현재 프로젝트에서는 JSON.stringify 해서 전달한다.
 */
import http from './http'
import type { ApiResponse } from './types'
import { pickFirstStringFromRecord } from './pickFromRecord'

export type ItemDisposalSearchRequest = {
  /** 시작 처분 신청일자 */
  startAplyAt?: string
  startApplYAt?: string
  /** 종료 처분 신청일자 */
  endAplyAt?: string
  endApplYAt?: string
  /** 처분 유형 */
  dispType?: string
  /** 승인상태 */
  apprSts?: string
}

export type ItemDisposalPageable = {
  page: number
  size: number
  sort?: string[]
}

export type ItemDisposalContent = {
  // 백엔드 스키마가 확정되지 않아 optional로 넓게 받는다.
  id?: number | string
  dispMId?: string
  disdAt?: string
  disdDate?: string
  applYAt?: string
  apprAt?: string
  confirmAt?: string
  cnfmAt?: string
  disdCfmAt?: string
  usrId?: string
  registrantId?: string
  usrNm?: string
  registrantName?: string
  apprSts?: string
  approvalStatus?: string
  dispType?: string
  [key: string]: unknown
}

export type ItemDisposalsData = {
  content: ItemDisposalContent[]
  totalElements?: number
}

export type ItemDisposalFilters = {
  disposalDateFrom: string
  disposalDateTo: string
  approvalStatus: string
}

export type DisposalRegistrationRow = {
  id: number
  /** 처분 신청 마스터 ID (하단 처분물품목록 조회에 사용) */
  dispMId: string
  disposalDate: string
  disposalConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

export type DisposalMaster = {
  dispMId: string
  aplyAt: string
  apprAt: string
  aplyUsrId: string
  aplyUsrNm: string
  apprSts: string
  dispType?: string
}

export type FetchItemDisposalsParams = {
  page: number
  pageSize: number
  filters: ItemDisposalFilters
}

export type FetchItemDisposalsResponse = {
  data: DisposalRegistrationRow[]
  totalCount: number
}

const APPR_STS_MAP: Record<string, string> = {
  대기: 'WAIT',
  승인요청: 'REQUEST',
  반려: 'REJECT',
  확정: 'CONFIRM',
}

const APPR_STS_CODE_TO_LABEL: Record<string, string> = {
  WAIT: '대기',
  REQUEST: '승인요청',
  REJECT: '반려',
  REJECTED: '반려',
  CONFIRM: '확정',
  APPROVED: '확정',
}

function mapApprovalStatusToLabel(raw: string | undefined): string {
  const code = String(raw ?? '').trim()
  if (!code) return ''
  return APPR_STS_CODE_TO_LABEL[code] ?? code
}

function filtersToSearchRequest(filters: ItemDisposalFilters): ItemDisposalSearchRequest {
  const req: ItemDisposalSearchRequest = {}
  if (filters.disposalDateFrom) {
    req.startAplyAt = filters.disposalDateFrom
    req.startApplYAt = filters.disposalDateFrom
  }
  if (filters.disposalDateTo) {
    req.endAplyAt = filters.disposalDateTo
    req.endApplYAt = filters.disposalDateTo
  }
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    req.apprSts = APPR_STS_MAP[filters.approvalStatus] ?? filters.approvalStatus
  }
  return req
}

function mapItemDisposalToRow(
  item: ItemDisposalContent,
  index: number,
  offset: number,
): DisposalRegistrationRow {
  const rec = item as Record<string, unknown>
  /** 목록 행: id는 문자열일 때만 보조 키로 사용 (기존 동작 유지) */
  const dispMId =
    pickFirstStringFromRecord(rec, ['dispMId']) ||
    (typeof item.id === 'string' ? item.id : '')
  const disposalDate = pickFirstStringFromRecord(rec, ['applYAt', 'disdAt', 'disdDate'])
  const disposalConfirmDate = pickFirstStringFromRecord(rec, [
    'apprAt',
    'confirmAt',
    'cnfmAt',
    'disdCfmAt',
  ])
  const registrantId = pickFirstStringFromRecord(rec, ['usrId', 'registrantId'])
  const registrantName = pickFirstStringFromRecord(rec, ['usrNm', 'registrantName'])
  const approvalStatusRaw = pickFirstStringFromRecord(rec, ['apprSts', 'approvalStatus'])

  return {
    id: offset + index + 1,
    dispMId,
    disposalDate,
    disposalConfirmDate,
    registrantId,
    registrantName,
    approvalStatus: mapApprovalStatusToLabel(approvalStatusRaw),
  }
}

function mapItemDisposalToMaster(item: ItemDisposalContent): DisposalMaster {
  const rec = item as Record<string, unknown>
  return {
    dispMId: pickFirstStringFromRecord(rec, ['dispMId', 'id']),
    aplyAt: pickFirstStringFromRecord(rec, ['applYAt', 'disdAt', 'disdDate']),
    apprAt: pickFirstStringFromRecord(rec, ['apprAt', 'confirmAt', 'cnfmAt', 'disdCfmAt']),
    aplyUsrId: pickFirstStringFromRecord(rec, ['usrId', 'registrantId']),
    aplyUsrNm: pickFirstStringFromRecord(rec, ['usrNm', 'registrantName']),
    apprSts: pickFirstStringFromRecord(rec, ['apprSts', 'approvalStatus']),
    dispType: typeof item.dispType === 'string' ? item.dispType : undefined,
  }
}

export async function fetchItemDisposals(params: FetchItemDisposalsParams): Promise<FetchItemDisposalsResponse> {
  const { page, pageSize, filters } = params
  const searchRequest = filtersToSearchRequest(filters)
  const pageable: ItemDisposalPageable = {
    page: page - 1,
    size: pageSize,
  }

  const res = await http.get<ApiResponse<ItemDisposalsData>>('/api/item/disposals', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      // searchRequest/pageable를 query object로 받는 백엔드 대비 (평탄화도 함께 전달)
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) => mapItemDisposalToRow(item, index, offset)),
    totalCount: payload.totalElements ?? 0,
  }
}

/** 단건 조회: GET /api/item/disposals (searchRequest에 dispMId 전달) */
export async function fetchItemDisposalByDispMId(dispMId: string): Promise<DisposalMaster | null> {
  const id = dispMId.trim()
  if (!id) return null
  const searchRequest = { dispMId: id }
  const pageable: ItemDisposalPageable = { page: 0, size: 50 }
  const res = await http.get<ApiResponse<ItemDisposalsData>>('/api/item/disposals', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })
  const payload = res.data.data
  const content = Array.isArray(payload?.content) ? payload.content : []
  const hit = content.find((item) => String(item.dispMId ?? item.id ?? '').trim() === id)
  return hit ? mapItemDisposalToMaster(hit) : null
}

// ---------------------------
// 처분 물품 목록 (상세)
// GET /api/item/disposals/{dispMId}/items
// ---------------------------

export type ItemDisposalItemContent = {
  id?: number | string
  g2bItemNo?: string
  g2bItemNm?: string
  itmNo?: string
  itemUnqNo?: string
  acqAt?: string
  acqUpr?: number
  deptNm?: string
  operSts?: string
  disdRsn?: string
  reason?: string
  [key: string]: unknown
}

export type ItemDisposalItemsData = {
  content: ItemDisposalItemContent[]
  totalElements?: number
}

export type DisposalItemRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  acquireAmount: string
  operatingDept: string
  itemStatus: string
  reason: string
}

export type DisposalItem = {
  itmNo?: string
  itemUnqNo?: string
  g2bItemNo?: string
  g2bItemNm?: string
  acqAt?: string
  acqUpr?: number
  deptNm?: string
  operSts?: string
  disdRsn?: string
}

export type FetchItemDisposalItemsParams = {
  dispMId: string
  page: number
  pageSize: number
}

export type FetchItemDisposalItemsResponse = {
  data: DisposalItemRow[]
  totalCount: number
}

function mapItemDisposalItemToRow(
  item: ItemDisposalItemContent,
  index: number,
  offset: number,
): DisposalItemRow {
  const g2bNumber = String((item.g2bItemNo as string | undefined) ?? '')
  const g2bName = String((item.g2bItemNm as string | undefined) ?? '')
  const itemUniqueNumber = String((item.itemUnqNo as string | undefined) ?? '')
  const acquireDate = String((item.acqAt as string | undefined) ?? '')
  const acquireAmountValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  const acquireAmount = acquireAmountValue ? `${acquireAmountValue.toLocaleString()}원` : ''
  const operatingDept = String((item.deptNm as string | undefined) ?? '')
  const itemStatus = String((item.operSts as string | undefined) ?? '')
  const reason = String((item.disdRsn as string | undefined) ?? (item.reason as string | undefined) ?? '')

  return {
    id: offset + index + 1,
    g2bNumber,
    g2bName,
    itemUniqueNumber,
    acquireDate,
    acquireAmount,
    operatingDept,
    itemStatus,
    reason,
  }
}

export async function fetchItemDisposalItems(
  params: FetchItemDisposalItemsParams,
): Promise<FetchItemDisposalItemsResponse> {
  const { dispMId, page, pageSize } = params
  const pageable: ItemDisposalPageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<ItemDisposalItemsData>>(
    `/api/item/disposals/${encodeURIComponent(dispMId)}/items`,
    {
      params: {
        pageable: JSON.stringify(pageable),
      },
    },
  )

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) => mapItemDisposalItemToRow(item, index, offset)),
    totalCount: payload.totalElements ?? 0,
  }
}

/** 처분에 묶인 물품 전부 (페이지 반복) */
export async function fetchItemDisposalAllItems(dispMId: string): Promise<DisposalItem[]> {
  const id = dispMId.trim()
  if (!id) return []
  const all: DisposalItem[] = []
  let page = 1
  const pageSize = 100
  while (true) {
    const res = await fetchItemDisposalItems({ dispMId: id, page, pageSize })
    const chunk: DisposalItem[] = res.data.map((row) => ({
      itmNo: row.itemUniqueNumber,
      itemUnqNo: row.itemUniqueNumber,
      g2bItemNo: row.g2bNumber,
      g2bItemNm: row.g2bName,
      acqAt: row.acquireDate,
      acqUpr: Number(String(row.acquireAmount).replace(/[^\d]/g, '')) || 0,
      deptNm: row.operatingDept,
      operSts: row.itemStatus,
      disdRsn: row.reason,
    }))
    all.push(...chunk)
    if (chunk.length === 0 || all.length >= res.totalCount) break
    page += 1
    if (page > 100) break
  }
  return all
}

export type CreateItemDisposalBody = {
  aplyAt: string
  dispType: string
  itmNos: string[]
}

/** PATCH /api/item/disposals/{dispMId} — 작성중 처분 신청 수정 */
export type UpdateItemDisposalBody = CreateItemDisposalBody

function assertDisposalMasterId(dispMId: string): string {
  const id = dispMId.trim()
  if (!id) throw new Error('처분 신청 ID가 없습니다.')
  return id
}

export async function updateItemDisposal(
  dispMId: string,
  body: UpdateItemDisposalBody,
): Promise<void> {
  const id = assertDisposalMasterId(dispMId)
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/item/disposals/${encodeURIComponent(id)}`,
    body,
  )
}

/** POST /api/item/disposals/{dispMId}/request — 처분 승인 요청 (MANAGER) */
export async function requestItemDisposalApproval(dispMId: string): Promise<void> {
  const id = assertDisposalMasterId(dispMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/disposals/${encodeURIComponent(id)}/request`,
  )
}

/** POST /api/item/disposals/{dispMId}/cancel — 처분 승인 요청 취소 (MANAGER) */
export async function cancelItemDisposalRequest(dispMId: string): Promise<void> {
  const id = assertDisposalMasterId(dispMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/disposals/${encodeURIComponent(id)}/cancel`,
  )
}

/** DELETE /api/item/disposals/{dispMId} — 처분 신청 삭제 (MANAGER) */
export async function deleteItemDisposal(dispMId: string): Promise<void> {
  const id = assertDisposalMasterId(dispMId)
  await http.delete<ApiResponse<Record<string, unknown>>>(
    `/api/item/disposals/${encodeURIComponent(id)}`,
  )
}

// ---------------------------
// 처분 신청 반려/확정 (ADMIN)
// PUT /api/item/disposals/admin/{dispMId}/reject
// PUT /api/item/disposals/admin/{dispMId}/confirm (추정: 확정 버튼용 - 필요 시 추가)
// ---------------------------

export async function rejectItemDisposal(dispMId: string): Promise<void> {
  await http.put<ApiResponse<unknown>>(
    `/api/item/disposals/admin/${encodeURIComponent(dispMId)}/reject`,
  )
}

export async function confirmItemDisposal(dispMId: string): Promise<void> {
  await http.put<ApiResponse<unknown>>(
    `/api/item/disposals/admin/${encodeURIComponent(dispMId)}/approval`,
  )
}

