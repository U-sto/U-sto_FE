import { useCallback, useEffect, useMemo, useState } from 'react'
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
  fetchDisuseList,
  fetchDisuseItems,
  adminApproveItemDisuse,
  adminRejectItemDisuse,
  type DisuseRegistrationRow,
  type DisuseItemRow,
} from '../../../api/itemDisuses'
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

const DisuseManagementPage = () => {
  const {
    filters,
    setFilters,
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

  const approvalOptions = ['전체', '대기', '반려', '확정']

  /** 목록 조회 조건·페이지 (취득 확정 관리 페이지와 동일 패턴) */
  const [query, setQuery] = useState<{ page: number; filters: Filters }>({
    page: 1,
    filters: INITIAL_FILTERS,
  })

  const [registrationData, setRegistrationData] = useState<DisuseRegistrationRow[]>([])
  const [registrationTotalCount, setRegistrationTotalCount] = useState(0)

  const [selectedDsuMId, setSelectedDsuMId] = useState<string | null>(null)
  const [selectedDsuMIds, setSelectedDsuMIds] = useState<Set<string>>(() => new Set())
  const [adminActionLoading, setAdminActionLoading] = useState<'approve' | 'reject' | null>(null)

  const [itemPage, setItemPage] = useState(1)
  const [itemData, setItemData] = useState<DisuseItemRow[]>([])
  const [itemTotalCount, setItemTotalCount] = useState(0)

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await fetchDisuseList({
        page: query.page,
        pageSize: 10,
        filters: query.filters,
      })
      setRegistrationData(Array.isArray(res.data) ? res.data : [])
      setRegistrationTotalCount(res.totalCount)
    } catch {
      setRegistrationData([])
      setRegistrationTotalCount(0)
    }
  }, [query])

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  /** 조회 조건이 바뀌면 체크 선택만 초기화 (페이지만 넘길 때는 유지) */
  useEffect(() => {
    setSelectedDsuMIds(new Set())
  }, [query.filters])

  /** 목록 조건·페이지 변경 시 하단 물품 목록 초기화 */
  useEffect(() => {
    setSelectedDsuMId(null)
    setItemData([])
    setItemTotalCount(0)
    setItemPage(1)
  }, [query])

  useEffect(() => {
    if (!selectedDsuMId) {
      setItemData([])
      setItemTotalCount(0)
      return
    }
    let ignore = false
    ;(async () => {
      try {
        const res = await fetchDisuseItems({
          dsuMId: selectedDsuMId,
          page: itemPage,
          pageSize: 10,
        })
        if (ignore) return
        setItemData(Array.isArray(res.data) ? res.data : [])
        setItemTotalCount(res.totalCount)
      } catch {
        if (ignore) return
        setItemData([])
        setItemTotalCount(0)
      }
    })()
    return () => {
      ignore = true
    }
  }, [itemPage, selectedDsuMId])

  const pageDsuMIds = useMemo(
    () => registrationData.map((r) => r.dsuMId).filter((id) => id.length > 0),
    [registrationData],
  )
  const allPageSelected =
    pageDsuMIds.length > 0 && pageDsuMIds.every((id) => selectedDsuMIds.has(id))

  const toggleSelectAllOnPage = () => {
    setSelectedDsuMIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageDsuMIds.forEach((id) => next.delete(id))
      } else {
        pageDsuMIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleRowSelected = (dsuMId: string) => {
    if (!dsuMId) return
    setSelectedDsuMIds((prev) => {
      const next = new Set(prev)
      if (next.has(dsuMId)) next.delete(dsuMId)
      else next.add(dsuMId)
      return next
    })
  }

  const handleAdminReject = async () => {
    const ids = [...selectedDsuMIds]
    if (ids.length === 0) {
      window.alert('반려할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건을 반려하시겠습니까?`)) return
    setAdminActionLoading('reject')
    try {
      for (const id of ids) {
        await adminRejectItemDisuse(id)
      }
      window.alert(`반려 처리되었습니다. (${ids.length}건)`)
      setSelectedDsuMIds(new Set())
      if (selectedDsuMId && ids.includes(selectedDsuMId)) setSelectedDsuMId(null)
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '반려 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(null)
    }
  }

  const handleAdminApprove = async () => {
    const ids = [...selectedDsuMIds]
    if (ids.length === 0) {
      window.alert('승인(확정)할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건을 승인(확정)하시겠습니까?`)) return
    setAdminActionLoading('approve')
    try {
      for (const id of ids) {
        await adminApproveItemDisuse(id)
      }
      window.alert(`승인(확정) 처리되었습니다. (${ids.length}건)`)
      setSelectedDsuMIds(new Set())
      if (selectedDsuMId && ids.includes(selectedDsuMId)) setSelectedDsuMId(null)
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(null)
    }
  }

  const registrationColumns: DataTableColumn<DisuseRegistrationRow>[] = [
    {
      key: 'select',
      stopRowClickPropagation: true,
      width: 56,
      header: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectAllOnPage}
          disabled={pageDsuMIds.length === 0}
          aria-label="현재 페이지 전체 선택"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={row.dsuMId ? selectedDsuMIds.has(row.dsuMId) : false}
          onChange={() => toggleRowSelected(row.dsuMId)}
          onClick={(e) => e.stopPropagation()}
          disabled={!row.dsuMId}
          aria-label={`불용 건 선택 ${row.id}`}
        />
      ),
    },
    { key: 'id', header: '순번', width: 100, render: (row) => row.id },
    { key: 'disuseDate', header: '불용일자', width: 150, render: (row) => row.disuseDate },
    {
      key: 'disuseConfirmDate',
      header: '불용확정일자',
      width: 150,
      render: (row) => row.disuseConfirmDate,
    },
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

  const handleSearchClick = () => {
    if (onSearch()) {
      setQuery({ page: 1, filters: { ...filters } })
    }
  }

  const handleResetClick = () => {
    onReset()
    setQuery({ page: 1, filters: INITIAL_FILTERS })
  }

  const actionBusy = adminActionLoading !== null

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
            <Button className="disuse-btn disuse-btn-outline" onClick={handleResetClick}>
              초기화
            </Button>
            <Button className="disuse-btn disuse-btn-primary" onClick={handleSearchClick}>
              조회
            </Button>
          </div>
        </FilterPanel>

        <DataTable<DisuseRegistrationRow>
          pageKey="disuse"
          title="불용 등록 목록"
          data={registrationData}
          totalCount={registrationTotalCount}
          pageSize={10}
          currentPage={query.page}
          onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
          variant="upper"
          columns={registrationColumns}
          getRowKey={(row, index) => row.dsuMId || `disuse-reg-${row.id}-${index}`}
          onRowClick={(row) => {
            if (!row.dsuMId) return
            setSelectedDsuMId(row.dsuMId)
            setItemPage(1)
          }}
          isRowSelected={(row) => row.dsuMId === selectedDsuMId}
          renderActions={() => (
            <div className="disuse-table-actions">
              <Button
                type="button"
                className="disuse-btn disuse-btn-outline disuse-btn-table"
                disabled={actionBusy || selectedDsuMIds.size === 0}
                onClick={() => void handleAdminReject()}
              >
                {adminActionLoading === 'reject' ? '처리 중…' : '반려'}
              </Button>
              <Button
                type="button"
                className="disuse-btn disuse-btn-primary disuse-btn-table"
                disabled={actionBusy || selectedDsuMIds.size === 0}
                onClick={() => void handleAdminApprove()}
              >
                {adminActionLoading === 'approve' ? '처리 중…' : '확정'}
              </Button>
            </div>
          )}
        />
        <DataTable<DisuseItemRow>
          pageKey="disuse"
          title="불용 물품 목록"
          data={itemData}
          totalCount={itemTotalCount}
          pageSize={10}
          currentPage={itemPage}
          onPageChange={setItemPage}
          variant="lower"
          columns={itemColumns}
          getRowKey={(row, index) => row.itemUniqueNumber || String(row.id ?? index)}
        />
    </ManagementPageLayout>
  )
}

export default DisuseManagementPage
