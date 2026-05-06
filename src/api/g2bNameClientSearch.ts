import http from './http'
import type { ApiResponse } from './types'

/** G2B 목록명 클라이언트 필터 시 한 번에 받는 최대 행 수 (추가 페이지 순회 없음 → 속도 우선) */
export const G2B_NAME_CLIENT_FETCH_SIZE = 2500

/**
 * 목록명 부분 일치용: 이름 조건은 빼고 나머지 필터로 API를 **한 번만** 호출한다.
 * (서버가 목록명 완전 일치만 할 때 대비 — 연속 페이지 스캔은 너무 느려 제거함)
 */
export async function fetchSearchRequestSingleBatch<T>(
  apiPath: string,
  searchRequest: Record<string, unknown>,
  options?: { size?: number },
): Promise<T[]> {
  const size = options?.size ?? G2B_NAME_CLIENT_FETCH_SIZE
  const pageable = { page: 0, size }
  const res = await http.get<ApiResponse<{ content?: T[] }>>(apiPath, {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })
  const payload = res.data.data
  return Array.isArray(payload?.content) ? payload!.content! : []
}
