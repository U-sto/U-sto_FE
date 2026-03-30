import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import { useAssetDetailOverrides } from '../../../../contexts/AssetDetailOverridesContext'
import {
  fetchItemAssetDetail,
  mapOperStsToLabel,
  updateItemAsset,
  type ItemAssetDetailData,
  type ItemAssetStatusHistoryItem,
} from '../../../../api/itemAssets'
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

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return ''
}

function mapStatusHistoriesToRows(
  histories: ItemAssetStatusHistoryItem[] | undefined,
  itmNo: string,
): OperationStatusHistoryRow[] {
  if (!Array.isArray(histories) || histories.length === 0) return []
  return histories.map((h, idx) => {
    const o = h as Record<string, unknown>
    return {
      id: idx + 1,
      changeDate: pickStr(o, 'chgAt', 'chgDt', 'regAt', 'changeDate'),
      itemUniqueNumber: itmNo,
      prevStatus:
        mapOperStsToLabel(String(h.prevSts ?? '')) || String(h.prevSts ?? ''),
      newStatus: mapOperStsToLabel(String(h.newSts ?? '')) || String(h.newSts ?? ''),
      reason: String(h.chgRsn ?? ''),
      managerName: pickStr(o, 'mngrNm', 'chgMngrNm', 'managerNm', 'managerName'),
      managerId: pickStr(o, 'mngrId', 'chgMngrId', 'managerId'),
      registrantName: pickStr(o, 'regNm', 'registrantNm', 'registrantName'),
      registrantId: pickStr(o, 'regId', 'regUserId', 'chgUserId', 'registrantId'),
    }
  })
}

function mergeDetailApiToItem(
  api: ItemAssetDetailData,
  listRow: OperationLedgerDetailItem,
): OperationLedgerDetailItem {
  const acqUpr = typeof api.acqUpr === 'number' ? api.acqUpr : Number(api.acqUpr ?? NaN)
  const g2bName = String(api.g2bOnm ?? api.g2bItemNm ?? listRow.g2bName)
  const g2bNo = String(api.g2bItmNo ?? listRow.g2bNumber)
  const drbYr = api.drbYr
  const usefulLife =
    drbYr != null && drbYr !== ''
      ? String(drbYr).endsWith('년')
        ? String(drbYr)
        : `${drbYr}년`
      : listRow.usefulLife

  const qty = api.qty ?? api.acqQty

  return {
    ...listRow,
    itmNo: String(api.itmNo ?? listRow.itmNo),
    itemUniqueNumber: String(api.itmNo ?? listRow.itemUniqueNumber),
    g2bName,
    g2bNumber: g2bNo,
    acquireDate: String(api.acqAt ?? listRow.acquireDate),
    sortDate: String(api.drgAt ?? api.arrgAt ?? listRow.sortDate),
    acquireAmount:
      Number.isFinite(acqUpr) && acqUpr > 0
        ? `${acqUpr.toLocaleString('ko-KR')}원`
        : listRow.acquireAmount,
    operatingDept: String(api.deptNm ?? listRow.operatingDept),
    operatingDeptCode: String(api.deptCd ?? listRow.operatingDeptCode ?? ''),
    operatingStatus:
      mapOperStsToLabel(String(api.operSts ?? '')) ||
      String(api.operSts ?? '') ||
      listRow.operatingStatus,
    usefulLife,
    quantity: qty != null ? String(qty) : listRow.quantity,
    acquireSortType: String(api.arrgTy ?? listRow.acquireSortType ?? ''),
    remarks: String(api.rmk ?? listRow.remarks ?? ''),
  }
}

const OperationLedgerDetailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const { setOverride } = useAssetDetailOverrides()

  const listItem = state?.item ?? null
  const itmNoForApi =
    listItem?.itmNo?.trim() || listItem?.itemUniqueNumber?.trim() || ''

  const [detailPayload, setDetailPayload] = useState<ItemAssetDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(!!itmNoForApi)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    if (!itmNoForApi) {
      setDetailLoading(false)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    void fetchItemAssetDetail(itmNoForApi)
      .then((data) => {
        if (!cancelled) setDetailPayload(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDetailError(e instanceof Error ? e.message : '상세 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [itmNoForApi])

  const item = useMemo<OperationLedgerDetailItem | null>(() => {
    if (!listItem) return null
    if (detailPayload) return mergeDetailApiToItem(detailPayload, listItem)
    return listItem
  }, [listItem, detailPayload])

  const statusHistoryData = useMemo<OperationStatusHistoryRow[]>(() => {
    if (!item) return []
    const histories = detailPayload?.statusHistories
    const rows = mapStatusHistoriesToRows(histories, item.itmNo || item.itemUniqueNumber)
    return rows
  }, [detailPayload, item])

  const formatAmount = (value: string) => {
    const numeric = value.replace(/[^\d]/g, '')
    if (!numeric) return ''
    return Number(numeric).toLocaleString('ko-KR')
  }

  const [form, setForm] = useState(() => ({
    acquireAmount: '',
    usefulLife: '',
    remarks: '',
  }))

  const [savedValues, setSavedValues] = useState<{
    acquireAmount: string
    usefulLife: string
    remarks: string
  } | null>(null)

  useEffect(() => {
    if (!item) return
    const next = {
      acquireAmount: formatAmount(item.acquireAmount ?? ''),
      usefulLife: item.usefulLife ?? '',
      remarks: item.remarks ?? '',
    }
    setForm(next)
    setSavedValues(null)
  }, [item])

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

  const handleSave = async () => {
    if (!item) return
    const itm = item.itmNo?.trim() || item.itemUniqueNumber?.trim()
    if (!itm) {
      window.alert('물품고유번호가 없어 저장할 수 없습니다.')
      return
    }

    const acquPr = Number(String(form.acquireAmount).replace(/\D/g, ''))
    if (!Number.isFinite(acquPr) || acquPr < 0) {
      window.alert('취득금액을 올바르게 입력해 주세요.')
      return
    }

    const drbYrRaw = String(form.usefulLife ?? '').trim()
    const drbYrDigits = drbYrRaw.replace(/[^\d]/g, '')
    const drbYr = drbYrDigits || drbYrRaw
    if (!drbYr) {
      window.alert('내용연수를 입력해 주세요.')
      return
    }

    setSaveLoading(true)
    try {
      await updateItemAsset(itm, {
        acqUpr: acquPr,
        drbYr,
        rmk: form.remarks,
      })
      setSavedValues(form)
      setOverride(item.itemUniqueNumber, {
        acquireAmount: form.acquireAmount,
        usefulLife: form.usefulLife,
        remarks: form.remarks,
      })

      const amtDigits = String(form.acquireAmount).replace(/\D/g, '')
      const updatedItem: OperationLedgerRow = {
        ...item,
        acquireAmount:
          amtDigits !== ''
            ? `${Number(amtDigits).toLocaleString('ko-KR')}원`
            : item.acquireAmount,
        usefulLife: form.usefulLife,
      }

      navigate('/asset-management/operation-management/operation-ledger', {
        state: { updatedItem },
      })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleBackToList = () => {
    if (!item) {
      navigate('/asset-management/operation-management/operation-ledger')
      return
    }
    if (savedValues) {
      const updatedItem: OperationLedgerRow = {
        ...item,
        acquireAmount: savedValues.acquireAmount,
        usefulLife: savedValues.usefulLife,
      }
      navigate('/asset-management/operation-management/operation-ledger', {
        state: { updatedItem },
      })
    } else {
      navigate('/asset-management/operation-management/operation-ledger')
    }
  }

  if (!listItem) {
    return (
      <AssetManagementPageLayout
        pageKey="operation-ledger"
        depthSecondLabel="물품 운용 관리"
        depthThirdLabel="물품 운용 대장 관리"
      >
        <div className="operation-ledger-detail-content" style={{ padding: '24px' }}>
          <p>목록에서 물품을 선택한 뒤 &quot;물품상세정보&quot;를 눌러 주세요.</p>
          <Button
            className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
            onClick={() => navigate('/asset-management/operation-management/operation-ledger')}
          >
            목록으로
          </Button>
        </div>
      </AssetManagementPageLayout>
    )
  }

  const [g2bPrefix, g2bSuffix] = item.g2bNumber.split('-')

  return (
    <AssetManagementPageLayout
      pageKey="operation-ledger"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel="물품 운용 대장 관리"
    >
      <div className="operation-ledger-detail-content">
        {detailLoading && (
          <p style={{ margin: '0 0 12px', color: '#5e818c', fontSize: '0.9rem' }}>
            상세 정보를 불러오는 중…
          </p>
        )}
        {detailError && (
          <p
            style={{
              margin: '0 0 12px',
              color: '#b91c1c',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
            }}
            role="alert"
          >
            {detailError}
            <br />
            <span style={{ color: '#4b5563' }}>목록에서 넘긴 값만 표시합니다.</span>
          </p>
        )}
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
              onClick={() => void handleSave()}
              disabled={detailLoading || saveLoading}
            >
              {saveLoading ? '저장 중…' : '저장'}
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
          getRowKey={(row) => `${row.id}-${row.changeDate}-${row.prevStatus}-${row.newStatus}`}
          variant="lower"
        />
      </div>
    </AssetManagementPageLayout>
  )
}

export default OperationLedgerDetailPage
