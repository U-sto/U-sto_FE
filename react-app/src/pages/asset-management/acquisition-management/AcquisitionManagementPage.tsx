import { useState } from 'react'
import TextField from '../../../components/common/TextField/TextField'
import Dropdown from '../../../components/common/Dropdown/Dropdown'
import Button from '../../../components/common/Button/Button'
import AssetManagementPageLayout from '../../../components/layout/management/AssetManagementPageLayout/AssetManagementPageLayout'
import './AcquisitionManagementPage.css'

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
const OPERATING_DEPT_OPTIONS = ['선택', '운용부서1', '운용부서2', '운용부서3']

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AcquisitionManagementPage = () => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  const update = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const handleSave = () => {
    // TODO: 저장 API 연동
  }

  const handleList = () => {
    // TODO: 목록 화면으로 이동 또는 모달
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
          <span className="acquisition-form-title-pill">물품 기본 정보</span>
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
              <div className="acquisition-input-with-icon">
                <TextField
                  value={form.g2bName}
                  onChange={(e) => update('g2bName', e.target.value)}
                  placeholder="G2B목록명 검색"
                />
                <button type="button" className="acquisition-search-btn" aria-label="검색">
                  <SearchIcon />
                </button>
              </div>
            </div>
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">G2B목록번호</label>
              <TextField
                value={form.g2bNumber}
                onChange={(e) => update('g2bNumber', e.target.value)}
                placeholder=""
              />
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
                type="date"
                value={form.sortDate}
                onChange={(e) => update('sortDate', e.target.value)}
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">운용상태</label>
              <TextField
                value={form.operatingStatus}
                onChange={(e) => update('operatingStatus', e.target.value)}
                placeholder=""
              />
            </div>
            <div className="acquisition-field">
              <label className="acquisition-label">내용연수</label>
              <TextField
                value={form.usefulLife}
                onChange={(e) => update('usefulLife', e.target.value)}
                placeholder=""
              />
            </div>

            {/* Row 3: 취득금액, 수량, 취득정리구분 - 3열 */}
            <div className="acquisition-field">
              <label className="acquisition-label">취득금액</label>
              <TextField
                value={form.acquireAmount}
                onChange={(e) => update('acquireAmount', e.target.value)}
                placeholder=""
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
                onChange={(value: string) => update('operatingDept', value)}
                options={OPERATING_DEPT_OPTIONS}
              />
            </div>
            <div className="acquisition-field acquisition-field-span2">
              <label className="acquisition-label">운용부서코드</label>
              <TextField
                value={form.operatingDeptCode}
                onChange={(e) => update('operatingDeptCode', e.target.value)}
                placeholder=""
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
    </AssetManagementPageLayout>
  )
}

export default AcquisitionManagementPage
