import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import {
  fetchDisuseList,
  fetchDisuseItems,
  requestItemDisuseApproval,
  cancelItemDisuseRequest,
  deleteItemDisuse,
  type DisuseRegistrationRow,
  type DisuseItemRow,
} from '../../../api/itemDisuses'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import './DisuseManagementPage.css'
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal/DeleteConfirmModal'
import {
  useApprovalStatusFilterOptions,
  resolveApprovalFilterDisuseStyle,
} from '../../../hooks/useCommonCodeOptions'

type DisuseFilters = {
  disuseDateFrom: string
  disuseDateTo: string
  approvalStatus: string
}

const INITIAL_FILTERS: DisuseFilters = {
  disuseDateFrom: '',
  disuseDateTo: '',
  approvalStatus: '전체',
}

const DisuseManagementPage = () => {
  const navigate = useNavigate()
  const { options: approvalStatusOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()
  const [filters, setFilters] = useState<DisuseFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<DisuseFilters>({ ...INITIAL_FILTERS })
  const [registrationPage, setRegistrationPage] = useState(1)
  const [registrationData, setRegistrationData] = useState<DisuseRegistrationRow[]>([])
  const [registrationTotalCount, setRegistrationTotalCount] = useState(0)
  const [selectedDsuMId, setSelectedDsuMId] = useState<string | null>(null)
  const [itemPage, setItemPage] = useState(1)
  const [itemData, setItemData] = useState<DisuseItemRow[]>([])
  const [itemTotalCount, setItemTotalCount] = useState(0)
  const [approvalRequesting, setApprovalRequesting] = useState(false)
  const [requestCanceling, setRequestCanceling] = useState(false)
  const [deletingDisuse, setDeletingDisuse] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const apiDisuseFilters = useMemo(() => {
    return {
      ...searchedFilters,
      approvalStatus: resolveApprovalFilterDisuseStyle(
        searchedFilters.approvalStatus,
        approvalDescToCode,
      ),
    }
  }, [searchedFilters, approvalDescToCode])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await fetchDisuseList({
          page: registrationPage,
          pageSize: 10,
          filters: apiDisuseFilters,
        })
        if (ignore) return
        setRegistrationData(res.data)
        setRegistrationTotalCount(res.totalCount)
        setSelectedDsuMId(null)
        setItemPage(1)
        setItemData([])
        setItemTotalCount(0)
      } catch {
        if (ignore) return
        setRegistrationData([])
        setRegistrationTotalCount(0)
      }
    })()
    return () => { ignore = true }
  }, [registrationPage, apiDisuseFilters])

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
        setItemData(res.data)
        setItemTotalCount(res.totalCount)
      } catch {
        if (ignore) return
        setItemData([])
        setItemTotalCount(0)
      }
    })()
    return () => { ignore = true }
  }, [itemPage, selectedDsuMId])

  const registrationColumns: DataTableColumn<DisuseRegistrationRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          disabled={!row.dsuMId}
          checked={selectedDsuMId === row.dsuMId}
          onChange={() => {
            setSelectedDsuMId((prev) => (prev === row.dsuMId ? null : row.dsuMId))
            setItemPage(1)
          }}
        />
      ),
    },
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'disuseDate', header: '불용일자', render: (row) => row.disuseDate },
    { key: 'disuseConfirmDate', header: '불용확정일자', render: (row) => row.disuseConfirmDate },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<DisuseItemRow>[] = [
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

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setRegistrationPage(1)
  }

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setRegistrationPage(1)
    setSelectedDsuMId(null)
    setItemPage(1)
    setItemData([])
    setItemTotalCount(0)
  }

  const handleEdit = () => {
    if (!selectedDsuMId) {
      window.alert('수정할 건을 선택해 주세요.')
      return
    }
    navigate(`/asset-management/disuse-management/edit/${encodeURIComponent(selectedDsuMId)}`)
  }

  const refreshRegistrations = () => {
    setSearchedFilters((prev) => ({ ...prev }))
  }

  const actionInProgress = approvalRequesting || requestCanceling || deletingDisuse

  const handleApprovalRequest = async () => {
    if (!selectedDsuMId) {
      window.alert('승인 요청할 건을 선택해 주세요.')
      return
    }
    setApprovalRequesting(true)
    try {
      await requestItemDisuseApproval(selectedDsuMId)
      window.alert('승인 요청이 완료되었습니다.')
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 요청에 실패했습니다.')
    } finally {
      setApprovalRequesting(false)
    }
  }

  const handleRequestCancel = async () => {
    if (!selectedDsuMId) {
      window.alert('요청 취소할 건을 선택해 주세요.')
      return
    }
    if (!window.confirm('선택한 건의 승인 요청을 취소하시겠습니까?')) {
      return
    }
    setRequestCanceling(true)
    try {
      await cancelItemDisuseRequest(selectedDsuMId)
      window.alert('요청 취소가 완료되었습니다.')
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '요청 취소에 실패했습니다.')
    } finally {
      setRequestCanceling(false)
    }
  }

  const handleOpenDeleteModal = () => {
    if (!selectedDsuMId) {
      window.alert('삭제할 건을 선택해 주세요.')
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteDisuse = async () => {
    if (!selectedDsuMId) return
    setDeleteConfirmOpen(false)
    setDeletingDisuse(true)
    try {
      await deleteItemDisuse(selectedDsuMId)
      window.alert('삭제가 완료되었습니다.')
      setSelectedDsuMId(null)
      setItemData([])
      setItemTotalCount(0)
      refreshRegistrations()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingDisuse(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="disuse"
      depthSecondLabel="물품 불용 관리"
      depthThirdLabel=""
    >
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">불용일자</div>
              <div className="operation-ledger-date-range">
                <TextField
                  type="date"
                  value={filters.disuseDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, disuseDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
                  value={filters.disuseDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, disuseDateTo: e.target.value }))
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
        onConfirm={() => void handleDeleteDisuse()}
        confirmDisabled={deletingDisuse}
        extraMessage={
          <>
            선택한 <strong>{selectedDsuMId ? 1 : 0}건</strong>을 삭제합니다.
            <br />
            <span className="delete-confirm-modal__hint">(작성중 상태만 삭제 가능합니다.)</span>
          </>
        }
      />

      <DataTable<DisuseRegistrationRow>
        pageKey="operation-ledger"
        title="불용 등록 목록"
        data={registrationData}
        totalCount={registrationTotalCount}
        pageSize={10}
        currentPage={registrationPage}
        onPageChange={setRegistrationPage}
        columns={registrationColumns}
        getRowKey={(row) => row.id}
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
              {deletingDisuse ? '삭제 중...' : '삭제'}
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
              onClick={() => navigate('/asset-management/disuse-management/register')}
            >
              등록
            </button>
          </div>
        )}
      />

      <DataTable<DisuseItemRow>
        pageKey="operation-ledger"
        title="불용 물품 목록"
        data={itemData}
        totalCount={itemTotalCount}
        pageSize={10}
        currentPage={itemPage}
        onPageChange={setItemPage}
        columns={itemColumns}
        getRowKey={(row) => row.id}
      />
    </AssetManagementPageLayout>
  )
}

export default DisuseManagementPage
