import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApprovalStatusFilterOptions } from '../../../../hooks/useCommonCodeOptions'
import { useCommonCodeGroup } from '../../../../hooks/useCommonCodeGroup'
import { CODE_GROUP, buildCodeToDescriptionMap } from '../../../../api/codes'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import DeleteConfirmModal from '../../../../components/common/DeleteConfirmModal/DeleteConfirmModal'
import {
  fetchItemReturningList,
  fetchItemReturningItems,
  formatReturningDateOnly,
  requestItemReturningApproval,
  cancelItemReturningRequest,
  deleteItemReturning,
  resolveItemReturningMasterId,
  type ItemReturningItem,
  type ItemReturningMaster,
  type ItemReturningSearchRequest,
} from '../../../../api/itemReturnings'
import '../operation-ledger/OperationLedgerPage.css'
import './ReturnManagementPage.css'

type ReturnFilters = {
  returnDateFrom: string
  returnDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: ReturnFilters = {
  returnDateFrom: '',
  returnDateTo: '',
  approvalStatus: '전체',
}

/** 공통코드 미로딩 시 승인상태 → API 코드 (스웨거 apprSts 예: WAIT) */
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
  filters: ReturnFilters,
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
  const navigate = useNavigate()
  const { options: approvalStatusOptions, descToCode: approvalDescToCode } =
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

  const [filters, setFilters] = useState<ReturnFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<ReturnFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentRegPage, setCurrentRegPage] = useState(1)
  const [registrationRows, setRegistrationRows] = useState<ReturnRegistrationRow[]>([])
  const [totalRegCount, setTotalRegCount] = useState(0)

  const [selectedRtrnId, setSelectedRtrnId] = useState<string | null>(null)
  /** 반납 등록 목록 — 승인요청·요청취소·삭제용 체크 선택 */
  const [selectedReturningIds, setSelectedReturningIds] = useState<Set<string>>(() => new Set())
  const [approvalRequesting, setApprovalRequesting] = useState(false)
  const [requestCanceling, setRequestCanceling] = useState(false)
  const [deletingReturning, setDeletingReturning] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [itemPage, setItemPage] = useState(1)
  const [itemRows, setItemRows] = useState<ReturnItemRow[]>([])
  const [totalItemCount, setTotalItemCount] = useState(0)

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await fetchItemReturningList({
        searchRequest: buildReturningSearchRequest(searchedFilters, approvalDescToCode),
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
  }, [currentRegPage, searchedFilters, approvalDescToCode, apprCodeToDesc])

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  /** 상단 목록 조건·페이지 변경 시 하단 선택 해제 */
  useEffect(() => {
    setSelectedRtrnId(null)
    setItemRows([])
    setTotalItemCount(0)
    setItemPage(1)
  }, [searchedFilters, currentRegPage])

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

  /** 조회 조건만 바뀔 때 반납 등록 목록 체크 초기화 */
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

  const registrationColumns: DataTableColumn<ReturnRegistrationRow>[] = [
    {
      key: 'select',
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
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'returnDate', header: '반납일자', render: (row) => row.returnDate },
    { key: 'returnConfirmDate', header: '반납확정일자', render: (row) => row.returnConfirmDate },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<ReturnItemRow>[] = [
    { key: 'select', header: '', render: () => <input type="checkbox" /> },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'itemStatus', header: '물품상태', render: (row) => row.itemStatus },
    { key: 'reason', header: '사유', render: (row) => row.reason },
  ]

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setCurrentRegPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setCurrentRegPage(1)
  }

  const handleEdit = () => {
    if (selectedReturningIds.size !== 1) {
      window.alert('수정할 건을 1건만 선택해 주세요.')
      return
    }
    const only = [...selectedReturningIds][0]
    if (!only) return
    navigate(
      `/asset-management/operation-management/return-management/edit/${encodeURIComponent(only)}`,
    )
  }

  const actionInProgress =
    approvalRequesting || requestCanceling || deletingReturning

  const handleApprovalRequest = async () => {
    const ids = [...selectedReturningIds]
    if (ids.length === 0) {
      window.alert('승인 요청할 건을 체크해 주세요.')
      return
    }
    setApprovalRequesting(true)
    try {
      for (const id of ids) {
        await requestItemReturningApproval(id)
      }
      window.alert(`승인 요청이 완료되었습니다. (${ids.length}건)`)
      setSelectedReturningIds(new Set())
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 요청에 실패했습니다.')
    } finally {
      setApprovalRequesting(false)
    }
  }

  const handleRequestCancel = async () => {
    const ids = [...selectedReturningIds]
    if (ids.length === 0) {
      window.alert('요청 취소할 건을 체크해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건의 승인 요청을 취소하시겠습니까?`)) {
      return
    }
    setRequestCanceling(true)
    try {
      for (const id of ids) {
        await cancelItemReturningRequest(id)
      }
      window.alert(`요청 취소가 완료되었습니다. (${ids.length}건)`)
      setSelectedReturningIds(new Set())
      if (selectedRtrnId && ids.includes(selectedRtrnId)) {
        setSelectedRtrnId(null)
      }
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '요청 취소에 실패했습니다.')
    } finally {
      setRequestCanceling(false)
    }
  }

  const handleOpenDeleteModal = () => {
    const ids = [...selectedReturningIds]
    if (ids.length === 0) {
      window.alert('삭제할 건을 체크해 주세요.')
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteReturning = async () => {
    const ids = [...selectedReturningIds]
    setDeleteConfirmOpen(false)
    if (ids.length === 0) return
    setDeletingReturning(true)
    try {
      for (const id of ids) {
        await deleteItemReturning(id)
      }
      window.alert(`삭제가 완료되었습니다. (${ids.length}건)`)
      setSelectedReturningIds(new Set())
      if (selectedRtrnId && ids.includes(selectedRtrnId)) {
        setSelectedRtrnId(null)
      }
      await loadRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingReturning(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="return"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="물품 반납 관리"
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">반납일자</div>
              <div className="operation-ledger-date-range">
                <TextField
                  type="date"
                  value={filters.returnDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, returnDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.returnDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, returnDateTo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="operation-ledger-field">
              <div className="operation-ledger-label">승인상태</div>
              <div className="operation-ledger-radio-group">
                {approvalStatusOptions.map((option) => (
                  <label key={option} className="operation-ledger-radio-label">
                    <input
                      type="radio"
                      name="approvalStatus"
                      value={option}
                      checked={filters.approvalStatus === option}
                      onChange={() =>
                        setFilters((prev) => ({ ...prev, approvalStatus: option }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
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

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleDeleteReturning()}
        confirmDisabled={deletingReturning}
        extraMessage={
          <>
            선택한 <strong>{selectedReturningIds.size}건</strong>을 삭제합니다.
            <br />
            <span className="delete-confirm-modal__hint">(작성중 상태만 삭제 가능합니다.)</span>
          </>
        }
      />

      <DataTable<ReturnRegistrationRow>
        pageKey="operation-ledger"
        title="반납 등록 목록"
        data={registrationRows}
        totalCount={totalRegCount}
        pageSize={10}
        currentPage={currentRegPage}
        onPageChange={setCurrentRegPage}
        columns={registrationColumns}
        getRowKey={(row, index) => row.rtrnId || `return-reg-${row.id}-${index}`}
        onRowClick={(row) => {
          if (!row.rtrnId) return
          setSelectedRtrnId(row.rtrnId)
          setItemPage(1)
        }}
        isRowSelected={(row) => row.rtrnId === selectedRtrnId}
        renderActions={() => (
          <div className="return-registration-actions">
            <button
              type="button"
              className="return-btn-modify"
              disabled={actionInProgress}
              onClick={() => void handleEdit()}
            >
              수정
            </button>
            <button
              type="button"
              className="return-btn-delete"
              disabled={actionInProgress}
              onClick={handleOpenDeleteModal}
            >
              {deletingReturning ? '삭제 중…' : '삭제'}
            </button>
            <button
              type="button"
              className="return-btn-approval-request"
              disabled={actionInProgress || selectedReturningIds.size === 0}
              onClick={() => void handleApprovalRequest()}
            >
              {approvalRequesting ? '요청 중…' : '승인요청'}
            </button>
            <button
              type="button"
              className="return-btn-request-cancel"
              disabled={actionInProgress || selectedReturningIds.size === 0}
              onClick={() => void handleRequestCancel()}
            >
              {requestCanceling ? '취소 중…' : '요청취소'}
            </button>
            <button
              type="button"
              className="return-btn-register"
              onClick={() => navigate('/asset-management/operation-management/return-management/register')}
            >
              등록
            </button>
          </div>
        )}
      />

      <DataTable<ReturnItemRow>
        pageKey="operation-ledger"
        title="반납 물품 목록"
        data={itemRows}
        totalCount={totalItemCount}
        pageSize={10}
        currentPage={itemPage}
        onPageChange={setItemPage}
        columns={itemColumns}
        getRowKey={(row, index) => row.itemUniqueNumber || String(row.id ?? index)}
      />
    </AssetManagementPageLayout>
  )
}

export default ReturnManagementPage
