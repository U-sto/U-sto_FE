import http from './http'
import type { ApiResponse } from './types'

/**
 * 아이디 중복확인
 * GET /api/users/exists/user-id?usrId=...
 */
export async function checkUserIdExists(usrId: string) {
  const res = await http.get<ApiResponse<Record<string, unknown>>>(
    '/api/users/exists/user-id',
    { params: { usrId: usrId.trim() } },
  )
  return res.data
}

/**
 * 회원 가입
 * POST /api/users/sign-up
 */
export interface SignUpPayload {
  usrId: string
  usrNm: string
  pwd: string
  orgCd: string
}

export async function signUp(payload: SignUpPayload) {
  const res = await http.post<ApiResponse<null>>('/api/users/sign-up', payload)
  return res.data
}
