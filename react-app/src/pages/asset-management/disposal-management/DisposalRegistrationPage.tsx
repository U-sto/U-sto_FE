import { useEffect, useState, useCallback, useMemo } from 'react'
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
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import {
  fetchItemAssets,
} from '../../../api/itemAssets'
import { createItemDisposalRequest } from '../../../api/itemDisposalRequest'
import {
  updateItemDisposal,
  fetchItemDisposalByDispMId,
  fetchItemDisposalAllItems,
} from '../../../api/itemDisposals'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import { OPERATING_DEPARTMENT_FILTER_OPTIONS } from '../../../constants/departments'
import {
  useOperatingStatusFilterOptions,
  resolveOperatingStatusFilterValue,
} from '../../../hooks/useCommonCodeOptions'

type RegistrationFilters = {
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

const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_FILTER_OPTIONS
// 처분정리구분(표시: 한글, 전송: 코드)
const DISPOSAL_SORT_OPTIONS = ['폐기', '매각', '멸실', '도난']
const DISPOSAL_TYPE_MAP: Record<string, string> = {
  폐기: 'DISCARD',
  매각: 'SALE',
  멸실: 'LOSS',
  도난: 'THEFT',
}
const DISPOSAL_TYPE_CODE_TO_LABEL: Record<string, string> = {
  DISCARD: '폐기',
  SALE: '매각',
  LOSS: '멸실',
  THEFT: '도난',
}
type LedgerRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  /** 처분 신청 API 전송용 물품고유번호(itmNo) */
  itmNo: string
  acquireDate: string
  sortDate: string
  acquireAmount: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
}

function mapDisposalItemToLedgerRow(
  item: Awaited<ReturnType<typeof fetchItemDisposalAllItems>>[number],
  index: number,
): LedgerRow {
  const acqUprValue = typeof item.acqUpr === 'number' ? item.acqUpr : Number(item.acqUpr ?? 0)
  return {
    id: index + 1,
    g2bNumber: String(item.g2bItemNo ?? ''),
    g2bName: String(item.g2bItemNm ?? ''),
    itemUniqueNumber: String(item.itmNo ?? item.itemUnqNo ?? ''),
    itmNo: String(item.itmNo ?? item.itemUnqNo ?? ''),
    acquireDate: String(item.acqAt ?? ''),
    sortDate: '',
    acquireAmount: acqUprValue ? `${acqUprValue.toLocaleString()}원` : '',
    operatingDept: String(item.deptNm ?? ''),
    operatingStatus: String(item.operSts ?? ''),
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

const DisposalRegistrationPage = () => {
  const navigate = useNavigate()
  const { dispMId: dispMIdParam } = useParams<{ dispMId?: string }>()
  const dispMId = dispMIdParam?.trim() ?? ''
  const isEditMode = dispMId.length > 0
  const { options: operatingStatusOptions, descToCode: operStatusDescToCode } =
    useOperatingStatusFilterOptions()
  const [filters, setFilters] = useState<RegistrationFilters>({
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
  })

  const [ledgerCheckedIds, setLedgerCheckedIds] = useState<Set<number>>(new Set())
  const [selectedRows, setSelectedRows] = useState<LedgerRow[]>([])
  const [selectedTableCheckedIds, setSelectedTableCheckedIds] = useState<Set<number>>(new Set())
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)

  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerData, setLedgerData] = useState<LedgerRow[]>([])
  const [ledgerTotalCount, setLedgerTotalCount] = useState(0)
  const [ledgerError, setLedgerError] = useState<string | null>(null)

  const [searchedFilters, setSearchedFilters] = useState<RegistrationFilters>({
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
  })

  const [disposalInfo, setDisposalInfo] = useState({
    disposalDate: '',
    registrantId: '',
    disposalSortType: '폐기',
  })

  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const apiLedgerFilters = useMemo(
    () => ({
      ...searchedFilters,
      operatingStatus: resolveOperatingStatusFilterValue(
        searchedFilters.operatingStatus,
        operStatusDescToCode,
      ),
    }),
    [searchedFilters, operStatusDescToCode],
  )

  useEffect(() => {
    let ignore = false
    setLedgerError(null)
    ;(async () => {
      try {
        const res = await fetchItemAssets({
          page: ledgerPage,
          pageSize: 10,
          filters: apiLedgerFilters,
        })
        if (ignore) return
        setLedgerData(res.data)
        setLedgerTotalCount(res.totalCount)
      } catch (e) {
        if (ignore) return
        setLedgerData([])
        setLedgerTotalCount(0)
        setLedgerError(e instanceof Error ? e.message : '물품 운용 대장 목록을 불러오지 못했습니다.')
      }
    })()
    return () => {
      ignore = true
    }
  }, [ledgerPage, apiLedgerFilters])

  useEffect(() => {
    if (!isEditMode || !dispMId) return
    let cancelled = false
    setLoadingDetail(true)
    ;(async () => {
      try {
        const master = await fetchItemDisposalByDispMId(dispMId)
        const items = await fetchItemDisposalAllItems(dispMId)
        if (cancelled) return
        if (!master && items.length === 0) {
          window.alert('처분 정보를 불러오지 못했습니다.')
          navigate('/asset-management/disposal-management')
          return
        }
        setSelectedRows(items.map((item, i) => mapDisposalItemToLedgerRow(item, i)))
        setSelectedTableCheckedIds(new Set())
        setLedgerCheckedIds(new Set())
        const dispTypeCode = String(master?.dispType ?? '')
        setDisposalInfo({
          disposalDate: master?.aplyAt ?? '',
          registrantId: master?.aplyUsrId ?? '',
          disposalSortType: DISPOSAL_TYPE_CODE_TO_LABEL[dispTypeCode] ?? '폐기',
        })
      } catch (e) {
        if (cancelled) return
        window.alert(e instanceof Error ? e.message : '처분 정보를 불러오지 못했습니다.')
        navigate('/asset-management/disposal-management')
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditMode, dispMId, navigate])

  const ledgerColumns: DataTableColumn<LedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        // 처분 신청은 불용(DSU) 상태만 가능
        <input
          type="checkbox"
          disabled={row.operatingStatus !== '불용'}
          checked={ledgerCheckedIds.has(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              if (row.operatingStatus !== '불용') {
                window.alert('불용 상태인 물품만 처분 신청할 수 있습니다.')
                return
              }
              setLedgerCheckedIds((prev) => new Set(prev).add(row.id))
              setSelectedRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]))
            } else {
              setLedgerCheckedIds((prev) => {
                const next = new Set(prev)
                next.delete(row.id)
                return next
              })
              setSelectedRows((prev) => prev.filter((r) => r.id !== row.id))
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

  const selectedColumns: DataTableColumn<LedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedTableCheckedIds.has(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTableCheckedIds((prev) => new Set(prev).add(row.id))
            } else {
              setSelectedTableCheckedIds((prev) => {
                const next = new Set(prev)
                next.delete(row.id)
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
    setFilters({
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
    })
    setSearchedFilters({
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
    })
    setLedgerPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setLedgerPage(1)
  }

  const handleDeleteSelected = useCallback(() => {
    setSelectedRows((prev) => prev.filter((r) => !selectedTableCheckedIds.has(r.id)))
    setSelectedTableCheckedIds(new Set())
    setLedgerCheckedIds((prev) => {
      const next = new Set(prev)
      selectedTableCheckedIds.forEach((id) => next.delete(id))
      return next
    })
  }, [selectedTableCheckedIds])

  const handleDeleteAll = useCallback(() => {
    setSelectedRows([])
    setSelectedTableCheckedIds(new Set())
    setLedgerCheckedIds(new Set())
  }, [])

  const handleG2BSelect = (item: G2BItem) => {
    const { prefix, suffix } = getG2BListNumberParts(item)
    setFilters((prev) => ({
      ...prev,
      g2bName: item.name ?? '',
      g2bNumberPrefix: prefix,
      g2bNumberSuffix: suffix,
    }))
  }

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      window.alert('선택 물품 목록에 물품을 먼저 추가해주세요.')
      return
    }
    if (selectedRows.some((r) => r.operatingStatus !== '불용')) {
      window.alert('불용 상태인 물품만 처분 신청할 수 있습니다.')
      return
    }
    if (!disposalInfo.disposalDate) {
      window.alert('처분일자를 입력해주세요.')
      return
    }
    // 일부 백엔드 검증: 신청일자는 미래 날짜 불가(YYYY-MM-DD 문자열 비교 가능)
    const today = new Date()
    const todayIso = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    )
      .toISOString()
      .slice(0, 10)
    if (disposalInfo.disposalDate > todayIso) {
      window.alert('처분일자는 오늘 이후 날짜로 입력할 수 없습니다.')
      return
    }
    if (!disposalInfo.registrantId?.trim()) {
      window.alert('등록자ID를 입력해주세요.')
      return
    }
    const dispType =
      DISPOSAL_TYPE_MAP[disposalInfo.disposalSortType] ?? disposalInfo.disposalSortType

    const itmNos = Array.from(
      new Set(
        selectedRows
          .map((r) => r.itmNo || r.itemUniqueNumber)
          .filter((v): v is string => Boolean(v && String(v).trim())),
      ),
    )

    if (itmNos.length === 0) {
      window.alert('선택된 물품의 물품고유번호(itmNo)를 찾지 못했습니다.')
      return
    }

    const payload = {
      aplyAt: disposalInfo.disposalDate,
      dispType,
      itmNos,
    }

    setSaving(true)
    if (isEditMode) {
      updateItemDisposal(dispMId, payload)
        .then(() => {
          window.alert('처분 수정이 완료되었습니다.')
          navigate('/asset-management/disposal-management')
        })
        .catch((e) => {
          const message = e instanceof Error ? e.message : '처분 수정에 실패했습니다.'
          window.alert(message)
        })
        .finally(() => setSaving(false))
      return
    }

    createItemDisposalRequest(payload)
      .then(() => {
        window.alert('처분 신청이 등록되었습니다.')
        navigate('/asset-management/disposal-management')
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : '처분 신청 등록에 실패했습니다.'
        window.alert(message)
      })
      .finally(() => setSaving(false))
  }

  return (
    <AssetManagementPageLayout
      pageKey="disposal"
      depthSecondLabel="물품 관리"
      depthThirdLabel={isEditMode ? '물품 처분 수정' : '물품 처분 등록'}
    >
      {isEditMode && loadingDetail ? (
        <div className="return-registration-detail-loading" role="status">
          처분 정보를 불러오는 중...
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
                  onClick={() => setIsG2BModalOpen(true)}
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
                  readOnly
                  className="operation-ledger-readonly"
                />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField
                  value={filters.g2bNumberSuffix}
                  readOnly
                  className="operation-ledger-readonly"
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
        <DataTable<LedgerRow>
          pageKey="operation-ledger"
          title="물품 운용 대장 목록"
          data={ledgerData}
          totalCount={ledgerTotalCount}
          pageSize={10}
          columns={ledgerColumns}
          getRowKey={(row) => row.id}
          currentPage={ledgerPage}
          onPageChange={setLedgerPage}
        />
      </div>

      <div className="return-registration-ledger-table-wrap" hidden={isEditMode && loadingDetail}>
        <DataTable<LedgerRow>
          pageKey="operation-ledger"
          title="선택 물품 목록"
          data={selectedRows}
          totalCount={selectedRows.length}
          pageSize={10}
          columns={selectedColumns}
          getRowKey={(row) => row.id}
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
          <TitlePill>{isEditMode ? '처분 수정 정보' : '처분 등록 정보'}</TitlePill>
        </div>
        <section className="operation-ledger-detail-panel return-registration-info-panel">
          <div className="return-registration-info-inner">
            <div className="operation-ledger-detail-grid">
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">처분일자</label>
                <DatePickerField
                  value={disposalInfo.disposalDate}
                  onChange={(e) =>
                    setDisposalInfo((prev) => ({ ...prev, disposalDate: e.target.value }))
                  }
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">등록자ID</label>
                <TextField
                  value={disposalInfo.registrantId}
                  onChange={(e) =>
                    setDisposalInfo((prev) => ({ ...prev, registrantId: e.target.value }))
                  }
                  placeholder="등록자ID"
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label operation-ledger-detail-label--disposal-sort">
                  처분정리구분
                </label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={disposalInfo.disposalSortType}
                  menuPlacement="top"
                  onChange={(value: string) =>
                    setDisposalInfo((prev) => ({ ...prev, disposalSortType: value }))
                  }
                  options={DISPOSAL_SORT_OPTIONS}
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

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />
    </AssetManagementPageLayout>
  )
}

export default DisposalRegistrationPage
