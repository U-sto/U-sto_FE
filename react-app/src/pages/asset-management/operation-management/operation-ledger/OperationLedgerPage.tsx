import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Dropdown from '../../../../components/common/Dropdown/Dropdown'
import Button from '../../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import './OperationLedgerPage.css'

type OperationLedgerFilters = {
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

const OPERATING_DEPT_OPTIONS = ['전체', '운용부서1', '운용부서2', '운용부서3']
const OPERATING_STATUS_OPTIONS = ['전체', '운용중', '반납', '불용', '처분']

export type OperationLedgerRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  acquireAmount: string
  sortDate: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
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
  const [filters, setFilters] = useState<OperationLedgerFilters>({
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
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  const [allData, setAllData] = useState<OperationLedgerRow[]>(() =>
    Array.from({ length: 15 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: `노트북 ${idx + 1}`,
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      sortDate: '2026-01-20',
      operatingDept: `운용부서${(idx % 3) + 1}`,
      operatingStatus: idx % 2 === 0 ? '운용중' : '반납',
      usefulLife: `${3 + (idx % 3)}년`,
    })),
  )

  // 상세 화면에서 돌아올 때 수정된 값을 반영
  useEffect(() => {
    const state = location.state as { updatedItem?: OperationLedgerRow } | null
    if (!state?.updatedItem) return

    setAllData((prev) =>
      prev.map((row) =>
        row.id === state.updatedItem!.id ? { ...row, ...state.updatedItem } : row,
      ),
    )

    // state 초기화 (뒤로가기 시 중복 반영 방지)
    navigate(location.pathname, { replace: true })
  }, [location.pathname, location.state, navigate])

  const filteredData = useMemo(() => {
    return allData.filter((row) => {
      if (filters.g2bName && !row.g2bName.includes(filters.g2bName)) {
        return false
      }

      if (filters.g2bNumberPrefix || filters.g2bNumberSuffix) {
        const [numPrefix = '', numSuffix = ''] = row.g2bNumber.split('-')
        if (
          filters.g2bNumberPrefix &&
          !numPrefix.startsWith(filters.g2bNumberPrefix)
        ) {
          return false
        }
        if (
          filters.g2bNumberSuffix &&
          !numSuffix.startsWith(filters.g2bNumberSuffix)
        ) {
          return false
        }
      }

      if (
        filters.itemUniqueNumber &&
        !row.itemUniqueNumber.includes(filters.itemUniqueNumber)
      ) {
        return false
      }

      if (filters.operatingDept !== '전체') {
        if (row.operatingDept !== filters.operatingDept) return false
      }

      if (filters.operatingStatus !== '전체') {
        if (row.operatingStatus !== filters.operatingStatus) return false
      }

      if (filters.acquireDateFrom && row.acquireDate < filters.acquireDateFrom) {
        return false
      }
      if (filters.acquireDateTo && row.acquireDate > filters.acquireDateTo) {
        return false
      }

      if (filters.sortDateFrom && row.sortDate < filters.sortDateFrom) {
        return false
      }
      if (filters.sortDateTo && row.sortDate > filters.sortDateTo) {
        return false
      }

      return true
    })
  }, [allData, filters])

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
  }

  const handleSearch = () => {
    // 현재는 클라이언트 필터만 사용하므로 별도 처리 없음
  }

  const handleOpenDetail = () => {
    const selected =
      selectedRowId != null
        ? filteredData.find((row) => row.id === selectedRowId)
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
                options={OPERATING_STATUS_OPTIONS}
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
                  setFilters((prev) => ({
                    ...prev,
                    itemUniqueNumber: e.target.value,
                  }))
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
                    setFilters((prev) => ({
                      ...prev,
                      acquireDateFrom: e.target.value,
                    }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
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
                <TextField
                  type="date"
                  value={filters.sortDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortDateFrom: e.target.value,
                    }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
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

      <DataTable<OperationLedgerRow>
        pageKey="operation-ledger"
        title="물품 운용 대장 목록"
        data={filteredData}
        totalCount={allData.length}
        pageSize={10}
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

