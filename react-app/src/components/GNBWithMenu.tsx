import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SystemLogo from './SystemLogo'
import './GNBWithMenu.css'

const GNBWithMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // 로고 클릭으로 리셋된 경우 드롭다운 상태 초기화
  useEffect(() => {
    if (location.state?.reset) {
      setActiveDropdown(null)
    }
  }, [location.state])

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu)
  }

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <nav className="gnb-with-menu">
      <div className="gnb-user-section">
        <span className="gnb-user-text">회원정보</span>
        <div className="gnb-user-divider"></div>
        <span className="gnb-user-text" onClick={handleLogout}>로그아웃</span>
      </div>
      <div className="gnb-menu-content">
        <SystemLogo />
        <div className="gnb-menu-tabs">
          <div className="gnb-dropdown">
            <button
              className="gnb-menu-tab"
              onClick={() => handleDropdownToggle('admin')}
              onMouseEnter={() => setActiveDropdown('admin')}
            >
              관리자
            </button>
            {activeDropdown === 'admin' && (
              <div
                className="gnb-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div
                  className="gnb-dropdown-item"
                  onClick={() => {
                    navigate('/acq-confirmation')
                    setActiveDropdown(null)
                  }}
                >
                  물품 취득 확정 관리
                </div>
                <div
                  className="gnb-dropdown-item"
                  onClick={() => {
                    navigate('/return-management')
                    setActiveDropdown(null)
                  }}
                >
                  물품 반납 등록 관리
                </div>
                <div className="gnb-dropdown-item">물품 불용 등록 관리</div>
                <div className="gnb-dropdown-item">물품 처분 등록 관리</div>
              </div>
            )}
          </div>
          
          <div className="gnb-dropdown">
            <button
              className="gnb-menu-tab"
              onClick={() => handleDropdownToggle('asset')}
              onMouseEnter={() => setActiveDropdown('asset')}
            >
              물품 관리
            </button>
            {activeDropdown === 'asset' && (
              <div
                className="gnb-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="gnb-dropdown-item">물품 취득 관리</div>
                <div className="gnb-dropdown-item gnb-dropdown-main">물품 운용 관리</div>
                <div className="gnb-dropdown-submenu">
                  <div className="gnb-dropdown-item gnb-dropdown-subitem">물품 운용 대장 관리</div>
                  <div className="gnb-dropdown-item gnb-dropdown-subitem">출력물 관리</div>
                  <div className="gnb-dropdown-item gnb-dropdown-subitem">물품 반납 관리</div>
                </div>
                <div className="gnb-dropdown-item">물품 불용 관리</div>
                <div className="gnb-dropdown-item">물품 처분 관리</div>
                <div className="gnb-dropdown-item">보유 현황 조회</div>
              </div>
            )}
          </div>
          
          <div className="gnb-dropdown">
            <button
              className="gnb-menu-tab"
              onClick={() => handleDropdownToggle('ai')}
              onMouseEnter={() => setActiveDropdown('ai')}
            >
              AI 예측
            </button>
            {activeDropdown === 'ai' && (
              <div
                className="gnb-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="gnb-dropdown-item">사용주기 AI 예측</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="gnb-bottom-border"></div>
    </nav>
  )
}

export default GNBWithMenu
