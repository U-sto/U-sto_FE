import { useMemo } from 'react'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import {
  ManagementPageLayout,
  FilterPanel,
  DataTable,
  type DataTableColumn,
} from '../../components/management'
import { useManagementFilter } from '../../hooks/useManagementFilter'
import './DisuseManagementPage.css'

type Filters = {
  disuseDateFrom: string
  disuseDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: Filters = {
  disuseDateFrom: '',
  disuseDateTo: '',
  approvalStatus: '전체',
}

type DisuseRegistrationRow = {
  id: number
  disuseDate: string
  disuseConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

type DisuseItemRow = {
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

const DisuseManagementPage = () => {
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
      { fromKey: 'disuseDateFrom', toKey: 'disuseDateTo', errorKey: 'disuseDate' },
    ],
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const allRegistrationData = useMemo<DisuseRegistrationRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      disuseDate: '2026-01-21',
      disuseConfirmDate: '2026-01-22',
      registrantId: `user${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      approvalStatus: '대기',
    }))
  }, [])

  const allItemData = useMemo<DisuseItemRow[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서 ${idx + 1}`,
      itemStatus: '운용중',
      reason: '불용 사유',
    }))
  }, [])

  const filteredRegistrationData = useMemo(() => {
    if (!searchedFilters) return allRegistrationData
    return allRegistrationData.filter((item) => {
      if (searchedFilters.disuseDateFrom && item.disuseDate < searchedFilters.disuseDateFrom)
        return false
      if (searchedFilters.disuseDateTo && item.disuseDate > searchedFilters.disuseDateTo)
        return false
      if (searchedFilters.approvalStatus && searchedFilters.approvalStatus !== '전체') {
        if (item.approvalStatus !== searchedFilters.approvalStatus) return false
      }
      return true
    })
  }, [allRegistrationData, searchedFilters])

  const filteredItemData = useMemo(() => allItemData, [allItemData])

  const registrationColumns: DataTableColumn<DisuseRegistrationRow>[] = [
    { key: 'id', header: '순번', width: 100, render: (row) => row.id },
    { key: 'disuseDate', header: '불용일자', width: 150, render: (row) => row.disuseDate },
    { key: 'disuseConfirmDate', header: '불용확정일자', width: 150, render: (row) => row.disuseConfirmDate },
    { key: 'registrantId', header: '등록자ID', width: 150, render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', width: 150, render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', width: 100, render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<DisuseItemRow>[] = [
    { key: 'select', header: <input type="checkbox" />, width: 56, render: () => <input type="checkbox" /> },
    { key: 'g2bNumber', header: 'G2B목록번호', width: 150, render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', width: 150, render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', width: 150, render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', width: 120, render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', width: 120, render: (row) => row.acquireAmount },
    { key: 'operatingDept', header: '운용부서', width: 120, render: (row) => row.operatingDept },
    { key: 'itemStatus', header: '물품상태', width: 100, render: (row) => row.itemStatus },
    { key: 'reason', header: '사유', width: 150, render: (row) => row.reason },
  ]

  const setDisuseDateError = (err: string) => setDateError('disuseDate', err)

  return (
    <ManagementPageLayout
      pageKey="disuse"
      depthSecondLabel="물품 불용 등록 관리"
    >
      <FilterPanel pageKey="disuse">
        <div className="disuse-filter-grid">
          <div className="disuse-field">
            <div className="disuse-label">불용일자</div>
            <div className="disuse-date-field-wrapper">
              <div className="disuse-date-range">
                <TextField
                  type="date"
                  value={filters.disuseDateFrom}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, disuseDateFrom: e.target.value }))
                    if (filters.disuseDateTo) {
                      validateDateRange(e.target.value, filters.disuseDateTo, setDisuseDateError)
                    }
                  }}
                />
                <span className="disuse-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.disuseDateTo}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, disuseDateTo: e.target.value }))
                    if (filters.disuseDateFrom) {
                      validateDateRange(filters.disuseDateFrom, e.target.value, setDisuseDateError)
                    }
                  }}
                />
              </div>
              {dateErrors.disuseDate && (
                <div className="disuse-error-text">{dateErrors.disuseDate}</div>
              )}
            </div>
          </div>
          <div className="disuse-field">
            <div className="disuse-label">승인상태</div>
            <div className="disuse-radio-group">
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
        <div className="disuse-filter-actions">
          <Button className="disuse-btn disuse-btn-outline" onClick={onReset}>
            초기화
          </Button>
          <Button className="disuse-btn disuse-btn-primary" onClick={onSearch}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<DisuseRegistrationRow>
        pageKey="disuse"
        title="불용 등록 목록"
        data={filteredRegistrationData}
        totalCount={allRegistrationData.length}
        pageSize={10}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row) => row.id}
      />
      <DataTable<DisuseItemRow>
        pageKey="disuse"
        title="불용 물품 목록"
        data={filteredItemData}
        totalCount={allItemData.length}
        pageSize={10}
        variant="lower"
        columns={itemColumns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="disuse-table-actions">
            <Button className="disuse-btn disuse-btn-outline disuse-btn-table">반려</Button>
            <Button className="disuse-btn disuse-btn-primary disuse-btn-table">확정</Button>
          </div>
        )}
      />
    </ManagementPageLayout>
  )
}

export default DisuseManagementPage
