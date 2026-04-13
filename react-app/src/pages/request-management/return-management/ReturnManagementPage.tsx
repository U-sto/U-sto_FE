import { useCallback, useEffect, useMemo, useState } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import { useManagementFilter } from '../../../hooks/useManagementFilter'
import { useApprovalStatusFilterOptions } from '../../../hooks/useCommonCodeOptions'
import { useCommonCodeGroup } from '../../../hooks/useCommonCodeGroup'
import { CODE_GROUP, buildCodeToDescriptionMap } from '../../../api/codes'
import {
  fetchItemReturningList,
  fetchItemReturningItems,
  formatReturningDateOnly,
  resolveItemReturningMasterId,
  adminApproveItemReturning,
  adminRejectItemReturning,
  type ItemReturningItem,
  type ItemReturningMaster,
  type ItemReturningSearchRequest,
} from '../../../api/itemReturnings'
import './ReturnManagementPage.css'

type Filters = {
  returnDateFrom: string
  returnDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: Filters = {
  returnDateFrom: '',
  returnDateTo: '',
  approvalStatus: '전체',
}

/** 공통코드 미로딩 시 승인상태 → API 코드 */
const FALLBACK_APPR_DESC_TO_CODE: Record<string, string> = {
  대기: 'WAIT',
  반려: 'REJECT',
  확정: 'CONFIRM',
}

type ReturnRegistrationRow = {
  id: number
  rtrnId: string
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

function buildReturningSearchRequest(
  filters: Filters,
  approvalDescToCode: Record<string, string>,
): ItemReturningSearchRequest {
  const req: ItemReturningSearchRequest = {}
  if (filters.returnDateFrom) req.startAplyAt = filters.returnDateFrom
  if (filters.returnDateTo) req.endAplyAt = filters.returnDateTo
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    const map =
      Object.keys(approvalDescToCode).length > 0
        ? approvalDescToCode
        : FALLBACK_APPR_DESC_TO_CODE
    req.apprSts = map[filters.approvalStatus] ?? filters.approvalStatus
  }
  return req
}

function mapMasterToRow(
  item: ItemReturningMaster,
  index: number,
  offset: number,
  apprCodeToDesc: Record<string, string>,
): ReturnRegistrationRow {
  const rtrnId = resolveItemReturningMasterId(item as ItemReturningMaster & Record<string, unknown>)
  return {
    id: offset + index + 1,
    rtrnId,
    returnDate: formatReturningDateOnly(item.aplyAt),
    returnConfirmDate: formatReturningDateOnly(item.rtrnApprAt),
    registrantId: item.aplyUsrId ?? '',
    registrantName: item.aplyUsrNm ?? '',
    approvalStatus: apprCodeToDesc[item.apprSts] ?? item.apprSts ?? '',
  }
}

function mapItemToRow(
  item: ItemReturningItem,
  index: number,
  offset: number,
  itemStsCodeToDesc: Record<string, string>,
  rtrnRsnCodeToDesc: Record<string, string>,
): ReturnItemRow {
  const upr = item.acqUpr
  return {
    id: offset + index + 1,
    g2bNumber: item.g2bItemNo ?? '',
    g2bName: item.g2bNm ?? '',
    itemUniqueNumber: item.itmNo ?? '',
    acquireDate: formatReturningDateOnly(item.acqAt),
    acquireAmount:
      typeof upr === 'number' && Number.isFinite(upr) ? `${upr.toLocaleString('ko-KR')}원` : '',
    operatingDept: item.deptNm ?? '',
    itemStatus: itemStsCodeToDesc[item.itemSts] ?? item.itemSts ?? '',
    reason: rtrnRsnCodeToDesc[item.rtrnRsn] ?? item.rtrnRsn ?? '',
  }
}

const ReturnManagementPage = () => {
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
      { fromKey: 'returnDateFrom', toKey: 'returnDateTo', errorKey: 'returnDate' },
    ],
  })

  const { options: approvalOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()

  const apprCodeToDesc = useMemo(() => {
    const src =
      Object.keys(approvalDescToCode).length > 0
        ? approvalDescToCode
        : FALLBACK_APPR_DESC_TO_CODE
    const m: Record<string, string> = {}
    for (const [desc, code] of Object.entries(src)) {
      m[code] = desc
    }
    return m
  }, [approvalDescToCode])

  const { group: itemStsGroup } = useCommonCodeGroup(CODE_GROUP.ITEM_STATUS)
  const itemStsCodeToDesc = useMemo(
    () => buildCodeToDescriptionMap(itemStsGroup ?? undefined),
    [itemStsGroup],
  )
  const { group: rtrnRsnGroup } = useCommonCodeGroup(CODE_GROUP.RETURNING_REASON)
  const rtrnRsnCodeToDesc = useMemo(
    () => buildCodeToDescriptionMap(rtrnRsnGroup ?? undefined),
    [rtrnRsnGroup],
  )

  /** 조회·초기화 시에만 갱신 (폼만 수정해도 API 재호출되지 않음) */
  const [appliedListFilters, setAppliedListFilters] = useState<Filters>(INITIAL_FILTERS)

  const [currentRegPage, setCurrentRegPage] = useState(1)
  const [registrationRows, setRegistrationRows] = useState<ReturnRegistrationRow[]>([])
  const [totalRegCount, setTotalRegCount] = useState(0)

  const [selectedRtrnId, setSelectedRtrnId] = useState<string | null>(null)
  const [selectedReturningIds, setSelectedReturningIds] = useState<Set<string>>(() => new Set())
  const [adminActionLoading, setAdminActionLoading] = useState<'approve' | 'reject' | null>(null)

  const [itemPage, setItemPage] = useState(1)
  const [itemRows, setItemRows] = useState<ReturnItemRow[]>([])
  const [totalItemCount, setTotalItemCount] = useState(0)

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await fetchItemReturningList({
        searchRequest: buildReturningSearchRequest(appliedListFilters, approvalDescToCode),
        page: currentRegPage,
        pageSize: 10,
      })
      const offset = (currentRegPage - 1) * 10
      setRegistrationRows(
        res.data.map((item, i) => mapMasterToRow(item, i, offset, apprCodeToDesc)),
      )
      setTotalRegCount(res.totalCount)
    } catch {
      setRegistrationRows([])
      setTotalRegCount(0)
    }
  }, [currentRegPage, appliedListFilters, approvalDescToCode, apprCodeToDesc])

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  useEffect(() => {
    setSelectedRtrnId(null)
    setItemRows([])
    setTotalItemCount(0)
    setItemPage(1)
  }, [appliedListFilters, currentRegPage])

  useEffect(() => {
    if (!selectedRtrnId) {
      setItemRows([])
      setTotalItemCount(0)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchItemReturningItems({
          rtrnId: selectedRtrnId,
          page: itemPage,
          pageSize: 10,
        })
        if (cancelled) return
        const offset = (itemPage - 1) * 10
        setItemRows(
          res.data.map((item, i) =>
            mapItemToRow(item, i, offset, itemStsCodeToDesc, rtrnRsnCodeToDesc),
          ),
        )
        setTotalItemCount(res.totalCount)
      } catch {
        if (!cancelled) {
          setItemRows([])
          setTotalItemCount(0)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedRtrnId, itemPage, itemStsCodeToDesc, rtrnRsnCodeToDesc])

  useEffect(() => {
    setSelectedReturningIds(new Set())
  }, [searchedFilters])

  const pageRtrnIds = useMemo(
    () => registrationRows.map((r) => r.rtrnId).filter((id) => id.length > 0),
    [registrationRows],
  )
  const allPageSelected =
    pageRtrnIds.length > 0 && pageRtrnIds.every((id) => selectedReturningIds.has(id))

  const toggleSelectAllOnPage = () => {
    setSelectedReturningIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageRtrnIds.forEach((id) => next.delete(id))
      } else {
        pageRtrnIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleRowSelected = (rtrnId: string) => {
    if (!rtrnId) return
    setSelectedReturningIds((prev) => {
      const next = new Set(prev)
      if (next.has(rtrnId)) next.delete(rtrnId)
      else next.add(rtrnId)
      return next
    })
  }

  const handleAdminReject = async () => {
    const ids = [...selectedReturningIds]
    if (ids.length === 0) {
      window.alert('반려할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건을 반려하시겠습니까?`)) return
    setAdminActionLoading('reject')
    try {
      for (const id of ids) {
        await adminRejectItemReturning(id)
      }
      window.alert(`반려 처리되었습니다. (${ids.length}건)`)
      setSelectedReturningIds(new Set())
      if (selectedRtrnId && ids.includes(selectedRtrnId)) setSelectedRtrnId(null)
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '반려 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(null)
    }
  }

  const handleAdminApprove = async () => {
    const ids = [...selectedReturningIds]
    if (ids.length === 0) {
      window.alert('승인(확정)할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건을 승인(확정)하시겠습니까?`)) return
    setAdminActionLoading('approve')
    try {
      for (const id of ids) {
        await adminApproveItemReturning(id)
      }
      window.alert(`승인(확정) 처리되었습니다. (${ids.length}건)`)
      setSelectedReturningIds(new Set())
      if (selectedRtrnId && ids.includes(selectedRtrnId)) setSelectedRtrnId(null)
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(null)
    }
  }

  const registrationColumns: DataTableColumn<ReturnRegistrationRow>[] = [
    {
      key: 'select',
      stopRowClickPropagation: true,
      header: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectAllOnPage}
          disabled={pageRtrnIds.length === 0}
          aria-label="현재 페이지 전체 선택"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={row.rtrnId ? selectedReturningIds.has(row.rtrnId) : false}
          onChange={() => toggleRowSelected(row.rtrnId)}
          onClick={(e) => e.stopPropagation()}
          disabled={!row.rtrnId}
          aria-label={`반납 건 선택 ${row.id}`}
        />
      ),
    },
    { key: 'id', header: '순번', width: 100, render: (row) => row.id },
    { key: 'returnDate', header: '반납일자', width: 150, render: (row) => row.returnDate },
    {
      key: 'returnConfirmDate',
      header: '반납확정일자',
      width: 150,
      render: (row) => row.returnConfirmDate,
    },
    { key: 'registrantId', header: '등록자ID', width: 150, render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', width: 150, render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', width: 100, render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<ReturnItemRow>[] = [
    { key: 'select', header: '', width: 56, render: () => <input type="checkbox" /> },
    { key: 'g2bNumber', header: 'G2B목록번호', width: 150, render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', width: 150, render: (row) => row.g2bName },
    {
      key: 'itemUniqueNumber',
      header: '물품고유번호',
      width: 150,
      render: (row) => row.itemUniqueNumber,
    },
    { key: 'acquireDate', header: '취득일자', width: 120, render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', width: 120, render: (row) => row.acquireAmount },
    { key: 'operatingDept', header: '운용부서', width: 120, render: (row) => row.operatingDept },
    { key: 'itemStatus', header: '물품상태', width: 100, render: (row) => row.itemStatus },
    { key: 'reason', header: '사유', width: 150, render: (row) => row.reason },
  ]

  const setReturnDateError = (err: string) => setDateError('returnDate', err)

  const handleSearchClick = () => {
    if (onSearch()) {
      setCurrentRegPage(1)
      setAppliedListFilters({ ...filters })
    }
  }

  const handleResetClick = () => {
    onReset()
    setCurrentRegPage(1)
    setAppliedListFilters(INITIAL_FILTERS)
  }

  const actionBusy = adminActionLoading !== null

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
                <DatePickerField
                  value={filters.returnDateFrom}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, returnDateFrom: e.target.value }))
                    if (filters.returnDateTo) {
                      validateDateRange(e.target.value, filters.returnDateTo, setReturnDateError)
                    }
                  }}
                />
                <span className="return-date-sep">~</span>
                <DatePickerField
                  value={filters.returnDateTo}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, returnDateTo: e.target.value }))
                    if (filters.returnDateFrom) {
                      validateDateRange(filters.returnDateFrom, e.target.value, setReturnDateError)
                    }
                  }}
                />
              </div>
              {dateErrors.returnDate && (
                <div className="return-error-text">{dateErrors.returnDate}</div>
              )}
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
                  onChange={(value) => setFilters((p) => ({ ...p, approvalStatus: value }))}
                  label={option}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="return-filter-actions">
          <Button className="return-btn return-btn-outline" onClick={handleResetClick}>
            초기화
          </Button>
          <Button className="return-btn return-btn-primary" onClick={handleSearchClick}>
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<ReturnRegistrationRow>
        pageKey="return"
        title="반납 등록 목록"
        data={registrationRows}
        totalCount={totalRegCount}
        pageSize={10}
        currentPage={currentRegPage}
        onPageChange={setCurrentRegPage}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row, index) => row.rtrnId || `return-reg-${row.id}-${index}`}
        onRowClick={(row) => {
          if (!row.rtrnId) return
          setSelectedRtrnId(row.rtrnId)
          setItemPage(1)
        }}
        isRowSelected={(row) => row.rtrnId === selectedRtrnId}
        renderActions={() => (
          <div className="return-table-actions">
            <Button
              type="button"
              className="return-btn return-btn-outline return-btn-table"
              disabled={actionBusy || selectedReturningIds.size === 0}
              onClick={() => void handleAdminReject()}
            >
              {adminActionLoading === 'reject' ? '처리 중…' : '반려'}
            </Button>
            <Button
              type="button"
              className="return-btn return-btn-primary return-btn-table"
              disabled={actionBusy || selectedReturningIds.size === 0}
              onClick={() => void handleAdminApprove()}
            >
              {adminActionLoading === 'approve' ? '처리 중…' : '확정'}
            </Button>
          </div>
        )}
      />
      <DataTable<ReturnItemRow>
        pageKey="return"
        title="반납 물품 목록"
        data={itemRows}
        totalCount={totalItemCount}
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

export default ReturnManagementPage
