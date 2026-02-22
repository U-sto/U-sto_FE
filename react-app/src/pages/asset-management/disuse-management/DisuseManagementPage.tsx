import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import '../operation-management/operation-ledger/OperationLedgerPage.css'
import '../operation-management/return-management/ReturnManagementPage.css'
import './DisuseManagementPage.css'

type DisuseFilters = {
  disuseDateFrom: string
  disuseDateTo: string
  approvalStatus: string
}

const APPROVAL_STATUS_OPTIONS = ['전체', '대기', '반려', '확정']

type DisuseRegistrationRow = {
  id: number
  disuseDate: string
  disuseConfirmDate: string
  registrantId: string
  registrantName: string
  approvalStatus: string
}

type DisuseItemRow = {
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

const DisuseManagementPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<DisuseFilters>({
    disuseDateFrom: '',
    disuseDateTo: '',
    approvalStatus: '전체',
  })

  const allRegistrationData = useMemo<DisuseRegistrationRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      disuseDate: '2026-01-21',
      disuseConfirmDate: '2026-01-22',
      registrantId: `user${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      approvalStatus: idx % 3 === 0 ? '대기' : idx % 3 === 1 ? '반려' : '확정',
    }))
  }, [])

  const allItemData = useMemo<DisuseItemRow[]>(() => {
    return Array.from({ length: 10 }).map((_, idx) => ({
      id: idx + 1,
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
      acquireDate: '2026-01-15',
      acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
      operatingDept: `운용부서 ${(idx % 3) + 1}`,
      itemStatus: '불용',
      reason: '불용 사유',
    }))
  }, [])

  const filteredRegistrationData = useMemo(() => {
    return allRegistrationData.filter((row) => {
      if (filters.disuseDateFrom && row.disuseDate < filters.disuseDateFrom) return false
      if (filters.disuseDateTo && row.disuseDate > filters.disuseDateTo) return false
      if (filters.approvalStatus !== '전체' && row.approvalStatus !== filters.approvalStatus) return false
      return true
    })
  }, [allRegistrationData, filters])

  const registrationColumns: DataTableColumn<DisuseRegistrationRow>[] = [
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

  const handleReset = () => {
    setFilters({
      disuseDateFrom: '',
      disuseDateTo: '',
      approvalStatus: '전체',
    })
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
              onClick={() => {}}
            >
              조회
            </Button>
          </div>
        </div>
      </section>

      <DataTable<DisuseRegistrationRow>
        pageKey="operation-ledger"
        title="불용 등록 목록"
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
        data={allItemData}
        totalCount={allItemData.length}
        pageSize={10}
        columns={itemColumns}
        getRowKey={(row) => row.id}
      />
    </AssetManagementPageLayout>
  )
}

export default DisuseManagementPage
