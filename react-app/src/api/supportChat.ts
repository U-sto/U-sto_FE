import http from './http'
import type { ApiResponse } from './types'

export interface AiChatRequest {
  session_id: string
  query: string
}

export interface AiChatResponseData {
  reply: string
  references?: string[]
  created_at?: string
}

export interface AiItemAssetsSearchParams {
  itmNo?: string
  g2bMcd?: string
  g2bDcd?: string
  g2bDn?: string
}

export interface AiItemAssetRow {
  itmNo?: string
  g2bMcd?: string
  g2bDcd?: string
  g2bDn?: string
  acqAt?: string
  arrAt?: string
  deptNm?: string
  operSts?: string
  acqUpr?: string
  qty?: string
  [key: string]: unknown
}

/**
 * 이전 채팅방(쓰레드) 목록 조회
 * GET /api/ai/chat/threads
 */
export async function getChatThreads(): Promise<string[]> {
  const res = await http.get<ApiResponse<string[]>>('/api/ai/chat/threads')
  const data = res.data?.data
  return Array.isArray(data) ? data : []
}

/**
 * 채팅방 입장 시 이전 대화 맥락 조회
 * GET /api/ai/chat/messages/{threadId}/serch
 */
export interface ChatContextMessage {
  order: number
  sender: string
  content: string
}

export async function getChatMessages(
  threadId: string,
): Promise<ChatContextMessage[]> {
  const res = await http.get<ApiResponse<ChatContextMessage[]>>(
    `/api/ai/chat/messages/${encodeURIComponent(threadId)}/serch`,
  )
  const data = res.data?.data
  return Array.isArray(data) ? data : []
}

/**
 * 전체 대화내용 조회 (검색)
 * GET /api/ai/chat/messages/search?content=...
 */
export async function searchChatMessages(content: string): Promise<string[]> {
  const res = await http.get<ApiResponse<string[]>>(
    '/api/ai/chat/messages/search',
    { params: { content: content.trim() } },
  )
  const data = res.data?.data
  return Array.isArray(data) ? data : []
}

/**
 * 채팅방(쓰레드) 삭제
 * DELETE /api/ai/chat/threads?threadId=...
 */
export async function deleteChatThread(threadId: string): Promise<void> {
  await http.delete<ApiResponse<Record<string, unknown>>>(
    '/api/ai/chat/threads',
    { params: { threadId } },
  )
}

/**
 * AI 챗봇 대화 API
 * POST /api/ai/chat
 */
export async function sendAiChat(
  sessionId: string,
  query: string,
): Promise<string> {
  const payload: AiChatRequest = {
    session_id: sessionId,
    query: query.trim(),
  }
  const res = await http.post<ApiResponse<AiChatResponseData>>(
    '/api/ai/chat',
    payload,
  )
  const body = res.data
  if (!body?.data?.reply) return ''
  return body.data.reply
}

/**
 * 물품 조회 By AI
 * GET /api/ai/item/assets
 */
export async function fetchAiItemAssets(
  params: AiItemAssetsSearchParams,
): Promise<AiItemAssetRow[]> {
  const req: Record<string, string> = {}
  if (params.itmNo?.trim()) req.itmNo = params.itmNo.trim()
  if (params.g2bMcd?.trim()) req.g2bMcd = params.g2bMcd.trim()
  if (params.g2bDcd?.trim()) req.g2bDcd = params.g2bDcd.trim()
  if (params.g2bDn?.trim()) req.g2bDn = params.g2bDn.trim()
  if (Object.keys(req).length === 0) return []

  const res = await http.get<ApiResponse<{ arr?: AiItemAssetRow[] } | AiItemAssetRow[] | string>>(
    '/api/ai/item/assets',
    { params: req },
  )
  const data = res.data?.data
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray((data as { arr?: AiItemAssetRow[] }).arr)) {
    return (data as { arr: AiItemAssetRow[] }).arr
  }
  return []
}

