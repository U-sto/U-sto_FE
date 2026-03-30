import { useEffect, useMemo, useState } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import { useManagementFilter } from '../../../hooks/useManagementFilter'
import {
  fetchItemDisposalItems,
  fetchItemDisposals,
  confirmItemDisposal,
  rejectItemDisposal,
  type DisposalItemRow,
  type DisposalRegistrationRow as ApiDisposalRegistrationRow,
} from '../../../api/itemDisposals'
import './DisposalManagementPage.css'
import {
  useApprovalStatusFilterOptions,
  resolveApprovalFilterTransferStyle,
} from '../../../hooks/useCommonCodeOptions'

type Filters = {
  disposalDateFrom: string
  disposalDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: Filters = {
  disposalDateFrom: '',
  disposalDateTo: '',
  approvalStatus: '전체',
}

type SelectedRegistration = { dispMId: string }

const DisposalManagementPage = () => {
  const { options: approvalOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()
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
      { fromKey: 'disposalDateFrom', toKey: 'disposalDateTo', errorKey: 'disposalDate' },
    ],
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [registrationData, setRegistrationData] = useState<ApiDisposalRegistrationRow[]>([])
  const [registrationTotalCount, setRegistrationTotalCount] = useState(0)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<SelectedRegistration | null>(null)

  const [itemPage, setItemPage] = useState(1)
  const [itemData, setItemData] = useState<DisposalItemRow[]>([])
  const [itemTotalCount, setItemTotalCount] = useState(0)
  const [itemError, setItemError] = useState<string | null>(null)
  const [checkedDispMIds, setCheckedDispMIds] = useState<Set<string>>(new Set())

  const effectiveFilters = searchedFilters ?? INITIAL_FILTERS

  const apiDisposalFilters = useMemo(
    () => ({
      disposalDateFrom: effectiveFilters.disposalDateFrom,
      disposalDateTo: effectiveFilters.disposalDateTo,
      approvalStatus: resolveApprovalFilterTransferStyle(
        effectiveFilters.approvalStatus,
        approvalDescToCode,
      ),
    }),
    [effectiveFilters, approvalDescToCode],
  )

  useEffect(() => {
    let ignore = false
    setRegistrationError(null)
    ;(async () => {
      try {
        const res = await fetchItemDisposals({
          page: currentPage,
          pageSize: 10,
          filters: apiDisposalFilters,
        })
        if (ignore) return
        setRegistrationData(res.data)
        setRegistrationTotalCount(res.totalCount)
        setSelectedRegistration(null)
        setItemPage(1)
        setItemData([])
        setItemTotalCount(0)
        setCheckedDispMIds(new Set())
      } catch (e) {
        if (ignore) return
        setRegistrationData([])
        setRegistrationTotalCount(0)
        setRegistrationError(
          e instanceof Error ? e.message : '처분 등록 목록을 불러오지 못했습니다.',
        )
      }
    })()
    return () => {
      ignore = true
    }
  }, [currentPage, apiDisposalFilters])

  useEffect(() => {
    let ignore = false
    const dispMId = selectedRegistration?.dispMId
    if (!dispMId) {
      setItemError(null)
      setItemData([])
      setItemTotalCount(0)
      return
    }

    setItemError(null)
    ;(async () => {
      try {
        const res = await fetchItemDisposalItems({
          dispMId,
          page: itemPage,
          pageSize: 10,
        })
        if (ignore) return
        setItemData(res.data)
        setItemTotalCount(res.totalCount)
      } catch (e) {
        if (ignore) return
        setItemData([])
        setItemTotalCount(0)
        setItemError(e instanceof Error ? e.message : '처분 물품 목록을 불러오지 못했습니다.')
      }
    })()

    return () => {
      ignore = true
    }
  }, [itemPage, selectedRegistration?.dispMId])

  const allRegistrationsChecked =
    registrationData.length > 0 && registrationData.every((row) => checkedDispMIds.has(row.dispMId))

  const toggleAllRegistrations = (checked: boolean) => {
    if (!checked) {
      setCheckedDispMIds(new Set())
      return
    }
    setCheckedDispMIds(new Set(registrationData.map((r) => r.dispMId).filter(Boolean)))
  }

  const toggleOneRegistration = (dispMId: string, checked: boolean) => {
    setCheckedDispMIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(dispMId)
      else next.delete(dispMId)
      return next
    })
  }

  // API 응답 row 타입이 동일하지만, 이 페이지에서 사용하는 타입과 맞추기 위해 명시적으로 선언
  const registrationColumns: DataTableColumn<ApiDisposalRegistrationRow>[] = [
    {
      key: 'check',
      header: (
        <input
          type="checkbox"
          checked={allRegistrationsChecked}
          disabled={registrationData.length === 0}
          onChange={(e) => toggleAllRegistrations(e.target.checked)}
          aria-label="전체 선택"
        />
      ),
      width: 56,
      render: (row) => (
        <input
          type="checkbox"
          checked={checkedDispMIds.has(row.dispMId)}
          disabled={!row.dispMId}
          onChange={(e) => toggleOneRegistration(row.dispMId, e.target.checked)}
          aria-label={`선택 ${row.id}`}
        />
      ),
    },
    {
      key: 'select',
      header: '',
      width: 56,
      render: (row) => (
        <input
          type="radio"
          name="disposal-registration-select"
          disabled={!row.dispMId}
          checked={selectedRegistration?.dispMId === row.dispMId}
          onChange={() => {
            setSelectedRegistration({ dispMId: row.dispMId })
            setItemPage(1)
          }}
        />
      ),
    },
    { key: 'id', header: '순번', width: 100, render: (row) => row.id },
    { key: 'disposalDate', header: '처분일자', width: 150, render: (row) => row.disposalDate },
    { key: 'disposalConfirmDate', header: '처분확정일자', width: 150, render: (row) => row.disposalConfirmDate },
    { key: 'registrantId', header: '등록자ID', width: 150, render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', width: 150, render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', width: 100, render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<DisposalItemRow>[] = [
    { key: 'g2bNumber', header: 'G2B목록번호', width: 150, render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', width: 150, render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', width: 150, render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', width: 120, render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', width: 120, render: (row) => row.acquireAmount },
    { key: 'operatingDept', header: '운용부서', width: 120, render: (row) => row.operatingDept },
    { key: 'itemStatus', header: '물품상태', width: 100, render: (row) => row.itemStatus },
    { key: 'reason', header: '사유', width: 150, render: (row) => row.reason },
  ]

  const setDisposalDateError = (err: string) => setDateError('disposalDate', err)

  const handleSearch = () => {
    const ok = onSearch()
    if (ok) setCurrentPage(1)
  }

  const handleReset = () => {
    onReset()
    setCurrentPage(1)
    setSelectedRegistration(null)
    setItemPage(1)
    setItemData([])
    setItemTotalCount(0)
    setCheckedDispMIds(new Set())
  }

  const handleReject = async () => {
    if (checkedDispMIds.size === 0) {
      window.alert('상단 처분 등록 목록에서 반려할 항목을 체크해주세요.')
      return
    }
    try {
      await Promise.all(Array.from(checkedDispMIds).map((id) => rejectItemDisposal(id)))
      window.alert('반려 처리되었습니다.')
      setCheckedDispMIds(new Set())
      setCurrentPage(1)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '반려 처리에 실패했습니다.')
    }
  }

  const handleConfirm = async () => {
    if (checkedDispMIds.size === 0) {
      window.alert('상단 처분 등록 목록에서 확정할 항목을 체크해주세요.')
      return
    }
    try {
      await Promise.all(Array.from(checkedDispMIds).map((id) => confirmItemDisposal(id)))
      window.alert('확정 처리되었습니다.')
      setCheckedDispMIds(new Set())
      setCurrentPage(1)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '확정 처리에 실패했습니다.')
    }
  }

  return (
    <ManagementPageLayout
      pageKey="disposal"
      depthSecondLabel="물품 처분 등록 관리"
    >
      <FilterPanel pageKey="disposal">
        <div className="disposal-filter-grid">
          <div className="disposal-field">
            <div className="disposal-label">처분일자</div>
            <div className="disposal-date-field-wrapper">
              <div className="disposal-date-range">
                <TextField
                  type="date"
                  value={filters.disposalDateFrom}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, disposalDateFrom: e.target.value }))
                    if (filters.disposalDateTo) {
                      validateDateRange(e.target.value, filters.disposalDateTo, setDisposalDateError)
                    }
                  }}
                />
                <span className="disposal-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.disposalDateTo}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, disposalDateTo: e.target.value }))
                    if (filters.disposalDateFrom) {
                      validateDateRange(filters.disposalDateFrom, e.target.value, setDisposalDateError)
                    }
                  }}
                />
              </div>
              {dateErrors.disposalDate && (
                <div className="disposal-error-text">{dateErrors.disposalDate}</div>
              )}
            </div>
          </div>
          <div className="disposal-field">
            <div className="disposal-label">승인상태</div>
            <div className="disposal-radio-group">
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
        <div className="disposal-filter-actions">
          <Button className="disposal-btn disposal-btn-outline" onClick={handleReset}>
            초기화
          </Button>
          <Button className="disposal-btn disposal-btn-primary" onClick={handleSearch}>
            조회
          </Button>
        </div>
      </FilterPanel>

      {registrationError && <div className="disposal-error-text">{registrationError}</div>}

      <DataTable<ApiDisposalRegistrationRow>
        pageKey="disposal"
        title="처분 등록 목록"
        data={registrationData}
        totalCount={registrationTotalCount}
        pageSize={10}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row) => row.id}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        renderActions={() => (
          <div className="disposal-table-actions">
            <Button
              className="disposal-btn disposal-btn-outline disposal-btn-table"
              onClick={handleReject}
              disabled={checkedDispMIds.size === 0}
            >
              반려
            </Button>
            <Button
              className="disposal-btn disposal-btn-primary disposal-btn-table"
              onClick={handleConfirm}
              disabled={checkedDispMIds.size === 0}
            >
              확정
            </Button>
          </div>
        )}
      />
      {itemError && <div className="disposal-error-text">{itemError}</div>}
      <DataTable<DisposalItemRow>
        pageKey="disposal"
        title="처분 물품 목록"
        data={itemData}
        totalCount={itemTotalCount}
        pageSize={10}
        variant="lower"
        columns={itemColumns}
        getRowKey={(row) => row.id}
        currentPage={itemPage}
        onPageChange={setItemPage}
      />
    </ManagementPageLayout>
  )
}

export default DisposalManagementPage
