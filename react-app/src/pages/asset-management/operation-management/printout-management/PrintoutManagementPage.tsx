import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TextField from '../../../../components/common/TextField/TextField'
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
import '../../operation-management/operation-ledger/OperationLedgerPage.css'
import { OPERATING_DEPARTMENT_FILTER_OPTIONS } from '../../../../constants/departments'
import {
  downloadItemAssetsPrintPdf,
  fetchItemAssetsPrint,
  type ItemAssetsPrintFilters,
  type PrintoutListRow,
} from '../../../../api/itemAssets'

type PrintoutFilters = ItemAssetsPrintFilters

const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_FILTER_OPTIONS
const PRINT_STATUS_OPTIONS = ['전체', '미출력', '출력']

type PrintoutRow = PrintoutListRow

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

const INITIAL_FILTERS: PrintoutFilters = {
  g2bName: '',
  g2bNumberPrefix: '',
  g2bNumberSuffix: '',
  itemUniqueNumber: '',
  operatingDept: '전체',
  printStatus: '전체',
  acquireDateFrom: '',
  acquireDateTo: '',
  sortDateFrom: '',
  sortDateTo: '',
}

const PrintoutManagementPage = () => {
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)
  const [filters, setFilters] = useState<PrintoutFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<PrintoutFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<PrintoutRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  /** 물품고유번호(itmNo) 기준 선택 — PDF 출력 요청에 사용 */
  const [checkedItmNos, setCheckedItmNos] = useState<Set<string>>(() => new Set())
  const [printLoading, setPrintLoading] = useState(false)
  /** 늦게 끝난 이전 조회 응답이 최신 결과를 덮어쓰지 않도록 순번으로 무시 */
  const printListRequestSeqRef = useRef(0)

  const loadPrintList = useCallback(async () => {
    const seq = ++printListRequestSeqRef.current
    setListLoading(true)
    try {
      const res = await fetchItemAssetsPrint({
        page: currentPage,
        pageSize: 10,
        filters: searchedFilters,
      })
      if (seq !== printListRequestSeqRef.current) return
      setTableData(res.data)
      setTotalCount(res.totalCount)
    } catch {
      if (seq !== printListRequestSeqRef.current) return
      setTableData([])
      setTotalCount(0)
    } finally {
      if (seq === printListRequestSeqRef.current) {
        setListLoading(false)
      }
    }
  }, [currentPage, searchedFilters])

  useEffect(() => {
    void loadPrintList()
  }, [loadPrintList])

  /** 조회 조건이 바뀌면 선택 초기화 */
  useEffect(() => {
    setCheckedItmNos(new Set())
  }, [searchedFilters])

  const pageItmNos = useMemo(
    () => tableData.map((r) => r.itemUniqueNumber.trim()).filter(Boolean),
    [tableData],
  )
  const allPageChecked =
    pageItmNos.length > 0 && pageItmNos.every((id) => checkedItmNos.has(id))

  const toggleCheckOne = useCallback((itmNo: string) => {
    const id = itmNo.trim()
    if (!id) return
    setCheckedItmNos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCheckAllPage = useCallback(() => {
    setCheckedItmNos((prev) => {
      const next = new Set(prev)
      if (allPageChecked) {
        pageItmNos.forEach((id) => next.delete(id))
      } else {
        pageItmNos.forEach((id) => next.add(id))
      }
      return next
    })
  }, [allPageChecked, pageItmNos])

  const columns: DataTableColumn<PrintoutRow>[] = useMemo(
    () => [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allPageChecked}
          onChange={toggleCheckAllPage}
          disabled={pageItmNos.length === 0}
          aria-label="현재 페이지 전체 선택"
        />
      ),
      render: (row) => {
        const id = row.itemUniqueNumber.trim()
        const disabled = !id
        return (
          <input
            type="checkbox"
            checked={!disabled && checkedItmNos.has(id)}
            disabled={disabled}
            onChange={() => toggleCheckOne(row.itemUniqueNumber)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`물품 ${id || '(번호없음)'} 선택`}
          />
        )
      },
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
      key: 'operatingDept',
      header: '운용부서',
      render: (row) => row.operatingDept,
    },
    {
      key: 'printStatus',
      header: '출력상태',
      render: (row) => row.printStatus,
    },
    {
      key: 'outputTarget',
      header: '출력대상',
      render: (row) => row.outputTarget,
    },
    ],
    [
      allPageChecked,
      checkedItmNos,
      tableData,
      toggleCheckAllPage,
      toggleCheckOne,
    ],
  )

  const handlePrintPdf = async () => {
    const ids = [...checkedItmNos]
    if (ids.length === 0) {
      window.alert('출력할 물품을 체크해 주세요.')
      return
    }
    setPrintLoading(true)
    try {
      await downloadItemAssetsPrintPdf(ids)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '출력에 실패했습니다.')
    } finally {
      setPrintLoading(false)
    }
  }

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

  return (
    <AssetManagementPageLayout
      pageKey="printout"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="출력물 관리"
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
                  setFilters((prev) => ({
                    ...prev,
                    itemUniqueNumber: e.target.value,
                  }))
                }
                placeholder="물품고유번호 입력"
              />
            </div>

            <div className="operation-ledger-field">
              <div className="operation-ledger-label">출력상태</div>
              <div className="operation-ledger-radio-group">
                {PRINT_STATUS_OPTIONS.map((option) => (
                  <label key={option} className="operation-ledger-radio-label">
                    <input
                      type="radio"
                      name="printStatus"
                      value={option}
                      checked={filters.printStatus === option}
                      onChange={() =>
                        setFilters((prev) => ({ ...prev, printStatus: option }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
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

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />

      {listLoading && (
        <p style={{ display: 'none' }} aria-live="polite">
          목록을 불러오는 중…
        </p>
      )}

      <DataTable<PrintoutRow>
        pageKey="operation-ledger"
        title="출력 대상 물품 목록"
        data={tableData}
        totalCount={totalCount}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        columns={columns}
        getRowKey={(row) => `${row.id}-${row.itemUniqueNumber}-${row.g2bNumber}`}
        renderActions={() => (
          <div className="operation-ledger-table-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              disabled={printLoading || checkedItmNos.size === 0}
              onClick={() => void handlePrintPdf()}
            >
              {printLoading ? '출력 중…' : '출력'}
            </Button>
          </div>
        )}
      />
    </AssetManagementPageLayout>
  )
}

export default PrintoutManagementPage

