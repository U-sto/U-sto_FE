import http from './http'
import type { ApiResponse } from './types'

/* ─── 승인상태 매핑 ─── */

const APPR_STS_MAP: Record<string, string> = {
  WAIT: '대기',
  REQUEST: '승인요청',
  REJECTED: '반려',
  APPROVED: '확정',
}

const APPR_STS_CODE_MAP: Record<string, string> = {
  전체: '',
  대기: 'WAIT',
  승인요청: 'REQUEST',
  반려: 'REJECTED',
  확정: 'APPROVED',
}

/* ─── 타입 (불용 등록 목록) ─── */

type DisuseListContent = {
  dsuMId?: string
  aplyAt?: string
  apprAt?: string
  aplyUsrId?: string
  aplyUsrNm?: string
  apprSts?: string
  itemSts?: string
  dsuRsn?: string
  [key: string]: unknown
}

type DisuseListData = {
  content: DisuseListContent[]
  totalElements?: number
}

export type DisuseRegistrationRow = {
  id: number
  dsuMId: string
  disuseDate: string
  disuseConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

export type DisuseMaster = {
  dsuMId: string
  aplyAt: string
  apprAt: string
  aplyUsrId: string
  aplyUsrNm: string
  apprSts: string
  itemSts?: string
  dsuRsn?: string
}

export type FetchDisuseListParams = {
  page: number
  pageSize: number
  filters: {
    disuseDateFrom: string
    disuseDateTo: string
    approvalStatus: string
  }
}

/* ─── 타입 (불용 물품 목록) ─── */

type DisuseItemContent = {
  id?: number | string
  g2bItemNo?: string
  g2bItemNm?: string
  itemUnqNo?: string
  itmNo?: string
  acqAt?: string
  acqUpr?: number
  deptNm?: string
  oprDeptNm?: string
  itmSts?: string
  operSts?: string
  dsuRsn?: string
  reason?: string
  [key: string]: unknown
}

type DisuseItemsData = {
  content: DisuseItemContent[]
  totalElements?: number
}

export type DisuseItem = {
  itmNo?: string
  itemUnqNo?: string
  g2bItemNo?: string
  g2bItemNm?: string
  acqAt?: string
  acqUpr?: number
  deptNm?: string
  oprDeptNm?: string
  itmSts?: string
  operSts?: string
  dsuRsn?: string
}

export type DisuseItemRow = {
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

/* ─── GET /api/item/disuses (불용등록목록 조회) ─── */

export async function fetchDisuseList(
  params: FetchDisuseListParams,
): Promise<{ data: DisuseRegistrationRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params

  const searchRequest: Record<string, string> = {}
  if (filters.disuseDateFrom) searchRequest.startAplyAt = filters.disuseDateFrom
  if (filters.disuseDateTo) searchRequest.endAplyAt = filters.disuseDateTo
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    searchRequest.apprSts = APPR_STS_CODE_MAP[filters.approvalStatus] ?? filters.approvalStatus
  }

  const pageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<DisuseListData>>('/api/item/disuses', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res?.data?.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize

  return {
    data: content.map((item, i) => {
      const rawSts = String(item.apprSts ?? '')
      return {
        id: offset + i + 1,
        dsuMId: String(item.dsuMId ?? ''),
        disuseDate: String(item.aplyAt ?? ''),
        disuseConfirmDate: String(item.apprAt ?? ''),
        registrantId: String(item.aplyUsrId ?? ''),
        registrantName: String(item.aplyUsrNm ?? ''),
        approvalStatus: APPR_STS_MAP[rawSts] ?? rawSts,
      }
    }),
    totalCount: payload.totalElements ?? 0,
  }
}

function mapDisuseMaster(item: DisuseListContent): DisuseMaster {
  return {
    dsuMId: String(item.dsuMId ?? ''),
    aplyAt: String(item.aplyAt ?? ''),
    apprAt: String(item.apprAt ?? ''),
    aplyUsrId: String(item.aplyUsrId ?? ''),
    aplyUsrNm: String(item.aplyUsrNm ?? ''),
    apprSts: String(item.apprSts ?? ''),
    itemSts: typeof item.itemSts === 'string' ? item.itemSts : undefined,
    dsuRsn: typeof item.dsuRsn === 'string' ? item.dsuRsn : undefined,
  }
}

/** 단건 조회: GET /api/item/disuses (searchRequest에 dsuMId 전달) */
export async function fetchItemDisuseByDsuMId(dsuMId: string): Promise<DisuseMaster | null> {
  const id = dsuMId.trim()
  if (!id) return null

  const searchRequest = { dsuMId: id }
  const pageable = { page: 0, size: 50 }
  const res = await http.get<ApiResponse<DisuseListData>>('/api/item/disuses', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })
  const payload = res?.data?.data
  const content = Array.isArray(payload?.content) ? payload?.content : []
  const hit = content.find((item) => String(item.dsuMId ?? '').trim() === id)
  return hit ? mapDisuseMaster(hit) : null
}

/* ─── GET /api/item/disuses/{dsuMId}/items (불용물품목록 조회) ─── */

export async function fetchDisuseItems(params: {
  dsuMId: string
  page: number
  pageSize: number
}): Promise<{ data: DisuseItemRow[]; totalCount: number }> {
  const { dsuMId, page, pageSize } = params
  const pageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<DisuseItemsData>>(
    `/api/item/disuses/${encodeURIComponent(dsuMId)}/items`,
    {
      params: {
        pageable: JSON.stringify(pageable),
        ...pageable,
      },
    },
  )

  const payload = res?.data?.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize

  return {
    data: content.map((item, i) => {
      const acqUpr = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
      return {
        id: offset + i + 1,
        g2bNumber: String(item.g2bItemNo ?? ''),
        g2bName: String(item.g2bItemNm ?? ''),
        itemUniqueNumber: String(item.itemUnqNo ?? item.itmNo ?? ''),
        acquireDate: String(item.acqAt ?? ''),
        acquireAmount: acqUpr ? `${acqUpr.toLocaleString()}원` : '',
        operatingDept: String(item.deptNm ?? item.oprDeptNm ?? ''),
        itemStatus: String(item.itmSts ?? item.operSts ?? ''),
        reason: String(item.dsuRsn ?? item.reason ?? ''),
      }
    }),
    totalCount: payload.totalElements ?? 0,
  }
}

/** 불용에 묶인 물품 전부 (페이지 반복) */
export async function fetchItemDisuseAllItems(dsuMId: string): Promise<DisuseItem[]> {
  const id = dsuMId.trim()
  if (!id) return []
  const all: DisuseItem[] = []
  let page = 1
  const pageSize = 100
  while (true) {
    const res = await fetchDisuseItems({ dsuMId: id, page, pageSize })
    const chunk = res.data.map((row) => ({
      itmNo: row.itemUniqueNumber,
      itemUnqNo: row.itemUniqueNumber,
      g2bItemNo: row.g2bNumber,
      g2bItemNm: row.g2bName,
      acqAt: row.acquireDate,
      acqUpr: Number(String(row.acquireAmount).replace(/[^\d]/g, '')) || 0,
      deptNm: row.operatingDept,
      itmSts: row.itemStatus,
      dsuRsn: row.reason,
    }))
    all.push(...chunk)
    if (chunk.length === 0 || all.length >= res.totalCount) break
    page += 1
    if (page > 100) break
  }
  return all
}

/** POST /api/item/disuses — 불용 신청 등록 (MANAGER) */
export type CreateItemDisuseBody = {
  aplyAt: string
  itemSts: string
  dsuRsn: string
  itmNos: string[]
}

export type CreateItemDisuseData = {
  dsuMId?: string
  [key: string]: unknown
}

export async function createItemDisuse(
  body: CreateItemDisuseBody,
): Promise<CreateItemDisuseData | null> {
  const res = await http.post<ApiResponse<CreateItemDisuseData>>('/api/item/disuses', body)
  return res.data.data ?? null
}

/** PATCH /api/item/disuses/{dsuMId} — 작성중(WAIT) 불용 신청 수정 */
export type UpdateItemDisuseBody = CreateItemDisuseBody

export async function updateItemDisuse(
  dsuMId: string,
  body: UpdateItemDisuseBody,
): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/item/disuses/${encodeURIComponent(id)}`,
    body,
  )
}

function assertDisuseMasterId(id: string): string {
  const t = id.trim()
  if (!t) throw new Error('불용 신청 ID가 없습니다.')
  return t
}

/** POST /api/item/disuses/{dsuMId}/request — 불용 승인 요청 (MANAGER) */
export async function requestItemDisuseApproval(dsuMId: string): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/disuses/${encodeURIComponent(id)}/request`,
  )
}

/** POST /api/item/disuses/{dsuMId}/cancel — 불용 승인 요청 취소 (MANAGER) */
export async function cancelItemDisuseRequest(dsuMId: string): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.post<ApiResponse<Record<string, unknown>>>(
    `/api/item/disuses/${encodeURIComponent(id)}/cancel`,
  )
}

/** DELETE /api/item/disuses/{dsuMId} — 불용 신청 삭제 (MANAGER) */
export async function deleteItemDisuse(dsuMId: string): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.delete<ApiResponse<Record<string, unknown>>>(`/api/item/disuses/${encodeURIComponent(id)}`)
}

/** PUT /api/item/disuses/admin/{dsuMId}/approval — 불용 승인 확정 (ADMIN) */
export async function adminApproveItemDisuse(dsuMId: string): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.put<ApiResponse<Record<string, unknown>>>(
    `/api/item/disuses/admin/${encodeURIComponent(id)}/approval`,
  )
}

/** PUT /api/item/disuses/admin/{dsuMId}/reject — 불용 요청 반려 (ADMIN) */
export async function adminRejectItemDisuse(dsuMId: string): Promise<void> {
  const id = assertDisuseMasterId(dsuMId)
  await http.put<ApiResponse<Record<string, unknown>>>(
    `/api/item/disuses/admin/${encodeURIComponent(id)}/reject`,
  )
}
