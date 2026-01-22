import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/GNBWithMenu'
import TextField from '../../components/TextField'
import Dropdown from '../../components/Dropdown'
import DropdownSmall from '../../components/DropdownSmall'
import Button from '../../components/Button'
import RadioButton from '../../components/RadioButton'
import ChatBotButton from '../../components/ChatBotButton'
import './AcqConfirmationPage.css'

type Filters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  category: string
}

const AcqConfirmationPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>({
    g2bName: '',
    g2bNumberFrom: '',
    g2bNumberTo: '',
    sortDateFrom: '',
    sortDateTo: '',
    acquireDateFrom: '',
    acquireDateTo: '',
    approvalStatus: '전체',
    category: '',
  })

  const approvalOptions = useMemo(() => ['전체', '대기', '반려', '확정'], [])
  const categoryOptions = useMemo(() => ['전체', '취득', '기타'], [])

  const g2bOptions = useMemo(
    () => [
      { name: '노트북', number: '43211613-26081535' },
      { name: '데스크탑', number: '43211614-26081536' },
      { name: '프로젝터', number: '43211615-26081537' },
      { name: '회의실 의자', number: '43211616-26081538' },
    ],
    [],
  )

  const [sortDateError, setSortDateError] = useState<string>('')
  const [acquireDateError, setAcquireDateError] = useState<string>('')
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  // 전체 데이터 (초기 데이터)
  const allTableData = useMemo(
    () =>
      Array.from({ length: 15 }).map((_, idx) => {
        const g2bOption = g2bOptions[idx % g2bOptions.length]
        // 같은 G2B목록명은 같은 목록번호를 사용
        const g2bNumber = g2bOption.number
        
        return {
          id: idx + 1,
          g2bNumber: g2bNumber,
          g2bName: g2bOption.name,
          acquireDate: '2026-01-21',
          acquireAmount: (1000000 * (idx + 1)).toLocaleString() + '원',
          sortDate: '2026-01-21',
          operatingDept: `운용부서 ${idx + 1}`,
          operatingStatus: '운용중',
          usefulLife: `${5 + idx}년`,
          quantity: idx + 1,
          approvalStatus: '대기',
        }
      }),
    [g2bOptions],
  )

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!searchedFilters) {
      return allTableData
    }

    return allTableData.filter((item) => {
      // G2B목록명 필터
      if (searchedFilters.g2bName && item.g2bName !== searchedFilters.g2bName) {
        return false
      }

      // G2B목록번호 필터 (범위)
      if (searchedFilters.g2bNumberFrom || searchedFilters.g2bNumberTo) {
        const itemNumber = item.g2bNumber
        // 43211613-26081535 형식에서 앞부분 숫자 추출
        const itemNumberParts = itemNumber.split('-')
        const itemNumberValue = itemNumberParts.length > 0 ? itemNumberParts[0] : ''
        
        // 범위 필터링
        if (searchedFilters.g2bNumberFrom && searchedFilters.g2bNumberTo) {
          // 범위가 지정된 경우
          const fromNum = parseInt(searchedFilters.g2bNumberFrom, 10)
          const toNum = parseInt(searchedFilters.g2bNumberTo, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum < fromNum || itemNum > toNum) {
            return false
          }
        } else if (searchedFilters.g2bNumberFrom) {
          // 시작값만 있는 경우
          const fromNum = parseInt(searchedFilters.g2bNumberFrom, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum < fromNum) {
            return false
          }
        } else if (searchedFilters.g2bNumberTo) {
          // 종료값만 있는 경우
          const toNum = parseInt(searchedFilters.g2bNumberTo, 10)
          const itemNum = parseInt(itemNumberValue, 10)
          if (isNaN(itemNum) || itemNum > toNum) {
            return false
          }
        }
      }

      // 정리일자 필터
      if (searchedFilters.sortDateFrom && item.sortDate < searchedFilters.sortDateFrom) {
        return false
      }
      if (searchedFilters.sortDateTo && item.sortDate > searchedFilters.sortDateTo) {
        return false
      }

      // 취득일자 필터
      if (searchedFilters.acquireDateFrom && item.acquireDate < searchedFilters.acquireDateFrom) {
        return false
      }
      if (searchedFilters.acquireDateTo && item.acquireDate > searchedFilters.acquireDateTo) {
        return false
      }

      // 승인상태 필터
      if (searchedFilters.approvalStatus && searchedFilters.approvalStatus !== '전체') {
        if (item.approvalStatus !== searchedFilters.approvalStatus) {
          return false
        }
      }

      // 운용부서 필터
      if (searchedFilters.category && searchedFilters.category !== '전체') {
        // 운용부서 필터링 로직 (필요시 추가)
      }

      return true
    })
  }, [allTableData, searchedFilters])

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
      g2bName: '',
      g2bNumberFrom: '',
      g2bNumberTo: '',
      sortDateFrom: '',
      sortDateTo: '',
      acquireDateFrom: '',
      acquireDateTo: '',
      approvalStatus: '전체',
      category: '',
    })
    setSortDateError('')
    setAcquireDateError('')
    setSearchedFilters(null)
  }

  const onSearch = () => {
    // 날짜 유효성 검사
    let hasError = false

    if (filters.sortDateFrom && filters.sortDateTo) {
      validateDateRange(filters.sortDateFrom, filters.sortDateTo, setSortDateError)
      if (filters.sortDateTo < filters.sortDateFrom) {
        hasError = true
      }
    }

    if (filters.acquireDateFrom && filters.acquireDateTo) {
      validateDateRange(filters.acquireDateFrom, filters.acquireDateTo, setAcquireDateError)
      if (filters.acquireDateTo < filters.acquireDateFrom) {
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
    <div className="acq-page">
      <GNBWithMenu />

      <div className="acq-layout">
        {/* SideBar (Figma SideBar/관리자) */}
        <aside className="acq-sidebar">
          <div className="acq-sidebar-main">
            <span className="acq-sidebar-main-text">관리자</span>
          </div>

          <div className="acq-sidebar-category">
            <div className="acq-sidebar-category-title">관리자 메뉴</div>
            <div className="acq-sidebar-menu-list">
              <div 
                className="acq-sidebar-menu-item acq-sidebar-menu-item-active"
                onClick={() => navigate('/acq-confirmation')}
                style={{ cursor: 'pointer' }}
              >
                물품취득확정관리
              </div>
              <div 
                className="acq-sidebar-menu-item"
                onClick={() => navigate('/return-management')}
                style={{ cursor: 'pointer' }}
              >
                물품반납등록관리
              </div>
              <div 
                className="acq-sidebar-menu-item"
                onClick={() => navigate('/disuse-registration')}
                style={{ cursor: 'pointer' }}
              >
                물품불용등록관리
              </div>
              <div 
                className="acq-sidebar-menu-item"
                onClick={() => navigate('/disposal-registration')}
                style={{ cursor: 'pointer' }}
              >
                물품처분등록관리
              </div>
            </div>
          </div>
        </aside>

        <main className="acq-main">
          {/* DepthBar */}
          <section className="acq-depthbar">
            <div className="acq-depthbar-bg" />
            <div className="acq-depthbar-track">
              <div className="acq-depth-pill acq-depth-pill-active">
                <span className="acq-depth-text">관리자 메뉴</span>
              </div>
              <div className="acq-depth-pill">
                <span className="acq-depth-text acq-depth-text-inactive">물품 취득 확정 관리</span>
              </div>
            </div>
          </section>

          {/* SearchFilterField/취득 */}
          <section className="acq-filter">
            <div className="acq-filter-wrapper">
              <div className="acq-filter-grid">
                {/* 첫 번째 행: G2B목록명, 운용부서 */}
                <div className="acq-field">
                  <div className="acq-label">G2B목록명</div>
                  <DropdownSmall
                    placeholder="목록명을 선택하세요"
                    value={filters.g2bName}
                    onChange={(value) => {
                      const matched = g2bOptions.find((opt) => opt.name === value)
                      if (matched) {
                        // 43211613-26081535 형식에서 앞부분 숫자 추출
                        const parts = matched.number.split('-')
                        const numberPart = parts.length > 0 ? parts[0] : ''
                        setFilters((p) => ({
                          ...p,
                          g2bName: value,
                          g2bNumberFrom: numberPart,
                          g2bNumberTo: numberPart,
                        }))
                      } else {
                        setFilters((p) => ({
                          ...p,
                          g2bName: value,
                          g2bNumberFrom: '',
                          g2bNumberTo: '',
                        }))
                      }
                    }}
                    options={g2bOptions.map((opt) => opt.name)}
                  />
                </div>

                <div className="acq-field">
                  <div className="acq-label">운용부서</div>
                  <DropdownSmall
                    placeholder="선택"
                    value={filters.category}
                    onChange={(value) => setFilters((p) => ({ ...p, category: value }))}
                    options={categoryOptions}
                  />
                </div>

                {/* 두 번째 행: G2B목록번호, 정리일자 */}
                <div className="acq-field">
                  <div className="acq-label">G2B목록번호</div>
                  <div className="acq-number-range">
                    <TextField
                      placeholder=""
                      value={filters.g2bNumberFrom || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, g2bNumberFrom: e.target.value }))}
                      className="acq-number-input"
                    />
                    <span className="acq-number-sep">-</span>
                    <TextField
                      placeholder=""
                      value={filters.g2bNumberTo || ''}
                      onChange={(e) => setFilters((p) => ({ ...p, g2bNumberTo: e.target.value }))}
                      className="acq-number-input"
                    />
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">정리일자</div>
                  <div className="acq-date-field-wrapper">
                    <div className="acq-date-range">
                      <TextField
                        type="date"
                        value={filters.sortDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, sortDateFrom: e.target.value }))
                          if (filters.sortDateTo) {
                            validateDateRange(e.target.value, filters.sortDateTo, setSortDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.sortDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, sortDateTo: e.target.value }))
                          if (filters.sortDateFrom) {
                            validateDateRange(filters.sortDateFrom, e.target.value, setSortDateError)
                          }
                        }}
                      />
                    </div>
                    {sortDateError && <div className="acq-error-text">{sortDateError}</div>}
                  </div>
                </div>

                {/* 세 번째 행: 취득일자, 승인상태 */}
                <div className="acq-field">
                  <div className="acq-label">취득일자</div>
                  <div className="acq-date-field-wrapper">
                    <div className="acq-date-range">
                      <TextField
                        type="date"
                        value={filters.acquireDateFrom}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, acquireDateFrom: e.target.value }))
                          if (filters.acquireDateTo) {
                            validateDateRange(e.target.value, filters.acquireDateTo, setAcquireDateError)
                          }
                        }}
                      />
                      <span className="acq-date-sep">~</span>
                      <TextField
                        type="date"
                        value={filters.acquireDateTo}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, acquireDateTo: e.target.value }))
                          if (filters.acquireDateFrom) {
                            validateDateRange(filters.acquireDateFrom, e.target.value, setAcquireDateError)
                          }
                        }}
                      />
                    </div>
                    {acquireDateError && <div className="acq-error-text">{acquireDateError}</div>}
                  </div>
                </div>

                <div className="acq-field">
                  <div className="acq-label">승인상태</div>
                  <div className="acq-radio-group">
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

              <div className="acq-filter-actions">
                <Button className="acq-btn acq-btn-outline" onClick={onReset}>
                  초기화
                </Button>
                <Button className="acq-btn acq-btn-primary" onClick={onSearch}>
                  조회
                </Button>
              </div>
            </div>
          </section>

          {/* Table/Form1 */}
          <section className="acq-table">
            <div className="acq-table-top">
              <div className="acq-table-label">물품 취득 대장 목록</div>
              <Button className="acq-btn acq-btn-primary acq-btn-small">확정</Button>
            </div>

            <div className="acq-table-wrap">
              <div className="acq-table-wrap-inner">
                <table className="acq-table-el">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }} />
                      <th style={{ width: 120 }}>G2B목록번호</th>
                      <th style={{ width: 150 }}>G2B목록명</th>
                      <th style={{ width: 100 }}>취득일자</th>
                      <th style={{ width: 120 }}>취득금액</th>
                      <th style={{ width: 100 }}>정리일자</th>
                      <th style={{ width: 120 }}>운용부서</th>
                      <th style={{ width: 100 }}>운용상태</th>
                      <th style={{ width: 100 }}>내용연수</th>
                      <th style={{ width: 80 }}>수량</th>
                      <th style={{ width: 100 }}>승인상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>{item.g2bNumber}</td>
                        <td>{item.g2bName}</td>
                        <td>{item.acquireDate}</td>
                        <td>{item.acquireAmount}</td>
                        <td>{item.sortDate}</td>
                        <td>{item.operatingDept}</td>
                        <td>{item.operatingStatus}</td>
                        <td>{item.usefulLife}</td>
                        <td>{item.quantity}</td>
                        <td>{item.approvalStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="acq-pagination">
              <button className="acq-page-btn" type="button">
                ‹
              </button>
              <button className="acq-page-num acq-page-num-active" type="button">
                1
              </button>
              <button className="acq-page-num" type="button">
                2
              </button>
              <button className="acq-page-num" type="button">
                3
              </button>
              <button className="acq-page-num" type="button">
                4
              </button>
              <button className="acq-page-num" type="button">
                5
              </button>
              <button className="acq-page-btn" type="button">
                ›
              </button>
              <div className="acq-pagination-summary">
                총 {allTableData.length}건 / 조회 {filteredData.length}건
              </div>
            </div>
          </section>
        </main>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default AcqConfirmationPage

