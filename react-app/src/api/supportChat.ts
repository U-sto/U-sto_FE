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

