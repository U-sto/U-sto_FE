import http from './http'
import type { ApiResponse } from './types'
import { ACCESS_TOKEN_KEY } from './types'

/**
 * 로그인
 * POST /api/auth/login
 */
export interface LoginPayload {
  usrId: string
  pwd: string
}

export interface LoginResponseData {
  accessToken?: string
  [key: string]: unknown
}

export async function login(payload: LoginPayload) {
  const res = await http.post<ApiResponse<LoginResponseData>>(
    '/api/auth/login',
    payload,
  )
  return res.data
}

/** 로그인 성공 시 토큰 저장 (data.accessToken 있으면 저장) */
export function saveLoginToken(data: LoginResponseData | null): void {
  const token = data?.accessToken
  if (typeof token === 'string' && token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

/** 로그아웃 시 로컬 토큰 제거 */
export function clearLoginToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

/**
 * 로그아웃 (서버에 로그아웃 요청, Authorization 헤더로 사용자 식별)
 * POST /api/auth/logout
 */
export async function logout() {
  const res = await http.post<ApiResponse<null>>('/api/auth/logout')
  return res.data
}

export interface SendEmailVerificationPayload {
  usrNm: string
  usrId: string
  emailId: string
}

export interface CheckEmailVerificationPayload {
  code: string
}

export async function sendEmailVerificationEmail(
  payload: SendEmailVerificationPayload,
) {
  const res = await http.post<ApiResponse<null>>(
    '/api/auth/verification/email/send',
    payload,
  )
  return res.data
}

export async function checkEmailVerificationCode(
  payload: CheckEmailVerificationPayload,
) {
  const res = await http.post<ApiResponse<null>>(
    '/api/auth/verification/email/check',
    payload,
  )
  return res.data
}

/**
 * 아이디 찾기 (이메일 인증 완료 후 호출, 세션/인증 상태로 사용자 식별)
 * POST /api/auth/find/user-id
 */
export async function findUserId() {
  const res = await http.post<ApiResponse<{ usrId?: string }>>(
    '/api/auth/find/user-id',
  )
  return res.data
}

/**
 * 비밀번호 재설정 (이메일 인증 완료 후 호출)
 * POST /api/auth/find/password
 */
export interface ResetPasswordPayload {
  pwd: string
  pwdConfirm: string
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const res = await http.post<ApiResponse<null>>(
    '/api/auth/find/password',
    payload,
  )
  return res.data
}

/** 휴대폰 인증번호 전송 */
export interface SendSmsVerificationPayload {
  target: string
  purpose: 'SIGNUP' | 'RESET_PASSWORD'
}

export async function sendSmsVerificationCode(
  payload: SendSmsVerificationPayload,
) {
  const res = await http.post<ApiResponse<null>>(
    '/api/auth/verification/sms/send',
    payload,
  )
  return res.data
}

/** 휴대폰 인증번호 확인 */
export async function checkSmsVerificationCode(payload: { code: string }) {
  const res = await http.post<ApiResponse<null>>(
    '/api/auth/verification/sms/check',
    payload,
  )
  return res.data
}
