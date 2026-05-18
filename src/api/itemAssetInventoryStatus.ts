import http from './http'
import type { ApiResponse } from './types'
import { filterByG2bItemNmIncludes } from './g2bFilterNormalize'
import { mapOperStsToLabel } from './itemAssets'
import { G2B_NAME_CLIENT_FETCH_SIZE } from './g2bNameClientSearch'
import {
  buildItemAssetListSearchRequest,
  type ItemAssetListFilters,
} from './itemAssetListSearch'
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
  /** 정리일자(목록 응답 우선) */
  arrgAt?: string
  arrAt?: string
  drgAt?: string
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

function filtersToSearchRequest(filters: AssetInventoryStatusFilters) {
  return buildItemAssetListSearchRequest(filters)
}

/** 보유현황 API — searchRequest/pageable JSON만 전달 (평탄 operSts·page 중복 제거) */
function buildInventoryStatusQueryParams(
  searchRequest: Record<string, unknown>,
  pageable: Pageable,
): Record<string, string> {
  return {
    searchRequest: JSON.stringify(searchRequest),
    pageable: JSON.stringify(pageable),
  }
}

async function fetchInventoryStatusContentBatch(
  searchRequest: Record<string, unknown>,
): Promise<AssetInventoryStatusContent[]> {
  const pageable = { page: 0, size: G2B_NAME_CLIENT_FETCH_SIZE }
  const res = await http.get<ApiResponse<AssetInventoryStatusData>>(
    '/api/item/asset-inventory-status',
    { params: buildInventoryStatusQueryParams(searchRequest, pageable) },
  )
  const payload = res.data.data
  return Array.isArray(payload?.content) ? payload.content : []
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
    sortDate: String(item.arrgAt ?? item.arrAt ?? item.drgAt ?? ''),
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
  const operStsFilter = resolveOperStsSearchCode(filters.operatingStatus)
  const searchRequest = filtersToSearchRequest(filters) as Record<string, unknown>

  const paginateClientSide = (items: AssetInventoryStatusContent[]) => {
    const totalCount = items.length
    const offset = (page - 1) * pageSize
    const pageItems = items.slice(offset, offset + pageSize)
    return {
      data: pageItems.map((item, index) => mapContentToRow(item, index, offset)),
      totalCount,
    }
  }

  if (term) {
    const raw = await fetchInventoryStatusContentBatch({
      ...searchRequest,
      operSts: undefined,
      itemSts: undefined,
    })
    let matched = filterByG2bItemNmIncludes(
      raw as Record<string, unknown>[],
      term,
    ) as AssetInventoryStatusContent[]
    if (operStsFilter) {
      matched = filterByOperSts(matched, operStsFilter)
    }
    return paginateClientSide(matched)
  }

  if (operStsFilter) {
    const batchReq = { ...searchRequest }
    delete batchReq.operSts
    delete batchReq.itemSts
    const raw = await fetchInventoryStatusContentBatch(batchReq)
    const matched = filterByOperSts(raw, operStsFilter)
    return paginateClientSide(matched)
  }

  const pageable: Pageable = { page: page - 1, size: pageSize }
  const res = await http.get<ApiResponse<AssetInventoryStatusData>>('/api/item/asset-inventory-status', {
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
  arrgAt?: string
  arrAt?: string
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
      sortDate: String(item.arrgAt ?? item.arrAt ?? ''),
      operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')),
      usefulLife,
      acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
      deptCd: String(item.deptCd ?? ''),
      remarks: String(item.rmk ?? ''),
    }
  })
}
