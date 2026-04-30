import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import TextField from '../../../../components/common/TextField/TextField'
import DatePickerField from '../../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../../components/common/Dropdown/Dropdown'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import DataTable, {
  type DataTableColumn,
} from '../../../../features/management/components/DataTable/DataTable'
import {
  fetchItemAssets,
  type AssetLedgerFilters,
  type AssetLedgerRow,
} from '../../../../api/itemAssets'
import {
  createItemOperation,
  updateItemOperation,
  fetchItemOperationMaster,
  extractItemOperationMasterFields,
  fetchAllOperationTransferItems,
  fetchOperationTransferRegistrations,
  itemStsCodeToRegistrationLabel,
  ITEM_OPERATION_REGISTRATION_ITEM_STS,
  type OperationTransferItemRow,
} from '../../../../api/itemOperations'
import {
  useOperatingStatusFilterOptions,
  useItemStatusSelectOptions,
  resolveOperatingStatusFilterValue,
} from '../../../../hooks/useCommonCodeOptions'
import {
  fetchOperatingDepartments,
  buildOperatingDepartmentSelect,
} from '../../../../api/organization'
import '../operation-ledger/OperationLedgerPage.css'
import '../return-management/ReturnManagementPage.css'
import {
  OPERATING_DEPARTMENT_SELECT_OPTIONS,
  resolveDeptCdForOperation,
} from '../../../../constants/departments'
import { useOperatingDepartmentFilterOptions } from '../../../../hooks/useOperatingDepartmentOptions'

/** 공통코드 없을 때 resolveAssetStatusForForm 초기값 */
const FALLBACK_ASSET_STATUS_LABELS = ['운용중', '반납', '불용', '처분']

const INITIAL_FILTERS: AssetLedgerFilters = {
  g2bName: '',
  g2bNumberPrefix: '',
  g2bNumberSuffix: '',
  itemUniqueNumber: '',
  operatingDept: '전체',
  operatingStatus: '전체',
  acquireDateFrom: '',
  acquireDateTo: '',
  sortDateFrom: '',
  sortDateTo: '',
}

const rowUniqueKey = (row: AssetLedgerRow) =>
  row.itmNo || row.itemUniqueNumber || String(row.id)

/** 목록에서 수정 진입 시 넘기는 state */
export type OperationTransferEditLocationState = {
  transferDate?: string
  registrantId?: string
  registrantName?: string
}

/** date input용 YYYY-MM-DD (UTC 보정으로 하루 밀리는 현상 완화) */
function toDateInputValue(s: string): string {
  if (!s) return ''
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  try {
    const d = new Date(t)
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  } catch {
    /* ignore */
  }
  return ''
}

function findDeptLabelForCd(deptCd: string, labelToCd: Record<string, string>): string {
  if (!deptCd.trim()) return '선택'
  for (const [label, cd] of Object.entries(labelToCd)) {
    if (cd === deptCd) return label
  }
  return '선택'
}

/** API 부서명과 드롭다운 라벨 매칭 (전각/공백·ERICA 표기 차이 허용) */
function findDeptLabelByName(deptNm: string, optionLabels: string[]): string {
  const n = deptNm.trim()
  if (!n) return '선택'
  const exact = optionLabels.find((o) => o === n)
  if (exact) return exact
  const norm = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const nNorm = norm(n)
  const loose = optionLabels.find(
    (o) => norm(o) === nNorm || o.includes(n) || n.includes(o.replace(/\s*\(ERICA\)\s*$/u, '')),
  )
  return loose ?? '선택'
}

function pickMasterString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return ''
}

function operationItemToLedgerRow(item: OperationTransferItemRow, index: number): AssetLedgerRow {
  const unq = item.itemUniqueNumber.trim()
  return {
    id: index + 1,
    g2bNumber: item.g2bNumber,
    g2bName: item.g2bName,
    itmNo: unq,
    itemUniqueNumber: unq,
    acquireDate: item.acquireDate,
    sortDate: '',
    acquireAmount: item.acquireAmount,
    operatingDept: item.operatingDept,
    operatingStatus: item.itemStatus,
    usefulLife: '',
  }
}

function resolveAssetStatusForForm(
  masterItemSts: string,
  firstRowOperatingStatus: string,
  allowedLabels: string[],
): string {
  const fromMaster = itemStsCodeToRegistrationLabel(masterItemSts)
  if (fromMaster !== '선택' && allowedLabels.includes(fromMaster)) return fromMaster
  const o1 = firstRowOperatingStatus.trim()
  if (allowedLabels.includes(o1)) return o1
  const fromRow = itemStsCodeToRegistrationLabel(o1)
  if (allowedLabels.includes(fromRow)) return fromRow
  return '선택'
}

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

const OperationTransferRegistrationPage = () => {
  const navigate = useNavigate()
  const operatingDeptOptions = useOperatingDepartmentFilterOptions()
  const { operMId: operMIdParam } = useParams<{ operMId: string }>()
  const location = useLocation()
  const operMId = operMIdParam?.trim() ?? ''
  const isEditMode = Boolean(operMId)

  const { options: operatingStatusFilterOptions, descToCode: operStatusDescToCode } =
    useOperatingStatusFilterOptions()
  const {
    options: assetStatusOptions,
    descToCode: itemStsDescToCode,
    codeToDesc: codeToItemStsDesc,
  } = useItemStatusSelectOptions()
  const allowedAssetStatusLabels = useMemo(
    () => assetStatusOptions.filter((o) => o !== '선택'),
    [assetStatusOptions],
  )

  /** 수정 시 마스터 itemSts 코드 — 공통코드 로드 후 드롭다운 라벨 동기화 */
  const pendingMasterItemStsCodeRef = useRef<string | null>(null)

  const [filters, setFilters] = useState<AssetLedgerFilters>({ ...INITIAL_FILTERS })
  const [searchedFilters, setSearchedFilters] = useState<AssetLedgerFilters>(() => ({
    ...INITIAL_FILTERS,
  }))
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerData, setLedgerData] = useState<AssetLedgerRow[]>([])
  const [ledgerTotal, setLedgerTotal] = useState(0)

  const [ledgerCheckedKeys, setLedgerCheckedKeys] = useState<Set<string>>(() => new Set())
  const [selectedRows, setSelectedRows] = useState<AssetLedgerRow[]>([])
  const [selectedTableCheckedKeys, setSelectedTableCheckedKeys] = useState<Set<string>>(
    () => new Set(),
  )

  const [transferInfo, setTransferInfo] = useState({
    transferDate: '',
    registrantId: '',
    assetStatus: '선택',
    transferOperatingDept: '선택',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [editInitialLoading, setEditInitialLoading] = useState(false)
  /** 운용부서(전환 대상): GET /api/organization/departments — 취득관리와 동일 */
  const [transferDeptOptions, setTransferDeptOptions] = useState<string[]>(() => [
    ...OPERATING_DEPARTMENT_SELECT_OPTIONS,
  ])
  const [deptLabelToCd, setDeptLabelToCd] = useState<Record<string, string>>({})
  /** 수정 폼 로드 시 마스터의 deptCd — 드롭다운 라벨 매핑 실패 시 저장 요청에 폴백 */
  const editLoadedDeptCdRef = useRef<string | null>(null)

  /** 공통코드 로드 후 수정 폼: API 코드 → 라벨로 물품상태 맞춤 */
  useEffect(() => {
    if (!isEditMode || !operMId) return
    const code = pendingMasterItemStsCodeRef.current
    if (!code?.trim()) return
    if (Object.keys(codeToItemStsDesc).length === 0) return
    const label = codeToItemStsDesc[code.trim()]
    if (label && allowedAssetStatusLabels.includes(label)) {
      setTransferInfo((prev) => ({ ...prev, assetStatus: label }))
      pendingMasterItemStsCodeRef.current = null
    }
  }, [isEditMode, operMId, codeToItemStsDesc, allowedAssetStatusLabels])

  /** 등록 화면에서만 부서 목록 단독 로드 (수정은 아래 edit에서 함께 로드) */
  useEffect(() => {
    if (isEditMode) return
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchOperatingDepartments()
        if (cancelled) return
        const { options, labelToDeptCd } = buildOperatingDepartmentSelect(rows)
        if (options.length > 1) {
          setTransferDeptOptions(options)
          setDeptLabelToCd(labelToDeptCd)
        }
      } catch {
        if (!cancelled) {
          setTransferDeptOptions([...OPERATING_DEPARTMENT_SELECT_OPTIONS])
          setDeptLabelToCd({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditMode])

  /** 수정: 기존 등록 + 물품 목록 불러오기 (마스터 GET → 목록 state → 운용등록 목록 API 순으로 보조) */
  useEffect(() => {
    if (!isEditMode || !operMId) return
    let cancelled = false
    const listState = (location.state ?? null) as OperationTransferEditLocationState | null
    ;(async () => {
      setEditInitialLoading(true)
      editLoadedDeptCdRef.current = null
      try {
        const deptRows = await fetchOperatingDepartments()
        if (cancelled) return
        const { options, labelToDeptCd: lmap } = buildOperatingDepartmentSelect(deptRows)
        if (options.length > 1) {
          setTransferDeptOptions(options)
          setDeptLabelToCd(lmap)
        } else {
          setTransferDeptOptions([...OPERATING_DEPARTMENT_SELECT_OPTIONS])
          setDeptLabelToCd({})
        }

        const [masterRaw, itemRows] = await Promise.all([
          fetchItemOperationMaster(operMId),
          fetchAllOperationTransferItems(operMId),
        ])
        if (cancelled) return

        let listSnapshot: OperationTransferEditLocationState | null = null
        try {
          const res = await fetchOperationTransferRegistrations({
            page: 1,
            pageSize: 500,
            filters: { transferDateFrom: '', transferDateTo: '', approvalStatus: '전체' },
          })
          const found = res.data.find((r) => r.operMId === operMId)
          if (found) {
            listSnapshot = {
              transferDate: found.transferDate,
              registrantId: found.registrantId,
              registrantName: found.registrantName,
            }
          }
        } catch {
          /* 목록 보조 실패 시 무시 */
        }

        const fields = extractItemOperationMasterFields(masterRaw)
        editLoadedDeptCdRef.current = fields.deptCd.trim() || null
        const ledgerRows = itemRows.map((item, i) => operationItemToLedgerRow(item, i))
        setSelectedRows(ledgerRows)
        setLedgerCheckedKeys(new Set(ledgerRows.map(rowUniqueKey)))
        setSelectedTableCheckedKeys(new Set())

        const snapshot: OperationTransferEditLocationState = {
          transferDate: listState?.transferDate ?? listSnapshot?.transferDate ?? '',
          registrantId: listState?.registrantId ?? listSnapshot?.registrantId ?? '',
          registrantName: listState?.registrantName ?? listSnapshot?.registrantName ?? '',
        }

        const aplyAt = toDateInputValue(fields.aplyAt || snapshot.transferDate || '')

        let deptLabel = fields.deptCd ? findDeptLabelForCd(fields.deptCd, lmap) : '선택'
        if (deptLabel === '선택' && fields.deptNm) {
          deptLabel = findDeptLabelByName(fields.deptNm, options)
        }
        if (deptLabel === '선택' && ledgerRows[0]?.operatingDept) {
          deptLabel = findDeptLabelByName(ledgerRows[0].operatingDept, options)
        }

        const firstOp = ledgerRows[0]?.operatingStatus ?? ''
        const assetStatus = resolveAssetStatusForForm(
          fields.itemSts,
          firstOp,
          FALLBACK_ASSET_STATUS_LABELS,
        )
        pendingMasterItemStsCodeRef.current = fields.itemSts.trim() || null

        const rgstId =
          fields.rgstId ||
          (masterRaw
            ? pickMasterString(masterRaw, ['aplyUsrId', 'rgstId', 'regId', 'rgstUsrId'])
            : '') ||
          snapshot.registrantId ||
          ''

        setTransferInfo({
          transferDate: aplyAt,
          registrantId: rgstId,
          assetStatus,
          transferOperatingDept: deptLabel,
        })
      } catch (e) {
        console.error(e)
        window.alert('운용 등록 정보를 불러오지 못했습니다.')
        navigate('/asset-management/operation-management/operation-transfer', { replace: true })
      } finally {
        if (!cancelled) setEditInitialLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 진입 시점의 location.state만 사용 (재실행으로 폼 덮어쓰기 방지)
  }, [isEditMode, operMId, navigate])

  const loadLedger = useCallback(async () => {
    try {
      const res = await fetchItemAssets({
        page: ledgerPage,
        pageSize: 10,
        filters: {
          ...searchedFilters,
          operatingStatus: resolveOperatingStatusFilterValue(
            searchedFilters.operatingStatus,
            operStatusDescToCode,
          ),
        },
      })
      setLedgerData(res.data)
      setLedgerTotal(res.totalCount)
    } catch {
      setLedgerData([])
      setLedgerTotal(0)
    }
  }, [ledgerPage, searchedFilters, operStatusDescToCode])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  const ledgerColumns: DataTableColumn<AssetLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => {
        const key = rowUniqueKey(row)
        return (
          <input
            type="checkbox"
            checked={ledgerCheckedKeys.has(key)}
            onChange={(e) => {
              if (e.target.checked) {
                setLedgerCheckedKeys((prev) => new Set(prev).add(key))
                setSelectedRows((prev) =>
                  prev.some((r) => rowUniqueKey(r) === key) ? prev : [...prev, row],
                )
              } else {
                setLedgerCheckedKeys((prev) => {
                  const next = new Set(prev)
                  next.delete(key)
                  return next
                })
                setSelectedRows((prev) => prev.filter((r) => rowUniqueKey(r) !== key))
              }
            }}
          />
        )
      },
    },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'operatingStatus', header: '운용상태', render: (row) => row.operatingStatus },
    { key: 'usefulLife', header: '내용연수', render: (row) => row.usefulLife },
  ]

  const selectedColumns: DataTableColumn<AssetLedgerRow>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => {
        const key = rowUniqueKey(row)
        return (
          <input
            type="checkbox"
            checked={selectedTableCheckedKeys.has(key)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTableCheckedKeys((prev) => new Set(prev).add(key))
              } else {
                setSelectedTableCheckedKeys((prev) => {
                  const next = new Set(prev)
                  next.delete(key)
                  return next
                })
              }
            }}
          />
        )
      },
    },
    { key: 'g2bNumber', header: 'G2B목록번호', render: (row) => row.g2bNumber },
    { key: 'g2bName', header: 'G2B목록명', render: (row) => row.g2bName },
    { key: 'itemUniqueNumber', header: '물품고유번호', render: (row) => row.itemUniqueNumber },
    { key: 'acquireDate', header: '취득일자', render: (row) => row.acquireDate },
    { key: 'acquireAmount', header: '취득금액', render: (row) => row.acquireAmount },
    { key: 'sortDate', header: '정리일자', render: (row) => row.sortDate },
    { key: 'operatingDept', header: '운용부서', render: (row) => row.operatingDept },
    { key: 'operatingStatus', header: '운용상태', render: (row) => row.operatingStatus },
    { key: 'usefulLife', header: '내용연수', render: (row) => row.usefulLife },
  ]

  const handleReset = () => {
    setFilters({ ...INITIAL_FILTERS })
    setSearchedFilters({ ...INITIAL_FILTERS })
    setLedgerPage(1)
  }

  const handleSearch = () => {
    setSearchedFilters({ ...filters })
    setLedgerPage(1)
  }

  const handleDeleteSelected = useCallback(() => {
    setSelectedRows((prev) => prev.filter((r) => !selectedTableCheckedKeys.has(rowUniqueKey(r))))
    setSelectedTableCheckedKeys(new Set())
    setLedgerCheckedKeys((prev) => {
      const next = new Set(prev)
      selectedTableCheckedKeys.forEach((k) => next.delete(k))
      return next
    })
  }, [selectedTableCheckedKeys])

  const handleDeleteAll = useCallback(() => {
    setSelectedRows([])
    setSelectedTableCheckedKeys(new Set())
    setLedgerCheckedKeys(new Set())
  }, [])

  const handleSave = async () => {
    if (selectedRows.length === 0) {
      window.alert('등록할 물품을 선택해 주세요.')
      return
    }
    if (!transferInfo.transferDate.trim()) {
      window.alert('운용전환일자를 입력해 주세요.')
      return
    }
    const assetStatusLabel = transferInfo.assetStatus.trim()
    if (assetStatusLabel === '선택' || !assetStatusLabel) {
      window.alert('물품상태를 선택해 주세요.')
      return
    }
    if (transferInfo.transferOperatingDept === '선택') {
      window.alert('운용부서를 선택해 주세요.')
      return
    }

    const itemSts =
      itemStsDescToCode[assetStatusLabel] ??
      ITEM_OPERATION_REGISTRATION_ITEM_STS[assetStatusLabel]
    if (!itemSts) {
      window.alert(
        `물품상태 값이 올바르지 않습니다. (${assetStatusLabel})\n` +
          '목록에서 선택한 값에 해당하는 코드를 찾을 수 없습니다.\n' +
          '(공통코드 ITEM_STATUS/OPER_STATUS 또는 로컬 매핑을 확인하세요.)',
      )
      return
    }

    const deptCd =
      deptLabelToCd[transferInfo.transferOperatingDept] ??
      resolveDeptCdForOperation(transferInfo.transferOperatingDept) ??
      (isEditMode ? editLoadedDeptCdRef.current ?? '' : '')
    if (!deptCd) {
      window.alert(
        '운용부서에 해당하는 부서코드(deptCd)를 찾을 수 없습니다.\n' +
          '부서 목록 API(/api/organization/departments) 응답을 확인하거나,\n' +
          'constants/departments.ts의 DEPARTMENT_NAME_TO_DEPT_CD에 매핑을 추가해 주세요.',
      )
      return
    }

    const itmNos = selectedRows
      .map((r) => r.itmNo?.trim())
      .filter((n): n is string => Boolean(n && n.length > 0))
    if (itmNos.length !== selectedRows.length) {
      window.alert('선택한 물품 중 물품번호(itmNo)가 없는 행이 있습니다. 대장에서 다시 조회한 뒤 선택해 주세요.')
      return
    }

    setSaveLoading(true)
    try {
      const body = {
        aplyAt: transferInfo.transferDate,
        itemSts,
        deptCd,
        itmNos,
      }
      if (isEditMode && operMId) {
        await updateItemOperation(operMId, body)
        window.alert('수정되었습니다.')
        navigate('/asset-management/operation-management/operation-transfer')
        return
      }
      const result = await createItemOperation(body)
      if (result == null) {
        window.alert('저장에 실패했습니다. 서버 응답이 없습니다.')
        return
      }
      window.alert('운용 전환 등록이 완료되었습니다.')
      navigate('/asset-management/operation-management/operation-transfer')
    } catch (e) {
      console.error(e)
      const detail =
        e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : '알 수 없는 오류'
      window.alert(
        `저장에 실패했습니다.\n\n${detail}\n\n(브라우저 개발자 도구 → 네트워크 탭에서 응답 본문을 확인할 수 있습니다.)`,
      )
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <AssetManagementPageLayout
      pageKey="operation-ledger"
      depthSecondLabel="물품 운용 관리"
      depthThirdLabel={isEditMode ? '물품 운용 전환 수정' : '물품 운용 전환'}
    >
      {editInitialLoading && (
        <p className="operation-ledger-filter" style={{ margin: '0 0 12px', color: '#555' }}>
          수정할 데이터를 불러오는 중…
        </p>
      )}
      <section className="operation-ledger-filter">
        <div className="operation-ledger-filter-wrapper">
          <div className="operation-ledger-filter-grid">
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록명</div>
              <div className="operation-ledger-input-and-search">
                <TextField
                  value={filters.g2bName}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bName: e.target.value }))
                  }
                  placeholder="G2B목록명 입력"
                  className="operation-ledger-g2b-input"
                />
                <button
                  type="button"
                  className="operation-ledger-search-btn"
                  aria-label="G2B목록명 검색"
                >
                  <SearchIcon />
                </button>
              </div>
            </div>
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">운용부서</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingDept}
                onChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, operatingDept: value }))
                }
                options={operatingDeptOptions}
              />
            </div>
            <div className="operation-ledger-field">
              <div className="operation-ledger-label">운용상태</div>
              <Dropdown
                size="small"
                placeholder="전체"
                value={filters.operatingStatus}
                onChange={(value: string) =>
                  setFilters((prev) => ({ ...prev, operatingStatus: value }))
                }
                options={operatingStatusFilterOptions}
              />
            </div>

            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">G2B목록번호</div>
              <div className="operation-ledger-g2b-number-split">
                <TextField
                  value={filters.g2bNumberPrefix}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bNumberPrefix: e.target.value }))
                  }
                />
                <span className="operation-ledger-g2b-number-sep">-</span>
                <TextField
                  value={filters.g2bNumberSuffix}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, g2bNumberSuffix: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">물품고유번호</div>
              <TextField
                value={filters.itemUniqueNumber}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, itemUniqueNumber: e.target.value }))
                }
                placeholder="물품고유번호 입력"
              />
            </div>
            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">취득일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.acquireDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, acquireDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.acquireDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, acquireDateTo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="operation-ledger-field operation-ledger-field-span2">
              <div className="operation-ledger-label">정리일자</div>
              <div className="operation-ledger-date-range">
                <DatePickerField
                  value={filters.sortDateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortDateFrom: e.target.value }))
                  }
                />
                <span className="operation-ledger-date-sep">~</span>
                <DatePickerField
                  value={filters.sortDateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortDateTo: e.target.value }))
                  }
                />
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

      <div className="return-registration-ledger-table-wrap">
        <DataTable<AssetLedgerRow>
          pageKey="operation-ledger"
          title="물품 운용 대장 목록"
          data={ledgerData}
          totalCount={ledgerTotal}
          pageSize={10}
          currentPage={ledgerPage}
          onPageChange={setLedgerPage}
          columns={ledgerColumns}
          getRowKey={(row) => rowUniqueKey(row)}
        />
      </div>

      <DataTable<AssetLedgerRow>
        pageKey="operation-ledger"
        title="선택 물품 목록"
        data={selectedRows}
        totalCount={selectedRows.length}
        pageSize={10}
        columns={selectedColumns}
        getRowKey={(row) => rowUniqueKey(row)}
        renderActions={() => (
          <div className="operation-ledger-table-actions">
            <Button
              className="operation-ledger-btn operation-ledger-btn-outline operation-ledger-btn-table"
              onClick={handleDeleteSelected}
            >
              선택삭제
            </Button>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={handleDeleteAll}
            >
              전체삭제
            </Button>
          </div>
        )}
      />

      <div className="operation-ledger-detail-content">
        <div className="operation-ledger-detail-header-row">
          <TitlePill>{isEditMode ? '운용 전환 정보 (수정)' : '운용 전환 정보'}</TitlePill>
        </div>
        <section className="operation-ledger-detail-panel return-registration-info-panel">
          <div className="return-registration-info-inner">
            <div className="operation-ledger-detail-grid">
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">운용전환일자</label>
                <DatePickerField
                  value={transferInfo.transferDate}
                  onChange={(e) =>
                    setTransferInfo((prev) => ({ ...prev, transferDate: e.target.value }))
                  }
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">등록자ID</label>
                <TextField
                  value={transferInfo.registrantId}
                  onChange={(e) =>
                    setTransferInfo((prev) => ({ ...prev, registrantId: e.target.value }))
                  }
                  placeholder="등록자ID"
                  className="operation-ledger-detail-input"
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">물품상태</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={transferInfo.assetStatus}
                  onChange={(value: string) =>
                    setTransferInfo((prev) => ({ ...prev, assetStatus: value }))
                  }
                  options={assetStatusOptions}
                />
              </div>
              <div className="operation-ledger-detail-field">
                <label className="operation-ledger-detail-label">운용부서</label>
                <Dropdown
                  size="small"
                  placeholder="선택"
                  value={transferInfo.transferOperatingDept}
                  onChange={(value: string) =>
                    setTransferInfo((prev) => ({ ...prev, transferOperatingDept: value }))
                  }
                  options={transferDeptOptions}
                />
              </div>
            </div>
            <Button
              className="operation-ledger-btn operation-ledger-btn-primary operation-ledger-btn-table"
              onClick={() => void handleSave()}
              disabled={saveLoading || editInitialLoading}
            >
              {saveLoading
                ? isEditMode
                  ? '수정 중…'
                  : '저장 중…'
                : isEditMode
                  ? '수정 저장'
                  : '저장'}
            </Button>
          </div>
        </section>
      </div>
    </AssetManagementPageLayout>
  )
}

export default OperationTransferRegistrationPage
