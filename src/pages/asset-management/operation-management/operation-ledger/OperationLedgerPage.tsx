import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import DatePickerField from '../../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../../components/common/Dropdown/Dropdown'
import Button from '../../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import {
  fetchItemAssets,
  type AssetLedgerFilters,
  type AssetLedgerRow,
} from '../../../../api/itemAssets'
import { useAssetDetailOverrides } from '../../../../contexts/AssetDetailOverridesContext'
import './OperationLedgerPage.css'
import { useOperatingDepartmentFilterOptions } from '../../../../hooks/useOperatingDepartmentOptions'
import {
  useOperatingStatusFilterOptions,
  resolveOperatingStatusFilterValue,
} from '../../../../hooks/useCommonCodeOptions'

/** 상세 페이지 등 기존 import 호환용 — GET /api/item/assets 매핑 결과와 동일 */
export type OperationLedgerRow = AssetLedgerRow

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

const OperationLedgerPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const operatingDeptOptions = useOperatingDepartmentFilterOptions()
  const { getOverride } = useAssetDetailOverrides()
  const { options: operatingStatusOptions, descToCode: operStatusDescToCode } =
    useOperatingStatusFilterOptions()
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)
  const [filters, setFilters] = useState<AssetLedgerFilters>({ ...INITIAL_FILTERS })
  /** 조회 적용 조건 — GET /api/item/assets searchRequest */
  const [searchedFilters, setSearchedFilters] = useState<AssetLedgerFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<OperationLedgerRow[]>([])
  const [totalCount, setTotalCount] = useState(0)

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
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
    void loadData()
  }, [loadData])

  /** 조회 조건이 바뀌면 행 선택 초기화 */
  useEffect(() => {
    setSelectedRowId(null)
  }, [searchedFilters])

  // 상세 화면에서 돌아올 때 수정된 값을 목록에 반영 후 state 초기화
  useEffect(() => {
    const state = location.state as { updatedItem?: OperationLedgerRow } | null
    if (!state?.updatedItem) return

    setTableData((prev) =>
      prev.map((row) =>
        row.id === state.updatedItem!.id ? { ...row, ...state.updatedItem } : row,
      ),
    )

    navigate(location.pathname, { replace: true })
  }, [location.pathname, location.state, navigate])

  /** 상세 저장(로컬 오버라이드) 반영 — `filteredData` 대신 이 값을 테이블에 사용 */
  const displayRows = useMemo(() => {
    return tableData.map((row) => {
      const o = getOverride(row.itemUniqueNumber)
      if (!o) return row
      const digits = String(o.acquireAmount ?? '').replace(/\D/g, '')
      const acquireAmount =
        digits !== ''
          ? `${Number(digits).toLocaleString('ko-KR')}원`
          : row.acquireAmount
      const u = String(o.usefulLife ?? '').trim()
      const usefulLife =
        u === ''
          ? row.usefulLife
          : u.endsWith('년')
            ? u
            : `${u.replace(/[^\d]/g, '') || u}년`
      return { ...row, acquireAmount, usefulLife }
    })
  }, [tableData, getOverride])

  /** 행 선택/해제 시 선택 상태와 G2B 필터 동기화 */
  const handleSelectRow = (row: OperationLedgerRow) => {
    setSelectedRowId((prevSelectedId) => {
      const nextSelectedId = prevSelectedId === row.id ? null : row.id

      setFilters((prev) => {
        if (nextSelectedId == null) {
          return {
            ...prev,
            g2bName: '',
            g2bNumberPrefix: '',
            g2bNumberSuffix: '',
          }
        }
        const [prefix = '', suffix = ''] = row.g2bNumber.split('-')
        return {
          ...prev,
          g2bName: row.g2bName,
          g2bNumberPrefix: prefix,
          g2bNumberSuffix: suffix,
        }
      })

      return nextSelectedId
    })
  }

  const columns: DataTableColumn<OperationLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRowId === row.id}
          onChange={() => handleSelectRow(row)}
        />
      ),
    },
    {
      key: 'id',
      header: '순번',
      width: 56,
      render: (row) => row.id,
    },
    {
      key: 'g2bNumber',
      header: 'G2B목록번호',
      render: (row) => row.g2bNumber,
    },
    {
      key: 'g2bName',
      header: 'G2B목록명',
      render: (row) => row.g2bName,
    },
    {
      key: 'itemUniqueNumber',
      header: '물품고유번호',
      render: (row) => row.itemUniqueNumber,
    },
    {
      key: 'acquireDate',
      header: '취득일자',
      render: (row) => row.acquireDate,
    },
    {
      key: 'sortDate',
      header: '정리일자',
      render: (row) => row.sortDate,
    },
    {
      key: 'acquireAmount',
      header: '취득금액',
      render: (row) => row.acquireAmount,
    },
    {
      key: 'operatingDept',
      header: '운용부서',
      render: (row) => row.operatingDept,
    },
    {
      key: 'operatingStatus',
      header: '운용상태',
      render: (row) => row.operatingStatus,
    },
    {
      key: 'usefulLife',
      header: '내용연수',
      render: (row) => row.usefulLife,
    },
  ]

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setCurrentPage(1)
  }

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

  const handleOpenDetail = () => {
    const selected =
      selectedRowId != null
        ? displayRows.find((row) => row.id === selectedRowId)
        : null

    if (!selected) {
      window.alert('물품상세정보를 보려면 행을 하나 선택해주세요.')
      return
    }

    navigate('/asset-management/operation-management/operation-ledger/detail', {
      state: {
        item: {
          ...selected,
          quantity: '1',
          acquireSortType: '취득',
          operatingDeptCode: 'DEPT001',
          remarks: '',
        },
      },
    })
  }

  return (
    <AssetManagementPageLayout
      pageKey="operation-ledger"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="물품 운용 대장 관리"
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid inventory-status-filter-grid">
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
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">운용부서</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingDept}
                onChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, operatingDept: value }))
                }
                options={operatingDeptOptions}
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
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">물품고유번호</div>
              <TextField
                value={filters.itemUniqueNumber}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    itemUniqueNumber: e.target.value,
                  }))
                }
                placeholder="물품고유번호 입력"
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
              <div className="operation-ledger-label">취득일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.acquireDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      acquireDateFrom: e.target.value,
                    }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.acquireDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      acquireDateTo: e.target.value,
                    }))
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
                    setFilters((prev) => ({
                      ...prev,
                      sortDateFrom: e.target.value,
                    }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.sortDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortDateTo: e.target.value,
                    }))
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

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />

      <DataTable<OperationLedgerRow>
        pageKey="operation-ledger"
        title="물품 운용 대장 목록"
        data={displayRows}
        totalCount={totalCount}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        columns={columns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="operation-ledger-table-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-outline operation-ledger-btn-table"
              onClick={handleOpenDetail}
            >
              물품상세정보
            </Button>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={() => navigate('/asset-management/operation-management/operation-transfer')}
            >
              물품운용전환
            </Button>
          </div>
        )}
      />
    </AssetManagementPageLayout>
  )
}

export default OperationLedgerPage

