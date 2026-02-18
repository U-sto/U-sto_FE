import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'

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

const OPERATING_DEPT_OPTIONS = ['전체', '운용부서1', '운용부서2', '운용부서3']
const OPERATING_STATUS_OPTIONS = ['전체', '운용중', '반납', '불용', '처분']
const ASSET_STATUS_OPTIONS = ['선택', '운용중', '반납', '불용', '처분']
const REASON_OPTIONS = ['선택', '교체', '폐기', '기타']

type LedgerRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  sortDate: string
  acquireAmount: string
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

const DisposalRegistrationPage = () => {
  const navigate = useNavigate()
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

  const [disposalInfo, setDisposalInfo] = useState({
    disposalDate: '',
    registrantId: '',
    assetStatus: '선택',
    reason: '선택',
  })

  const ledgerData = useMemo<LedgerRow[]>(() => {
    return Array.from({ length: 15 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: `노트북 ${idx + 1}`,
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      sortDate: '2026-01-20',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서${(idx % 3) + 1}`,
      operatingStatus: idx % 2 === 0 ? '운용중' : '처분',
      usefulLife: `${3 + (idx % 3)}년`,
    }))
  }, [])

  const filteredLedgerData = useMemo(() => {
    return ledgerData.filter((row) => {
      if (filters.g2bName && !row.g2bName.includes(filters.g2bName)) return false
      if (filters.g2bNumberPrefix || filters.g2bNumberSuffix) {
        const [prefix = '', suffix = ''] = row.g2bNumber.split('-')
        if (filters.g2bNumberPrefix && !prefix.startsWith(filters.g2bNumberPrefix)) return false
        if (filters.g2bNumberSuffix && !suffix.startsWith(filters.g2bNumberSuffix)) return false
      }
      if (filters.itemUniqueNumber && !row.itemUniqueNumber.includes(filters.itemUniqueNumber)) return false
      if (filters.operatingDept !== '전체' && row.operatingDept !== filters.operatingDept) return false
      if (filters.operatingStatus !== '전체' && row.operatingStatus !== filters.operatingStatus) return false
      if (filters.acquireDateFrom && row.acquireDate < filters.acquireDateFrom) return false
      if (filters.acquireDateTo && row.acquireDate > filters.acquireDateTo) return false
      if (filters.sortDateFrom && row.sortDate < filters.sortDateFrom) return false
      if (filters.sortDateTo && row.sortDate > filters.sortDateTo) return false
      return true
    })
  }, [ledgerData, filters])

  const ledgerColumns: DataTableColumn<LedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={ledgerCheckedIds.has(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
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

  const handleSave = () => {
    alert('처분 등록이 완료되었습니다.')
    navigate('/asset-management/disposal-management')
  }

  return (
    <AssetManagementPageLayout
      pageKey="disposal"
      depthSecondLabel="물품 관리"
      depthThirdLabel="물품 처분 등록"
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
              onClick={() => {}}
            >
              조회
            </Button>
          </div>
        </div>
      </section>

      <div className="return-registration-ledger-table-wrap">
        <DataTable<LedgerRow>
          pageKey="operation-ledger"
          title="물품 운용 대장 목록"
          data={filteredLedgerData}
          totalCount={filteredLedgerData.length}
          pageSize={10}
          columns={ledgerColumns}
          getRowKey={(row) => row.id}
        />
      </div>

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

      <div className="operation-ledger-detail-content">
        <div className="operation-ledger-detail-header-row">
          <TitlePill>처분 등록 정보</TitlePill>
        </div>
        <section className="operation-ledger-detail-panel return-registration-info-panel">
          <div className="return-registration-info-inner">
            <div className="operation-ledger-detail-grid">
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">처분일자</label>
                <TextField
                  type="date"
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
                <label className="operation-ledger-detail-label">물품상태</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={disposalInfo.assetStatus}
                  onChange={(value: string) =>
                    setDisposalInfo((prev) => ({ ...prev, assetStatus: value }))
                  }
                  options={ASSET_STATUS_OPTIONS}
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">사유</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={disposalInfo.reason}
                  onChange={(value: string) =>
                    setDisposalInfo((prev) => ({ ...prev, reason: value }))
                  }
                  options={REASON_OPTIONS}
                />
              </div>
            </div>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleSave}
            >
              저장
            </Button>
          </div>
        </section>
      </div>
    </AssetManagementPageLayout>
  )
}

export default DisposalRegistrationPage
