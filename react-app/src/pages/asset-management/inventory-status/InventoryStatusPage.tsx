import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import { OPERATING_DEPARTMENT_FILTER_OPTIONS } from '../../../constants/departments'
import { useOperatingStatusFilterOptions } from '../../../hooks/useCommonCodeOptions'
import {
  fetchAssetInventoryStatus,
  type AssetInventoryStatusRow,
  type AssetInventoryStatusFilters as InventoryStatusFilters,
} from '../../../api/itemAssetInventoryStatus'

export type InventoryStatusRow = AssetInventoryStatusRow

const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_FILTER_OPTIONS

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

const InventoryStatusPage = () => {
  const navigate = useNavigate()
  const { options: operatingStatusOptions } = useOperatingStatusFilterOptions()
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)
  const [filters, setFilters] = useState<InventoryStatusFilters>({
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

  const [searchedFilters, setSearchedFilters] = useState<InventoryStatusFilters>(() => ({
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
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<InventoryStatusRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoadError(null)
      const res = await fetchAssetInventoryStatus({
        page: currentPage,
        pageSize: 10,
        filters: searchedFilters,
      })
      setTableData(res.data)
      setTotalCount(res.totalCount)
      setSelectedRowId(null)
    } catch (e) {
      setTableData([])
      setTotalCount(0)
      setSelectedRowId(null)
      setLoadError(e instanceof Error ? e.message : '보유 현황 목록을 불러오지 못했습니다.')
    }
  }, [currentPage, searchedFilters])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const columns: DataTableColumn<InventoryStatusRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRowId === row.id}
          onChange={() => {
            setSelectedRowId((prev) => {
              const next = prev === row.id ? null : row.id
              if (next == null) {
                setFilters((prev) => ({
                  ...prev,
                  g2bName: '',
                  g2bNumberPrefix: '',
                  g2bNumberSuffix: '',
                }))
              } else {
                const [prefix = '', suffix = ''] = row.g2bNumber.split('-')
                setFilters((prev) => ({
                  ...prev,
                  g2bName: row.g2bName,
                  g2bNumberPrefix: prefix,
                  g2bNumberSuffix: suffix,
                }))
              }
              return next
            })
          }}
        />
      ),
    },
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
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
    setCurrentPage(1)
    setSelectedRowId(null)
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
      selectedRowId != null ? tableData.find((row) => row.id === selectedRowId) : null
    if (!selected) {
      window.alert('물품상세정보를 보려면 행을 하나 선택해주세요.')
      return
    }
    navigate('/asset-management/inventory-status/detail', {
      state: {
        item: selected,
      },
    })
  }

  return (
    <AssetManagementPageLayout
      pageKey="inventory-status"
      depthSecondLabel="보유 현황 조회"
      depthThirdLabel=""
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid inventory-status-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록명</div>
              <div className="operation-ledger-input-and-search">
                <TextField
                  value={filters.g2bName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, g2bName: e.target.value }))}
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
                options={OPERATING_DEPT_OPTIONS}
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
                  setFilters((prev) => ({ ...prev, itemUniqueNumber: e.target.value }))
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
              onClick={() => {
                setSearchedFilters({ ...filters })
                setCurrentPage(1)
              }}
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

      {loadError ? (
        <div style={{ margin: '8px 0', color: '#d52e2e', fontSize: 14 }}>
          {loadError}
        </div>
      ) : null}

      <DataTable<InventoryStatusRow>
        pageKey="operation-ledger"
        title="보유 현황 목록"
        data={tableData}
        totalCount={totalCount}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        columns={columns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="operation-ledger-table-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleOpenDetail}
            >
              물품상세정보
            </Button>
          </div>
        )}
      />
    </AssetManagementPageLayout>
  )
}

export default InventoryStatusPage
