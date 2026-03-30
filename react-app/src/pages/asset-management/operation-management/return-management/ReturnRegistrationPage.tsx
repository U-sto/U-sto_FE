import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Dropdown from '../../../../components/common/Dropdown/Dropdown'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import '../operation-ledger/OperationLedgerPage.css'
import './ReturnManagementPage.css'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import { OPERATING_DEPARTMENT_FILTER_OPTIONS } from '../../../../constants/departments'
import {
  useOperatingStatusFilterOptions,
  useItemStatusSelectOptions,
  resolveOperatingStatusFilterValue,
} from '../../../../hooks/useCommonCodeOptions'
import {
  fetchItemAssets,
  mapOperStsToLabel,
  type AssetLedgerFilters,
  type AssetLedgerRow,
} from '../../../../api/itemAssets'
import {
  createItemReturning,
  updateItemReturning,
  fetchItemReturningByRtrnMid,
  fetchItemReturningAllItems,
  formatReturningDateOnly,
  type ItemReturningItem,
} from '../../../../api/itemReturnings'
import { useCommonCodeGroup } from '../../../../hooks/useCommonCodeGroup'
import {
  CODE_GROUP,
  buildDescriptionToCodeMap,
  buildSelectOptionsWithPlaceholder,
} from '../../../../api/codes'

const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_FILTER_OPTIONS
const REASON_OPTIONS = ['선택', '교체', '폐기', '기타']

/** 공통코드 미로딩 시 반납 사유 라벨 → API 코드 */
const FALLBACK_RETURN_REASON_DESC_TO_CODE: Record<string, string> = {
  교체: 'REPLACE',
  폐기: 'DISPOSE',
  기타: 'ETC',
}

/** 공통코드 미로딩 시 물품상태(등록 폼) → API 코드 (스웨거 itemSts 예시 참고) */
const FALLBACK_ITEM_STS_FORM_TO_CODE: Record<string, string> = {
  운용중: 'USED',
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

const INITIAL_FILTERS: AssetLedgerFilters = {
  g2bName: '',
  g2bNumberPrefix: '',
  g2bNumberSuffix: '',
  itemUniqueNumber: '',
  operatingDept: '전체',
  operatingStatus: '전체',
  acquireDateFrom: '',
  acquireDateTo: '',
  sortDateFrom: '',
  sortDateTo: '',
}

/** 공통코드 code → 드롭다운 라벨 */
function codeToDropdownLabel(
  code: string,
  codeToDesc: Record<string, string>,
  descToCode: Record<string, string>,
): string {
  const c = code.trim()
  if (!c) return '선택'
  const fromMap = codeToDesc[c]
  if (fromMap) return fromMap
  for (const [label, v] of Object.entries(descToCode)) {
    if (v === c) return label
  }
  return '선택'
}

function mapReturningItemToLedgerRow(item: ItemReturningItem, index: number): AssetLedgerRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  return {
    id: index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bNm ?? ''),
    itmNo: String(item.itmNo ?? ''),
    itemUniqueNumber: String(item.itmNo ?? ''),
    acquireDate: formatReturningDateOnly(item.acqAt),
    sortDate: '',
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString('ko-KR')}원` : '',
    operatingDept: String(item.deptNm ?? ''),
    operatingStatus: mapOperStsToLabel(String(item.itemSts ?? '')) || String(item.itemSts ?? ''),
    usefulLife: '',
  }
}

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L16.65 16.65"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ReturnRegistrationPage = () => {
  const navigate = useNavigate()
  const { rtrnMid: rtrnMidParam } = useParams<{ rtrnMid?: string }>()
  const rtrnMid = rtrnMidParam?.trim() ?? ''
  const isEditMode = rtrnMid.length > 0

  const { options: operatingStatusOptions, descToCode: operStatusDescToCode } =
    useOperatingStatusFilterOptions()
  const {
    options: assetStatusOptions,
    descToCode: itemStatusDescToCode,
    codeToDesc: itemStsCodeToLabel,
  } = useItemStatusSelectOptions()
  const { group: returnReasonGroup } = useCommonCodeGroup(CODE_GROUP.RETURNING_REASON)
  const returnReasonDescToCode = useMemo(() => {
    const fromApi = buildDescriptionToCodeMap(returnReasonGroup ?? undefined)
    if (Object.keys(fromApi).length > 0) return fromApi
    return FALLBACK_RETURN_REASON_DESC_TO_CODE
  }, [returnReasonGroup])
  const reasonOptions = useMemo(() => {
    if (Object.keys(returnReasonDescToCode).length > 0) {
      return buildSelectOptionsWithPlaceholder(returnReasonDescToCode)
    }
    return REASON_OPTIONS
  }, [returnReasonDescToCode])

  const returnReasonCodeToLabel = useMemo(() => {
    const m: Record<string, string> = {}
    for (const [d, c] of Object.entries(returnReasonDescToCode)) {
      m[c] = d
    }
    return m
  }, [returnReasonDescToCode])
  const [filters, setFilters] = useState<AssetLedgerFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<AssetLedgerFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<AssetLedgerRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)

  /** 대장 목록 체크 — 물품고유번호(itmNo) 기준 (페이지 바뀌어도 유지) */
  const [ledgerCheckedItmNos, setLedgerCheckedItmNos] = useState<Set<string>>(() => new Set())
  const [selectedRows, setSelectedRows] = useState<AssetLedgerRow[]>([])
  const [selectedTableCheckedItmNos, setSelectedTableCheckedItmNos] = useState<Set<string>>(
    () => new Set(),
  )

  const [returnInfo, setReturnInfo] = useState({
    returnDate: '',
    registrantId: '',
    assetStatus: '선택',
    reason: '선택',
  })
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setSelectedRows([])
      setLedgerCheckedItmNos(new Set())
      setSelectedTableCheckedItmNos(new Set())
      setReturnInfo({
        returnDate: '',
        registrantId: '',
        assetStatus: '선택',
        reason: '선택',
      })
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !rtrnMid) return
    let cancelled = false
    setLoadingDetail(true)
    ;(async () => {
      try {
        const master = await fetchItemReturningByRtrnMid(rtrnMid)
        const items = await fetchItemReturningAllItems(rtrnMid)
        if (cancelled) return
        if (!master && items.length === 0) {
          window.alert('반납 정보를 불러오지 못했습니다.')
          navigate('/asset-management/operation-management/return-management')
          return
        }
        const rows = items.map((it, i) => mapReturningItemToLedgerRow(it, i))
        setSelectedRows(rows)
        setLedgerCheckedItmNos(new Set(rows.map((r) => r.itmNo).filter(Boolean)))

        const itemStsCode = master?.itemSts ?? items[0]?.itemSts ?? ''
        const rtrnRsnCode = master?.rtrnRsn ?? items[0]?.rtrnRsn ?? ''
        setReturnInfo({
          returnDate: formatReturningDateOnly(master?.aplyAt ?? ''),
          registrantId: master?.aplyUsrId ?? '',
          assetStatus: codeToDropdownLabel(
            itemStsCode,
            itemStsCodeToLabel,
            itemStatusDescToCode,
          ),
          reason: codeToDropdownLabel(
            rtrnRsnCode,
            returnReasonCodeToLabel,
            returnReasonDescToCode,
          ),
        })
      } catch (e) {
        if (!cancelled) {
          window.alert(e instanceof Error ? e.message : '반납 정보를 불러오지 못했습니다.')
          navigate('/asset-management/operation-management/return-management')
        }
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    isEditMode,
    rtrnMid,
    navigate,
    itemStsCodeToLabel,
    itemStatusDescToCode,
    returnReasonCodeToLabel,
    returnReasonDescToCode,
  ])

  const loadLedgerData = useCallback(async () => {
    try {
      const res = await fetchItemAssets({
        page: currentPage,
        pageSize: 10,
        filters: {
          ...searchedFilters,
          operatingStatus: resolveOperatingStatusFilterValue(
            searchedFilters.operatingStatus,
            operStatusDescToCode,
          ),
        },
      })
      setTableData(res.data)
      setTotalCount(res.totalCount)
    } catch {
      setTableData([])
      setTotalCount(0)
    }
  }, [currentPage, searchedFilters, operStatusDescToCode])

  useEffect(() => {
    void loadLedgerData()
  }, [loadLedgerData])

  /** 조회 조건이 바뀌면 대장 쪽 체크만 초기화 (선택 물품 목록은 유지) */
  useEffect(() => {
    setLedgerCheckedItmNos(new Set())
  }, [searchedFilters])

  const ledgerColumns: DataTableColumn<AssetLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={ledgerCheckedItmNos.has(row.itmNo)}
          onChange={(e) => {
            const key = row.itmNo
            if (!key) return
            if (e.target.checked) {
              setLedgerCheckedItmNos((prev) => new Set(prev).add(key))
              setSelectedRows((prev) => (prev.some((r) => r.itmNo === key) ? prev : [...prev, row]))
            } else {
              setLedgerCheckedItmNos((prev) => {
                const next = new Set(prev)
                next.delete(key)
                return next
              })
              setSelectedRows((prev) => prev.filter((r) => r.itmNo !== key))
            }
          }}
        />
      ),
    },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'operatingStatus', header: '운용상태', render: (row) => row.operatingStatus },
    { key: 'usefulLife', header: '내용연수', render: (row) => row.usefulLife },
  ]

  const selectedColumns: DataTableColumn<AssetLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedTableCheckedItmNos.has(row.itmNo)}
          onChange={(e) => {
            const key = row.itmNo
            if (!key) return
            if (e.target.checked) {
              setSelectedTableCheckedItmNos((prev) => new Set(prev).add(key))
            } else {
              setSelectedTableCheckedItmNos((prev) => {
                const next = new Set(prev)
                next.delete(key)
                return next
              })
            }
          }}
        />
      ),
    },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'operatingStatus', header: '운용상태', render: (row) => row.operatingStatus },
    { key: 'usefulLife', header: '내용연수', render: (row) => row.usefulLife },
  ]

  const handleG2BSelect = (item: G2BItem) => {
    const { prefix, suffix } = getG2BListNumberParts(item)
    setFilters((prev) => ({
      ...prev,
      g2bName: item.name,
      g2bNumberPrefix: prefix,
      g2bNumberSuffix: suffix,
    }))
    setIsG2BModalOpen(false)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setCurrentPage(1)
  }

  const handleReset = () => {
    const next = { ...INITIAL_FILTERS }
    setFilters(next)
    setSearchedFilters(next)
    setCurrentPage(1)
  }

  const handleDeleteSelected = useCallback(() => {
    setSelectedRows((prev) => prev.filter((r) => !selectedTableCheckedItmNos.has(r.itmNo)))
    setSelectedTableCheckedItmNos(new Set())
    setLedgerCheckedItmNos((prev) => {
      const next = new Set(prev)
      selectedTableCheckedItmNos.forEach((itmNo) => next.delete(itmNo))
      return next
    })
  }, [selectedTableCheckedItmNos])

  const handleDeleteAll = useCallback(() => {
    setSelectedRows([])
    setSelectedTableCheckedItmNos(new Set())
    setLedgerCheckedItmNos(new Set())
  }, [])

  const handleSave = async () => {
    const aplyAt = returnInfo.returnDate.trim()
    if (!aplyAt) {
      window.alert('반납일자를 입력해 주세요.')
      return
    }
    const itmNos = selectedRows.map((r) => r.itmNo.trim()).filter(Boolean)
    if (itmNos.length === 0) {
      window.alert('반납할 물품을 선택 물품 목록에 담아 주세요.')
      return
    }
    if (!returnInfo.assetStatus || returnInfo.assetStatus === '선택') {
      window.alert('물품상태를 선택해 주세요.')
      return
    }
    if (!returnInfo.reason || returnInfo.reason === '선택') {
      window.alert('사유를 선택해 주세요.')
      return
    }

    const itemSts =
      itemStatusDescToCode[returnInfo.assetStatus] ??
      FALLBACK_ITEM_STS_FORM_TO_CODE[returnInfo.assetStatus] ??
      returnInfo.assetStatus
    const rtrnRsn =
      returnReasonDescToCode[returnInfo.reason] ?? returnInfo.reason

    setSaving(true)
    try {
      if (isEditMode) {
        await updateItemReturning(rtrnMid, {
          aplyAt,
          itemSts,
          rtrnRsn,
          itmNos,
        })
        window.alert('반납 수정이 완료되었습니다.')
      } else {
        await createItemReturning({
          aplyAt,
          itemSts,
          rtrnRsn,
          itmNos,
        })
        window.alert('반납 등록이 완료되었습니다.')
      }
      navigate('/asset-management/operation-management/return-management')
    } catch (e) {
      window.alert(
        e instanceof Error
          ? e.message
          : isEditMode
            ? '반납 수정에 실패했습니다.'
            : '반납 등록에 실패했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="return"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel={isEditMode ? '반납 수정' : '물품 반납 관리'}
    >
      {isEditMode && loadingDetail ? (
        <div className="return-registration-detail-loading" role="status">
          반납 정보를 불러오는 중…
        </div>
      ) : null}
      <section className="operation-ledger-filter" hidden={isEditMode && loadingDetail}>
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록명</div>
              <div className="operation-ledger-input-and-search">
                <TextField
                  value={filters.g2bName}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bName: e.target.value }))
                  }
                  placeholder="G2B목록명 입력"
                  className="operation-ledger-g2b-input"
                  readOnly={isEditMode}
                />
                <button
                  type="button"
                  className="operation-ledger-search-btn"
                  aria-label="G2B목록명 검색"
                  onClick={() => setIsG2BModalOpen(true)}
                  disabled={isEditMode}
                >
                  <SearchIcon />
                </button>
              </div>
            </div>
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">운용부서</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingDept}
                onChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, operatingDept: value }))
                }
                options={OPERATING_DEPT_OPTIONS}
              />
            </div>
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">운용상태</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingStatus}
                onChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, operatingStatus: value }))
                }
                options={operatingStatusOptions}
              />
            </div>

            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록번호</div>
              <div className="operation-ledger-g2b-number-split">
                <TextField
                  value={filters.g2bNumberPrefix}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bNumberPrefix: e.target.value }))
                  }
                />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField
                  value={filters.g2bNumberSuffix}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bNumberSuffix: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">물품고유번호</div>
              <TextField
                value={filters.itemUniqueNumber}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, itemUniqueNumber: e.target.value }))
                }
                placeholder="물품고유번호 입력"
              />
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">취득일자</div>
              <div className="operation-ledger-date-range">
                <TextField
                  type="date"
                  value={filters.acquireDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, acquireDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.acquireDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, acquireDateTo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">정리일자</div>
              <div className="operation-ledger-date-range">
                <TextField
                  type="date"
                  value={filters.sortDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.sortDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortDateTo: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="operation-ledger-filter-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-outline"
              onClick={handleReset}
            >
              초기화
            </Button>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary"
              onClick={handleSearch}
            >
              조회
            </Button>
          </div>
        </div>
      </section>

      <div className="return-registration-ledger-table-wrap" hidden={isEditMode && loadingDetail}>
        <DataTable<AssetLedgerRow>
          pageKey="operation-ledger"
          title="물품 운용 대장 목록"
          data={tableData}
          totalCount={totalCount}
          pageSize={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          columns={ledgerColumns}
          getRowKey={(row) => row.itmNo || String(row.id)}
        />
      </div>

      <div hidden={isEditMode && loadingDetail}>
      <DataTable<AssetLedgerRow>
        pageKey="operation-ledger"
        title="선택 물품 목록"
        data={selectedRows}
        totalCount={selectedRows.length}
        pageSize={10}
        columns={selectedColumns}
        getRowKey={(row) => row.itmNo || String(row.id)}
        renderActions={() => (
          <div className="operation-ledger-table-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-outline operation-ledger-btn-table"
              onClick={handleDeleteSelected}
            >
              선택삭제
            </Button>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleDeleteAll}
            >
              전체삭제
            </Button>
          </div>
        )}
      />
      </div>

      <div className="operation-ledger-detail-content" hidden={isEditMode && loadingDetail}>
        <div className="operation-ledger-detail-header-row">
          <TitlePill>{isEditMode ? '반납 수정 정보' : '반납 등록 정보'}</TitlePill>
        </div>
        <section className="operation-ledger-detail-panel return-registration-info-panel">
          <div className="return-registration-info-inner">
            <div className="operation-ledger-detail-grid">
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">반납일자</label>
                <TextField
                  type="date"
                  value={returnInfo.returnDate}
                  onChange={(e) =>
                    setReturnInfo((prev) => ({ ...prev, returnDate: e.target.value }))
                  }
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">등록자ID</label>
                <TextField
                  value={returnInfo.registrantId}
                  onChange={(e) =>
                    setReturnInfo((prev) => ({ ...prev, registrantId: e.target.value }))
                  }
                  placeholder="등록자ID"
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">물품상태</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={returnInfo.assetStatus}
                  onChange={(value: string) =>
                    setReturnInfo((prev) => ({ ...prev, assetStatus: value }))
                  }
                  options={assetStatusOptions}
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">사유</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={returnInfo.reason}
                  onChange={(value: string) =>
                    setReturnInfo((prev) => ({ ...prev, reason: value }))
                  }
                  options={reasonOptions}
                />
              </div>
            </div>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={() => void handleSave()}
              disabled={saving || (isEditMode && loadingDetail)}
            >
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </section>
      </div>

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />
    </AssetManagementPageLayout>
  )
}

export default ReturnRegistrationPage
