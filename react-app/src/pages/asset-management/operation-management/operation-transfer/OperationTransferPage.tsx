import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import '../operation-ledger/OperationLedgerPage.css'
import '../return-management/ReturnManagementPage.css'

type TransferFilters = {
  transferDateFrom: string
  transferDateTo: string
  approvalStatus: string
}

const APPROVAL_STATUS_OPTIONS = ['전체', '대기', '반려', '확정']

type TransferRegistrationRow = {
  id: number
  transferDate: string
  transferConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

type TransferItemRow = {
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

const OperationTransferPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<TransferFilters>({
    transferDateFrom: '',
    transferDateTo: '',
    approvalStatus: '전체',
  })

  const allRegistrationData = useMemo<TransferRegistrationRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      transferDate: '2026-01-21',
      transferConfirmDate: '2026-01-22',
      registrantId: `user${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      approvalStatus: idx % 3 === 0 ? '대기' : idx % 3 === 1 ? '반려' : '확정',
    }))
  }, [])

  const allItemData = useMemo<TransferItemRow[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서 ${(idx % 3) + 1}`,
      itemStatus: '운용중',
      reason: '전환 사유',
    }))
  }, [])

  const filteredRegistrationData = useMemo(() => {
    return allRegistrationData.filter((row) => {
      if (filters.transferDateFrom && row.transferDate < filters.transferDateFrom) return false
      if (filters.transferDateTo && row.transferDate > filters.transferDateTo) return false
      if (filters.approvalStatus !== '전체' && row.approvalStatus !== filters.approvalStatus) return false
      return true
    })
  }, [allRegistrationData, filters])

  const registrationColumns: DataTableColumn<TransferRegistrationRow>[] = [
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'transferDate', header: '전환일자', render: (row) => row.transferDate },
    { key: 'transferConfirmDate', header: '전환확정일자', render: (row) => row.transferConfirmDate },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'approvalStatus', header: '승인상태', render: (row) => row.approvalStatus },
  ]

  const itemColumns: DataTableColumn<TransferItemRow>[] = [
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
    setFilters({
      transferDateFrom: '',
      transferDateTo: '',
      approvalStatus: '전체',
    })
  }

  const handleSearch = () => {
    // 클라이언트 필터만 사용
  }

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
                <TextField
                  type="date"
                  value={filters.transferDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, transferDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <TextField
                  type="date"
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
                {APPROVAL_STATUS_OPTIONS.map((option) => (
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

      <DataTable<TransferRegistrationRow>
        pageKey="operation-ledger"
        title="운용 전환 등록 목록"
        data={filteredRegistrationData}
        totalCount={filteredRegistrationData.length}
        pageSize={10}
        columns={registrationColumns}
        getRowKey={(row) => row.id}
        renderActions={() => (
          <div className="return-registration-actions">
            <button type="button" className="return-btn-modify">
              수정
            </button>
            <button type="button" className="return-btn-delete">
              삭제
            </button>
            <button type="button" className="return-btn-approval-request">
              승인요청
            </button>
            <button type="button" className="return-btn-request-cancel">
              요청취소
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

      <DataTable<TransferItemRow>
        pageKey="operation-ledger"
        title="운용 전환 물품 목록"
        data={allItemData}
        totalCount={allItemData.length}
        pageSize={10}
        columns={itemColumns}
        getRowKey={(row) => row.id}
      />
    </AssetManagementPageLayout>
  )
}

export default OperationTransferPage
