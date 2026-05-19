import http from './http'
import type { ApiResponse } from './types'
import { filterByG2bItemNmIncludes } from './g2bFilterNormalize'
import { mapOperStsToLabel } from './itemAssets'
import {
  buildItemAssetListQueryParams,
  buildItemAssetListSearchRequest,
  type ItemAssetListFilters,
  type ItemAssetListSearchRequest,
} from './itemAssetListSearch'
import { fetchSearchRequestSingleBatch } from './g2bNameClientSearch'
import { resolveOperStsSearchCode } from '../utils/operStsSearch'

export type AssetInventoryStatusFilters = ItemAssetListFilters & {
  g2bName: string
}

type Pageable = {
  page: number
  size: number
  sort?: string[]
}

type AssetInventoryStatusContent = {
  acqId?: string
  itmNo?: string
  itemUnqNo?: string
  g2bItemNo?: string
  g2bItemNm?: string
  acqAt?: string
  acqUpr?: number
  /** 정리일자 */
  arrgAt?: string
  deptNm?: string
  deptCd?: string
  operSts?: string
  drbYr?: string | number
  rmk?: string
  qty?: number | string
  [key: string]: unknown
}

type AssetInventoryStatusData = {
  content?: AssetInventoryStatusContent[]
  totalElements?: number
}

export type AssetInventoryStatusRow = {
  id: number
  acqId: string
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  acquireAmount: string
  sortDate: string
  operatingDept: string
  deptCd: string
  operatingStatus: string
  operStsCode: string
  usefulLife: string
  acqUpr: number
  drbYr: string
  rmk: string
  qty: number
}

/** 보유현황 API — 정리일자 필드: arrgAt (조회 startArrgAt / endArrgAt) */
function filtersToSearchRequest(filters: AssetInventoryStatusFilters): ItemAssetListSearchRequest {
  const req = buildItemAssetListSearchRequest(filters)
  delete req.startDrgAt
  delete req.endDrgAt
  delete req.startArrAt
  delete req.endArrAt
  const sortFrom = filters.sortDateFrom?.trim()
  const sortTo = filters.sortDateTo?.trim()
  if (sortFrom) req.startArrgAt = sortFrom
  if (sortTo) req.endArrgAt = sortTo
  return req
}

function normalizeDateOnly(value: string): string {
  const s = value.trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const digits = s.replace(/\D/g, '')
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  return s
}

function getInventorySortDate(item: AssetInventoryStatusContent): string {
  return normalizeDateOnly(String(item.arrgAt ?? ''))
}

function filterBySortDateRange(
  items: AssetInventoryStatusContent[],
  sortDateFrom?: string,
  sortDateTo?: string,
): AssetInventoryStatusContent[] {
  const from = sortDateFrom?.trim() ? normalizeDateOnly(sortDateFrom) : ''
  const to = sortDateTo?.trim() ? normalizeDateOnly(sortDateTo) : ''
  if (!from && !to) return items
  return items.filter((item) => {
    const d = getInventorySortDate(item)
    if (!d) return false
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  })
}

const INVENTORY_STATUS_API = '/api/item/asset-inventory-status'

function buildInventoryStatusQueryParams(
  searchRequest: ItemAssetListSearchRequest,
  pageable: Pageable,
): Record<string, string | number> {
  return buildItemAssetListQueryParams(searchRequest, pageable)
}

function filterByOperSts(
  items: AssetInventoryStatusContent[],
  operSts: string,
): AssetInventoryStatusContent[] {
  const code = operSts.trim().toUpperCase()
  return items.filter((item) => String(item.operSts ?? '').trim().toUpperCase() === code)
}

function formatOperatingDept(deptNm: string | null | undefined, deptCd: string | null | undefined): string {
  const name = deptNm != null ? String(deptNm).trim() : ''
  if (name) return name
  const cd = deptCd != null ? String(deptCd).trim() : ''
  if (cd && cd.toUpperCase() !== 'NONE') return cd
  return ''
}

function mapContentToRow(
  item: AssetInventoryStatusContent,
  index: number,
  offset: number,
): AssetInventoryStatusRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  const drbYrRaw = item.drbYr
  const usefulLife =
    drbYrRaw != null && String(drbYrRaw).trim() !== ''
      ? String(drbYrRaw).endsWith('년')
        ? String(drbYrRaw)
        : `${String(drbYrRaw)}년`
      : ''

  const qtyRaw = item.qty
  let qty = 0
  if (typeof qtyRaw === 'number' && Number.isFinite(qtyRaw)) {
    qty = qtyRaw
  } else if (qtyRaw != null && qtyRaw !== '') {
    const n = Number(qtyRaw)
    if (Number.isFinite(n)) qty = n
  }

  return {
    id: offset + index + 1,
    acqId: String(item.acqId ?? ''),
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itmNo ?? item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    sortDate: String(item.arrgAt ?? ''),
    operatingDept: formatOperatingDept(item.deptNm, item.deptCd),
    deptCd: String(item.deptCd ?? ''),
    operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')) || String(item.operSts ?? ''),
    operStsCode: String(item.operSts ?? '').trim().toUpperCase(),
    usefulLife,
    acqUpr: acqUprValue,
    drbYr: drbYrRaw != null ? String(drbYrRaw) : '',
    rmk: String(item.rmk ?? ''),
    qty,
  }
}

export async function fetchAssetInventoryStatus(params: {
  page: number
  pageSize: number
  filters: AssetInventoryStatusFilters
}): Promise<{ data: AssetInventoryStatusRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params
  const term = filters.g2bName?.trim()
  const sortFrom = filters.sortDateFrom?.trim()
  const sortTo = filters.sortDateTo?.trim()
  const hasSortDateFilter = Boolean(sortFrom || sortTo)
  const operStsFilter = resolveOperStsSearchCode(filters.operatingStatus)
  const searchRequest = filtersToSearchRequest(filters)

  const paginateClientSide = (items: AssetInventoryStatusContent[]) => {
    const totalCount = items.length
    const offset = (page - 1) * pageSize
    const pageItems = items.slice(offset, offset + pageSize)
    return {
      data: pageItems.map((item, index) => mapContentToRow(item, index, offset)),
      totalCount,
    }
  }

  const applyClientFilters = (raw: AssetInventoryStatusContent[]) => {
    let matched = raw
    if (term) {
      matched = filterByG2bItemNmIncludes(
        matched as Record<string, unknown>[],
        term,
      ) as AssetInventoryStatusContent[]
    }
    if (operStsFilter) {
      matched = filterByOperSts(matched, operStsFilter)
    }
    if (hasSortDateFilter) {
      matched = filterBySortDateRange(matched, sortFrom, sortTo)
    }
    return matched
  }

  /** G2B명·운용상태·정리일자 — 서버 필터 미적용/불안정 시 배치 조회 후 클라이언트 필터 */
  if (term || operStsFilter || hasSortDateFilter) {
    const batchReq: Record<string, unknown> = { ...searchRequest }
    if (operStsFilter) {
      delete batchReq.operSts
      delete batchReq.itemSts
    }
    const raw = await fetchSearchRequestSingleBatch<AssetInventoryStatusContent>(
      INVENTORY_STATUS_API,
      batchReq,
    )
    return paginateClientSide(applyClientFilters(raw))
  }

  const pageable: Pageable = { page: page - 1, size: pageSize }
  const res = await http.get<ApiResponse<AssetInventoryStatusData>>(INVENTORY_STATUS_API, {
    params: buildInventoryStatusQueryParams(searchRequest, pageable),
  })

  const payload = res.data.data
  if (!payload) return { data: [], totalCount: 0 }

  const content = Array.isArray(payload.content) ? payload.content : []
  const offset = (page - 1) * pageSize
  return {
    data: content.map((item, index) => mapContentToRow(item, index, offset)),
    totalCount: payload.totalElements ?? 0,
  }
}

type AssetInventoryStatusDetailQuery = {
  acqId: string
  deptCd: string
  operSts: string
  acqUpr: number
  drbYr: string
  rmk: string
}

type AssetInventoryStatusDetailItemContent = {
  g2bNo?: string
  g2bItemNo?: string
  itmNo?: string
  acqAt?: string
  /** 정리일자 */
  arrgAt?: string
  operSts?: string
  drbYr?: string | number
  acqUpr?: number | string
  deptCd?: string
  rmk?: string
  [key: string]: unknown
}

type AssetInventoryStatusDetailData = {
  itmNos?: AssetInventoryStatusDetailItemContent[]
  g2bNm?: string
  g2bItemNm?: string
  [key: string]: unknown
}

export type AssetInventoryStatusDetailItem = {
  id: number
  g2bNumber: string
  itemUniqueNumber: string
  acquireDate: string
  sortDate: string
  operatingStatus: string
  usefulLife: string
  acquireAmount: string
  deptCd: string
  remarks: string
}

function normalizeDetailQueryParams(
  query: AssetInventoryStatusDetailQuery,
): Record<string, string | number> {
  const operSts =
    resolveOperStsSearchCode(query.operSts) ?? String(query.operSts ?? '').trim().toUpperCase()
  const drbYr = String(query.drbYr ?? '')
    .replace(/년\s*$/, '')
    .trim()
  const params: Record<string, string | number> = {
    acqId: query.acqId.trim(),
    deptCd: query.deptCd.trim(),
    operSts,
    acqUpr: query.acqUpr,
    drbYr,
  }
  const rmk = String(query.rmk ?? '').trim()
  if (rmk) params.rmk = rmk
  return params
}

function extractDetailItemList(payload: AssetInventoryStatusDetailData | null | undefined): AssetInventoryStatusDetailItemContent[] {
  if (!payload || typeof payload !== 'object') return []
  if (Array.isArray(payload.itmNos)) return payload.itmNos
  return []
}

export async function fetchAssetInventoryStatusDetail(
  query: AssetInventoryStatusDetailQuery,
): Promise<AssetInventoryStatusDetailItem[]> {
  const res = await http.get<ApiResponse<AssetInventoryStatusDetailData>>(
    '/api/item/asset-inventory-status/detail',
    {
      params: normalizeDetailQueryParams(query),
    },
  )

  const payload = res.data.data
  const items = extractDetailItemList(payload)
  return items.map((item, index) => {
    const acqUprValue =
      typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
    const drbYrRaw = item.drbYr
    const usefulLife =
      drbYrRaw != null && String(drbYrRaw).trim() !== ''
        ? String(drbYrRaw).endsWith('년')
          ? String(drbYrRaw)
          : `${String(drbYrRaw)}년`
        : ''
    return {
      id: index + 1,
      g2bNumber: String(
        item.g2bNo ?? item.g2bItemNo ?? payload?.g2bNm ?? payload?.g2bItemNm ?? '',
      ),
      itemUniqueNumber: String(item.itmNo ?? ''),
      acquireDate: String(item.acqAt ?? ''),
      sortDate: String(item.arrgAt ?? ''),
      operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')),
      usefulLife,
      acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
      deptCd: String(item.deptCd ?? ''),
      remarks: String(item.rmk ?? ''),
    }
  })
}
