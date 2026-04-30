import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Button from '../../../components/common/Button/Button'
import RadioButton from '../../../components/common/RadioButton/RadioButton'
import ManagementPageLayout from '../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import FilterPanel from '../../../features/management/components/FilterPanel/FilterPanel'
import {
  fetchOperationTransferRegistrations,
  fetchOperationTransferItems,
  rejectItemOperationAdmin,
  approveItemOperationAdmin,
  type OperationTransferListFilters,
  type OperationTransferRegistrationRow,
  type OperationTransferItemRow,
} from '../../../api/itemOperations'
import {
  useApprovalStatusFilterOptions,
  resolveApprovalFilterTransferStyle,
} from '../../../hooks/useCommonCodeOptions'
import './OperationManagementPage.css'

const DATE_RANGE_ERROR_MESSAGE = '비교날짜 이 후의 날짜를 선택해주세요 !'

const INITIAL_FILTERS: OperationTransferListFilters = {
  transferDateFrom: '',
  transferDateTo: '',
  approvalStatus: '전체',
}

const OperationManagementPage = () => {
  const [filters, setFilters] = useState<OperationTransferListFilters>({
    ...INITIAL_FILTERS,
  })
  const [searchedFilters, setSearchedFilters] = useState<OperationTransferListFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [dateErrors, setDateErrors] = useState<{ operationDate?: string }>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [registrationData, setRegistrationData] = useState<
    OperationTransferRegistrationRow[]
  >([])
  const [registrationTotal, setRegistrationTotal] = useState(0)
  const registrationRequestSeqRef = useRef(0)

  const [checkedOperMIds, setCheckedOperMIds] = useState<Set<string>>(() => new Set())
  const [selectedOperMId, setSelectedOperMId] = useState<string | null>(null)
  const [itemPage, setItemPage] = useState(1)
  const [itemData, setItemData] = useState<OperationTransferItemRow[]>([])
  const [itemTotal, setItemTotal] = useState(0)
  const itemRequestSeqRef = useRef(0)
  const [adminActionLoading, setAdminActionLoading] = useState(false)

  const { options: approvalOptions, descToCode: approvalDescToCode } =
    useApprovalStatusFilterOptions()

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
    const seq = ++registrationRequestSeqRef.current
    try {
      const res = await fetchOperationTransferRegistrations({
        page: currentPage,
        pageSize: 10,
        filters: apiSearchedFilters,
      })
      if (seq !== registrationRequestSeqRef.current) return
      setRegistrationData(res.data)
      setRegistrationTotal(res.totalCount)
    } catch {
      if (seq !== registrationRequestSeqRef.current) return
      setRegistrationData([])
      setRegistrationTotal(0)
    }
  }, [currentPage, apiSearchedFilters])

  useEffect(() => {
    void loadRegistrationList()
  }, [loadRegistrationList])

  useEffect(() => {
    setSelectedOperMId(null)
    setCheckedOperMIds(new Set())
    setItemPage(1)
  }, [currentPage, searchedFilters])

  const loadItemList = useCallback(async () => {
    const seq = ++itemRequestSeqRef.current
    if (!selectedOperMId) {
      if (seq === itemRequestSeqRef.current) {
        setItemData([])
        setItemTotal(0)
      }
      return
    }
    try {
      const res = await fetchOperationTransferItems({
        operMId: selectedOperMId,
        page: itemPage,
        pageSize: 10,
      })
      if (seq !== itemRequestSeqRef.current) return
      setItemData(res.data)
      setItemTotal(res.totalCount)
    } catch {
      if (seq !== itemRequestSeqRef.current) return
      setItemData([])
      setItemTotal(0)
    }
  }, [selectedOperMId, itemPage])

  useEffect(() => {
    void loadItemList()
  }, [loadItemList])

  const handleToggleRegistrationCheck = useCallback(
    (row: OperationTransferRegistrationRow) => {
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
    },
    [],
  )

  const validateDateRange = (from: string, to: string) => {
    if (from && to && to < from) {
      setDateErrors({ operationDate: DATE_RANGE_ERROR_MESSAGE })
      return false
    }
    setDateErrors({})
    return true
  }

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setDateErrors({})
    setCurrentPage(1)
  }

  const handleSearch = () => {
    if (
      !validateDateRange(filters.transferDateFrom, filters.transferDateTo)
    ) {
      return
    }
    setSearchedFilters({ ...filters })
    setCurrentPage(1)
  }

  const handleAdminReject = async () => {
    if (checkedOperMIds.size === 0) {
      window.alert('상단 운용 등록 목록에서 반려할 항목을 체크해 주세요.')
      return
    }
    setAdminActionLoading(true)
    try {
      await Promise.all(Array.from(checkedOperMIds).map((id) => rejectItemOperationAdmin(id)))
      window.alert('반려 처리되었습니다.')
      setCheckedOperMIds(new Set())
      setSelectedOperMId(null)
      setCurrentPage(1)
      await loadRegistrationList()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '반려 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(false)
    }
  }

  const handleAdminApprove = async () => {
    if (checkedOperMIds.size === 0) {
      window.alert('상단 운용 등록 목록에서 확정할 항목을 체크해 주세요.')
      return
    }
    setAdminActionLoading(true)
    try {
      await Promise.all(Array.from(checkedOperMIds).map((id) => approveItemOperationAdmin(id)))
      window.alert('확정 처리되었습니다.')
      setCheckedOperMIds(new Set())
      setSelectedOperMId(null)
      setCurrentPage(1)
      await loadRegistrationList()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '확정 처리에 실패했습니다.')
    } finally {
      setAdminActionLoading(false)
    }
  }

  const registrationColumns: DataTableColumn<OperationTransferRegistrationRow>[] = useMemo(
    () => [
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
      {
        key: 'operationDate',
        header: '운용일자',
        width: 150,
        render: (row) => row.transferDate,
      },
      {
        key: 'operationConfirmDate',
        header: '운용확정일자',
        width: 150,
        render: (row) => row.transferConfirmDate,
      },
      {
        key: 'registrantId',
        header: '등록자ID',
        width: 150,
        render: (row) => row.registrantId,
      },
      {
        key: 'registrantName',
        header: '등록자명',
        width: 150,
        render: (row) => row.registrantName,
      },
      {
        key: 'approvalStatus',
        header: '승인상태',
        width: 100,
        render: (row) => row.approvalStatus,
      },
    ],
    [checkedOperMIds, handleToggleRegistrationCheck],
  )

  const itemColumns: DataTableColumn<OperationTransferItemRow>[] = useMemo(
    () => [
      {
        key: 'select',
        header: '',
        render: () => <input type="checkbox" disabled />,
      },
      {
        key: 'g2bNumber',
        header: 'G2B목록번호',
        width: 150,
        render: (row) => row.g2bNumber,
      },
      {
        key: 'g2bName',
        header: 'G2B목록명',
        width: 150,
        render: (row) => row.g2bName,
      },
      {
        key: 'itemUniqueNumber',
        header: '물품고유번호',
        width: 150,
        render: (row) => row.itemUniqueNumber,
      },
      {
        key: 'acquireDate',
        header: '취득일자',
        width: 120,
        render: (row) => row.acquireDate,
      },
      {
        key: 'acquireAmount',
        header: '취득금액',
        width: 120,
        render: (row) => row.acquireAmount,
      },
      {
        key: 'operatingDept',
        header: '운용부서',
        width: 120,
        render: (row) => row.operatingDept,
      },
      {
        key: 'itemStatus',
        header: '물품상태',
        width: 100,
        render: (row) => row.itemStatus,
      },
      {
        key: 'reason',
        header: '사유',
        width: 150,
        render: (row) => row.reason,
      },
    ],
    [],
  )

  const setOperationDateError = (err: string) =>
    setDateErrors((prev) => ({ ...prev, operationDate: err }))

  return (
    <ManagementPageLayout
      pageKey="operation"
      depthSecondLabel="물품 운용 등록 관리"
    >
      <FilterPanel pageKey="operation">
        <div className="operation-filter-grid">
          <div className="operation-field">
            <div className="operation-label">운용일자</div>
            <div className="operation-date-field-wrapper">
              <div className="operation-date-range">
                <DatePickerField
                  value={filters.transferDateFrom}
                  onChange={(e) => {
                    const v = e.target.value
                    setFilters((p) => ({
                      ...p,
                      transferDateFrom: v,
                    }))
                    if (filters.transferDateTo) {
                      if (v && filters.transferDateTo < v) {
                        setOperationDateError(DATE_RANGE_ERROR_MESSAGE)
                      } else {
                        setOperationDateError('')
                      }
                    }
                  }}
                />
                <span className="operation-date-sep">~</span>
                <DatePickerField
                  value={filters.transferDateTo}
                  onChange={(e) => {
                    const v = e.target.value
                    setFilters((p) => ({
                      ...p,
                      transferDateTo: v,
                    }))
                    if (filters.transferDateFrom) {
                      if (v && v < filters.transferDateFrom) {
                        setOperationDateError(DATE_RANGE_ERROR_MESSAGE)
                      } else {
                        setOperationDateError('')
                      }
                    }
                  }}
                />
              </div>
              {dateErrors.operationDate && (
                <div className="operation-error-text">
                  {dateErrors.operationDate}
                </div>
              )}
            </div>
          </div>
          <div className="operation-field">
            <div className="operation-label">승인상태</div>
            <div className="operation-radio-group">
              {approvalOptions.map((option) => (
                <RadioButton
                  key={option}
                  name="approvalStatus"
                  value={option}
                  checked={filters.approvalStatus === option}
                  onChange={(value) =>
                    setFilters((p) => ({ ...p, approvalStatus: value }))
                  }
                  label={option}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="operation-filter-actions">
          <Button
            className="operation-btn operation-btn-outline"
            onClick={handleReset}
          >
            초기화
          </Button>
          <Button
            className="operation-btn operation-btn-primary"
            onClick={handleSearch}
          >
            조회
          </Button>
        </div>
      </FilterPanel>

      <DataTable<OperationTransferRegistrationRow>
        pageKey="operation"
        title="운용 등록 목록"
        data={registrationData}
        totalCount={registrationTotal}
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        variant="upper"
        columns={registrationColumns}
        getRowKey={(row) =>
          row.operMId ? `reg-${row.operMId}` : `reg-${row.id}`
        }
        renderActions={() => (
          <div className="operation-table-actions">
            <Button
              type="button"
              className="operation-btn operation-btn-outline operation-btn-table"
              disabled={adminActionLoading || checkedOperMIds.size === 0}
              onClick={() => void handleAdminReject()}
            >
              {adminActionLoading ? '처리 중…' : '반려'}
            </Button>
            <Button
              type="button"
              className="operation-btn operation-btn-primary operation-btn-table"
              disabled={adminActionLoading || checkedOperMIds.size === 0}
              onClick={() => void handleAdminApprove()}
            >
              {adminActionLoading ? '처리 중…' : '확정'}
            </Button>
          </div>
        )}
      />
      <DataTable<OperationTransferItemRow>
        pageKey="operation"
        title="운용 물품 목록"
        data={itemData}
        totalCount={itemTotal}
        pageSize={10}
        currentPage={itemPage}
        onPageChange={setItemPage}
        variant="lower"
        columns={itemColumns}
        getRowKey={(row) =>
          `${selectedOperMId ?? 'none'}-${row.id}-${row.itemUniqueNumber}`
        }
      />
    </ManagementPageLayout>
  )
}

export default OperationManagementPage
