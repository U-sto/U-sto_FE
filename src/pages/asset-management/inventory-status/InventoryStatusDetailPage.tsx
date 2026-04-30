import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../features/management/components/DataTable/DataTable'
import {
  fetchAssetInventoryStatusDetail,
  type AssetInventoryStatusDetailItem,
} from '../../../api/itemAssetInventoryStatus'
import type { InventoryStatusRow } from './InventoryStatusPage'
import '../operation-management/operation-ledger/OperationLedgerPage.css'

type LocationState = {
  item?: InventoryStatusRow
}

const InventoryStatusDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const item = state?.item ?? null

  const [detailRows, setDetailRows] = useState<AssetInventoryStatusDetailItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleBackToList = () => {
    navigate('/asset-management/inventory-status')
  }

  useEffect(() => {
    if (!item) return
    if (!item.acqId || !item.deptCd || !item.operStsCode) {
      setLoadError('상세 조회에 필요한 키 값(acqId/deptCd/operSts)이 없습니다.')
      return
    }

    let ignore = false
    setLoading(true)
    setLoadError(null)
    ;(async () => {
      try {
        const rows = await fetchAssetInventoryStatusDetail({
          acqId: item.acqId,
          deptCd: item.deptCd,
          operSts: item.operStsCode,
          acqUpr: item.acqUpr,
          drbYr: item.drbYr,
          rmk: item.rmk,
        })
        if (ignore) return
        setDetailRows(rows)
      } catch (e) {
        if (ignore) return
        setDetailRows([])
        setLoadError(e instanceof Error ? e.message : '보유 현황 상세 정보를 불러오지 못했습니다.')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [item])

  const [g2bPrefix, g2bSuffix] = useMemo(
    () => (item?.g2bNumber ? item.g2bNumber.split('-') : ['', '']),
    [item?.g2bNumber],
  )

  const detailColumns: DataTableColumn<AssetInventoryStatusDetailItem>[] = [
    { key: 'id', header: '순번', render: (row) => row.id },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'operatingStatus', header: '운용상태', render: (row) => row.operatingStatus },
    { key: 'usefulLife', header: '내용연수', render: (row) => row.usefulLife },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'deptCd', header: '운용부서코드', render: (row) => row.deptCd },
    { key: 'remarks', header: '비고', render: (row) => row.remarks },
  ]

  if (!item) {
    return (
      <AssetManagementPageLayout
        pageKey="inventory-status"
        depthSecondLabel="보유 현황 조회"
        depthThirdLabel=""
      >
        <div className="operation-ledger-detail-content">
          <div className="operation-ledger-detail-header-row">
            <TitlePill>물품 상세 정보</TitlePill>
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
            <div style={{ padding: 12 }}>선택된 항목 정보가 없습니다. 목록에서 다시 선택해 주세요.</div>
          </section>
        </div>
      </AssetManagementPageLayout>
    )
  }

  return (
    <AssetManagementPageLayout
      pageKey="inventory-status"
      depthSecondLabel="보유 현황 조회"
      depthThirdLabel=""
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
              <TextField value={item.g2bName ?? ''} readOnly className="operation-ledger-readonly" />
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
              <DatePickerField
                value={item.acquireDate ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">정리일자</label>
              <DatePickerField
                value={item.sortDate ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용상태</label>
              <TextField
                value={item.operatingStatus ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">내용연수</label>
              <TextField
                value={item.usefulLife ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득금액</label>
              <TextField
                value={item.acquireAmount ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용부서</label>
              <TextField
                value={item.operatingDept ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">운용부서코드</label>
              <TextField
                value={item.deptCd ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field">
              <label className="operation-ledger-detail-label">취득ID</label>
              <TextField
                value={item.acqId ?? ''}
                readOnly
                className="operation-ledger-readonly"
              />
            </div>
            <div className="operation-ledger-detail-field operation-ledger-detail-field-span4 operation-ledger-detail-field-remarks">
              <label className="operation-ledger-detail-label">비고</label>
              <textarea
                className="operation-ledger-detail-textarea operation-ledger-readonly"
                value={item.rmk ?? ''}
                readOnly
              />
            </div>
          </div>
        </section>

        {loadError ? (
          <div style={{ margin: '8px 0', color: '#d52e2e', fontSize: 14 }}>{loadError}</div>
        ) : null}

        <DataTable<AssetInventoryStatusDetailItem>
          pageKey="operation-ledger"
          title={loading ? '보유 현황 상세 목록 (조회 중...)' : '보유 현황 상세 목록'}
          data={detailRows}
          totalCount={detailRows.length}
          pageSize={10}
          columns={detailColumns}
          getRowKey={(row) => `${row.id}-${row.itemUniqueNumber}`}
        />
      </div>
    </AssetManagementPageLayout>
  )
}

export default InventoryStatusDetailPage
