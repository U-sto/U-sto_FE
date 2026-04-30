/**
 * 백엔드 공통 응답 Body 구조
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T | null
}

/** localStorage 등에 저장하는 accessToken 키 (공통) */
export const ACCESS_TOKEN_KEY = 'accessToken'
