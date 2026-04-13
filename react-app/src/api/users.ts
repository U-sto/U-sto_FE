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
 * 이메일 중복확인 (인증번호 발송 전 호출 필요)
 * GET /api/users/exists/email?emailId=...
 * emailId: @ 앞부분(로컬 파트)만 전달
 */
export async function checkEmailExists(emailId: string) {
  const res = await http.get<ApiResponse<Record<string, unknown>>>(
    '/api/users/exists/email',
    { params: { emailId: emailId.trim() } },
  )
  return res.data
}

/**
 * 전화번호 중복확인 (휴대폰 인증번호 발송 전 호출 필요)
 * GET /api/users/exists/sms?sms=...
 * sms: 하이픈 제거한 번호 (예: 01012345678)
 */
export async function checkSmsExists(sms: string) {
  const digits = sms.replace(/\D/g, '')
  const res = await http.get<ApiResponse<Record<string, unknown>>>(
    '/api/users/exists/sms',
    { params: { sms: digits } },
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

/**
 * 회원 비밀번호 변경
 * PATCH /api/users/update/password
 */
export interface UpdatePasswordPayload {
  oldPwd: string
  newPwd: string
}

export async function updatePassword(payload: UpdatePasswordPayload) {
  const res = await http.patch<ApiResponse<{ usrId: string }>>(
    '/api/users/update/password',
    payload,
  )
  return res.data
}

/**
 * 회원 정보 조회
 * GET /api/users/info
 */
export interface UserInfo {
  usrId: string
  usrNm: string
  email: string
  sms: string
  orgNm: string
  orgCd?: string
  roleNm: string
}

export async function getUserInfo() {
  const res = await http.get<ApiResponse<UserInfo>>('/api/users/info')
  return res.data
}

/**
 * 휴대폰 번호 변경
 * PATCH /api/users/update/sms
 */
export interface UpdateSmsPayload {
  sms: string
}

export async function updateUserSms(payload: UpdateSmsPayload) {
  const digits = payload.sms.replace(/\D/g, '')
  const res = await http.patch<ApiResponse<Record<string, unknown>>>(
    '/api/users/update/sms',
    { sms: digits },
  )
  return res.data
}

/**
 * 회원 탈퇴
 * DELETE /api/users/delete
 */
export interface WithdrawPayload {
  currentPw: string
}

export async function withdrawUser(payload: WithdrawPayload) {
  const res = await http.delete<ApiResponse<Record<string, unknown>>>(
    '/api/users/delete',
    { data: payload },
  )
  return res.data
}
