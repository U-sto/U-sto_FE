import http from './http'
import type { ApiResponse } from './types'

/** POST /api/ai/chat/threads/{threadId}/messages 요청 바디 (경로에 threadId 포함) */
export interface AiChatMessageRequest {
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
 * GET /api/ai/chat/threads/{threadId}/messages
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
    `/api/ai/chat/threads/${encodeURIComponent(threadId)}/messages`,
  )
  const data = res.data?.data
  return Array.isArray(data) ? data : []
}

function parseThreadIdFromCreateResponse(
  raw: unknown,
): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (typeof o.threadId === 'string' && o.threadId.trim()) return o.threadId.trim()
    if (typeof o.id === 'string' && o.id.trim()) return o.id.trim()
  }
  return null
}

/**
 * 쓰레드 생성(첫 대화)
 * POST /api/ai/chat/threads
 */
export async function createChatThread(): Promise<string> {
  const res = await http.post<ApiResponse<unknown>>('/api/ai/chat/threads')
  const id = parseThreadIdFromCreateResponse(res.data?.data)
  if (id) return id
  throw new Error('쓰레드 생성 응답에 threadId가 없습니다.')
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
 * DELETE /api/ai/chat/threads/{threadId}
 */
export async function deleteChatThread(threadId: string): Promise<void> {
  await http.delete<ApiResponse<Record<string, unknown>>>(
    `/api/ai/chat/threads/${encodeURIComponent(threadId)}`,
  )
}

/**
 * 쓰레드 이름 수정
 * PATCH /api/ai/chat/threads/{threadId}
 */
export async function patchChatThreadTitle(
  threadId: string,
  title: string,
): Promise<void> {
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/ai/chat/threads/${encodeURIComponent(threadId)}`,
    { title: title.trim() },
  )
}

/**
 * AI 챗봇 대화
 * POST /api/ai/chat/threads/{threadId}/messages
 */
export async function sendAiChat(
  threadId: string,
  query: string,
): Promise<string> {
  const payload: AiChatMessageRequest = {
    query: query.trim(),
  }
  const res = await http.post<ApiResponse<AiChatResponseData>>(
    `/api/ai/chat/threads/${encodeURIComponent(threadId)}/messages`,
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

