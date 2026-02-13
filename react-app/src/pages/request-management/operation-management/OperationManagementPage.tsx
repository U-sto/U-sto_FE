import { useMemo } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import { useManagementFilter } from '../../../hooks/useManagementFilter'
import './OperationManagementPage.css'

type Filters = {
  operationDateFrom: string
  operationDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: Filters = {
  operationDateFrom: '',
  operationDateTo: '',
  approvalStatus: '전체',
}

type OperationRegistrationRow = {
  id: number
  operationDate: string
  operationConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

type OperationItemRow = {
  id: number
  g2bNumber: string
  g2bName: string
  itemUniqueNumber: string
  acquireDate: string
  acquireAmount: string
  operatingDept: string
  itemStatus: string
  reason: string
}

const OperationManagementPage = () => {
  const {
    filters,
    setFilters,
    searchedFilters,
    dateErrors,
    setDateError,
    validateDateRange,
    onReset,
    onSearch,
  } = useManagementFilter<Filters>({
    initialFilters: INITIAL_FILTERS,
    dateRanges: [
      {
        fromKey: 'operationDateFrom',
        toKey: 'operationDateTo',
        errorKey: 'operationDate',
      },
    ],
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const allRegistrationData = useMemo<OperationRegistrationRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      operationDate: '2026-01-21',
      operationConfirmDate: '2026-01-22',
      registrantId: `user${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      approvalStatus: '대기',
    }))
  }, [])

  const allItemData = useMemo<OperationItemRow[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서 ${idx + 1}`,
      itemStatus: '운용중',
      reason: '운용 사유',
    }))
  }, [])

  const filteredRegistrationData = useMemo(() => {
    if (!searchedFilters) return allRegistrationData
    return allRegistrationData.filter((item) => {
      if (
        searchedFilters.operationDateFrom &&
        item.operationDate < searchedFilters.operationDateFrom
      )
        return false
      if (
        searchedFilters.operationDateTo &&
        item.operationDate > searchedFilters.operationDateTo
      )
        return false
      if (
        searchedFilters.approvalStatus &&
        searchedFilters.approvalStatus !== '전체'
      ) {
        if (item.approvalStatus !== searchedFilters.approvalStatus)
          return false
      }
      return true
    })
  }, [allRegistrationData, searchedFilters])

  const filteredItemData = useMemo(() => allItemData, [allItemData])

  const registrationColumns: DataTableColumn<OperationRegistrationRow>[] = [
    { key: 'id', header: '순번', width: 100, render: (row) => row.id },
    {
      key: 'operationDate',
      header: '운용일자',
      width: 150,
      render: (row) => row.operationDate,
    },
    {
      key: 'operationConfirmDate',
      header: '운용확정일자',
      width: 150,
      render: (row) => row.operationConfirmDate,
    },
    {
      key: 'registrantId',
      header: '등록자ID',
      width: 150,
      render: (row) => row.registrantId,
    },
    {
      key: 'registrantName',
      header: '등록자명',
      width: 150,
      render: (row) => row.registrantName,
    },
    {
      key: 'approvalStatus',
      header: '승인상태',
      width: 100,
      render: (row) => row.approvalStatus,
    },
  ]

  const itemColumns: DataTableColumn<OperationItemRow>[] = [
    {
      key: 'select',
      header: '',
      width: 56,
      render: () => <input type="checkbox" />,
    },
    {
      key: 'g2bNumber',
      header: 'G2B목록번호',
      width: 150,
      render: (row) => row.g2bNumber,
    },
    {
      key: 'g2bName',
      header: 'G2B목록명',
      width: 150,
      render: (row) => row.g2bName,
    },
    {
      key: 'itemUniqueNumber',
      header: '물품고유번호',
      width: 150,
      render: (row) => row.itemUniqueNumber,
    },
    {
      key: 'acquireDate',
      header: '취득일자',
      width: 120,
      render: (row) => row.acquireDate,
    },
    {
      key: 'acquireAmount',
      header: '취득금액',
      width: 120,
      render: (row) => row.acquireAmount,
    },
    {
      key: 'operatingDept',
      header: '운용부서',
      width: 120,
      render: (row) => row.operatingDept,
    },
    {
      key: 'itemStatus',
      header: '물품상태',
      width: 100,
      render: (row) => row.itemStatus,
    },
    {
      key: 'reason',
      header: '사유',
      width: 150,
      render: (row) => row.reason,
    },
  ]

  const setOperationDateError = (err: string) =>
    setDateError('operationDate', err)

  return (
    <ManagementPageLayout
      pageKey="operation"
      depthSecondLabel="물품 운용 등록 관리"
    >
      <FilterPanel pageKey="operation">
        <div className="operation-filter-grid">
          <div className="operation-field">
            <div className="operation-label">운용일자</div>
            <div className="operation-date-field-wrapper">
              <div className="operation-date-range">
                <TextField
                  type="date"
                  value={filters.operationDateFrom}
                  onChange={(e) => {
                    setFilters((p) => ({
                      ...p,
                      operationDateFrom: e.target.value,
                    }))
                    if (filters.operationDateTo) {
                      validateDateRange(
                        e.target.value,
                        filters.operationDateTo,
                        setOperationDateError
                      )
                    }
                  }}
                />
                <span className="operation-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.operationDateTo}
                  onChange={(e) => {
                    setFilters((p) => ({
                      ...p,
                      operationDateTo: e.target.value,
                    }))
                    if (filters.operationDateFrom) {
                      validateDateRange(
                        filters.operationDateFrom,
                        e.target.value,
                        setOperationDateError
                      )
                    }
                  }}
                />
              </div>
              {dateErrors.operationDate && (
                <div className="operation-error-text">
                  {dateErrors.operationDate}
                </div>
              )}
            </div>
          </div>
          <div className="operation-field">
            <div className="operation-label">승인상태</div>
            <div className="operation-radio-group">
              {approvalOptions.map((option) => (
                <RadioButton
                  key={option}
                  name="approvalStatus"
                  value={option}
                  checked={filters.approvalStatus === option}
                  onChange={(value) =>
                    setFilters((p) => ({ ...p, approvalStatus: value }))
                  }
                  label={option}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="operation-filter-actions">
          <Button
            className="operation-btn operation-btn-outline"
            onClick={onReset}
          >
            초기화
          </Button>
          <Button
            className="operation-btn operation-btn-primary"
            onClick={onSearch}
          >
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<OperationRegistrationRow>
        pageKey="operation"
        title="운용 등록 목록"
        data={filteredRegistrationData}
        totalCount={allRegistrationData.length}
        pageSize={10}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row) => row.id}
      />
      <DataTable<OperationItemRow>
        pageKey="operation"
        title="운용 물품 목록"
        data={filteredItemData}
        totalCount={allItemData.length}
        pageSize={10}
        variant="lower"
        columns={itemColumns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="operation-table-actions">
            <Button className="operation-btn operation-btn-outline operation-btn-table">
              반려
            </Button>
            <Button className="operation-btn operation-btn-primary operation-btn-table">
              확정
            </Button>
          </div>
        )}
      />
    </ManagementPageLayout>
  )
}

export default OperationManagementPage
