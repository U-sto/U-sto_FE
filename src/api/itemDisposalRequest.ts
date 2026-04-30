/**
 * 처분 신청 등록 API (MANAGER)
 * POST /api/item/disposals
 *
 * Request body 예시:
 * {
 *   "aplyAt": "2026-02-01",
 *   "aplyUsrId": "user01",
 *   "dispType": "SALE",
 *   "itmNo": ["M202600001", "M202600002"]
 * }
 */
import http from './http'
import type { ApiResponse } from './types'

export type CreateItemDisposalRequestBody = {
  aplyAt: string
  dispType: string
  itmNos: string[]
  aplyUsrId?: string
  orgCd?: string
}

export type CreateItemDisposalResponseData = {
  dispMId?: string
}

export async function createItemDisposalRequest(
  body: CreateItemDisposalRequestBody,
): Promise<CreateItemDisposalResponseData> {
  const normalizedItmNos = Array.isArray(body.itmNos)
    ? body.itmNos.filter((v) => typeof v === 'string' && v.trim().length > 0)
    : []

  const requestBody: Record<string, unknown> = {
    aplyAt: body.aplyAt,
    dispType: body.dispType,
    itmNos: normalizedItmNos,
  }

  const res = await http.post<ApiResponse<CreateItemDisposalResponseData>>(
    '/api/item/disposals',
    requestBody,
  )
  return res.data.data ?? {}
}

