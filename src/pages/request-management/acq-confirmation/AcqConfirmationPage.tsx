import { useCallback, useEffect, useMemo, useState } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import { useManagementFilter } from '../../../hooks/useManagementFilter'
import {
  fetchAcqConfirmationList,
  type AcqConfirmationRow,
} from '../../../api/acqConfirmation'
import {
  bulkApproveItemAcquisitions,
  bulkRejectItemAcquisitions,
} from '../../../api/itemAcquisitions'
import {
  CODE_GROUP,
  buildDescriptionToCodeMap,
  buildFilterOptionsWithAll,
} from '../../../api/codes'
import { useCommonCodeGroup } from '../../../hooks/useCommonCodeGroup'
import './AcqConfirmationPage.css'
import { useOperatingDepartmentFilterOptions } from '../../../hooks/useOperatingDepartmentOptions'

type Filters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  operatingDept: string
}

const INITIAL_FILTERS: Filters = {
  g2bName: '',
  g2bNumberFrom: '',
  g2bNumberTo: '',
  sortDateFrom: '',
  sortDateTo: '',
  acquireDateFrom: '',
  acquireDateTo: '',
  approvalStatus: '전체',
  operatingDept: '전체',
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

const DATE_RANGES = [
  { fromKey: 'sortDateFrom' as const, toKey: 'sortDateTo' as const, errorKey: 'sortDate' },
  { fromKey: 'acquireDateFrom' as const, toKey: 'acquireDateTo' as const, errorKey: 'acquireDate' },
]

/** AcqTableRow는 AcqConfirmationRow와 동일 - API 타입과 정렬 */
type AcqTableRow = AcqConfirmationRow

const APPROVAL_FALLBACK_OPTIONS = ['전체', '대기', '반려', '확정']

const AcqConfirmationPage = () => {
  const { group: apprGroup } = useCommonCodeGroup(CODE_GROUP.APPR_STATUS)
  const approvalDescToCode = useMemo(
    () => buildDescriptionToCodeMap(apprGroup ?? undefined),
    [apprGroup],
  )
  const approvalOptions = useMemo(() => {
    if (Object.keys(approvalDescToCode).length > 0) {
      return buildFilterOptionsWithAll(approvalDescToCode)
    }
    return APPROVAL_FALLBACK_OPTIONS
  }, [approvalDescToCode])

  const {
    filters,
    setFilters,
    dateErrors,
    setDateError,
    validateDateRange,
    onReset,
    onSearch,
  } = useManagementFilter<Filters>({
    initialFilters: INITIAL_FILTERS,
    dateRanges: DATE_RANGES,
  })

  /** 검색 조건·페이지를 하나의 상태로 관리하여 API 이중 호출 방지 */
  const [query, setQuery] = useState<{ page: number; filters: Filters }>({
    page: 1,
    filters: INITIAL_FILTERS,
  })

  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)

  const operatingDeptOptions = useOperatingDepartmentFilterOptions()

  const [tableData, setTableData] = useState<AcqTableRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedAcqIds, setSelectedAcqIds] = useState<Set<string>>(() => new Set())
  const [approvalActionLoading, setApprovalActionLoading] = useState(false)
  const pageSize = 10

  const loadData = useCallback(async () => {
    const res = await fetchAcqConfirmationList({
      page: query.page,
      pageSize,
      filters: query.filters,
      approvalDescToCode:
        Object.keys(approvalDescToCode).length > 0 ? approvalDescToCode : undefined,
    })
    setTableData(res.data)
    setTotalCount(res.totalCount)
  }, [query, approvalDescToCode])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setSelectedAcqIds(new Set())
  }, [query.filters])

  const pageAcqIds = useMemo(
    () => tableData.map((r) => r.acqId).filter((id) => id.length > 0),
    [tableData],
  )
  const allPageSelected =
    pageAcqIds.length > 0 && pageAcqIds.every((id) => selectedAcqIds.has(id))

  const toggleSelectAllOnPage = () => {
    setSelectedAcqIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageAcqIds.forEach((id) => next.delete(id))
      } else {
        pageAcqIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleRowSelected = (acqId: string) => {
    if (!acqId) return
    setSelectedAcqIds((prev) => {
      const next = new Set(prev)
      if (next.has(acqId)) next.delete(acqId)
      else next.add(acqId)
      return next
    })
  }

  const handleBulkApprove = async () => {
    const ids = [...selectedAcqIds]
    if (ids.length === 0) {
      window.alert('확정할 건을 체크해 주세요.')
      return
    }
    setApprovalActionLoading(true)
    try {
      await bulkApproveItemAcquisitions(ids)
      window.alert(`승인 확정 처리되었습니다. (${ids.length}건)`)
      setSelectedAcqIds(new Set())
      await loadData()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 확정에 실패했습니다.')
    } finally {
      setApprovalActionLoading(false)
    }
  }

  const handleBulkReject = async () => {
    const ids = [...selectedAcqIds]
    if (ids.length === 0) {
      window.alert('반려할 건을 체크해 주세요.')
      return
    }
    setApprovalActionLoading(true)
    try {
      await bulkRejectItemAcquisitions(ids)
      window.alert(`반려 처리되었습니다. (${ids.length}건)`)
      setSelectedAcqIds(new Set())
      await loadData()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '반려 처리에 실패했습니다.')
    } finally {
      setApprovalActionLoading(false)
    }
  }

  /** 조회: 날짜 검증 후 필터 조건으로 query 갱신 → API 재호출 */
  const handleSearchClick = () => {
    if (onSearch()) {
      setQuery({ page: 1, filters: { ...filters } })
    }
  }

  const handleG2BSelect = (item: G2BItem) => {
    const { prefix, suffix } = getG2BListNumberParts(item)
    setFilters((p) => ({
      ...p,
      g2bName: item.name,
      g2bNumberFrom: prefix,
      g2bNumberTo: suffix,
    }))
    setIsG2BModalOpen(false)
  }

  /** 초기화: 폼 리셋 후 전체 목록 다시 조회 */
  const handleReset = () => {
    onReset()
    setQuery({ page: 1, filters: INITIAL_FILTERS })
  }

  const setSortDateError = (err: string) => setDateError('sortDate', err)
  const setAcquireDateError = (err: string) => setDateError('acquireDate', err)

  const columns: DataTableColumn<AcqTableRow>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectAllOnPage}
          disabled={pageAcqIds.length === 0}
          aria-label="현재 페이지 전체 선택"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={row.acqId ? selectedAcqIds.has(row.acqId) : false}
          onChange={() => toggleRowSelected(row.acqId)}
          disabled={!row.acqId}
          aria-label={`취득 건 선택 ${row.g2bNumber}`}
        />
      ),
    },
    {
      key: 'g2bNumber',
      header: 'G2B목록번호',
      width: 120,
      render: (row) => row.g2bNumber,
    },
    {
      key: 'g2bName',
      header: 'G2B목록명',
      width: 150,
      render: (row) => row.g2bName,
    },
    {
      key: 'acquireDate',
      header: '취득일자',
      width: 100,
      render: (row) => row.acquireDate,
    },
    {
      key: 'acquireAmount',
      header: '취득금액',
      width: 120,
      render: (row) =>
        typeof row.acquireAmount === 'number'
          ? row.acquireAmount.toLocaleString('ko-KR') + '원'
          : String(row.acquireAmount),
    },
    {
      key: 'sortDate',
      header: '정리일자',
      width: 100,
      render: (row) => row.sortDate,
    },
    {
      key: 'operatingDept',
      header: '운용부서',
      width: 120,
      render: (row) => row.operatingDept,
    },
    {
      key: 'operatingStatus',
      header: '운용상태',
      width: 100,
      render: (row) => row.operatingStatus,
    },
    {
      key: 'usefulLife',
      header: '내용연수',
      width: 100,
      render: (row) => row.usefulLife,
    },
    {
      key: 'quantity',
      header: '수량',
      width: 80,
      render: (row) => row.quantity,
    },
    {
      key: 'approvalStatus',
      header: '승인상태',
      width: 100,
      render: (row) => row.approvalStatus,
    },
  ]

  return (
    <ManagementPageLayout pageKey="acq" depthSecondLabel="물품 취득 확정 관리">
      <FilterPanel pageKey="acq">
        <div className="acq-filter-grid">
                <div className="acq-field acq-field-g2b">
                  <div className="acq-label">G2B목록명</div>
                  <div className="acq-input-and-search">
                    <TextField
                      value={filters.g2bName}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, g2bName: e.target.value }))
                      }
                      placeholder="G2B목록명 입력"
                      className="acq-g2b-input"
                    />
                    <button
                      type="button"
                      className="acq-search-btn"
                      aria-label="G2B목록명 검색"
                      onClick={() => setIsG2BModalOpen(true)}
                    >
                      <SearchIcon />
                    </button>
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">운용부서</div>
                  <Dropdown
                    size="small"
                    placeholder="선택"
                    value={filters.operatingDept}
                    onChange={(value: string) =>
                      setFilters((p) => ({ ...p, operatingDept: value }))
                    }
                    options={operatingDeptOptions}
                    ariaLabel="운용부서 선택"
                  />
                </div>

                <div className="acq-field">
                  <div className="acq-label">G2B목록번호</div>
                  <div className="acq-number-range">
                    <TextField
                      placeholder=""
                      value={filters.g2bNumberFrom || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, g2bNumberFrom: e.target.value }))}
                      className="acq-number-input"
                    />
                    <span className="acq-number-sep">-</span>
                    <TextField
                      placeholder=""
                      value={filters.g2bNumberTo || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, g2bNumberTo: e.target.value }))}
                      className="acq-number-input"
                    />
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">정리일자</div>
                  <div className="acq-date-field-wrapper">
                    <div className="acq-date-range">
                      <DatePickerField
                        value={filters.sortDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, sortDateFrom: e.target.value }))
                          if (filters.sortDateTo) {
                            validateDateRange(e.target.value, filters.sortDateTo, setSortDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <DatePickerField
                        value={filters.sortDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, sortDateTo: e.target.value }))
                          if (filters.sortDateFrom) {
                            validateDateRange(filters.sortDateFrom, e.target.value, setSortDateError)
                          }
                        }}
                      />
                    </div>
                    {dateErrors.sortDate && <div className="acq-error-text">{dateErrors.sortDate}</div>}
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">취득일자</div>
                  <div className="acq-date-field-wrapper">
                    <div className="acq-date-range">
                      <DatePickerField
                        value={filters.acquireDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, acquireDateFrom: e.target.value }))
                          if (filters.acquireDateTo) {
                            validateDateRange(e.target.value, filters.acquireDateTo, setAcquireDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <DatePickerField
                        value={filters.acquireDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, acquireDateTo: e.target.value }))
                          if (filters.acquireDateFrom) {
                            validateDateRange(filters.acquireDateFrom, e.target.value, setAcquireDateError)
                          }
                        }}
                      />
                    </div>
                    {dateErrors.acquireDate && <div className="acq-error-text">{dateErrors.acquireDate}</div>}
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">승인상태</div>
                  <div className="acq-radio-group">
                    {approvalOptions.map((option) => (
                      <RadioButton
                        key={option}
                        name="approvalStatus"
                        value={option}
                        checked={filters.approvalStatus === option}
                        onChange={(value) => setFilters((p) => ({ ...p, approvalStatus: value }))}
                        label={option}
                      />
                    ))}
                  </div>
                </div>
              </div>

        <div className="acq-filter-actions">
          <Button className="acq-btn acq-btn-outline" onClick={handleReset}>
            초기화
          </Button>
          <Button className="acq-btn acq-btn-primary" onClick={handleSearchClick}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />

      <DataTable<AcqTableRow>
        pageKey="acq"
        title="물품 취득 대장 목록"
        data={tableData}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={query.page}
        onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
        columns={columns}
        getRowKey={(row) => (row.acqId ? row.acqId : String(row.id))}
        renderActions={() => (
          <>
            <Button
              type="button"
              className="acq-btn acq-btn-outline acq-btn-small"
              disabled={approvalActionLoading || selectedAcqIds.size === 0}
              onClick={() => void handleBulkReject()}
            >
              {approvalActionLoading ? '처리 중…' : '반려'}
            </Button>
            <Button
              type="button"
              className="acq-btn acq-btn-primary acq-btn-small"
              disabled={approvalActionLoading || selectedAcqIds.size === 0}
              onClick={() => void handleBulkApprove()}
            >
              {approvalActionLoading ? '처리 중…' : '확정'}
            </Button>
          </>
        )}
      />
    </ManagementPageLayout>
  )
}

export default AcqConfirmationPage

