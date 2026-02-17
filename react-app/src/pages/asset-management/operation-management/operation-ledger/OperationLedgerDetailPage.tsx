import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Dropdown from '../../../../components/common/Dropdown/Dropdown'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import type { OperationLedgerRow } from './OperationLedgerPage'
import './OperationLedgerPage.css'

type OperationLedgerDetailItem = OperationLedgerRow & {
  quantity?: string
  acquireSortType?: string
  operatingDeptCode?: string
  remarks?: string
}

type LocationState = {
  item?: OperationLedgerDetailItem
}

const OPERATING_STATUS_OPTIONS = ['운용중', '반납', '불용', '처분']

type OperationStatusHistoryRow = {
  id: number
  changeDate: string
  itemUniqueNumber: string
  prevStatus: string
  newStatus: string
  reason: string
  managerName: string
  managerId: string
  registrantName: string
  registrantId: string
}

const OperationLedgerDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const item = useMemo<OperationLedgerDetailItem>(() => {
    if (state?.item) return state.item
    // 직접 진입 시 예시 데이터
    return {
      g2bNumber: '43211613-26081535',
      g2bName: '노트북',
      itemUniqueNumber: 'ITEM-0001',
      acquireDate: '2026-01-15',
      sortDate: '2026-01-20',
      acquireAmount: '1,000,000원',
      operatingDept: '운용부서1',
      operatingStatus: '운용중',
      usefulLife: '3년',
      quantity: '1',
      acquireSortType: '취득',
      operatingDeptCode: 'DEPT001',
      remarks: '',
    }
  }, [state])

  const formatAmount = (value: string) => {
    const numeric = value.replace(/[^\d]/g, '')
    if (!numeric) return ''
    return Number(numeric).toLocaleString('ko-KR')
  }

  const [form, setForm] = useState(() => ({
    acquireAmount: formatAmount(item.acquireAmount ?? ''),
    usefulLife: item.usefulLife ?? '',
    remarks: item.remarks ?? '',
  }))

  // 마지막으로 저장된 값 (저장 버튼을 누른 경우에만 갱신)
  const [savedValues, setSavedValues] = useState<{
    acquireAmount: string
    usefulLife: string
    remarks: string
  } | null>(null)

  useEffect(() => {
    const next = {
      acquireAmount: formatAmount(item.acquireAmount ?? ''),
      usefulLife: item.usefulLife ?? '',
      remarks: item.remarks ?? '',
    }
    setForm(next)
    setSavedValues(null)
  }, [item.acquireAmount, item.usefulLife, item.remarks])

  const statusHistoryData = useMemo<OperationStatusHistoryRow[]>(() => {
    return Array.from({ length: 5 }).map((_, idx) => ({
      id: idx + 1,
      changeDate: '2026-01-21',
      itemUniqueNumber: item.itemUniqueNumber,
      prevStatus: idx === 0 ? '취득' : '운용중',
      newStatus: idx === 0 ? '운용중' : '반납',
      reason: '상태 변경 사유',
      managerName: `관리자${idx + 1}`,
      managerId: `manager${idx + 1}`,
      registrantName: `등록자${idx + 1}`,
      registrantId: `user${idx + 1}`,
    }))
  }, [item.itemUniqueNumber])

  const statusHistoryColumns: DataTableColumn<OperationStatusHistoryRow>[] = [
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'changeDate', header: '변경일자', render: (row) => row.changeDate },
    {
      key: 'itemUniqueNumber',
      header: '물품고유번호',
      render: (row) => row.itemUniqueNumber,
    },
    { key: 'prevStatus', header: '(이전)상태', render: (row) => row.prevStatus },
    { key: 'newStatus', header: '(변경)상태', render: (row) => row.newStatus },
    { key: 'reason', header: '사유', render: (row) => row.reason },
    { key: 'managerName', header: '관리자명', render: (row) => row.managerName },
    { key: 'managerId', header: '관리자ID', render: (row) => row.managerId },
    { key: 'registrantName', header: '등록자명', render: (row) => row.registrantName },
    { key: 'registrantId', header: '등록자ID', render: (row) => row.registrantId },
  ]

  const handleSave = () => {
    // TODO: 저장 API 연동 (form 값을 사용)
    setSavedValues(form)
    window.alert('저장되었습니다.')
  }

  const handleBackToList = () => {
    const base = savedValues ?? form
    const updatedItem: OperationLedgerRow = {
      ...item,
      acquireAmount: base.acquireAmount,
      usefulLife: base.usefulLife,
    }

    navigate('/asset-management/operation-management/operation-ledger', {
      state: { updatedItem },
    })
  }

  const [g2bPrefix, g2bSuffix] = item.g2bNumber.split('-')

  return (
    <AssetManagementPageLayout
      pageKey="operation-ledger"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="물품 운용 대장 관리"
    >
      <div className="operation-ledger-detail-content">
        <div className="operation-ledger-detail-header-row">
          <TitlePill>물품 기본 정보</TitlePill>
          <div className="operation-ledger-detail-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-outline operation-ledger-btn-table"
              onClick={handleBackToList}
            >
              목록
            </Button>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleSave}
            >
              저장
            </Button>
          </div>
        </div>

        <section className="operation-ledger-detail-panel">
          <div className="operation-ledger-detail-grid">
            <div className="operation-ledger-detail-field operation-ledger-detail-field-span2">
              <label className="operation-ledger-detail-label">G2B목록명</label>
              <TextField value={item.g2bName} readOnly className="operation-ledger-readonly" />
            </div>

            <div className="operation-ledger-detail-field operation-ledger-detail-field-span2">
              <label className="operation-ledger-detail-label">G2B목록번호</label>
              <div className="operation-ledger-g2b-number-split">
                <TextField
                  value={g2bPrefix ?? ''}
                  readOnly
                  className="operation-ledger-readonly"
                />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField
                  value={g2bSuffix ?? ''}
                  readOnly
                  className="operation-ledger-readonly"
                />
              </div>
            </div>

            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득일자</label>
              <TextField
                type="date"
                value={item.acquireDate}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">정리일자</label>
              <TextField
                type="date"
                value={item.sortDate}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용상태</label>
              <TextField
                value={item.operatingStatus}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">내용연수</label>
              <TextField
                value={form.usefulLife}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, usefulLife: e.target.value }))
                }
                className="operation-ledger-detail-input"
              />
            </div>

            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득금액</label>
              <TextField
                value={form.acquireAmount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    acquireAmount: formatAmount(e.target.value),
                  }))
                }
                className="operation-ledger-detail-input"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">수량</label>
              <TextField
                value={item.quantity ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득정리구분</label>
              <TextField
                value={item.acquireSortType ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            {/* 레이아웃 정렬용 빈 칸 (취득정리구분 오른쪽 여백) */}
            <div className="operation-ledger-detail-field" />

            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용부서</label>
              <TextField
                value={item.operatingDept}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용부서코드</label>
              <TextField
                value={item.operatingDeptCode ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>

            <div className="operation-ledger-detail-field operation-ledger-detail-field-span4 operation-ledger-detail-field-remarks">
              <label className="operation-ledger-detail-label">비고</label>
              <textarea
                className="operation-ledger-detail-textarea"
                value={form.remarks}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, remarks: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        <DataTable<OperationStatusHistoryRow>
          pageKey="operation-ledger"
          title="물품 상태 이력"
          data={statusHistoryData}
          totalCount={statusHistoryData.length}
          pageSize={10}
          columns={statusHistoryColumns}
          getRowKey={(row) => row.id}
          variant="lower"
        />
      </div>
    </AssetManagementPageLayout>
  )
}

export default OperationLedgerDetailPage

