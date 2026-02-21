import { useCallback, useEffect, useMemo, useState } from 'react'
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
import {
  fetchAcqConfirmationList,
  type AcqConfirmationRow,
} from '../../../api/acqConfirmation'
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

/** AcqTableRow는 AcqConfirmationRow와 동일 - API 타입과 정렬 */
type AcqTableRow = AcqConfirmationRow

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

  /** 서버 사이드 페이지네이션: 현재 페이지 */
  const [currentPage, setCurrentPage] = useState(1)
  /** 서버 사이드 페이지네이션: 테이블 데이터 (API 응답) */
  const [tableData, setTableData] = useState<AcqTableRow[]>([])
  /** 서버 사이드 페이지네이션: 전체 건수 (API 응답) */
  const [totalCount, setTotalCount] = useState(0)

  const pageSize = 10

  /**
   * 백엔드 API에서 필터·페이지네이션 적용 후 결과만 수신 (서버 사이드 필터링).
   * searchedFilters가 null이면 초기 필터(전체)로 조회.
   */
  const loadData = useCallback(async () => {
    const effectiveFilters = searchedFilters ?? INITIAL_FILTERS
    const res = await fetchAcqConfirmationList({
      page: currentPage,
      pageSize,
      filters: effectiveFilters,
    })
    setTableData(res.data)
    setTotalCount(res.totalCount)
  }, [currentPage, searchedFilters])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** 조회 시 첫 페이지로 이동 후 API 재호출 (searchedFilters 변경 → loadData 실행) */
  const handleSearchClick = () => {
    onSearch()
    setCurrentPage(1)
  }

  /** 초기화 시 첫 페이지로 이동 */
  const handleReset = () => {
    onReset()
    setCurrentPage(1)
  }

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
          <Button className="acq-btn acq-btn-outline" onClick={handleReset}>
            초기화
          </Button>
          <Button className="acq-btn acq-btn-primary" onClick={handleSearchClick}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<AcqTableRow>
        pageKey="acq"
        title="물품 취득 대장 목록"
        data={tableData}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
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

