/**
 * 물품 운용 등록 목록 조회 API
 * 백엔드: GET /api/item/operations (운용등록목록조회)
 * - searchRequest, pageable 를 query 파라미터로 받으며(스웨거 기준 required),
 *   현재 프로젝트에서는 JSON.stringify 해서 전달한다.
 */
import http from './http'
import type { ApiResponse } from './types'
import { applyDeptLabelToSearchRequest } from '../constants/departments'
import { buildCombinedG2bListNoForFilter } from './g2bFilterNormalize'
import { pickFirstStringFromRecord as pickFromRecord } from './pickFromRecord'

export type ItemOperationSearchRequest = {
  /** 시작 신청일자 (스웨거 예: startAplyAt) */
  startAplyAt?: string
  /** 종료 신청일자 (스웨거 예: endAplyAt) */
  endAplyAt?: string
  /** 시작 신청일자 (호환) */
  startApplYAt?: string
  /** 종료 신청일자 (호환) */
  endApplYAt?: string
  /** 승인상태 */
  apprSts?: string
  // 아래는 화면 필터에서 필요할 수 있어 optional로 확장
  g2bItemNm?: string
  g2bItemNo?: string
  itemUnqNo?: string
  deptCd?: string
  deptNm?: string
  operSts?: string
  startAcqAt?: string
  endAcqAt?: string
  startApprAt?: string
  endApprAt?: string
  [key: string]: unknown
}

export type ItemOperationPageable = {
  page: number
  size: number
  sort?: string[]
}

export type ItemOperationContent = {
  g2bItemNo?: string
  g2bItemNm?: string
  itemUnqNo?: string
  acqAt?: string
  acqUpr?: number
  apprAt?: string
  deptNm?: string
  operSts?: string
  drbYr?: string
  [key: string]: unknown
}

export type ItemOperationsData = {
  content: ItemOperationContent[]
  totalElements?: number
}

export type OperationLedgerFilters = {
  g2bName: string
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

export type OperationLedgerRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  sortDate: string
  acquireAmount: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
}

export type FetchItemOperationsParams = {
  page: number
  pageSize: number
  filters: OperationLedgerFilters
}

export type FetchItemOperationsResponse = {
  data: OperationLedgerRow[]
  totalCount: number
}

const APPR_STS_MAP: Record<string, string> = {
  대기: 'WAIT',
  반려: 'REJECT',
  확정: 'CONFIRM',
  전체: '',
}

function filtersToSearchRequest(filters: OperationLedgerFilters): ItemOperationSearchRequest {
  const req: ItemOperationSearchRequest = {}

  // 화면에서 들어오는 값들을 백엔드가 받을 가능성이 높은 키로 최대한 매핑
  if (filters.g2bName?.trim()) req.g2bItemNm = filters.g2bName.trim()

  const g2bNo = buildCombinedG2bListNoForFilter(
    filters.g2bNumberPrefix,
    filters.g2bNumberSuffix,
  )
  if (g2bNo) req.g2bItemNo = g2bNo

  if (filters.itemUniqueNumber?.trim()) req.itemUnqNo = filters.itemUniqueNumber.trim()
  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }
  if (filters.operatingStatus && filters.operatingStatus !== '전체') req.operSts = filters.operatingStatus

  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) req.startApprAt = filters.sortDateFrom
  if (filters.sortDateTo) req.endApprAt = filters.sortDateTo

  return req
}

function mapItemOperationToRow(
  item: ItemOperationContent,
  index: number,
  offset: number,
): OperationLedgerRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  const usefulLife =
    typeof item.drbYr === 'string'
      ? item.drbYr.endsWith('년')
        ? item.drbYr
        : `${item.drbYr}년`
      : ''

  return {
    id: offset + index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    sortDate: String(item.apprAt ?? ''),
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    operatingDept: String(item.deptNm ?? ''),
    operatingStatus: String(item.operSts ?? ''),
    usefulLife,
  }
}

export async function fetchItemOperations(
  params: FetchItemOperationsParams,
): Promise<FetchItemOperationsResponse> {
  const { page, pageSize, filters } = params

  const searchRequest = filtersToSearchRequest(filters)
  const pageable: ItemOperationPageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<ItemOperationsData>>('/api/item/operations', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) => mapItemOperationToRow(item, index, offset)),
    totalCount: payload.totalElements ?? 0,
  }
}

/** 물품 운용 전환 — 운용 전환 등록 목록 필터 (화면) */
export type OperationTransferListFilters = {
  transferDateFrom: string
  transferDateTo: string
  approvalStatus: string
}

/** 운용 전환 등록 목록 테이블 행 */
export type OperationTransferRegistrationRow = {
  id: number
  /** 운용 등록 마스터 ID — GET /api/item/operations/{operMId}/items */
  operMId: string
  transferDate: string
  transferConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

/** 운용 전환 물품 목록 테이블 행 (GET .../operations/{operMId}/items) */
export type OperationTransferItemRow = {
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

const APPR_STS_CODE_TO_LABEL: Record<string, string> = {
  WAIT: '대기',
  REJECT: '반려',
  CONFIRM: '확정',
}

function mapApprStsCodeToLabel(code: string): string {
  const raw = String(code ?? '').trim()
  if (!raw) return ''
  return APPR_STS_CODE_TO_LABEL[raw] ?? raw
}

function operationTransferFiltersToSearchRequest(
  filters: OperationTransferListFilters,
): ItemOperationSearchRequest {
  const req: ItemOperationSearchRequest = {}
  if (filters.transferDateFrom) {
    req.startAplyAt = filters.transferDateFrom
    req.startApplYAt = filters.transferDateFrom
  }
  if (filters.transferDateTo) {
    req.endAplyAt = filters.transferDateTo
    req.endApplYAt = filters.transferDateTo
  }
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    const code = APPR_STS_MAP[filters.approvalStatus] ?? filters.approvalStatus
    if (code) req.apprSts = code
  }
  return req
}

/** 등록자: 최상위 필드가 비었을 때 user/regUser 등 중첩 객체에서 시도 */
function pickRegistrantFromRecord(item: Record<string, unknown>): {
  id: string
  name: string
} {
  const idKeys = [
    'aplyUsrId',
    'rgstId',
    'regId',
    'rgstUsrId',
    'frstRgstrId',
    'usrId',
    'crtUsrId',
    'regUsrId',
    'instUsrId',
  ]
  const nameKeys = [
    'aplyUsrNm',
    'rgstNm',
    'regNm',
    'rgstUsrNm',
    'frstRgstrNm',
    'usrNm',
    'crtUsrNm',
    'regUsrNm',
    'instUsrNm',
  ]
  let id = pickFromRecord(item, idKeys)
  let name = pickFromRecord(item, nameKeys)
  if (id || name) return { id, name }

  const nested = [item.user, item.regUser, item.applicant, item.rgstUser].find(
    (v): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v),
  )
  if (nested) {
    id = pickFromRecord(nested, [...idKeys, 'id', 'loginId'])
    name = pickFromRecord(nested, [...nameKeys, 'nm', 'name'])
  }
  return { id, name }
}

/**
 * GET /api/item/operations content 한 건 → 운용 전환 등록 목록 행
 * (백엔드 필드명이 다를 수 있어 후보 키를 순서대로 시도)
 */
function mapOperationRegistrationRecord(
  item: Record<string, unknown>,
  index: number,
  offset: number,
): OperationTransferRegistrationRow {
  const apprRaw = String(item.apprSts ?? '')
  const { id: registrantId, name: registrantName } = pickRegistrantFromRecord(item)
  /** 불용 등록 목록(itemDisuses)과 동일하게 aplyUsrId/aplyUsrNm·apprAt 등 후보를 넓게 시도 */
  return {
    id: offset + index + 1,
    operMId: pickFromRecord(item, ['operMId', 'operMld', 'operMid', 'oprMId', 'id']),
    transferDate: pickFromRecord(item, [
      'applYAt',
      'aplyAt',
      'applyDt',
      'aplyDt',
      'transferDt',
      'startAplyAt',
    ]),
    transferConfirmDate: pickFromRecord(item, [
      'apprCfmAt',
      'apprCnfAt',
      'oprCnfAt',
      'operCnfAt',
      'trnsfCnfAt',
      'cnfAt',
      'cnfDt',
      'cfmAt',
      'confirmAt',
      'transferConfirmDt',
      'apprAt',
    ]),
    registrantId,
    registrantName,
    approvalStatus: mapApprStsCodeToLabel(apprRaw) || apprRaw,
  }
}

/**
 * 물품 운용 전환 — 운용 전환 등록 목록 (마스터) 조회
 * GET /api/item/operations
 */
export async function fetchOperationTransferRegistrations(params: {
  page: number
  pageSize: number
  filters: OperationTransferListFilters
}): Promise<{ data: OperationTransferRegistrationRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params
  const searchRequest = operationTransferFiltersToSearchRequest(filters)
  const pageable: ItemOperationPageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<ItemOperationsData>>('/api/item/operations', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) =>
      mapOperationRegistrationRecord(item as Record<string, unknown>, index, offset),
    ),
    totalCount: payload.totalElements ?? 0,
  }
}

/** GET /api/item/operations/{operMId}/items 응답 data (페이지) */
export type ItemOperationsItemsPageData = {
  content?: Record<string, unknown>[]
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
  [key: string]: unknown
}

function mapOperationItemToRow(
  item: Record<string, unknown>,
  index: number,
  offset: number,
): OperationTransferItemRow {
  const acqUpr = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? NaN)
  return {
    id: offset + index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bNm ?? item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itmNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    acquireAmount:
      Number.isFinite(acqUpr) && acqUpr > 0
        ? `${acqUpr.toLocaleString('ko-KR')}원`
        : '',
    operatingDept: String(item.deptNm ?? ''),
    itemStatus: String(
      item.itemSts ?? item.itmSts ?? item.operSts ?? item.oprSts ?? item.itm_sts ?? '',
    ),
    reason: String(item.chgRsn ?? item.rmk ?? ''),
  }
}

/**
 * 특정 운용 등록의 물품 목록 조회 (페이징)
 * GET /api/item/operations/{operMId}/items
 */
export async function fetchOperationTransferItems(params: {
  operMId: string
  page: number
  pageSize: number
}): Promise<{ data: OperationTransferItemRow[]; totalCount: number }> {
  const id = params.operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  const pageable: ItemOperationPageable = { page: params.page - 1, size: params.pageSize }

  const res = await http.get<ApiResponse<ItemOperationsItemsPageData>>(
    `/api/item/operations/${encodeURIComponent(id)}/items`,
    {
      params: {
        pageable: JSON.stringify(pageable),
        ...pageable,
      },
    },
  )

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (params.page - 1) * params.pageSize
  return {
    data: content.map((item, index) =>
      mapOperationItemToRow(item as Record<string, unknown>, index, offset),
    ),
    totalCount: payload.totalElements ?? 0,
  }
}

/** POST /api/item/operations — 운용 신청 등록 (MANAGER) */
export type CreateItemOperationBody = {
  aplyAt: string
  itemSts: string
  deptCd: string
  itmNos: string[]
}

export type CreateItemOperationResult = {
  operMId?: string
  [key: string]: unknown
}

/**
 * 화면 물품상태 → API itemSts (OperationRegisterRequest)
 * 물품 운용대장 `operSts` / itemAssets `OPER_STS_MAP` 과 동일한 코드 사용 (스웨거·백엔드 enum 기준)
 */
export const ITEM_OPERATION_REGISTRATION_ITEM_STS: Record<string, string> = {
  운용중: 'OPER',
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

/** API itemSts 코드 → 등록 화면 드롭다운 라벨 */
export const ITEM_OPERATION_ITEM_STS_TO_LABEL: Record<string, string> = {
  USED: '운용중',
  OPER: '운용중',
  OPE: '운용중',
  OPEM: '운용중',
  RET: '반납',
  RTN: '반납',
  DIS: '불용',
  DSU: '불용',
  DSP: '처분',
}

export function itemStsCodeToRegistrationLabel(code: string): string {
  const c = String(code ?? '').trim()
  if (!c) return '선택'
  return ITEM_OPERATION_ITEM_STS_TO_LABEL[c] ?? c
}

/**
 * 운용 등록 단건 조회 (수정 폼용) — 백엔드에 없으면 null
 * GET /api/item/operations/{operMId}
 */
export async function fetchItemOperationMaster(
  operMId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await http.get<ApiResponse<Record<string, unknown>>>(
      `/api/item/operations/${encodeURIComponent(operMId.trim())}`,
    )
    const d = res.data.data
    return d && typeof d === 'object' && !Array.isArray(d) ? d : null
  } catch {
    return null
  }
}

export function extractItemOperationMasterFields(record: Record<string, unknown> | null): {
  aplyAt: string
  deptCd: string
  itemSts: string
  deptNm: string
  rgstId: string
} {
  if (!record) return { aplyAt: '', deptCd: '', itemSts: '', deptNm: '', rgstId: '' }
  const pick = (keys: string[]) => {
    for (const k of keys) {
      const v = record[k]
      if (v != null && String(v).trim() !== '') return String(v)
    }
    return ''
  }
  return {
    aplyAt: pick([
      'aplyAt',
      'applYAt',
      'applyDt',
      'aplyDt',
      'transferDt',
      'oprDt',
    ]),
    deptCd: pick(['deptCd', 'oprDeptCd', 'tgtDeptCd', 'dept_cd']),
    itemSts: pick(['itemSts', 'itmSts', 'oprSts', 'operSts', 'itm_sts']),
    deptNm: pick(['deptNm', 'oprDeptNm', 'tgtDeptNm', 'dept_nm']),
    rgstId: pick([
      'aplyUsrId',
      'rgstId',
      'regId',
      'rgstUsrId',
      'frstRgstrId',
      'instUsrId',
    ]),
  }
}

/**
 * 운용 등록 물품 전체 조회 (페이지 반복)
 */
export async function fetchAllOperationTransferItems(
  operMId: string,
): Promise<OperationTransferItemRow[]> {
  const id = operMId.trim()
  if (!id) return []
  const all: OperationTransferItemRow[] = []
  let page = 1
  const pageSize = 100
  let total = Infinity
  while (all.length < total && page <= 200) {
    const res = await fetchOperationTransferItems({ operMId: id, page, pageSize })
    all.push(...res.data)
    total = res.totalCount ?? all.length
    if (res.data.length === 0 || res.data.length < pageSize) break
    page += 1
  }
  return all
}

export async function createItemOperation(
  body: CreateItemOperationBody,
): Promise<CreateItemOperationResult | null> {
  const res = await http.post<ApiResponse<CreateItemOperationResult>>(
    '/api/item/operations',
    body,
  )
  return res.data.data ?? null
}

/**
 * 운용 신청 수정 (MANAGER) — 작성중(WAIT) 상태만 수정, 본문은 등록과 동일
 * PATCH /api/item/operations/{operMId}
 */
export async function updateItemOperation(
  operMId: string,
  body: CreateItemOperationBody,
): Promise<void> {
  await http.patch<ApiResponse<unknown>>(
    `/api/item/operations/${encodeURIComponent(operMId.trim())}`,
    body,
  )
}

/**
 * 운용 승인 요청 (MANAGER) — 결재자(ADMIN)에게 승인 요청
 * POST /api/item/operations/{operMId}/request (본문 없음)
 */
export async function requestItemOperationApproval(operMId: string): Promise<void> {
  const id = operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/operations/${encodeURIComponent(id)}/request`,
  )
}

/**
 * 운용 승인 요청 취소 (MANAGER) — 승인 요청 중인 등록 소프트 삭제
 * POST /api/item/operations/{operMId}/cancel (본문 없음)
 */
export async function cancelItemOperationRequest(operMId: string): Promise<void> {
  const id = operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/operations/${encodeURIComponent(id)}/cancel`,
  )
}

/**
 * 운용 신청 삭제 (MANAGER) — 작성중(WAIT) 상태만 삭제 가능
 * DELETE /api/item/operations/{operMId}
 */
export async function deleteItemOperation(operMId: string): Promise<void> {
  const id = operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  await http.delete<ApiResponse<Record<string, unknown>>>(
    `/api/item/operations/${encodeURIComponent(id)}`,
  )
}

/**
 * 운용 요청 반려 (ADMIN)
 * PUT /api/item/operations/admin/{operMId}/reject
 */
export async function rejectItemOperationAdmin(operMId: string): Promise<void> {
  const id = operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  await http.put<ApiResponse<unknown>>(
    `/api/item/operations/admin/${encodeURIComponent(id)}/reject`,
  )
}

/**
 * 운용 승인 확정 (ADMIN)
 * PUT /api/item/operations/admin/{operMId}/approve
 */
export async function approveItemOperationAdmin(operMId: string): Promise<void> {
  const id = operMId.trim()
  if (!id) {
    throw new Error('operMId가 없습니다.')
  }
  await http.put<ApiResponse<unknown>>(
    `/api/item/operations/admin/${encodeURIComponent(id)}/approve`,
  )
}
