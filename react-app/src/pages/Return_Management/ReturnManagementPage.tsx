import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/GNBWithMenu'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import ChatBotButton from '../../components/ChatBotButton'
import './ReturnManagementPage.css'

type Filters = {
  returnDateFrom: string
  returnDateTo: string
  approvalStatus: string
}

const ReturnManagementPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({
    returnDateFrom: '',
    returnDateTo: '',
    approvalStatus: '전체',
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const [returnDateError, setReturnDateError] = useState<string>('')
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  // 전체 데이터 (초기 데이터) - 반납 등록 목록
  const allRegistrationData = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => ({
        id: idx + 1,
        returnDate: '2026-01-21',
        returnConfirmDate: '2026-01-22',
        registrantId: `user${idx + 1}`,
        registrantName: `등록자${idx + 1}`,
        approvalStatus: '대기',
      })),
    [],
  )

  // 전체 데이터 (초기 데이터) - 반납 물품 목록
  const allItemData = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, idx) => ({
        id: idx + 1,
        g2bNumber: '43211613-26081535',
        g2bName: '노트북',
        itemUniqueNumber: `ITEM-${String(idx + 1).padStart(4, '0')}`,
        acquireDate: '2026-01-15',
        acquireAmount: ((idx + 1) * 1000000).toLocaleString() + '원',
        operatingDept: `운용부서 ${idx + 1}`,
        itemStatus: '운용중',
        reason: '반납 사유',
      })),
    [],
  )

  // 필터링된 데이터 - 반납 등록 목록
  const filteredRegistrationData = useMemo(() => {
    if (!searchedFilters) {
      return allRegistrationData
    }

    return allRegistrationData.filter((item) => {
      // 반납일자 필터
      if (searchedFilters.returnDateFrom && item.returnDate < searchedFilters.returnDateFrom) {
        return false
      }
      if (searchedFilters.returnDateTo && item.returnDate > searchedFilters.returnDateTo) {
        return false
      }

      // 승인상태 필터
      if (searchedFilters.approvalStatus && searchedFilters.approvalStatus !== '전체') {
        if (item.approvalStatus !== searchedFilters.approvalStatus) {
          return false
        }
      }

      return true
    })
  }, [allRegistrationData, searchedFilters])

  // 필터링된 데이터 - 반납 물품 목록
  const filteredItemData = useMemo(() => {
    // 등록 목록과 연동되도록 할 수도 있지만, 일단 전체 데이터 반환
    return allItemData
  }, [allItemData])

  const validateDateRange = (
    baseDate: string,
    compareDate: string,
    setError: (error: string) => void,
  ) => {
    if (baseDate && compareDate && compareDate < baseDate) {
      setError('비교날짜 이 후의 날짜를 선택해주세요 !')
    } else {
      setError('')
    }
  }

  const onReset = () => {
    setFilters({
      returnDateFrom: '',
      returnDateTo: '',
      approvalStatus: '전체',
    })
    setReturnDateError('')
    setSearchedFilters(null)
  }

  const onSearch = () => {
    // 날짜 유효성 검사
    let hasError = false

    if (filters.returnDateFrom && filters.returnDateTo) {
      validateDateRange(filters.returnDateFrom, filters.returnDateTo, setReturnDateError)
      if (filters.returnDateTo < filters.returnDateFrom) {
        hasError = true
      }
    }

    if (hasError) {
      return
    }

    // 필터 적용
    setSearchedFilters({ ...filters })
  }

  return (
    <div className="return-page">
      <GNBWithMenu />

      <div className="return-layout">
        {/* SideBar */}
        <aside className="return-sidebar">
          <div className="return-sidebar-main">
            <span className="return-sidebar-main-text">관리자</span>
          </div>

          <div className="return-sidebar-category">
            <div className="return-sidebar-category-title">관리자 메뉴</div>
            <div className="return-sidebar-menu-list">
              <div
                className="return-sidebar-menu-item"
                onClick={() => navigate('/acq-confirmation')}
                style={{ cursor: 'pointer' }}
              >
                물품취득확정관리
              </div>
              <div
                className="return-sidebar-menu-item return-sidebar-menu-item-active"
                onClick={() => navigate('/return-management')}
                style={{ cursor: 'pointer' }}
              >
                물품반납등록관리
              </div>
              <div
                className="return-sidebar-menu-item"
                onClick={() => navigate('/disposal-management')}
                style={{ cursor: 'pointer' }}
              >
                물품불용등록관리
              </div>
              <div
                className="return-sidebar-menu-item"
                onClick={() => navigate('/disposal-registration')}
                style={{ cursor: 'pointer' }}
              >
                물품처분등록관리
              </div>
            </div>
          </div>
        </aside>

        <main className="return-main">
          {/* DepthBar */}
          <section className="return-depthbar">
            <div className="return-depthbar-bg" />
            <div className="return-depthbar-track">
              <div className="return-depth-pill return-depth-pill-active">
                <span className="return-depth-text">관리자 메뉴</span>
              </div>
              <div className="return-depth-pill">
                <span className="return-depth-text return-depth-text-inactive">물품 반납 등록 관리</span>
              </div>
            </div>
          </section>

          {/* Filter Section */}
          <section className="return-filter">
            <div className="return-filter-wrapper">
              <div className="return-filter-grid">
                <div className="return-field">
                  <div className="return-label">반납일자</div>
                  <div className="return-date-field-wrapper">
                    <div className="return-date-range">
                      <TextField
                        type="date"
                        value={filters.returnDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, returnDateFrom: e.target.value }))
                          if (filters.returnDateTo) {
                            validateDateRange(e.target.value, filters.returnDateTo, setReturnDateError)
                          }
                        }}
                      />
                      <span className="return-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.returnDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, returnDateTo: e.target.value }))
                          if (filters.returnDateFrom) {
                            validateDateRange(filters.returnDateFrom, e.target.value, setReturnDateError)
                          }
                        }}
                      />
                    </div>
                    {returnDateError && <div className="return-error-text">{returnDateError}</div>}
                  </div>
                </div>

                <div className="return-field">
                  <div className="return-label">승인상태</div>
                  <div className="return-radio-group">
                    {approvalOptions.map((option) => (
                      <RadioButton
                        key={option}
                        name="approvalStatus"
                        value={option}
                        checked={filters.approvalStatus === option}
                        onChange={(value) => setFilters((p) => ({ ...p, approvalStatus: value }))}
                        label={option}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="return-filter-actions">
                <Button className="return-btn return-btn-outline" onClick={onReset}>
                  초기화
                </Button>
                <Button className="return-btn return-btn-primary" onClick={onSearch}>
                  조회
                </Button>
              </div>
            </div>
          </section>

          {/* Upper Table - 반납 등록 목록 */}
          <section className="return-table return-table-upper">
            <div className="return-table-top">
              <div className="return-table-label">반납 등록 목록</div>
            </div>

            <div className="return-table-wrap">
              <div className="return-table-wrap-inner">
                <table className="return-table-el">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>순번</th>
                      <th style={{ width: 150 }}>반납일자</th>
                      <th style={{ width: 150 }}>반납확정일자</th>
                      <th style={{ width: 150 }}>등록자ID</th>
                      <th style={{ width: 150 }}>등록자명</th>
                      <th style={{ width: 100 }}>승인상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrationData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.returnDate}</td>
                        <td>{item.returnConfirmDate}</td>
                        <td>{item.registrantId}</td>
                        <td>{item.registrantName}</td>
                        <td>{item.approvalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="return-pagination">
              <button className="return-page-btn" type="button">
                ‹
              </button>
              <button className="return-page-num return-page-num-active" type="button">
                1
              </button>
              <button className="return-page-num" type="button">
                2
              </button>
              <button className="return-page-num" type="button">
                3
              </button>
              <button className="return-page-num" type="button">
                4
              </button>
              <button className="return-page-num" type="button">
                5
              </button>
              <button className="return-page-btn" type="button">
                ›
              </button>
              <div className="return-pagination-summary">
                총 {allRegistrationData.length}건 / 조회 {filteredRegistrationData.length}건
              </div>
            </div>
          </section>

          {/* Lower Table - 반납 물품 목록 */}
          <section className="return-table return-table-lower">
            <div className="return-table-top">
              <div className="return-table-label">반납 물품 목록</div>
              <div className="return-table-actions">
                <Button className="return-btn return-btn-outline return-btn-table">반려</Button>
                <Button className="return-btn return-btn-primary return-btn-table">확정</Button>
              </div>
            </div>

            <div className="return-table-wrap">
              <div className="return-table-wrap-inner">
                <table className="return-table-el">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>
                        <input type="checkbox" />
                      </th>
                      <th style={{ width: 150 }}>G2B목록번호</th>
                      <th style={{ width: 150 }}>G2B목록명</th>
                      <th style={{ width: 150 }}>물품고유번호</th>
                      <th style={{ width: 120 }}>취득일자</th>
                      <th style={{ width: 120 }}>취득금액</th>
                      <th style={{ width: 120 }}>운용부서</th>
                      <th style={{ width: 100 }}>물품상태</th>
                      <th style={{ width: 150 }}>사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItemData.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{item.g2bNumber}</td>
                        <td>{item.g2bName}</td>
                        <td>{item.itemUniqueNumber}</td>
                        <td>{item.acquireDate}</td>
                        <td>{item.acquireAmount}</td>
                        <td>{item.operatingDept}</td>
                        <td>{item.itemStatus}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="return-pagination">
              <button className="return-page-btn" type="button">
                ‹
              </button>
              <button className="return-page-num return-page-num-active" type="button">
                1
              </button>
              <button className="return-page-num" type="button">
                2
              </button>
              <button className="return-page-num" type="button">
                3
              </button>
              <button className="return-page-num" type="button">
                4
              </button>
              <button className="return-page-num" type="button">
                5
              </button>
              <button className="return-page-btn" type="button">
                ›
              </button>
              <div className="return-pagination-summary">
                총 {allItemData.length}건 / 조회 {filteredItemData.length}건
              </div>
            </div>
          </section>
        </main>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default ReturnManagementPage
