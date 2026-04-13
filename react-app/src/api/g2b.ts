/**
 * G2B 물품 분류 / 물품 품목 조회 API
 * - GET /api/g2b/categories: 물품분류코드·분류명으로 물품 분류 조회
 * - GET /api/g2b/items: 물품분류코드·물품식별코드·품목명으로 물품 품목 조회
 */

import http from './http'

/** 페이지 공통 요청 (query) */
export type PageableParams = {
  page: number
  size: number
  sort?: string[]
}

/** Spring Page 스타일 응답 */
export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** API 응답이 data 래핑인 경우 */
type ApiPageResponse<T> = {
  data?: PageResponse<T>
}

/** G2B 물품 분류 한 건 (API 응답) */
export type G2BCategoryDto = {
  id?: string
  sequence?: number
  code?: string
  name?: string
  mCd?: string
  mNm?: string
  [key: string]: unknown
}

/** G2B 물품 품목 한 건 (API 응답) */
export type G2BItemDto = {
  id?: string
  sequence?: number
  categoryCode?: string
  classificationCode?: string
  itemCode?: string
  identificationCode?: string
  dCd?: string
  itemName?: string
  name?: string
  dNm?: string
  upr?: number
  sortDate?: string
  operatingStatus?: string
  usefulLife?: string
  acquireAmount?: string
  [key: string]: unknown
}

/** GET /api/g2b/categories - 물품분류코드·분류명으로 G2B 물품 분류 조회 */
export type FetchG2BCategoriesParams = {
  code?: string
  name?: string
  page: number
  size: number
  sort?: string[]
}

export async function fetchG2BCategories(
  params: FetchG2BCategoriesParams,
): Promise<PageResponse<G2BCategoryDto>> {
  const { page, size, sort, ...rest } = params
  const search = new URLSearchParams()
  if (rest.code != null && rest.code !== '') search.set('code', rest.code)
  if (rest.name != null && rest.name !== '') search.set('name', rest.name)
  search.set('page', String(page))
  search.set('size', String(size))
  if (sort && sort.length > 0) sort.forEach((s) => search.append('sort', s))

  const res = await http.get<ApiPageResponse<G2BCategoryDto> | PageResponse<G2BCategoryDto>>(
    `/api/g2b/categories?${search.toString()}`,
  )
  const body = res.data as ApiPageResponse<G2BCategoryDto> | PageResponse<G2BCategoryDto>
  if (body && 'data' in body && body.data) return body.data
  return body as PageResponse<G2BCategoryDto>
}

/** GET /api/g2b/items - 물품분류코드·물품식별코드·품목명으로 G2B 물품 품목 조회 */
export type FetchG2BItemsParams = {
  categoryCode?: string
  itemCode?: string
  itemName?: string
  page: number
  size: number
  sort?: string[]
}

export async function fetchG2BItems(params: FetchG2BItemsParams): Promise<PageResponse<G2BItemDto>> {
  const { page, size, sort, ...rest } = params
  const search = new URLSearchParams()
  if (rest.categoryCode != null && rest.categoryCode !== '') search.set('categoryCode', rest.categoryCode)
  if (rest.itemCode != null && rest.itemCode !== '') search.set('itemCode', rest.itemCode)
  if (rest.itemName != null && rest.itemName !== '') search.set('itemName', rest.itemName)
  search.set('page', String(page))
  search.set('size', String(size))
  if (sort && sort.length > 0) sort.forEach((s) => search.append('sort', s))

  const res = await http.get<ApiPageResponse<G2BItemDto> | PageResponse<G2BItemDto>>(
    `/api/g2b/items?${search.toString()}`,
  )
  const body = res.data as ApiPageResponse<G2BItemDto> | PageResponse<G2BItemDto>
  if (body && 'data' in body && body.data) return body.data
  return body as PageResponse<G2BItemDto>
}
