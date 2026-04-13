import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import {
  fetchItemDisposalItems,
  fetchItemDisposals,
  requestItemDisposalApproval,
  cancelItemDisposalRequest,
  deleteItemDisposal,
  type DisposalItemRow,
  type DisposalRegistrationRow,
} from '../../../api/itemDisposals'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import './DisposalManagementPage.css'
import {
  useApprovalStatusFilterOptions,
  resolveApprovalFilterTransferStyle,
} from '../../../hooks/useCommonCodeOptions'
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal/DeleteConfirmModal'

type DisposalFilters = {
  disposalDateFrom: string
  disposalDateTo: string
  approvalStatus: string
}

type SelectedRegistration = { dispMId: string }

const DisposalManagementPage = () => {
  const navigate = useNavigate()
  const { options: approvalStatusOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()
  const [filters, setFilters] = useState<DisposalFilters>({
    disposalDateFrom: '',
    disposalDateTo: '',
    approvalStatus: '전체',
  })
  const [searchedFilters, setSearchedFilters] = useState<DisposalFilters>({
    disposalDateFrom: '',
    disposalDateTo: '',
    approvalStatus: '전체',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [registrationData, setRegistrationData] = useState<DisposalRegistrationRow[]>([])
  const [registrationTotalCount, setRegistrationTotalCount] = useState(0)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<SelectedRegistration | null>(null)

  const [itemPage, setItemPage] = useState(1)
  const [itemData, setItemData] = useState<DisposalItemRow[]>([])
  const [itemTotalCount, setItemTotalCount] = useState(0)
  const [itemError, setItemError] = useState<string | null>(null)
  const [approvalRequesting, setApprovalRequesting] = useState(false)
  const [requestCanceling, setRequestCanceling] = useState(false)
  const [deletingDisposal, setDeletingDisposal] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const apiDisposalFilters = useMemo(
    () => ({
      disposalDateFrom: searchedFilters.disposalDateFrom,
      disposalDateTo: searchedFilters.disposalDateTo,
      approvalStatus: resolveApprovalFilterTransferStyle(
        searchedFilters.approvalStatus,
        approvalDescToCode,
      ),
    }),
    [searchedFilters, approvalDescToCode],
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

  const registrationColumns: DataTableColumn<DisposalRegistrationRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          disabled={!row.dispMId}
          checked={selectedRegistration?.dispMId === row.dispMId}
          onChange={() => {
            setSelectedRegistration((prev) =>
              prev?.dispMId === row.dispMId ? null : { dispMId: row.dispMId },
            )
            setItemPage(1)
          }}
        />
      ),
    },
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'disposalDate', header: '처분일자', render: (row) => row.disposalDate },
    { key: 'disposalConfirmDate', header: '처분확정일자', render: (row) => row.disposalConfirmDate },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<DisposalItemRow>[] = [
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
    const next: DisposalFilters = {
      disposalDateFrom: '',
      disposalDateTo: '',
      approvalStatus: '전체',
    }
    setFilters(next)
    setSearchedFilters(next)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setCurrentPage(1)
  }

  const handleEdit = () => {
    const dispMId = selectedRegistration?.dispMId
    if (!dispMId) {
      window.alert('수정할 건을 선택해 주세요.')
      return
    }
    navigate(`/asset-management/disposal-management/edit/${encodeURIComponent(dispMId)}`)
  }

  const refreshRegistrations = () => {
    setSearchedFilters((prev) => ({ ...prev }))
  }

  const actionInProgress = approvalRequesting || requestCanceling || deletingDisposal

  const handleApprovalRequest = async () => {
    const dispMId = selectedRegistration?.dispMId
    if (!dispMId) {
      window.alert('승인 요청할 건을 선택해 주세요.')
      return
    }
    setApprovalRequesting(true)
    try {
      await requestItemDisposalApproval(dispMId)
      window.alert('승인 요청이 완료되었습니다.')
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 요청에 실패했습니다.')
    } finally {
      setApprovalRequesting(false)
    }
  }

  const handleRequestCancel = async () => {
    const dispMId = selectedRegistration?.dispMId
    if (!dispMId) {
      window.alert('요청 취소할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm('선택한 건의 승인 요청을 취소하시겠습니까?')) {
      return
    }
    setRequestCanceling(true)
    try {
      await cancelItemDisposalRequest(dispMId)
      window.alert('요청 취소가 완료되었습니다.')
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '요청 취소에 실패했습니다.')
    } finally {
      setRequestCanceling(false)
    }
  }

  const handleOpenDeleteModal = () => {
    if (!selectedRegistration?.dispMId) {
      window.alert('삭제할 건을 선택해 주세요.')
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteDisposal = async () => {
    const dispMId = selectedRegistration?.dispMId
    if (!dispMId) return
    setDeleteConfirmOpen(false)
    setDeletingDisposal(true)
    try {
      await deleteItemDisposal(dispMId)
      window.alert('삭제가 완료되었습니다.')
      setSelectedRegistration(null)
      setItemData([])
      setItemTotalCount(0)
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingDisposal(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="disposal"
      depthSecondLabel="물품 처분 관리"
      depthThirdLabel=""
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">처분일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.disposalDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, disposalDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.disposalDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, disposalDateTo: e.target.value }))
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
        onConfirm={() => void handleDeleteDisposal()}
        confirmDisabled={deletingDisposal}
        extraMessage={
          <>
            선택한 <strong>{selectedRegistration?.dispMId ? 1 : 0}건</strong>을 삭제합니다.
            <br />
            <span className="delete-confirm-modal__hint">(작성중 상태만 삭제 가능합니다.)</span>
          </>
        }
      />

      <DataTable<DisposalRegistrationRow>
        pageKey="operation-ledger"
        title="처분 등록 목록"
        data={registrationData}
        totalCount={registrationTotalCount}
        pageSize={10}
        columns={registrationColumns}
        getRowKey={(row) => row.id}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        renderActions={() => (
          <div className="return-registration-actions">
            <button
              type="button"
              className="return-btn-modify"
              disabled={actionInProgress}
              onClick={handleEdit}
            >
              수정
            </button>
            <button
              type="button"
              className="return-btn-delete"
              onClick={handleOpenDeleteModal}
              disabled={actionInProgress}
            >
              {deletingDisposal ? '삭제 중...' : '삭제'}
            </button>
            <button
              type="button"
              className="return-btn-approval-request"
              onClick={() => void handleApprovalRequest()}
              disabled={actionInProgress}
            >
              {approvalRequesting ? '요청 중...' : '승인요청'}
            </button>
            <button
              type="button"
              className="return-btn-request-cancel"
              onClick={() => void handleRequestCancel()}
              disabled={actionInProgress}
            >
              {requestCanceling ? '취소 중...' : '요청취소'}
            </button>
            <button
              type="button"
              className="return-btn-register"
              onClick={() => navigate('/asset-management/disposal-management/register')}
            >
              등록
            </button>
          </div>
        )}
      />

      {itemError && (
        <div style={{ margin: '8px 0', color: '#d52e2e', fontSize: 14 }}>
          {itemError}
        </div>
      )}
      <DataTable<DisposalItemRow>
        pageKey="operation-ledger"
        title="처분 물품 목록"
        data={itemData}
        totalCount={itemTotalCount}
        pageSize={10}
        columns={itemColumns}
        getRowKey={(row) => row.id}
        currentPage={itemPage}
        onPageChange={setItemPage}
      />
    </AssetManagementPageLayout>
  )
}

export default DisposalManagementPage
