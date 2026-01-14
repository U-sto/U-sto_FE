import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GNBWithMenu.css'

const GNBWithMenu = () => {
  const navigate = useNavigate()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

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
        <div className="gnb-logo-section">
          <div className="gnb-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6H4C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6ZM20 16H4V8H20V16Z" fill="currentColor"/>
              <path d="M6 10H18V12H6V10ZM6 13H14V15H6V13Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="gnb-logo-text">물품관리시스템</div>
        </div>
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
                <div className="gnb-dropdown-item">물품 취득 확정 관리</div>
                <div className="gnb-dropdown-item">물품 반납 등록 관리</div>
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
