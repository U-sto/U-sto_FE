import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import { useAssetDetailOverrides } from '../../../contexts/AssetDetailOverridesContext'
import type { InventoryStatusRow } from './InventoryStatusPage'
import '../operation-management/operation-ledger/OperationLedgerPage.css'

type InventoryStatusDetailItem = InventoryStatusRow & {
  quantity?: string
  acquireSortType?: string
  operatingDeptCode?: string
  remarks?: string
}

type LocationState = {
  item?: InventoryStatusDetailItem
}

const InventoryStatusDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const { getOverride } = useAssetDetailOverrides()

  const item = useMemo<InventoryStatusDetailItem>(() => {
    if (state?.item) return state.item
    return {
      id: 1,
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

  const override = getOverride(item.itemUniqueNumber)
  const displayAcquireAmount = override?.acquireAmount ?? item.acquireAmount ?? ''
  const displayUsefulLife = override?.usefulLife ?? item.usefulLife ?? ''
  const displayRemarks = override?.remarks ?? item.remarks ?? ''

  const handleBackToList = () => {
    navigate('/asset-management/inventory-status')
  }

  const [g2bPrefix, g2bSuffix] = item.g2bNumber.split('-')

  return (
    <AssetManagementPageLayout
      pageKey="inventory-status"
      depthSecondLabel="물품 관리"
      depthThirdLabel="보유 현황 조회"
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
                <TextField value={g2bPrefix ?? ''} readOnly className="operation-ledger-readonly" />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField value={g2bSuffix ?? ''} readOnly className="operation-ledger-readonly" />
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
                value={displayUsefulLife}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득금액</label>
              <TextField
                value={displayAcquireAmount}
                readOnly
                className="operation-ledger-readonly"
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
                className="operation-ledger-detail-textarea operation-ledger-readonly"
                value={displayRemarks}
                readOnly
              />
            </div>
          </div>
        </section>
      </div>
    </AssetManagementPageLayout>
  )
}

export default InventoryStatusDetailPage
