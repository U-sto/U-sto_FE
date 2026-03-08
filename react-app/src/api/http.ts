import axios, { type AxiosError } from 'axios'
import { ACCESS_TOKEN_KEY } from './types'

/** 공통 Request Header + 공통 Response 처리용 axios 인스턴스 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://13.124.10.41:8080',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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
    const message =
      error.response?.data?.message ??
      error.message ??
      '네트워크 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  },
)

export default http
