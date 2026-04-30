/**
 * 물품 운용 대장 조회 API
 * 백엔드: GET /api/item/assets (물품운용대장조회)
 * - searchRequest, pageable 를 query 파라미터로 받으며(스웨거 기준 required),
 *   현재 프로젝트에서는 JSON.stringify 해서 전달한다.
 */
import axios from 'axios'
import http from './http'
import type { ApiResponse } from './types'
import { applyDeptLabelToSearchRequest } from '../constants/departments'
import { buildCombinedG2bListNoForFilter } from './g2bFilterNormalize'

export type ItemAssetSearchRequest = {
  /** G2B 목록번호(코드) */
  g2bDcd?: string
  /** (호환) G2B 목록번호 */
  g2bCd?: string
  /** (호환) G2B 품목번호 */
  g2bItemNo?: string
  /** (호환) G2B 목록명 */
  g2bItemNm?: string
  /** 취득일자 시작/종료 */
  startAcqAt?: string
  endAcqAt?: string
  /** 정리일자 시작/종료 */
  startArrgAt?: string
  endArrgAt?: string
  /** (호환) 정리일자 키 */
  startDrgAt?: string
  endDrgAt?: string
  /** 부서코드 */
  deptCd?: string
  /** (호환) 부서명 */
  deptNm?: string
  /** 운용상태 */
  operSts?: string
  /** 물품고유번호 */
  itmNo?: string
  /** (호환) 물품고유번호 */
  itemUnqNo?: string
  [key: string]: unknown
}

export type ItemAssetPageable = {
  page: number
  size: number
  sort?: string[]
}

export type ItemAssetContent = {
  g2bItemNo?: string
  g2bItemNm?: string
  itemUnqNo?: string
  itmNo?: string
  acqAt?: string
  acqUpr?: number
  drgAt?: string
  deptNm?: string
  deptCd?: string
  operSts?: string
  drbYr?: string
  [key: string]: unknown
}

export type ItemAssetsData = {
  content: ItemAssetContent[]
  totalElements?: number
}

export type AssetLedgerFilters = {
  g2bName: string
  g2bNumberPrefix: string
  g2bNumberSuffix: string
  itemUniqueNumber: string
  operatingDept: string
  operatingStatus: string
  acquireDateFrom: string
  acquireDateTo: string
  sortDateFrom: string
  sortDateTo: string
}

export type AssetLedgerRow = {
  id: number
  g2bNumber: string
  g2bName: string
  /** 물품고유번호(itmNo) */
  itmNo: string
  itemUniqueNumber: string
  acquireDate: string
  sortDate: string
  acquireAmount: string
  operatingDept: string
  /** 응답에 있으면 운용 전환 등록 등에 사용 */
  deptCd?: string
  operatingStatus: string
  usefulLife: string
}

export type FetchItemAssetsParams = {
  page: number
  pageSize: number
  filters: AssetLedgerFilters
}

export type FetchItemAssetsResponse = {
  data: AssetLedgerRow[]
  totalCount: number
}

// UI(한글) → API 코드 (스웨거 예시: OPER)
const OPER_STS_MAP: Record<string, string> = {
  운용중: 'OPER',
  // 백엔드에서 RTN/DSU로 내려오는 케이스가 있어 그 기준으로 조회도 맞춘다.
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

// API 코드 → UI(한글) (테이블 표시용)
const OPER_STS_LABEL_MAP: Record<string, string> = {
  OPER: '운용중',
  OPE: '운용중',
  RET: '반납',
  RTN: '반납',
  DIS: '불용',
  DSU: '불용',
  DSP: '처분',
}

/** 운용상태 API 코드 → 화면 라벨 (상세·이력 공통) */
export function mapOperStsToLabel(code: string | undefined | null): string {
  const raw = String(code ?? '').trim()
  if (!raw) return ''
  return OPER_STS_LABEL_MAP[raw] ?? raw
}

/** GET /api/item/assets/{itmNo} 응답 data (스웨거: 개별 물품 상세) */
export type ItemAssetStatusHistoryItem = {
  itemHisId?: string
  prevSts?: string
  newSts?: string
  chgRsn?: string
  chgAt?: string
  regAt?: string
  chgDt?: string
  chgUserId?: string
  regUserId?: string
  mngrNm?: string
  mngrId?: string
  regNm?: string
  regId?: string
  [key: string]: unknown
}

export type ItemAssetDetailData = {
  itmNo?: string
  /** G2B 목록명 (스웨거 필드명 예: g2bOnm) */
  g2bOnm?: string
  g2bItemNm?: string
  g2bItmNo?: string
  acqAt?: string
  acqUpr?: number
  drgAt?: string
  arrgAt?: string
  operSts?: string
  deptNm?: string
  deptCd?: string
  drbYr?: string | number
  qty?: number
  acqQty?: number
  arrgTy?: string
  rmk?: string
  statusHistories?: ItemAssetStatusHistoryItem[]
  [key: string]: unknown
}

/**
 * 개별 물품 상세 조회 (MANAGER)
 * GET /api/item/assets/{itmNo}
 */
export async function fetchItemAssetDetail(itmNo: string): Promise<ItemAssetDetailData> {
  const id = itmNo.trim()
  if (!id) {
    throw new Error('물품고유번호(itmNo)가 없습니다.')
  }
  const res = await http.get<ApiResponse<ItemAssetDetailData>>(
    `/api/item/assets/${encodeURIComponent(id)}`,
  )
  const data = res.data.data
  if (data == null || typeof data !== 'object') {
    throw new Error('상세 정보를 불러올 수 없습니다.')
  }
  return data as ItemAssetDetailData
}

/** PATCH /api/item/assets/{itmNo} — 취득단가·내용연수·비고 수정 (백엔드 검증 필드명: acqUpr) */
export type UpdateItemAssetBody = {
  /** 취득단가(취득금액) */
  acqUpr: number
  /** 내용연수 (스웨거 예: "5") */
  drbYr: string
  /** 비고 */
  rmk?: string
}

export async function updateItemAsset(
  itmNo: string,
  body: UpdateItemAssetBody,
): Promise<void> {
  const id = itmNo.trim()
  if (!id) {
    throw new Error('물품고유번호(itmNo)가 없습니다.')
  }
  const payload: Record<string, unknown> = {
    acqUpr: body.acqUpr,
    drbYr: body.drbYr,
  }
  if (body.rmk !== undefined) {
    payload.rmk = body.rmk
  }
  await http.patch<ApiResponse<Record<string, unknown>>>(
    `/api/item/assets/${encodeURIComponent(id)}`,
    payload,
  )
}

function filtersToSearchRequest(filters: AssetLedgerFilters): ItemAssetSearchRequest {
  const req: ItemAssetSearchRequest = {}

  const g2bDcd = buildCombinedG2bListNoForFilter(
    filters.g2bNumberPrefix,
    filters.g2bNumberSuffix,
  )
  if (g2bDcd) {
    req.g2bDcd = g2bDcd
    req.g2bCd = g2bDcd
    req.g2bItemNo = g2bDcd
  }
  // 목록명 기반 검색을 백엔드가 지원하는 경우를 대비해 같이 전달
  if (filters.g2bName?.trim()) req.g2bItemNm = filters.g2bName.trim()

  if (filters.itemUniqueNumber?.trim()) {
    req.itmNo = filters.itemUniqueNumber.trim()
    req.itemUnqNo = filters.itemUniqueNumber.trim()
  }

  // 날짜: 취득/정리
  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) {
    req.startArrgAt = filters.sortDateFrom
    req.startDrgAt = filters.sortDateFrom
  }
  if (filters.sortDateTo) {
    req.endArrgAt = filters.sortDateTo
    req.endDrgAt = filters.sortDateTo
  }

  // 운용상태 코드 매핑
  if (filters.operatingStatus && filters.operatingStatus !== '전체') {
    // API가 코드/한글 중 무엇을 받든 대응할 수 있게 기본은 코드로, 매핑 없으면 원문 전달
    req.operSts = OPER_STS_MAP[filters.operatingStatus] ?? filters.operatingStatus
  }

  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }

  return req
}

function mapItemAssetToRow(item: ItemAssetContent, index: number, offset: number): AssetLedgerRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  const usefulLife =
    typeof item.drbYr === 'string'
      ? item.drbYr.endsWith('년')
        ? item.drbYr
        : `${item.drbYr}년`
      : ''

  return {
    id: offset + index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itmNo: String(item.itmNo ?? item.itemUnqNo ?? ''),
    itemUniqueNumber: String(item.itmNo ?? item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    sortDate: String(item.drgAt ?? ''),
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    operatingDept: String(item.deptNm ?? ''),
    deptCd: item.deptCd != null && String(item.deptCd).trim() !== '' ? String(item.deptCd) : undefined,
    operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')) || String(item.operSts ?? ''),
    usefulLife,
  }
}

export async function fetchItemAssets(params: FetchItemAssetsParams): Promise<FetchItemAssetsResponse> {
  const { page, pageSize, filters } = params
  const searchRequest = filtersToSearchRequest(filters)
  const pageable: ItemAssetPageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<ItemAssetsData>>('/api/item/assets', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      // 일부 백엔드는 searchRequest/pageable JSON 문자열이 아니라 query를 평탄화해서 받는다.
      // 둘 다 지원하도록 동일 값을 개별 query로도 함께 전달한다(문제 시 백엔드가 무시).
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) => mapItemAssetToRow(item, index, offset)),
    totalCount: payload.totalElements ?? 0,
  }
}

/* ─── 출력물 관리 목록 GET /api/item/assets/print ─── */

/** 화면 필터 (출력물 관리) */
export type ItemAssetsPrintFilters = {
  g2bName: string
  g2bNumberPrefix: string
  g2bNumberSuffix: string
  itemUniqueNumber: string
  operatingDept: string
  /** 전체 | 미출력 | 출력 */
  printStatus: string
  acquireDateFrom: string
  acquireDateTo: string
  sortDateFrom: string
  sortDateTo: string
}

/** 스웨거: searchRequest — g2bNo, startAcqAt, endAcqAt, startArrAt, endArrAt, deptCd, operSts, itemNo, printYn */
export type ItemAssetPrintSearchRequest = {
  g2bNo?: string
  g2bItemNm?: string
  startAcqAt?: string
  endAcqAt?: string
  startArrAt?: string
  endArrAt?: string
  deptCd?: string
  deptNm?: string
  operSts?: string
  itemNo?: string
  printYn?: string
  [key: string]: unknown
}

export type ItemAssetPrintContent = {
  itmNo?: string
  g2bItemNo?: string
  g2bItemNm?: string
  acqAt?: string
  acqUpr?: number
  arrAt?: string
  drgAt?: string
  deptNm?: string
  operSts?: string
  drbYr?: string
  printYn?: string
  [key: string]: unknown
}

export type ItemAssetsPrintData = {
  content?: ItemAssetPrintContent[]
  totalElements?: number
}

export type PrintoutListRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  sortDate: string
  operatingDept: string
  printStatus: string
  outputTarget: string
}

function printFiltersToSearchRequest(filters: ItemAssetsPrintFilters): ItemAssetPrintSearchRequest {
  const req: ItemAssetPrintSearchRequest = {}
  const g2bNo = buildCombinedG2bListNoForFilter(
    filters.g2bNumberPrefix,
    filters.g2bNumberSuffix,
  )
  if (g2bNo) req.g2bNo = g2bNo
  if (filters.g2bName?.trim()) req.g2bItemNm = filters.g2bName.trim()
  if (filters.itemUniqueNumber?.trim()) req.itemNo = filters.itemUniqueNumber.trim()
  if (filters.acquireDateFrom) req.startAcqAt = filters.acquireDateFrom
  if (filters.acquireDateTo) req.endAcqAt = filters.acquireDateTo
  if (filters.sortDateFrom) req.startArrAt = filters.sortDateFrom
  if (filters.sortDateTo) req.endArrAt = filters.sortDateTo
  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }
  if (filters.printStatus === '미출력') req.printYn = 'N'
  if (filters.printStatus === '출력') req.printYn = 'Y'
  return req
}

function mapItemPrintToRow(
  item: ItemAssetPrintContent,
  index: number,
  offset: number,
): PrintoutListRow {
  const py = String(item.printYn ?? '').trim().toUpperCase()
  let printStatus = ''
  if (py === 'Y') printStatus = '출력'
  else if (py === 'N') printStatus = '미출력'
  else printStatus = py || '-'

  const dr = item.drbYr
  const outputTarget =
    dr != null && String(dr).trim() !== ''
      ? String(dr).endsWith('년')
        ? String(dr)
        : `${String(dr)}년`
      : '-'

  return {
    id: offset + index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itmNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    sortDate: String(item.arrAt ?? item.drgAt ?? ''),
    operatingDept: String(item.deptNm ?? ''),
    printStatus,
    outputTarget,
  }
}

/**
 * 출력물관리 목록 조회 (페이징)
 * GET /api/item/assets/print
 */
export async function fetchItemAssetsPrint(params: {
  page: number
  pageSize: number
  filters: ItemAssetsPrintFilters
}): Promise<{ data: PrintoutListRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params
  const searchRequest = printFiltersToSearchRequest(filters)
  const pageable: ItemAssetPageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<ItemAssetsPrintData>>('/api/item/assets/print', {
    params: {
      searchRequest: JSON.stringify(searchRequest),
      pageable: JSON.stringify(pageable),
      ...searchRequest,
      ...pageable,
    },
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) =>
      mapItemPrintToRow(item as ItemAssetPrintContent, index, offset),
    ),
    totalCount: payload.totalElements ?? 0,
  }
}

/**
 * 물품 QR 라벨 PDF 출력 (선택 물품만)
 * POST /api/item/assets/print — body: { itmNos: string[] } — 응답: application/pdf
 * (목록 조회는 GET /api/item/assets/print)
 */
export async function downloadItemAssetsPrintPdf(itmNos: string[]): Promise<void> {
  const ids = [...new Set(itmNos.map((s) => String(s).trim()).filter(Boolean))]
  if (ids.length === 0) {
    throw new Error('출력할 물품을 선택해 주세요.')
  }

  try {
    const res = await http.post<Blob>(
      '/api/item/assets/print',
      { itmNos: ids },
      {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf, application/json;q=0.1',
        },
      },
    )

    const blob = res.data
    const ct = (res.headers['content-type'] ?? '').toLowerCase()

    if (ct.includes('application/json') || (blob.type && blob.type.includes('json'))) {
      const text = await blob.text()
      const j = JSON.parse(text) as { message?: string; success?: boolean }
      if (typeof j.success === 'boolean' && !j.success) {
        throw new Error(j.message ?? '출력에 실패했습니다.')
      }
      throw new Error(j.message ?? '출력에 실패했습니다.')
    }

    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = `물품-QR라벨-${new Date().toISOString().slice(0, 10)}.pdf`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      const text = await e.response.data.text()
      try {
        const j = JSON.parse(text) as { message?: string }
        throw new Error(j.message ?? `HTTP ${e.response.status}`)
      } catch (inner: unknown) {
        if (inner instanceof SyntaxError) {
          throw new Error(text.slice(0, 300) || `HTTP ${e.response.status}`)
        }
        throw inner
      }
    }
    throw e
  }
}

