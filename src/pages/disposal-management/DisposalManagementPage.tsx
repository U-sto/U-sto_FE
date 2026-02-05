import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/GNBWithMenu'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import ChatBotButton from '../../components/ChatBotButton'
import './DisposalManagementPage.css'

type Filters = {
  disposalDateFrom: string
  disposalDateTo: string
  approvalStatus: string
}

const DisposalManagementPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({
    disposalDateFrom: '',
    disposalDateTo: '',
    approvalStatus: '전체',
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const [disposalDateError, setDisposalDateError] = useState<string>('')
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  // 전체 데이터 (초기 데이터) - 불용 등록 목록
  const allRegistrationData = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => ({
        id: idx + 1,
        disposalDate: '2026-01-21',
        disposalConfirmDate: '2026-01-22',
        registrantId: `user${idx + 1}`,
        registrantName: `등록자${idx + 1}`,
        approvalStatus: '대기',
      })),
    [],
  )

  // 전체 데이터 (초기 데이터) - 불용 물품 목록
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
        reason: '불용 사유',
      })),
    [],
  )

  // 필터링된 데이터 - 불용 등록 목록
  const filteredRegistrationData = useMemo(() => {
    if (!searchedFilters) {
      return allRegistrationData
    }

    return allRegistrationData.filter((item) => {
      // 불용일자 필터
      if (searchedFilters.disposalDateFrom && item.disposalDate < searchedFilters.disposalDateFrom) {
        return false
      }
      if (searchedFilters.disposalDateTo && item.disposalDate > searchedFilters.disposalDateTo) {
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

  // 필터링된 데이터 - 불용 물품 목록
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
      disposalDateFrom: '',
      disposalDateTo: '',
      approvalStatus: '전체',
    })
    setDisposalDateError('')
    setSearchedFilters(null)
  }

  const onSearch = () => {
    // 날짜 유효성 검사
    let hasError = false

    if (filters.disposalDateFrom && filters.disposalDateTo) {
      validateDateRange(filters.disposalDateFrom, filters.disposalDateTo, setDisposalDateError)
      if (filters.disposalDateTo < filters.disposalDateFrom) {
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
    <div className="disposal-page">
      <GNBWithMenu />

      <div className="disposal-layout">
        {/* SideBar */}
        <aside className="disposal-sidebar">
          <div className="disposal-sidebar-main">
            <span className="disposal-sidebar-main-text">관리자</span>
          </div>

          <div className="disposal-sidebar-category">
            <div className="disposal-sidebar-category-title">관리자 메뉴</div>
            <div className="disposal-sidebar-menu-list">
              <div
                className="disposal-sidebar-menu-item"
                onClick={() => navigate('/acq-confirmation')}
                style={{ cursor: 'pointer' }}
              >
                물품취득확정관리
              </div>
              <div
                className="disposal-sidebar-menu-item"
                onClick={() => navigate('/return-management')}
                style={{ cursor: 'pointer' }}
              >
                물품반납등록관리
              </div>
              <div
                className="disposal-sidebar-menu-item"
                onClick={() => navigate('/disuse-management')}
                style={{ cursor: 'pointer' }}
              >
                물품불용등록관리
              </div>
              <div
                className="disposal-sidebar-menu-item disposal-sidebar-menu-item-active"
                onClick={() => navigate('/disposal-management')}
                style={{ cursor: 'pointer' }}
              >
                물품처분등록관리
              </div>
            </div>
          </div>
        </aside>

        <main className="disposal-main">
          {/* DepthBar */}
          <section className="disposal-depthbar">
            <div className="disposal-depthbar-bg" />
            <div className="disposal-depthbar-track">
              <div className="disposal-depth-pill disposal-depth-pill-active">
                <span className="disposal-depth-text">관리자 메뉴</span>
              </div>
              <div className="disposal-depth-pill">
                <span className="disposal-depth-text disposal-depth-text-inactive">물품 처분 등록 관리</span>
              </div>
            </div>
          </section>

          {/* Filter Section */}
          <section className="disposal-filter">
            <div className="disposal-filter-wrapper">
              <div className="disposal-filter-grid">
                <div className="disposal-field">
                  <div className="disposal-label">불용일자</div>
                  <div className="disposal-date-field-wrapper">
                    <div className="disposal-date-range">
                      <TextField
                        type="date"
                        value={filters.disposalDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, disposalDateFrom: e.target.value }))
                          if (filters.disposalDateTo) {
                            validateDateRange(e.target.value, filters.disposalDateTo, setDisposalDateError)
                          }
                        }}
                      />
                      <span className="disposal-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.disposalDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, disposalDateTo: e.target.value }))
                          if (filters.disposalDateFrom) {
                            validateDateRange(filters.disposalDateFrom, e.target.value, setDisposalDateError)
                          }
                        }}
                      />
                    </div>
                    {disposalDateError && <div className="disposal-error-text">{disposalDateError}</div>}
                  </div>
                </div>

                <div className="disposal-field">
                  <div className="disposal-label">승인상태</div>
                  <div className="disposal-radio-group">
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

              <div className="disposal-filter-actions">
                <Button className="disposal-btn disposal-btn-outline" onClick={onReset}>
                  초기화
                </Button>
                <Button className="disposal-btn disposal-btn-primary" onClick={onSearch}>
                  조회
                </Button>
              </div>
            </div>
          </section>

          {/* Upper Table - 불용 등록 목록 */}
          <section className="disposal-table disposal-table-upper">
            <div className="disposal-table-top">
              <div className="disposal-table-label">불용 등록 목록</div>
            </div>

            <div className="disposal-table-wrap">
              <div className="disposal-table-wrap-inner">
                <table className="disposal-table-el">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>순번</th>
                      <th style={{ width: 150 }}>불용일자</th>
                      <th style={{ width: 150 }}>불용확정일자</th>
                      <th style={{ width: 150 }}>등록자ID</th>
                      <th style={{ width: 150 }}>등록자명</th>
                      <th style={{ width: 100 }}>승인상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrationData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.disposalDate}</td>
                        <td>{item.disposalConfirmDate}</td>
                        <td>{item.registrantId}</td>
                        <td>{item.registrantName}</td>
                        <td>{item.approvalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="disposal-pagination">
              <button className="disposal-page-btn" type="button">
                ‹
              </button>
              <button className="disposal-page-num disposal-page-num-active" type="button">
                1
              </button>
              <button className="disposal-page-num" type="button">
                2
              </button>
              <button className="disposal-page-num" type="button">
                3
              </button>
              <button className="disposal-page-num" type="button">
                4
              </button>
              <button className="disposal-page-num" type="button">
                5
              </button>
              <button className="disposal-page-btn" type="button">
                ›
              </button>
              <div className="disposal-pagination-summary">
                총 {allRegistrationData.length}건 / 조회 {filteredRegistrationData.length}건
              </div>
            </div>
          </section>

          {/* Lower Table - 불용 물품 목록 */}
          <section className="disposal-table disposal-table-lower">
            <div className="disposal-table-top">
              <div className="disposal-table-label">불용 물품 목록</div>
              <div className="disposal-table-actions">
                <Button className="disposal-btn disposal-btn-outline disposal-btn-table">반려</Button>
                <Button className="disposal-btn disposal-btn-primary disposal-btn-table">확정</Button>
              </div>
            </div>

            <div className="disposal-table-wrap">
              <div className="disposal-table-wrap-inner">
                <table className="disposal-table-el">
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

            <div className="disposal-pagination">
              <button className="disposal-page-btn" type="button">
                ‹
              </button>
              <button className="disposal-page-num disposal-page-num-active" type="button">
                1
              </button>
              <button className="disposal-page-num" type="button">
                2
              </button>
              <button className="disposal-page-num" type="button">
                3
              </button>
              <button className="disposal-page-num" type="button">
                4
              </button>
              <button className="disposal-page-num" type="button">
                5
              </button>
              <button className="disposal-page-btn" type="button">
                ›
              </button>
              <div className="disposal-pagination-summary">
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

export default DisposalManagementPage
