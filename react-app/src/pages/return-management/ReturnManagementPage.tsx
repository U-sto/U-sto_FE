import { useMemo, useState } from 'react'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import {
  ManagementPageLayout,
  FilterPanel,
  DataTable,
  type DataTableColumn,
} from '../../components/management'
import './ReturnManagementPage.css'

type Filters = {
  returnDateFrom: string
  returnDateTo: string
  approvalStatus: string
}

type ReturnRegistrationRow = {
  id: number
  returnDate: string
  returnConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

type ReturnItemRow = {
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

const ReturnManagementPage = () => {
  const [filters, setFilters] = useState<Filters>({
    returnDateFrom: '',
    returnDateTo: '',
    approvalStatus: '전체',
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const [returnDateError, setReturnDateError] = useState<string>('')
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  // 전체 데이터 (초기 데이터) - 반납 등록 목록
  const allRegistrationData = useMemo<ReturnRegistrationRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      returnDate: '2026-01-21',
      returnConfirmDate: '2026-01-22',
      registrantId: `user${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      approvalStatus: '대기',
    }))
  }, [])

  // 전체 데이터 (초기 데이터) - 반납 물품 목록
  const allItemData = useMemo<ReturnItemRow[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서 ${idx + 1}`,
      itemStatus: '운용중',
      reason: '반납 사유',
    }))
  }, [])

  // 필터링된 데이터 - 반납 등록 목록
  const filteredRegistrationData = useMemo(() => {
    if (!searchedFilters) {
      return allRegistrationData
    }

    return allRegistrationData.filter((item) => {
      // 반납일자 필터
      if (searchedFilters.returnDateFrom && item.returnDate < searchedFilters.returnDateFrom) {
        return false
      }
      if (searchedFilters.returnDateTo && item.returnDate > searchedFilters.returnDateTo) {
        return false
      }

      // 승인상태 필터
      if (searchedFilters.approvalStatus && searchedFilters.approvalStatus !== '전체') {
        if (item.approvalStatus !== searchedFilters.approvalStatus) {
          return false
        }
      }

      return true
    })
  }, [allRegistrationData, searchedFilters])

  // 필터링된 데이터 - 반납 물품 목록
  const filteredItemData = useMemo(() => {
    // 등록 목록과 연동되도록 할 수도 있지만, 일단 전체 데이터 반환
    return allItemData
  }, [allItemData])

  const validateDateRange = (
    baseDate: string,
    compareDate: string,
    setError: (error: string) => void,
  ) => {
    if (baseDate && compareDate && compareDate < baseDate) {
      setError('비교날짜 이 후의 날짜를 선택해주세요 !')
    } else {
      setError('')
    }
  }

  const onReset = () => {
    setFilters({
      returnDateFrom: '',
      returnDateTo: '',
      approvalStatus: '전체',
    })
    setReturnDateError('')
    setSearchedFilters(null)
  }

  const onSearch = () => {
    // 날짜 유효성 검사
    let hasError = false

    if (filters.returnDateFrom && filters.returnDateTo) {
      validateDateRange(filters.returnDateFrom, filters.returnDateTo, setReturnDateError)
      if (filters.returnDateTo < filters.returnDateFrom) {
        hasError = true
      }
    }

    if (hasError) {
      return
    }

    // 필터 적용
    setSearchedFilters({ ...filters })
  }

  const registrationColumns: DataTableColumn<ReturnRegistrationRow>[] = [
    {
      key: 'id',
      header: '순번',
      width: 100,
      render: (row) => row.id,
    },
    {
      key: 'returnDate',
      header: '반납일자',
      width: 150,
      render: (row) => row.returnDate,
    },
    {
      key: 'returnConfirmDate',
      header: '반납확정일자',
      width: 150,
      render: (row) => row.returnConfirmDate,
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

  const itemColumns: DataTableColumn<ReturnItemRow>[] = [
    {
      key: 'select',
      header: <input type="checkbox" />,
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

  return (
    <ManagementPageLayout
      pageKey="return"
      depthSecondLabel="물품 반납 등록 관리"
    >
      <FilterPanel pageKey="return">
        <div className="return-filter-grid">
                <div className="return-field">
                  <div className="return-label">반납일자</div>
                  <div className="return-date-field-wrapper">
                    <div className="return-date-range">
                      <TextField
                        type="date"
                        value={filters.returnDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, returnDateFrom: e.target.value }))
                          if (filters.returnDateTo) {
                            validateDateRange(e.target.value, filters.returnDateTo, setReturnDateError)
                          }
                        }}
                      />
                      <span className="return-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.returnDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, returnDateTo: e.target.value }))
                          if (filters.returnDateFrom) {
                            validateDateRange(filters.returnDateFrom, e.target.value, setReturnDateError)
                          }
                        }}
                      />
                    </div>
                    {returnDateError && <div className="return-error-text">{returnDateError}</div>}
                  </div>
                </div>

                <div className="return-field">
                  <div className="return-label">승인상태</div>
                  <div className="return-radio-group">
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

        <div className="return-filter-actions">
          <Button className="return-btn return-btn-outline" onClick={onReset}>
            초기화
          </Button>
          <Button className="return-btn return-btn-primary" onClick={onSearch}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<ReturnRegistrationRow>
        pageKey="return"
        title="반납 등록 목록"
        data={filteredRegistrationData}
        totalCount={allRegistrationData.length}
        pageSize={10}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row) => row.id}
      />

      <DataTable<ReturnItemRow>
        pageKey="return"
        title="반납 물품 목록"
        data={filteredItemData}
        totalCount={allItemData.length}
        pageSize={10}
        variant="lower"
        columns={itemColumns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="return-table-actions">
            <Button className="return-btn return-btn-outline return-btn-table">
              반려
            </Button>
            <Button className="return-btn return-btn-primary return-btn-table">
              확정
            </Button>
          </div>
        )}
      />
    </ManagementPageLayout>
  )
}

export default ReturnManagementPage
