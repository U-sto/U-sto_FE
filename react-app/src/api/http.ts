import axios, { type AxiosError } from 'axios'
import { ACCESS_TOKEN_KEY } from './types'

/**
 * 개발 시 baseURL '' → 같은 origin(localhost:5173)으로 요청 → Vite 프록시가 백엔드로 전달.
 * 이렇게 해야 이메일 중복확인 후 세션 쿠키가 인증번호 발송 요청에 붙어서 "중복확인 필요" 에러가 사라짐.
 * 운영 빌드에서는 VITE_API_BASE_URL 또는 기본값 사용.
 */
const http = axios.create({
  baseURL: import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL ?? 'http://13.124.10.41:8080'),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

/** 요청 직전: 로그인 후 필요한 API용 Authorization 헤더 추가 */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 응답: 공통 Body(success/message/data) 처리, 실패 시 에러 throw */
http.interceptors.response.use(
  (response) => {
    const body = response.data as { success?: boolean; message?: string; data?: unknown }
    if (body && typeof body.success === 'boolean' && !body.success) {
      const message = body.message ?? '요청에 실패했습니다.'
      return Promise.reject(new Error(message))
    }
    return response
  },
  (error: AxiosError<{ success?: boolean; message?: string; data?: unknown }>) => {
    const status = error.response?.status

    // 인증 만료 또는 로그인 필요 (401) 시 토큰 삭제 후 로그인 페이지로 이동
    if (status === 401) {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      } catch {
        // ignore
      }

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const shouldRedirect = window.confirm(
          '로그인 정보가 만료되었습니다.\n다시 로그인 페이지로 이동하시겠습니까?',
        )
        if (shouldRedirect) {
          window.location.href = '/login'
        }
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      '네트워크 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  },
)

export default http
