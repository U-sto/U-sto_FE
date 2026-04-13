import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import { OPERATING_DEPARTMENT_FILTER_OPTIONS } from '../../../constants/departments'
import {
  useOperatingStatusFilterOptions,
  useItemStatusSelectOptions,
  resolveOperatingStatusFilterValue,
} from '../../../hooks/useCommonCodeOptions'
import {
  fetchItemAssets,
  type AssetLedgerFilters,
  type AssetLedgerRow,
} from '../../../api/itemAssets'
import {
  createItemDisuse,
  updateItemDisuse,
  fetchItemDisuseByDsuMId,
  fetchItemDisuseAllItems,
} from '../../../api/itemDisuses'
import { useCommonCodeGroup } from '../../../hooks/useCommonCodeGroup'
import {
  CODE_GROUP,
  buildDescriptionToCodeMap,
  buildSelectOptionsWithPlaceholder,
} from '../../../api/codes'

const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_FILTER_OPTIONS
const REASON_OPTIONS_FALLBACK = ['선택', '교체', '폐기', '기타']

/** 공통코드 미로딩 시 불용 사유 라벨 → API 코드 */
const FALLBACK_DISUSE_REASON_DESC_TO_CODE: Record<string, string> = {
  교체: 'REPLACE',
  폐기: 'DISPOSE',
  기타: 'ETC',
}

/** 공통코드 미로딩 시 물품상태(등록 폼) → API 코드 */
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

/** 물품고유번호 기준 키 (체크·선택 목록 동기화) */
function assetRowKey(row: AssetLedgerRow): string {
  const k = (row.itemUniqueNumber || row.itmNo || '').trim()
  return k || `row-${row.id}`
}

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

function mapDisuseItemToLedgerRow(item: Awaited<ReturnType<typeof fetchItemDisuseAllItems>>[number], index: number): AssetLedgerRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  return {
    id: index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itmNo: String(item.itmNo ?? item.itemUnqNo ?? ''),
    itemUniqueNumber: String(item.itmNo ?? item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    sortDate: '',
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    operatingDept: String(item.deptNm ?? item.oprDeptNm ?? ''),
    operatingStatus: String(item.itmSts ?? item.operSts ?? ''),
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

const DisuseRegistrationPage = () => {
  const navigate = useNavigate()
  const { dsuMId: dsuMIdParam } = useParams<{ dsuMId?: string }>()
  const dsuMId = dsuMIdParam?.trim() ?? ''
  const isEditMode = dsuMId.length > 0
  const { options: operatingStatusOptions, descToCode: operStatusDescToCode } =
    useOperatingStatusFilterOptions()
  const {
    options: assetStatusOptions,
    descToCode: itemStatusDescToCode,
    codeToDesc: itemStsCodeToLabel,
  } =
    useItemStatusSelectOptions()
  const { group: disuseReasonGroup } = useCommonCodeGroup(CODE_GROUP.DISUSE_REASON)
  const disuseReasonDescToCode = useMemo(() => {
    const fromApi = buildDescriptionToCodeMap(disuseReasonGroup ?? undefined)
    if (Object.keys(fromApi).length > 0) return fromApi
    return FALLBACK_DISUSE_REASON_DESC_TO_CODE
  }, [disuseReasonGroup])
  const reasonOptions = useMemo(() => {
    if (Object.keys(disuseReasonDescToCode).length > 0) {
      return buildSelectOptionsWithPlaceholder(disuseReasonDescToCode)
    }
    return REASON_OPTIONS_FALLBACK
  }, [disuseReasonDescToCode])
  const reasonCodeToLabel = useMemo(() => {
    const m: Record<string, string> = {}
    for (const [label, code] of Object.entries(disuseReasonDescToCode)) {
      m[code] = label
    }
    return m
  }, [disuseReasonDescToCode])

  const [filters, setFilters] = useState<AssetLedgerFilters>({ ...INITIAL_FILTERS })
  /** GET /api/item/assets 조회에 적용된 조건 (물품 운용 대장과 동일) */
  const [searchedFilters, setSearchedFilters] = useState<AssetLedgerFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerData, setLedgerData] = useState<AssetLedgerRow[]>([])
  const [ledgerTotalCount, setLedgerTotalCount] = useState(0)

  const [selectedRows, setSelectedRows] = useState<AssetLedgerRow[]>([])
  const [selectedTableCheckedKeys, setSelectedTableCheckedKeys] = useState<Set<string>>(
    () => new Set(),
  )

  const [disuseInfo, setDisuseInfo] = useState({
    disuseDate: '',
    registrantId: '',
    assetStatus: '선택',
    reason: '선택',
  })
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadLedger = useCallback(async () => {
    try {
      const res = await fetchItemAssets({
        page: ledgerPage,
        pageSize: 10,
        filters: {
          ...searchedFilters,
          operatingStatus: resolveOperatingStatusFilterValue(
            searchedFilters.operatingStatus,
            operStatusDescToCode,
          ),
        },
      })
      setLedgerData(res.data)
      setLedgerTotalCount(res.totalCount)
    } catch {
      setLedgerData([])
      setLedgerTotalCount(0)
    }
  }, [ledgerPage, searchedFilters, operStatusDescToCode])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  useEffect(() => {
    if (!isEditMode || !dsuMId) return
    let cancelled = false
    setLoadingDetail(true)
    ;(async () => {
      try {
        const master = await fetchItemDisuseByDsuMId(dsuMId)
        const items = await fetchItemDisuseAllItems(dsuMId)
        if (cancelled) return
        if (!master && items.length === 0) {
          window.alert('불용 정보를 불러오지 못했습니다.')
          navigate('/asset-management/disuse-management')
          return
        }
        setSelectedRows(items.map((item, i) => mapDisuseItemToLedgerRow(item, i)))
        setSelectedTableCheckedKeys(new Set())
        setDisuseInfo({
          disuseDate: master?.aplyAt ?? '',
          registrantId: master?.aplyUsrId ?? '',
          assetStatus: codeToDropdownLabel(
            String(master?.itemSts ?? ''),
            itemStsCodeToLabel,
            itemStatusDescToCode,
          ),
          reason:
            reasonCodeToLabel[String(master?.dsuRsn ?? '')] ??
            codeToDropdownLabel(String(master?.dsuRsn ?? ''), reasonCodeToLabel, disuseReasonDescToCode),
        })
      } catch (e) {
        if (cancelled) return
        window.alert(e instanceof Error ? e.message : '불용 정보를 불러오지 못했습니다.')
        navigate('/asset-management/disuse-management')
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    isEditMode,
    dsuMId,
    navigate,
    itemStatusDescToCode,
    itemStsCodeToLabel,
    reasonCodeToLabel,
    disuseReasonDescToCode,
  ])

  const isInSelectedList = (row: AssetLedgerRow) =>
    selectedRows.some((r) => assetRowKey(r) === assetRowKey(row))

  const toggleLedgerRow = (row: AssetLedgerRow) => {
    const k = assetRowKey(row)
    setSelectedRows((prev) => {
      if (prev.some((r) => assetRowKey(r) === k)) {
        return prev.filter((r) => assetRowKey(r) !== k)
      }
      return [...prev, row]
    })
  }

  const ledgerColumns: DataTableColumn<AssetLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={isInSelectedList(row)}
          onChange={() => toggleLedgerRow(row)}
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
          checked={selectedTableCheckedKeys.has(assetRowKey(row))}
          onChange={(e) => {
            const k = assetRowKey(row)
            if (e.target.checked) {
              setSelectedTableCheckedKeys((prev) => new Set(prev).add(k))
            } else {
              setSelectedTableCheckedKeys((prev) => {
                const next = new Set(prev)
                next.delete(k)
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

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setLedgerPage(1)
    setSelectedRows([])
    setSelectedTableCheckedKeys(new Set())
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setLedgerPage(1)
  }

  const handleDeleteSelected = useCallback(() => {
    setSelectedRows((prev) => prev.filter((r) => !selectedTableCheckedKeys.has(assetRowKey(r))))
    setSelectedTableCheckedKeys(new Set())
  }, [selectedTableCheckedKeys])

  const handleDeleteAll = useCallback(() => {
    setSelectedRows([])
    setSelectedTableCheckedKeys(new Set())
  }, [])

  const handleSave = async () => {
    const aplyAt = disuseInfo.disuseDate.trim()
    if (!aplyAt) {
      window.alert('불용일자를 입력해 주세요.')
      return
    }

    const itmNos = selectedRows
      .map((row) => (row.itmNo || row.itemUniqueNumber || '').trim())
      .filter(Boolean)
    if (itmNos.length === 0) {
      window.alert('불용할 물품을 선택 물품 목록에 담아 주세요.')
      return
    }

    if (!disuseInfo.assetStatus || disuseInfo.assetStatus === '선택') {
      window.alert('물품상태를 선택해 주세요.')
      return
    }
    if (!disuseInfo.reason || disuseInfo.reason === '선택') {
      window.alert('사유를 선택해 주세요.')
      return
    }

    const itemSts =
      itemStatusDescToCode[disuseInfo.assetStatus] ??
      FALLBACK_ITEM_STS_FORM_TO_CODE[disuseInfo.assetStatus] ??
      disuseInfo.assetStatus
    const dsuRsn = disuseReasonDescToCode[disuseInfo.reason] ?? disuseInfo.reason

    setSaving(true)
    try {
      if (isEditMode) {
        await updateItemDisuse(dsuMId, {
          aplyAt,
          itemSts,
          dsuRsn,
          itmNos,
        })
        window.alert('불용 수정이 완료되었습니다.')
      } else {
        await createItemDisuse({
          aplyAt,
          itemSts,
          dsuRsn,
          itmNos,
        })
        window.alert('불용 등록이 완료되었습니다.')
      }
      navigate('/asset-management/disuse-management')
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : isEditMode ? '불용 수정에 실패했습니다.' : '불용 등록에 실패했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="disuse"
      depthSecondLabel="물품 관리"
      depthThirdLabel={isEditMode ? '물품 불용 수정' : '물품 불용 관리'}
    >
      {isEditMode && loadingDetail ? (
        <div className="return-registration-detail-loading" role="status">
          불용 정보를 불러오는 중...
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
                />
                <button
                  type="button"
                  className="operation-ledger-search-btn"
                  aria-label="G2B목록명 검색"
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
                <DatePickerField
                  value={filters.acquireDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, acquireDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
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
                <DatePickerField
                  value={filters.sortDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
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
          data={ledgerData}
          totalCount={ledgerTotalCount}
          pageSize={10}
          currentPage={ledgerPage}
          onPageChange={setLedgerPage}
          columns={ledgerColumns}
          getRowKey={(row) => assetRowKey(row)}
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
        getRowKey={(row) => assetRowKey(row)}
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
          <TitlePill>{isEditMode ? '불용 수정 정보' : '불용 등록 정보'}</TitlePill>
        </div>
        <section className="operation-ledger-detail-panel return-registration-info-panel">
          <div className="return-registration-info-inner">
            <div className="operation-ledger-detail-grid">
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">불용일자</label>
                <DatePickerField
                  value={disuseInfo.disuseDate}
                  onChange={(e) =>
                    setDisuseInfo((prev) => ({ ...prev, disuseDate: e.target.value }))
                  }
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">등록자ID</label>
                <TextField
                  value={disuseInfo.registrantId}
                  onChange={(e) =>
                    setDisuseInfo((prev) => ({ ...prev, registrantId: e.target.value }))
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
                  value={disuseInfo.assetStatus}
                  onChange={(value: string) =>
                    setDisuseInfo((prev) => ({ ...prev, assetStatus: value }))
                  }
                  options={assetStatusOptions}
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">사유</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={disuseInfo.reason}
                  onChange={(value: string) =>
                    setDisuseInfo((prev) => ({ ...prev, reason: value }))
                  }
                  options={reasonOptions}
                />
              </div>
            </div>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleSave}
              disabled={saving || (isEditMode && loadingDetail)}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </section>
      </div>
    </AssetManagementPageLayout>
  )
}

export default DisuseRegistrationPage
