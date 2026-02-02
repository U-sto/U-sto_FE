import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/GNBWithMenu'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import ChatBotButton from '../../components/ChatBotButton'
import './DisuseManagementPage.css'

type Filters = {
  disuseDateFrom: string
  disuseDateTo: string
  approvalStatus: string
}

const DisuseManagementPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({
    disuseDateFrom: '',
    disuseDateTo: '',
    approvalStatus: '전체',
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])

  const [disuseDateError, setDisuseDateError] = useState<string>('')
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  // 전체 데이터 (초기 데이터) - 불용 등록 목록
  const allRegistrationData = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => ({
        id: idx + 1,
        disuseDate: '2026-01-21',
        disuseConfirmDate: '2026-01-22',
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
      if (searchedFilters.disuseDateFrom && item.disuseDate < searchedFilters.disuseDateFrom) {
        return false
      }
      if (searchedFilters.disuseDateTo && item.disuseDate > searchedFilters.disuseDateTo) {
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
      disuseDateFrom: '',
      disuseDateTo: '',
      approvalStatus: '전체',
    })
    setDisuseDateError('')
    setSearchedFilters(null)
  }

  const onSearch = () => {
    // 날짜 유효성 검사
    let hasError = false

    if (filters.disuseDateFrom && filters.disuseDateTo) {
      validateDateRange(filters.disuseDateFrom, filters.disuseDateTo, setDisuseDateError)
      if (filters.disuseDateTo < filters.disuseDateFrom) {
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
    <div className="disuse-page">
      <GNBWithMenu />

      <div className="disuse-layout">
        {/* SideBar */}
        <aside className="disuse-sidebar">
          <div className="disuse-sidebar-main">
            <span className="disuse-sidebar-main-text">관리자</span>
          </div>

          <div className="disuse-sidebar-category">
            <div className="disuse-sidebar-category-title">관리자 메뉴</div>
            <div className="disuse-sidebar-menu-list">
              <div
                className="disuse-sidebar-menu-item"
                onClick={() => navigate('/acq-confirmation')}
                style={{ cursor: 'pointer' }}
              >
                물품취득확정관리
              </div>
              <div
                className="disuse-sidebar-menu-item"
                onClick={() => navigate('/return-management')}
                style={{ cursor: 'pointer' }}
              >
                물품반납등록관리
              </div>
              <div
                className="disuse-sidebar-menu-item disuse-sidebar-menu-item-active"
                onClick={() => navigate('/disuse-management')}
                style={{ cursor: 'pointer' }}
              >
                물품불용등록관리
              </div>
              <div
                className="disuse-sidebar-menu-item"
                onClick={() => navigate('/disposal-management')}
                style={{ cursor: 'pointer' }}
              >
                물품처분등록관리
              </div>
            </div>
          </div>
        </aside>

        <main className="disuse-main">
          {/* DepthBar */}
          <section className="disuse-depthbar">
            <div className="disuse-depthbar-bg" />
            <div className="disuse-depthbar-track">
              <div className="disuse-depth-pill disuse-depth-pill-active">
                <span className="disuse-depth-text">관리자 메뉴</span>
              </div>
              <div className="disuse-depth-pill">
                <span className="disuse-depth-text disuse-depth-text-inactive">물품 불용 등록 관리</span>
              </div>
            </div>
          </section>

          {/* Filter Section */}
          <section className="disuse-filter">
            <div className="disuse-filter-wrapper">
              <div className="disuse-filter-grid">
                <div className="disuse-field">
                  <div className="disuse-label">불용일자</div>
                  <div className="disuse-date-field-wrapper">
                    <div className="disuse-date-range">
                      <TextField
                        type="date"
                        value={filters.disuseDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, disuseDateFrom: e.target.value }))
                          if (filters.disuseDateTo) {
                            validateDateRange(e.target.value, filters.disuseDateTo, setDisuseDateError)
                          }
                        }}
                      />
                      <span className="disuse-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.disuseDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, disuseDateTo: e.target.value }))
                          if (filters.disuseDateFrom) {
                            validateDateRange(filters.disuseDateFrom, e.target.value, setDisuseDateError)
                          }
                        }}
                      />
                    </div>
                    {disuseDateError && <div className="disuse-error-text">{disuseDateError}</div>}
                  </div>
                </div>

                <div className="disuse-field">
                  <div className="disuse-label">승인상태</div>
                  <div className="disuse-radio-group">
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

              <div className="disuse-filter-actions">
                <Button className="disuse-btn disuse-btn-outline" onClick={onReset}>
                  초기화
                </Button>
                <Button className="disuse-btn disuse-btn-primary" onClick={onSearch}>
                  조회
                </Button>
              </div>
            </div>
          </section>

          {/* Upper Table - 불용 등록 목록 */}
          <section className="disuse-table disuse-table-upper">
            <div className="disuse-table-top">
              <div className="disuse-table-label">불용 등록 목록</div>
            </div>

            <div className="disuse-table-wrap">
              <div className="disuse-table-wrap-inner">
                <table className="disuse-table-el">
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
                        <td>{item.disuseDate}</td>
                        <td>{item.disuseConfirmDate}</td>
                        <td>{item.registrantId}</td>
                        <td>{item.registrantName}</td>
                        <td>{item.approvalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="disuse-pagination">
              <button className="disuse-page-btn" type="button">
                ‹
              </button>
              <button className="disuse-page-num disuse-page-num-active" type="button">
                1
              </button>
              <button className="disuse-page-num" type="button">
                2
              </button>
              <button className="disuse-page-num" type="button">
                3
              </button>
              <button className="disuse-page-num" type="button">
                4
              </button>
              <button className="disuse-page-num" type="button">
                5
              </button>
              <button className="disuse-page-btn" type="button">
                ›
              </button>
              <div className="disuse-pagination-summary">
                총 {allRegistrationData.length}건 / 조회 {filteredRegistrationData.length}건
              </div>
            </div>
          </section>

          {/* Lower Table - 불용 물품 목록 */}
          <section className="disuse-table disuse-table-lower">
            <div className="disuse-table-top">
              <div className="disuse-table-label">불용 물품 목록</div>
              <div className="disuse-table-actions">
                <Button className="disuse-btn disuse-btn-outline disuse-btn-table">반려</Button>
                <Button className="disuse-btn disuse-btn-primary disuse-btn-table">확정</Button>
              </div>
            </div>

            <div className="disuse-table-wrap">
              <div className="disuse-table-wrap-inner">
                <table className="disuse-table-el">
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

            <div className="disuse-pagination">
              <button className="disuse-page-btn" type="button">
                ‹
              </button>
              <button className="disuse-page-num disuse-page-num-active" type="button">
                1
              </button>
              <button className="disuse-page-num" type="button">
                2
              </button>
              <button className="disuse-page-num" type="button">
                3
              </button>
              <button className="disuse-page-num" type="button">
                4
              </button>
              <button className="disuse-page-num" type="button">
                5
              </button>
              <button className="disuse-page-btn" type="button">
                ›
              </button>
              <div className="disuse-pagination-summary">
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

export default DisuseManagementPage
