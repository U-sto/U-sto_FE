import http from './http'
import type { ApiResponse } from './types'
import { applyDeptLabelToSearchRequest } from '../constants/departments'
import { buildCombinedG2bListNoForFilter } from './g2bFilterNormalize'

export type AssetInventoryStatusFilters = {
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

type AssetInventoryStatusSearchRequest = {
  g2bDcd?: string
  g2bCd?: string
  g2bItemNo?: string
  g2bItemNm?: string
  itmNo?: string
  itemUnqNo?: string
  startAcqAt?: string
  endAcqAt?: string
  startArrgAt?: string
  endArrgAt?: string
  startDrgAt?: string
  endDrgAt?: string
  deptCd?: string
  deptNm?: string
  operSts?: string
  [key: string]: unknown
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
  arrAt?: string
  drgAt?: string
  deptNm?: string
  deptCd?: string
  operSts?: string
  drbYr?: string | number
  rmk?: string
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
}

const OPER_STS_MAP: Record<string, string> = {
  운용중: 'OPER',
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

const OPER_STS_LABEL_MAP: Record<string, string> = {
  OPER: '운용중',
  OPE: '운용중',
  RET: '반납',
  RTN: '반납',
  DIS: '불용',
  DSU: '불용',
  DSP: '처분',
}

function mapOperStsToLabel(code: string | undefined): string {
  const raw = String(code ?? '').trim()
  if (!raw) return ''
  return OPER_STS_LABEL_MAP[raw] ?? raw
}

function filtersToSearchRequest(filters: AssetInventoryStatusFilters): AssetInventoryStatusSearchRequest {
  const req: AssetInventoryStatusSearchRequest = {}
  const g2bDcd = buildCombinedG2bListNoForFilter(
    filters.g2bNumberPrefix,
    filters.g2bNumberSuffix,
  )
  if (g2bDcd) {
    req.g2bDcd = g2bDcd
    req.g2bCd = g2bDcd
    req.g2bItemNo = g2bDcd
  }
  if (filters.g2bName?.trim()) req.g2bItemNm = filters.g2bName.trim()
  if (filters.itemUniqueNumber?.trim()) {
    req.itmNo = filters.itemUniqueNumber.trim()
    req.itemUnqNo = filters.itemUniqueNumber.trim()
  }
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
  if (filters.operatingDept && filters.operatingDept !== '전체') {
    applyDeptLabelToSearchRequest(req, filters.operatingDept)
  }
  if (filters.operatingStatus && filters.operatingStatus !== '전체') {
    req.operSts = OPER_STS_MAP[filters.operatingStatus] ?? filters.operatingStatus
  }
  return req
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

  return {
    id: offset + index + 1,
    acqId: String(item.acqId ?? ''),
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itmNo ?? item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    sortDate: String(item.arrAt ?? item.drgAt ?? ''),
    operatingDept: String(item.deptNm ?? ''),
    deptCd: String(item.deptCd ?? ''),
    operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')),
    operStsCode: String(item.operSts ?? ''),
    usefulLife,
    acqUpr: acqUprValue,
    drbYr: drbYrRaw != null ? String(drbYrRaw) : '',
    rmk: String(item.rmk ?? ''),
  }
}

export async function fetchAssetInventoryStatus(params: {
  page: number
  pageSize: number
  filters: AssetInventoryStatusFilters
}): Promise<{ data: AssetInventoryStatusRow[]; totalCount: number }> {
  const { page, pageSize, filters } = params
  const searchRequest = filtersToSearchRequest(filters)
  const pageable: Pageable = { page: page - 1, size: pageSize }

  const res = await http.get<ApiResponse<AssetInventoryStatusData>>('/api/item/asset-inventory-status', {
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

export async function fetchAssetInventoryStatusDetail(
  query: AssetInventoryStatusDetailQuery,
): Promise<AssetInventoryStatusDetailItem[]> {
  const res = await http.get<ApiResponse<AssetInventoryStatusDetailData>>(
    '/api/item/asset-inventory-status/detail',
    {
      params: {
        acqId: query.acqId,
        deptCd: query.deptCd,
        operSts: query.operSts,
        acqUpr: query.acqUpr,
        drbYr: query.drbYr,
        rmk: query.rmk,
      },
    },
  )

  const payload = res.data.data
  const items = Array.isArray(payload?.itmNos) ? payload.itmNos : []
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
      g2bNumber: String(item.g2bNo ?? item.g2bItemNo ?? ''),
      itemUniqueNumber: String(item.itmNo ?? ''),
      acquireDate: String(item.acqAt ?? ''),
      sortDate: String(item.arrAt ?? ''),
      operatingStatus: mapOperStsToLabel(String(item.operSts ?? '')),
      usefulLife,
      acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
      deptCd: String(item.deptCd ?? ''),
      remarks: String(item.rmk ?? ''),
    }
  })
}
