import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import DatePickerField from '../../../components/common/DatePickerField/DatePickerField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import G2BSearchModal, {
  type G2BItem,
  getG2BListNumberParts,
} from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
import {
  createItemAcquisition,
  fetchItemAcquisitionByAcqId,
  updateItemAcquisition,
  type ItemAcquisitionContent,
} from '../../../api/itemAcquisitions'
import {
  fetchOperatingDepartments,
  buildOperatingDepartmentSelect,
} from '../../../api/organization'
import {
  CODE_GROUP,
  buildDescriptionToCodeMap,
  buildSelectOptionsWithPlaceholder,
} from '../../../api/codes'
import { useCommonCodeGroup } from '../../../hooks/useCommonCodeGroup'
import './AcquisitionManagementPage.css'
import { OPERATING_DEPARTMENT_SELECT_OPTIONS } from '../../../constants/departments'

type FormState = {
  g2bName: string
  g2bNumber: string
  acquireDate: string
  sortDate: string
  operatingStatus: string
  usefulLife: string
  acquireAmount: string
  quantity: string
  acquireSortType: string
  operatingDept: string
  operatingDeptCode: string
  remarks: string
}

const INITIAL_FORM: FormState = {
  g2bName: '',
  g2bNumber: '',
  acquireDate: '',
  sortDate: '',
  operatingStatus: '',
  usefulLife: '',
  acquireAmount: '',
  quantity: '',
  acquireSortType: '',
  operatingDept: '',
  operatingDeptCode: '',
  remarks: '',
}

const ACQUIRE_SORT_OPTIONS = ['선택', '취득', '정리', '기타']
/** 취득정리구분 → API arrgTy (TODO: 정확한 코드 알려주시면 수정) */
const ARRG_TY_MAP: Record<string, string> = {
  취득: 'BUY',
  정리: 'ARRG',
  기타: 'ETC',
}
/** 공통코드 미로딩 시 arrgTy 코드 → 라벨 */
const ARRG_CODE_TO_LABEL: Record<string, string> = {
  BUY: '취득',
  ARRG: '정리',
  ETC: '기타',
}
/** 미선택/빈 값일 때만 사용 — 등록 연동 확인용, TODO: 운용부서 코드 확정 후 제거·매핑 적용 */
const TEMP_DEFAULT_ARRG_TY = 'BUY'
const TEMP_DEFAULT_DEPT_CD = 'A350'

/** date input용 YYYY-MM-DD */
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

function formatUsefulLife(drbYr: string): string {
  if (!drbYr) return ''
  return drbYr.endsWith('년') ? drbYr : `${drbYr}년`
}

function buildFormFromDetail(
  item: ItemAcquisitionContent,
  arrgCodeToDesc: Record<string, string>,
  deptLabelToCd: Record<string, string>,
  deptOptions: string[],
): FormState {
  const arrgTy = item.arrgTy?.trim()
  const acquireSortType = arrgTy
    ? arrgCodeToDesc[arrgTy] ?? ARRG_CODE_TO_LABEL[arrgTy] ?? ''
    : ''

  const deptCd = item.deptCd?.trim() ?? ''
  const operatingDept = deptCd
    ? findDeptLabelForCd(deptCd, deptLabelToCd)
    : findDeptLabelByName(item.deptNm ?? '', deptOptions)
  const codeFromLabel =
    operatingDept !== '선택' ? deptLabelToCd[operatingDept] ?? '' : ''

  return {
    g2bName: item.g2bItemNm ?? '',
    g2bNumber: item.g2bItemNo ?? '',
    acquireDate: toDateInputValue(item.acqAt),
    sortDate: toDateInputValue(item.apprAt),
    operatingStatus: item.operSts ?? '',
    usefulLife: formatUsefulLife(item.drbYr ?? ''),
    acquireAmount: item.acqUpr != null ? String(item.acqUpr) : '',
    quantity: item.acqQty != null ? String(item.acqQty) : '',
    acquireSortType,
    operatingDept,
    operatingDeptCode: deptCd || codeFromLabel,
    remarks: item.rmk ?? '',
  }
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AcquisitionManagementPage = () => {
  const navigate = useNavigate()
  const { acqId: acqIdParam } = useParams<{ acqId?: string }>()
  const acquisitionId = acqIdParam?.trim() ?? ''
  const isEditMode = acquisitionId.length > 0

  const { group: arrgGroup } = useCommonCodeGroup(CODE_GROUP.ACQ_ARRANGEMENT_TYPE)
  const arrgDescToCode = useMemo(
    () => buildDescriptionToCodeMap(arrgGroup ?? undefined),
    [arrgGroup],
  )
  const arrgCodeToDesc = useMemo(() => {
    const inv: Record<string, string> = {}
    for (const [desc, code] of Object.entries(arrgDescToCode)) {
      inv[code] = desc
    }
    return inv
  }, [arrgDescToCode])
  const arrgOptions = useMemo(() => {
    if (Object.keys(arrgDescToCode).length > 0) {
      return buildSelectOptionsWithPlaceholder(arrgDescToCode)
    }
    return ACQUIRE_SORT_OPTIONS
  }, [arrgDescToCode])

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  /** 운용부서: GET /api/organization/departments 성공 시 API 목록, 실패 시 constants 폴백 */
  const [deptOptions, setDeptOptions] = useState<string[]>(() => [
    ...OPERATING_DEPARTMENT_SELECT_OPTIONS,
  ])
  const [deptLabelToCd, setDeptLabelToCd] = useState<Record<string, string>>({})
  const [detail, setDetail] = useState<ItemAcquisitionContent | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setDetail(null)
      setForm(INITIAL_FORM)
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !acquisitionId) return
    let cancelled = false
    setLoadingDetail(true)
    ;(async () => {
      try {
        const d = await fetchItemAcquisitionByAcqId(acquisitionId)
        if (cancelled) return
        if (!d) {
          window.alert('취득 정보를 불러오지 못했습니다.')
          navigate('/asset-management/acquisition-management')
          return
        }
        setDetail(d)
      } catch (e) {
        if (!cancelled) {
          window.alert(e instanceof Error ? e.message : '조회에 실패했습니다.')
          navigate('/asset-management/acquisition-management')
        }
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEditMode, acquisitionId, navigate])

  useEffect(() => {
    if (!isEditMode || !detail) return
    setForm(buildFormFromDetail(detail, arrgCodeToDesc, deptLabelToCd, deptOptions))
  }, [isEditMode, detail, arrgCodeToDesc, deptLabelToCd, deptOptions])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchOperatingDepartments()
        if (cancelled) return
        const { options, labelToDeptCd } = buildOperatingDepartmentSelect(rows)
        if (options.length > 1) {
          setDeptOptions(options)
          setDeptLabelToCd(labelToDeptCd)
        }
      } catch {
        if (!cancelled) {
          setDeptOptions([...OPERATING_DEPARTMENT_SELECT_OPTIONS])
          setDeptLabelToCd({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const update = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const handleOperatingDeptChange = (value: string) => {
    update('operatingDept', value)
    update('operatingDeptCode', deptLabelToCd[value] ?? '')
  }

  const handleSave = async () => {
    const raw = form.g2bNumber.trim()
    const dash = raw.indexOf('-')
    const g2b0Cd = (dash === -1 ? raw : raw.slice(0, dash)).replace(/-/g, '').trim()
    const g2bDCd = (dash === -1 ? '' : raw.slice(dash + 1)).replace(/-/g, '').trim()
    if (!g2b0Cd) {
      window.alert(
        isEditMode ? 'G2B 목록번호가 없습니다.' : 'G2B 목록을 검색하여 물품을 선택해 주세요.',
      )
      return
    }
    if (!form.acquireDate) {
      window.alert('취득일자를 입력해 주세요.')
      return
    }
    const qty = Number.parseInt(String(form.quantity).replace(/,/g, ''), 10)
    if (!Number.isFinite(qty) || qty <= 0) {
      window.alert('수량을 1 이상 입력해 주세요.')
      return
    }

    const sort =
      form.acquireSortType && form.acquireSortType !== '선택' ? form.acquireSortType : null
    const arrgTy = sort
      ? arrgDescToCode[sort] ?? ARRG_TY_MAP[sort] ?? TEMP_DEFAULT_ARRG_TY
      : TEMP_DEFAULT_ARRG_TY
    const deptCd =
      form.operatingDeptCode.trim() ||
      (form.operatingDept && form.operatingDept !== '선택'
        ? deptLabelToCd[form.operatingDept] ?? ''
        : '') ||
      TEMP_DEFAULT_DEPT_CD

    setSaving(true)
    try {
      if (isEditMode) {
        await updateItemAcquisition(acquisitionId, {
          ...(g2bDCd ? { g2bDCd } : {}),
          acqAt: form.acquireDate,
          acqQty: qty,
          arrgTy,
          deptCd,
          rmk: form.remarks.trim() || undefined,
        })
        window.alert('물품 취득이 수정되었습니다.')
        navigate('/asset-management/acquisition-management')
        return
      }

      await createItemAcquisition({
        g2b0Cd,
        ...(g2bDCd ? { g2bDCd } : {}),
        acqAt: form.acquireDate,
        acqQty: qty,
        arrgTy,
        deptCd,
        rmk: form.remarks.trim() || undefined,
      })
      window.alert('물품 취득이 등록되었습니다.')
      setForm(INITIAL_FORM)
      navigate('/asset-management/acquisition-management')
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleList = () => {
    navigate('/asset-management/acquisition-management')
  }

  const handleG2BSelect = (item: G2BItem) => {
    const { prefix, suffix } = getG2BListNumberParts(item)
    const g2bNumberJoined = [prefix, suffix].filter(Boolean).join('-')
    update('g2bName', item.name)
    update('g2bNumber', g2bNumberJoined || item.number)
    if (item.sortDate !== undefined) update('sortDate', item.sortDate)
    if (item.operatingStatus !== undefined) update('operatingStatus', item.operatingStatus)
    if (item.usefulLife !== undefined) update('usefulLife', item.usefulLife)
    if (item.acquireAmount !== undefined) update('acquireAmount', item.acquireAmount)
  }

  return (
    <AssetManagementPageLayout
      pageKey="acquisition"
      depthSecondLabel="물품 취득 관리"
      depthThirdLabel={isEditMode ? '물품 기본 정보 수정' : '물품 기본 정보 관리'}
    >
      <div className="acquisition-content">
        {/* 위쪽 한 줄: 왼쪽 제목 pill, 오른쪽 목록·저장 버튼 */}
        <div className="acquisition-form-title-row">
          <TitlePill>물품 기본 정보</TitlePill>
          <div className="acquisition-form-actions">
            <Button className="acquisition-btn acquisition-btn-outline" onClick={handleList}>
              목록
            </Button>
            <Button
              className="acquisition-btn acquisition-btn-primary"
              onClick={() => void handleSave()}
              disabled={saving || (isEditMode && loadingDetail)}
            >
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>

        <section className="acquisition-form-panel">
          {isEditMode && loadingDetail ? (
            <div className="acquisition-form-body acquisition-form-loading" role="status">
              취득 정보를 불러오는 중…
            </div>
          ) : null}
          <div className="acquisition-form-body" hidden={isEditMode && loadingDetail}>
          <div className="acquisition-form-grid">
            {/* Row 1: G2B목록명(넓게), G2B목록번호 - 2열 */}
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">G2B목록명</label>
              <div className="acquisition-input-and-search">
                <TextField
                  value={form.g2bName}
                  onChange={(e) => update('g2bName', e.target.value)}
                  placeholder="G2B목록명 검색"
                  className="acquisition-g2b-input"
                  readOnly={isEditMode}
                />
                <button
                  type="button"
                  className="acquisition-search-btn"
                  aria-label="검색"
                  onClick={() => setIsG2BModalOpen(true)}
                  disabled={isEditMode}
                >
                  <SearchIcon />
                </button>
              </div>
            </div>
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">G2B목록번호</label>
              <div className="acquisition-g2b-number-split">
                <TextField
                  value={form.g2bNumber.split('-')[0] ?? ''}
                  readOnly
                  className="acquisition-readonly acquisition-g2b-number-box"
                />
                <span className="acquisition-g2b-number-sep">-</span>
                <TextField
                  value={form.g2bNumber.split('-')[1] ?? ''}
                  readOnly
                  className="acquisition-readonly acquisition-g2b-number-box"
                />
              </div>
            </div>

            {/* Row 2: 취득일자, 정리일자, 운용상태, 내용연수 - 4열 동일 너비 */}
            <div className="acquisition-field">
              <label className="acquisition-label">취득일자</label>
              <DatePickerField
                value={form.acquireDate}
                onChange={(e) => update('acquireDate', e.target.value)}
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">정리일자</label>
              <TextField
                type="text"
                value={form.sortDate}
                readOnly
                className="acquisition-readonly"
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">운용상태</label>
              <TextField
                value={form.operatingStatus}
                placeholder=""
                readOnly
                className="acquisition-readonly"
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">내용연수</label>
              <TextField
                value={form.usefulLife}
                placeholder=""
                readOnly
                className="acquisition-readonly"
              />
            </div>

            {/* Row 3: 취득금액, 수량, 취득정리구분 - 3열 */}
            <div className="acquisition-field">
              <label className="acquisition-label">취득금액</label>
              <TextField
                value={form.acquireAmount}
                placeholder=""
                readOnly
                className="acquisition-readonly"
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">수량</label>
              <TextField
                value={form.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                placeholder=""
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">취득정리구분</label>
              <Dropdown
                size="small"
                placeholder="선택"
                value={form.acquireSortType}
                onChange={(value: string) => update('acquireSortType', value)}
                options={arrgOptions}
              />
            </div>

            {/* Row 4: 운용부서, 운용부서코드 - 2열 */}
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">운용부서</label>
              <Dropdown
                size="small"
                placeholder="선택"
                value={form.operatingDept}
                onChange={handleOperatingDeptChange}
                options={deptOptions}
              />
            </div>
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">운용부서코드</label>
              <TextField
                value={form.operatingDeptCode}
                placeholder="예: A350"
                onChange={(e) => update('operatingDeptCode', e.target.value)}
                className="acquisition-readonly"
              />
            </div>

            {/* Row 5: 비고 - 전체 너비 */}
            <div className="acquisition-field acquisition-field-full acquisition-field-remarks">
              <label className="acquisition-label">비고</label>
              <textarea
                className="acquisition-textarea"
                value={form.remarks}
                onChange={(e) => update('remarks', e.target.value)}
                placeholder=""
                rows={4}
              />
            </div>
          </div>
        </div>
        </section>
      </div>
      <G2BSearchModal
        isOpen={isG2BModalOpen}
        onClose={() => setIsG2BModalOpen(false)}
        onSelect={handleG2BSelect}
      />
    </AssetManagementPageLayout>
  )
}

export default AcquisitionManagementPage
