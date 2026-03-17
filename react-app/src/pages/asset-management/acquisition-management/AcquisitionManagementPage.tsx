import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import TitlePill from '../../../components/common/TitlePill/TitlePill'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import G2BSearchModal, { type G2BItem } from '../../../features/asset-management/components/G2BSearchModal/G2BSearchModal'
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
const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_SELECT_OPTIONS
const OPERATING_DEPT_CODE_MAP: Record<string, string> = {}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AcquisitionManagementPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [isG2BModalOpen, setIsG2BModalOpen] = useState(false)

  const update = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const handleOperatingDeptChange = (value: string) => {
    update('operatingDept', value)
    update('operatingDeptCode', OPERATING_DEPT_CODE_MAP[value] ?? '')
  }

  const handleSave = () => {
    // TODO: 저장 API 연동
  }

  const handleList = () => {
    navigate('/asset-management/acquisition-management')
  }

  const handleG2BSelect = (item: G2BItem) => {
    update('g2bName', item.name)
    update('g2bNumber', item.number)
    if (item.sortDate !== undefined) update('sortDate', item.sortDate)
    if (item.operatingStatus !== undefined) update('operatingStatus', item.operatingStatus)
    if (item.usefulLife !== undefined) update('usefulLife', item.usefulLife)
    if (item.acquireAmount !== undefined) update('acquireAmount', item.acquireAmount)
  }

  return (
    <AssetManagementPageLayout
      pageKey="acquisition"
      depthSecondLabel="물품 취득 관리"
      depthThirdLabel="물품 기본 정보 관리"
    >
      <div className="acquisition-content">
        {/* 위쪽 한 줄: 왼쪽 제목 pill, 오른쪽 목록·저장 버튼 */}
        <div className="acquisition-form-title-row">
          <TitlePill>물품 기본 정보</TitlePill>
          <div className="acquisition-form-actions">
            <Button className="acquisition-btn acquisition-btn-outline" onClick={handleList}>
              목록
            </Button>
            <Button className="acquisition-btn acquisition-btn-primary" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>

        <section className="acquisition-form-panel">
          <div className="acquisition-form-body">
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
                />
                <button
                  type="button"
                  className="acquisition-search-btn"
                  aria-label="검색"
                  onClick={() => setIsG2BModalOpen(true)}
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
              <TextField
                type="date"
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
                options={ACQUIRE_SORT_OPTIONS}
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
                options={OPERATING_DEPT_OPTIONS}
              />
            </div>
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">운용부서코드</label>
              <TextField
                value={form.operatingDeptCode}
                placeholder=""
                readOnly
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
