import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import DatePickerField from '../../../../components/common/DatePickerField/DatePickerField'
import Button from '../../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import {
  fetchOperationTransferRegistrations,
  fetchOperationTransferItems,
  requestItemOperationApproval,
  cancelItemOperationRequest,
  deleteItemOperation,
  type OperationTransferListFilters,
  type OperationTransferRegistrationRow,
  type OperationTransferItemRow,
} from '../../../../api/itemOperations'
import type { OperationTransferEditLocationState } from './OperationTransferRegistrationPage'
import '../operation-ledger/OperationLedgerPage.css'
import '../return-management/ReturnManagementPage.css'
import {
  useApprovalStatusFilterOptions,
  resolveApprovalFilterTransferStyle,
} from '../../../../hooks/useCommonCodeOptions'

const INITIAL_FILTERS: OperationTransferListFilters = {
  transferDateFrom: '',
  transferDateTo: '',
  approvalStatus: '전체',
}

/** 스웨거: 작성중(WAIT)만 삭제 — 화면 라벨은 보통 '대기' */
function isOperationWaitDraftStatus(approvalStatus: string): boolean {
  const s = approvalStatus.trim()
  return s === '대기' || s === 'WAIT' || s === '작성중'
}

const OperationTransferPage = () => {
  const navigate = useNavigate()
  const { options: approvalStatusOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()
  const [filters, setFilters] = useState<OperationTransferListFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<OperationTransferListFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [registrationData, setRegistrationData] = useState<OperationTransferRegistrationRow[]>([])
  const [registrationTotal, setRegistrationTotal] = useState(0)

  /** 체크한 운용 등록 ID — 승인요청 등 일괄 처리 */
  const [checkedOperMIds, setCheckedOperMIds] = useState<Set<string>>(() => new Set())
  /** 하단 물품 목록 조회용 (체크 시 마지막으로 체크한 행 우선) */
  const [selectedOperMId, setSelectedOperMId] = useState<string | null>(null)
  const [itemPage, setItemPage] = useState(1)
  const [approvalRequestLoading, setApprovalRequestLoading] = useState(false)
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false)
  const [deleteOperationLoading, setDeleteOperationLoading] = useState(false)
  const [itemData, setItemData] = useState<OperationTransferItemRow[]>([])
  const [itemTotal, setItemTotal] = useState(0)

  const apiSearchedFilters = useMemo(
    () => ({
      ...searchedFilters,
      approvalStatus: resolveApprovalFilterTransferStyle(
        searchedFilters.approvalStatus,
        approvalDescToCode,
      ),
    }),
    [searchedFilters, approvalDescToCode],
  )

  const loadRegistrationList = useCallback(async () => {
    try {
      const res = await fetchOperationTransferRegistrations({
        page: currentPage,
        pageSize: 10,
        filters: apiSearchedFilters,
      })
      setRegistrationData(res.data)
      setRegistrationTotal(res.totalCount)
    } catch {
      setRegistrationData([])
      setRegistrationTotal(0)
    }
  }, [currentPage, apiSearchedFilters])

  useEffect(() => {
    void loadRegistrationList()
  }, [loadRegistrationList])

  /** 등록 목록 페이지·조회가 바뀌면 선택 해제 */
  useEffect(() => {
    setSelectedOperMId(null)
    setCheckedOperMIds(new Set())
    setItemPage(1)
  }, [currentPage, searchedFilters])

  const loadItemList = useCallback(async () => {
    if (!selectedOperMId) {
      setItemData([])
      setItemTotal(0)
      return
    }
    try {
      const res = await fetchOperationTransferItems({
        operMId: selectedOperMId,
        page: itemPage,
        pageSize: 10,
      })
      setItemData(res.data)
      setItemTotal(res.totalCount)
    } catch {
      setItemData([])
      setItemTotal(0)
    }
  }, [selectedOperMId, itemPage])

  useEffect(() => {
    void loadItemList()
  }, [loadItemList])

  const handleToggleRegistrationCheck = (row: OperationTransferRegistrationRow) => {
    if (!row.operMId) {
      window.alert('운용 등록 ID(operMId)가 없습니다.')
      return
    }
    setCheckedOperMIds((prev) => {
      const next = new Set(prev)
      if (next.has(row.operMId)) {
        next.delete(row.operMId)
        setSelectedOperMId((cur) => {
          if (cur !== row.operMId) return cur
          const first = next.values().next().value as string | undefined
          return first ?? null
        })
      } else {
        next.add(row.operMId)
        setSelectedOperMId(row.operMId)
        setItemPage(1)
      }
      return next
    })
  }

  const handleApprovalRequest = async () => {
    if (checkedOperMIds.size === 0) {
      window.alert('승인 요청할 항목을 체크해 주세요.')
      return
    }
    const ids = [...checkedOperMIds]
    setApprovalRequestLoading(true)
    try {
      const failed: { id: string; message: string }[] = []
      for (const id of ids) {
        try {
          await requestItemOperationApproval(id)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          failed.push({ id, message })
        }
      }
      if (failed.length === 0) {
        window.alert('승인 요청이 완료되었습니다.')
        setCheckedOperMIds(new Set())
        setSelectedOperMId(null)
        await loadRegistrationList()
        return
      }
      if (failed.length === ids.length) {
        window.alert(
          `승인 요청에 실패했습니다.\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
        )
        return
      }
      window.alert(
        `일부만 성공했습니다. (실패 ${failed.length}건)\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
      )
      setCheckedOperMIds(new Set(failed.map((f) => f.id)))
      await loadRegistrationList()
    } finally {
      setApprovalRequestLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    if (checkedOperMIds.size === 0) {
      window.alert('승인 요청을 취소할 항목을 체크해 주세요.')
      return
    }
    if (!window.confirm('체크한 항목의 승인 요청을 취소하시겠습니까?')) {
      return
    }
    const ids = [...checkedOperMIds]
    setCancelRequestLoading(true)
    try {
      const failed: { id: string; message: string }[] = []
      for (const id of ids) {
        try {
          await cancelItemOperationRequest(id)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          failed.push({ id, message })
        }
      }
      if (failed.length === 0) {
        window.alert('승인 요청이 취소되었습니다.')
        setCheckedOperMIds(new Set())
        setSelectedOperMId(null)
        await loadRegistrationList()
        return
      }
      if (failed.length === ids.length) {
        window.alert(
          `승인 요청 취소에 실패했습니다.\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
        )
        return
      }
      window.alert(
        `일부만 취소되었습니다. (실패 ${failed.length}건)\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
      )
      setCheckedOperMIds(new Set(failed.map((f) => f.id)))
      await loadRegistrationList()
    } finally {
      setCancelRequestLoading(false)
    }
  }

  const handleDeleteOperation = async () => {
    if (checkedOperMIds.size === 0) {
      window.alert('삭제할 항목을 체크해 주세요.')
      return
    }
    const checkedRows = registrationData.filter((r) => r.operMId && checkedOperMIds.has(r.operMId))
    const deletableIds = checkedRows
      .filter((r) => isOperationWaitDraftStatus(r.approvalStatus))
      .map((r) => r.operMId)
    const skippedCount = checkedRows.length - deletableIds.length

    if (deletableIds.length === 0) {
      window.alert('작성중(WAIT) 상태의 운용 신청만 삭제할 수 있습니다.')
      return
    }
    if (skippedCount > 0) {
      if (
        !window.confirm(
          `선택한 항목 중 작성중 상태가 아닌 ${skippedCount}건은 제외하고, ${deletableIds.length}건만 삭제합니다. 계속하시겠습니까?`,
        )
      ) {
        return
      }
    } else if (!window.confirm('체크한 운용 신청을 삭제하시겠습니까?')) {
      return
    }

    setDeleteOperationLoading(true)
    try {
      const failed: { id: string; message: string }[] = []
      for (const id of deletableIds) {
        try {
          await deleteItemOperation(id)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          failed.push({ id, message })
        }
      }
      if (failed.length === 0) {
        window.alert('삭제되었습니다.')
        setCheckedOperMIds(new Set())
        setSelectedOperMId(null)
        await loadRegistrationList()
        return
      }
      if (failed.length === deletableIds.length) {
        window.alert(
          `삭제에 실패했습니다.\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
        )
        return
      }
      window.alert(
        `일부만 삭제되었습니다. (실패 ${failed.length}건)\n${failed.map((f) => `- ${f.id}: ${f.message}`).join('\n')}`,
      )
      setCheckedOperMIds(new Set(failed.map((f) => f.id)))
      await loadRegistrationList()
    } finally {
      setDeleteOperationLoading(false)
    }
  }

  const registrationColumns: DataTableColumn<OperationTransferRegistrationRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={row.operMId !== '' && checkedOperMIds.has(row.operMId)}
          onChange={() => handleToggleRegistrationCheck(row)}
          disabled={!row.operMId}
          onClick={(e) => e.stopPropagation()}
          aria-label="운용 등록 선택"
        />
      ),
    },
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'transferDate', header: '전환일자', render: (row) => row.transferDate },
    { key: 'transferConfirmDate', header: '전환확정일자', render: (row) => row.transferConfirmDate },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<OperationTransferItemRow>[] = [
    { key: 'select', header: '', render: () => <input type="checkbox" disabled /> },
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
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setCurrentPage(1)
  }

  const handleModify = () => {
    if (checkedOperMIds.size !== 1) {
      window.alert('수정할 항목을 한 건만 체크해 주세요.')
      return
    }
    const id = [...checkedOperMIds][0]
    const row = registrationData.find((r) => r.operMId === id)
    const state: OperationTransferEditLocationState | undefined = row
      ? {
          transferDate: row.transferDate,
          registrantId: row.registrantId,
          registrantName: row.registrantName,
        }
      : undefined
    navigate(
      `/asset-management/operation-management/operation-transfer/edit/${encodeURIComponent(id)}`,
      { state },
    )
  }

  const bulkActionBusy =
    approvalRequestLoading || cancelRequestLoading || deleteOperationLoading

  return (
    <AssetManagementPageLayout
      pageKey="operation-ledger"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="물품 운용 전환"
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">전환일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.transferDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, transferDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.transferDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, transferDateTo: e.target.value }))
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

      <DataTable<OperationTransferRegistrationRow>
        pageKey="operation-ledger"
        title="운용 전환 등록 목록"
        data={registrationData}
        totalCount={registrationTotal}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        columns={registrationColumns}
        getRowKey={(row) => (row.operMId ? `reg-${row.operMId}` : `reg-${row.id}`)}
        renderActions={() => (
          <div className="return-registration-actions">
            <button
              type="button"
              className="return-btn-modify"
              disabled={bulkActionBusy || checkedOperMIds.size !== 1}
              onClick={handleModify}
            >
              수정
            </button>
            <button
              type="button"
              className="return-btn-delete"
              disabled={
                deleteOperationLoading ||
                approvalRequestLoading ||
                cancelRequestLoading ||
                checkedOperMIds.size === 0
              }
              onClick={() => void handleDeleteOperation()}
            >
              {deleteOperationLoading ? '삭제 중…' : '삭제'}
            </button>
            <button
              type="button"
              className="return-btn-approval-request"
              disabled={
                approvalRequestLoading ||
                cancelRequestLoading ||
                deleteOperationLoading ||
                checkedOperMIds.size === 0
              }
              onClick={() => void handleApprovalRequest()}
            >
              {approvalRequestLoading ? '승인 요청 중…' : '승인요청'}
            </button>
            <button
              type="button"
              className="return-btn-request-cancel"
              disabled={
                cancelRequestLoading ||
                approvalRequestLoading ||
                deleteOperationLoading ||
                checkedOperMIds.size === 0
              }
              onClick={() => void handleCancelRequest()}
            >
              {cancelRequestLoading ? '취소 처리 중…' : '요청취소'}
            </button>
            <button
              type="button"
              className="return-btn-register"
              onClick={() => navigate('/asset-management/operation-management/operation-transfer/register')}
            >
              등록
            </button>
          </div>
        )}
      />

      <DataTable<OperationTransferItemRow>
        pageKey="operation-ledger"
        title="운용 전환 물품 목록"
        data={itemData}
        totalCount={itemTotal}
        pageSize={10}
        currentPage={itemPage}
        onPageChange={setItemPage}
        columns={itemColumns}
        getRowKey={(row) => `${selectedOperMId ?? 'none'}-${row.id}-${row.itemUniqueNumber}`}
      />
    </AssetManagementPageLayout>
  )
}

export default OperationTransferPage
