import { useMemo } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import { useManagementFilter } from '../../../hooks/useManagementFilter'
import './AcqConfirmationPage.css'

type Filters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  category: string
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
  category: '',
}

type AcqTableRow = {
  id: number
  g2bNumber: string
  g2bName: string
  acquireDate: string
  acquireAmount: string
  sortDate: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
  quantity: number
  approvalStatus: string
}

const AcqConfirmationPage = () => {
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
      { fromKey: 'sortDateFrom', toKey: 'sortDateTo', errorKey: 'sortDate' },
      { fromKey: 'acquireDateFrom', toKey: 'acquireDateTo', errorKey: 'acquireDate' },
    ],
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])
  const categoryOptions = useMemo(() => ['전체', '취득', '기타'], [])

  const g2bOptions = useMemo(
    () => [
      { name: '노트북', number: '43211613-26081535' },
      { name: '데스크탑', number: '43211614-26081536' },
      { name: '프로젝터', number: '43211615-26081537' },
      { name: '회의실 의자', number: '43211616-26081538' },
    ],
    [],
  )

  // 전체 데이터 (초기 데이터)
  const allTableData = useMemo<AcqTableRow[]>(() => {
    return Array.from({ length: 15 }).map((_, idx) => {
      const g2bOption = g2bOptions[idx % g2bOptions.length]
      // 같은 G2B목록명은 같은 목록번호를 사용
      const g2bNumber = g2bOption.number

      return {
        id: idx + 1,
        g2bNumber,
        g2bName: g2bOption.name,
        acquireDate: '2026-01-21',
        acquireAmount: (1000000 * (idx + 1)).toLocaleString() + '원',
        sortDate: '2026-01-21',
        operatingDept: `운용부서 ${idx + 1}`,
        operatingStatus: '운용중',
        usefulLife: `${5 + idx}년`,
        quantity: idx + 1,
        approvalStatus: '대기',
      }
    })
  }, [g2bOptions])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!searchedFilters) {
      return allTableData
    }

    return allTableData.filter((item) => {
      // G2B목록명 필터
      if (searchedFilters.g2bName && item.g2bName !== searchedFilters.g2bName) {
        return false
      }

      // G2B목록번호 필터 (범위)
      if (searchedFilters.g2bNumberFrom || searchedFilters.g2bNumberTo) {
        const itemNumber = item.g2bNumber
        // 43211613-26081535 형식에서 앞부분 숫자 추출
        const itemNumberParts = itemNumber.split('-')
        const itemNumberValue = itemNumberParts.length > 0 ? itemNumberParts[0] : ''
        
        // 범위 필터링
        if (searchedFilters.g2bNumberFrom && searchedFilters.g2bNumberTo) {
          // 범위가 지정된 경우
          const fromNum = parseInt(searchedFilters.g2bNumberFrom, 10)
          const toNum = parseInt(searchedFilters.g2bNumberTo, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum < fromNum || itemNum > toNum) {
            return false
          }
        } else if (searchedFilters.g2bNumberFrom) {
          // 시작값만 있는 경우
          const fromNum = parseInt(searchedFilters.g2bNumberFrom, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum < fromNum) {
            return false
          }
        } else if (searchedFilters.g2bNumberTo) {
          // 종료값만 있는 경우
          const toNum = parseInt(searchedFilters.g2bNumberTo, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum > toNum) {
            return false
          }
        }
      }

      // 정리일자 필터
      if (searchedFilters.sortDateFrom && item.sortDate < searchedFilters.sortDateFrom) {
        return false
      }
      if (searchedFilters.sortDateTo && item.sortDate > searchedFilters.sortDateTo) {
        return false
      }

      // 취득일자 필터
      if (searchedFilters.acquireDateFrom && item.acquireDate < searchedFilters.acquireDateFrom) {
        return false
      }
      if (searchedFilters.acquireDateTo && item.acquireDate > searchedFilters.acquireDateTo) {
        return false
      }

      // 승인상태 필터
      if (searchedFilters.approvalStatus && searchedFilters.approvalStatus !== '전체') {
        if (item.approvalStatus !== searchedFilters.approvalStatus) {
          return false
        }
      }

      // 운용부서 필터
      if (searchedFilters.category && searchedFilters.category !== '전체') {
        // 운용부서 필터링 로직 (필요시 추가)
      }

      return true
    })
  }, [allTableData, searchedFilters])

  const setSortDateError = (err: string) => setDateError('sortDate', err)
  const setAcquireDateError = (err: string) => setDateError('acquireDate', err)

  const columns: DataTableColumn<AcqTableRow>[] = [
    {
      key: 'select',
      header: '',
      width: 56,
      render: () => <input type="checkbox" />,
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
      render: (row) => row.acquireAmount,
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
                <div className="acq-field">
                  <div className="acq-label">G2B목록명</div>
                  <Dropdown
                    size="small"
                    placeholder="목록명을 선택하세요"
                    value={filters.g2bName}
                    onChange={(value: string) => {
                      const matched = g2bOptions.find((opt) => opt.name === value)
                      if (matched) {
                        const parts = matched.number.split('-')
                        const numberPart = parts.length > 0 ? parts[0] : ''
                        setFilters((p) => ({
                          ...p,
                          g2bName: value,
                          g2bNumberFrom: numberPart,
                          g2bNumberTo: numberPart,
                        }))
                      } else {
                        setFilters((p) => ({
                          ...p,
                          g2bName: value,
                          g2bNumberFrom: '',
                          g2bNumberTo: '',
                        }))
                      }
                    }}
                    options={g2bOptions.map((opt) => opt.name)}
                  />
                </div>

                <div className="acq-field">
                  <div className="acq-label">운용부서</div>
                  <Dropdown
                    size="small"
                    placeholder="선택"
                    value={filters.category}
                    onChange={(value: string) => setFilters((p) => ({ ...p, category: value }))}
                    options={categoryOptions}
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
                      <TextField
                        type="date"
                        value={filters.sortDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, sortDateFrom: e.target.value }))
                          if (filters.sortDateTo) {
                            validateDateRange(e.target.value, filters.sortDateTo, setSortDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <TextField
                        type="date"
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
                      <TextField
                        type="date"
                        value={filters.acquireDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, acquireDateFrom: e.target.value }))
                          if (filters.acquireDateTo) {
                            validateDateRange(e.target.value, filters.acquireDateTo, setAcquireDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <TextField
                        type="date"
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
          <Button className="acq-btn acq-btn-outline" onClick={onReset}>
            초기화
          </Button>
          <Button className="acq-btn acq-btn-primary" onClick={onSearch}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<AcqTableRow>
        pageKey="acq"
        title="물품 취득 대장 목록"
        data={filteredData}
        totalCount={allTableData.length}
        pageSize={10}
        columns={columns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <Button className="acq-btn acq-btn-primary acq-btn-small">확정</Button>
        )}
      />
    </ManagementPageLayout>
  )
}

export default AcqConfirmationPage

