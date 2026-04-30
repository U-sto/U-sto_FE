import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import {
  fetchAcqConfirmationList,
  type AcqConfirmationRow,
} from '../../../api/acqConfirmation'
import {
  requestItemAcquisitionApproval,
  cancelItemAcquisitionRequest,
  deleteItemAcquisition,
} from '../../../api/itemAcquisitions'
import {
  CODE_GROUP,
  buildDescriptionToCodeMap,
  buildFilterOptionsWithAll,
} from '../../../api/codes'
import { useCommonCodeGroup } from '../../../hooks/useCommonCodeGroup'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import './AcquisitionListPage.css'
import { useOperatingDepartmentFilterOptions } from '../../../hooks/useOperatingDepartmentOptions'
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal/DeleteConfirmModal'

type AcquisitionListFilters = {
  g2bName: string
  g2bNumberPrefix: string
  g2bNumberSuffix: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  operatingDept: string
}

const INITIAL_FILTERS: AcquisitionListFilters = {
  g2bName: '',
  g2bNumberPrefix: '',
  g2bNumberSuffix: '',
  sortDateFrom: '',
  sortDateTo: '',
  acquireDateFrom: '',
  acquireDateTo: '',
  approvalStatus: '전체',
  operatingDept: '전체',
}

const APPROVAL_STATUS_FALLBACK_OPTIONS = ['전체', '대기', '반려', '확정']

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

const AcquisitionListPage = () => {
  const navigate = useNavigate()
  const operatingDeptOptions = useOperatingDepartmentFilterOptions()
  const { group: apprGroup } = useCommonCodeGroup(CODE_GROUP.APPR_STATUS)
  const approvalDescToCode = useMemo(
    () => buildDescriptionToCodeMap(apprGroup ?? undefined),
    [apprGroup],
  )
  const approvalStatusOptions = useMemo(() => {
    if (Object.keys(approvalDescToCode).length > 0) {
      return buildFilterOptionsWithAll(approvalDescToCode)
    }
    return APPROVAL_STATUS_FALLBACK_OPTIONS
  }, [approvalDescToCode])

  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)
  const [filters, setFilters] = useState<AcquisitionListFilters>({ ...INITIAL_FILTERS })
  /** 초기값을 두어 진입 시 전체 조건으로 목록 자동 조회 */
  const [searchedFilters, setSearchedFilters] = useState<AcquisitionListFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [currentPage, setCurrentPage] = useState(1)
  const [tableData, setTableData] = useState<AcqConfirmationRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedAcqIds, setSelectedAcqIds] = useState<Set<string>>(() => new Set())
  const [approvalRequesting, setApprovalRequesting] = useState(false)
  const [requestCanceling, setRequestCanceling] = useState(false)
  const [deletingItemAcquisitions, setDeletingItemAcquisitions] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAcqConfirmationList({
        page: currentPage,
        pageSize: 10,
        filters: {
          g2bName: searchedFilters.g2bName,
          g2bNumberFrom: searchedFilters.g2bNumberPrefix,
          g2bNumberTo: searchedFilters.g2bNumberSuffix,
          sortDateFrom: searchedFilters.sortDateFrom,
          sortDateTo: searchedFilters.sortDateTo,
          acquireDateFrom: searchedFilters.acquireDateFrom,
          acquireDateTo: searchedFilters.acquireDateTo,
          approvalStatus: searchedFilters.approvalStatus,
          operatingDept: searchedFilters.operatingDept,
        },
        approvalDescToCode:
          Object.keys(approvalDescToCode).length > 0 ? approvalDescToCode : undefined,
      })
      setTableData(res.data)
      setTotalCount(res.totalCount)
    } catch {
      setTableData([])
      setTotalCount(0)
    }
  }, [currentPage, searchedFilters, approvalDescToCode])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** 조회 조건만 바뀔 때 선택 초기화 — 페이지 이동 시에는 여러 페이지 건 동시 승인요청 가능 */
  useEffect(() => {
    setSelectedAcqIds(new Set())
  }, [searchedFilters])

  const pageAcqIds = useMemo(
    () => tableData.map((r) => r.acqId).filter((id) => id.length > 0),
    [tableData],
  )
  const allPageSelected =
    pageAcqIds.length > 0 && pageAcqIds.every((id) => selectedAcqIds.has(id))

  const toggleSelectAllOnPage = () => {
    setSelectedAcqIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageAcqIds.forEach((id) => next.delete(id))
      } else {
        pageAcqIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleRowSelected = (acqId: string) => {
    if (!acqId) return
    setSelectedAcqIds((prev) => {
      const next = new Set(prev)
      if (next.has(acqId)) next.delete(acqId)
      else next.add(acqId)
      return next
    })
  }

  const handleApprovalRequest = async () => {
    const ids = [...selectedAcqIds]
    if (ids.length === 0) {
      window.alert('승인 요청할 건을 체크해 주세요.')
      return
    }
    setApprovalRequesting(true)
    try {
      for (const acqId of ids) {
        await requestItemAcquisitionApproval(acqId)
      }
      window.alert(`승인 요청이 완료되었습니다. (${ids.length}건)`)
      setSelectedAcqIds(new Set())
      await loadData()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '승인 요청에 실패했습니다.')
    } finally {
      setApprovalRequesting(false)
    }
  }

  const handleRequestCancel = async () => {
    const ids = [...selectedAcqIds]
    if (ids.length === 0) {
      window.alert('요청 취소할 건을 체크해 주세요.')
      return
    }
    if (!window.confirm(`선택한 ${ids.length}건의 승인 요청을 취소하시겠습니까?`)) {
      return
    }
    setRequestCanceling(true)
    try {
      for (const acqId of ids) {
        await cancelItemAcquisitionRequest(acqId)
      }
      window.alert(`요청 취소가 완료되었습니다. (${ids.length}건)`)
      setSelectedAcqIds(new Set())
      await loadData()
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '요청 취소에 실패했습니다.',
      )
    } finally {
      setRequestCanceling(false)
    }
  }

  const actionInProgress =
    approvalRequesting || requestCanceling || deletingItemAcquisitions

  const handleOpenDeleteModal = () => {
    if (selectedAcqIds.size === 0) {
      window.alert('삭제할 건을 체크해 주세요.')
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    const ids = [...selectedAcqIds]
    setDeleteConfirmOpen(false)
    if (ids.length === 0) return
    setDeletingItemAcquisitions(true)
    try {
      for (const acqId of ids) {
        await deleteItemAcquisition(acqId)
      }
      window.alert(`삭제가 완료되었습니다. (${ids.length}건)`)
      setSelectedAcqIds(new Set())
      await loadData()
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : '삭제에 실패했습니다.',
      )
    } finally {
      setDeletingItemAcquisitions(false)
    }
  }

  const columns: DataTableColumn<AcqConfirmationRow>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={toggleSelectAllOnPage}
          disabled={pageAcqIds.length === 0}
          aria-label="현재 페이지 전체 선택"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={row.acqId ? selectedAcqIds.has(row.acqId) : false}
          onChange={() => toggleRowSelected(row.acqId)}
          disabled={!row.acqId}
          aria-label={`취득 건 선택 ${row.g2bNumber}`}
        />
      ),
    },
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    {
      key: 'acquireAmount',
      header: '취득금액',
      render: (row) =>
        typeof row.acquireAmount === 'number'
          ? row.acquireAmount.toLocaleString('ko-KR') + '원'
          : String(row.acquireAmount),
    },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
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

  const handleRegister = () => {
    navigate('/asset-management/acquisition-management/register')
  }

  const handleEdit = () => {
    if (selectedAcqIds.size !== 1) {
      window.alert('수정할 건을 1건만 선택해 주세요.')
      return
    }
    const only = [...selectedAcqIds][0]
    if (!only) return
    navigate(`/asset-management/acquisition-management/edit/${encodeURIComponent(only)}`)
  }

  return (
    <AssetManagementPageLayout
      pageKey="acquisition"
      depthSecondLabel="물품 취득 관리"
      depthThirdLabel=""
    >
      <div className="acquisition-filter">
        <FilterPanel pageKey="acq" filterPrefix="operation-ledger">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록명</div>
              <div className="operation-ledger-input-and-search">
                <TextField
                  value={filters.g2bName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, g2bName: e.target.value }))}
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
              <div className="operation-ledger-label">G2B목록번호</div>
              <div className="operation-ledger-g2b-number-split">
                <TextField
                  value={filters.g2bNumberPrefix}
                  onChange={(e) => setFilters((prev) => ({ ...prev, g2bNumberPrefix: e.target.value }))}
                  placeholder=""
                  className="operation-ledger-readonly"
                />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField
                  value={filters.g2bNumberSuffix}
                  onChange={(e) => setFilters((prev) => ({ ...prev, g2bNumberSuffix: e.target.value }))}
                  placeholder=""
                  className="operation-ledger-readonly"
                />
              </div>
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">운용부서</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingDept}
                onChange={(value: string) => setFilters((prev) => ({ ...prev, operatingDept: value }))}
                options={operatingDeptOptions}
              />
            </div>
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">승인상태</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.approvalStatus}
                onChange={(value: string) => setFilters((prev) => ({ ...prev, approvalStatus: value }))}
                options={approvalStatusOptions}
              />
            </div>

            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">취득일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.acquireDateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, acquireDateFrom: e.target.value }))}
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.acquireDateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, acquireDateTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">정리일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.sortDateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortDateFrom: e.target.value }))}
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.sortDateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortDateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="operation-ledger-filter-actions">
            <Button className="operation-ledger-btn operation-ledger-btn-outline" onClick={handleReset}>
              초기화
            </Button>
            <Button className="operation-ledger-btn operation-ledger-btn-primary" onClick={handleSearch}>
              조회
            </Button>
          </div>
        </FilterPanel>
      </div>

      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        extraMessage={
          <>
            선택한 <strong>{selectedAcqIds.size}건</strong>을 삭제합니다.
            <br />
            <span className="delete-confirm-modal__hint">(작성중 상태만 삭제 가능합니다.)</span>
          </>
        }
      />

      <DataTable<AcqConfirmationRow>
        pageKey="operation-ledger"
        title="물품 취득 대장 목록"
        data={tableData}
        totalCount={totalCount}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        columns={columns}
        getRowKey={(row) => (row.acqId ? row.acqId : String(row.id))}
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
              disabled={actionInProgress || selectedAcqIds.size === 0}
              onClick={handleOpenDeleteModal}
            >
              {deletingItemAcquisitions ? '삭제 중…' : '삭제'}
            </button>
            <button
              type="button"
              className="return-btn-approval-request"
              disabled={actionInProgress}
              onClick={() => void handleApprovalRequest()}
            >
              {approvalRequesting ? '요청 중…' : '승인요청'}
            </button>
            <button
              type="button"
              className="return-btn-request-cancel"
              disabled={actionInProgress}
              onClick={() => void handleRequestCancel()}
            >
              {requestCanceling ? '취소 중…' : '요청취소'}
            </button>
            <button
              type="button"
              className="return-btn-register"
              onClick={handleRegister}
            >
              등록
            </button>
          </div>
        )}
      />
    </AssetManagementPageLayout>
  )
}

export default AcquisitionListPage
