import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SystemLogo from './SystemLogo'
import './GNBWithMenu.css'

type MenuItem = {
  label: string
  path?: string
  isMain?: boolean
  isSubItem?: boolean
  children?: MenuItem[]
}

type MenuSection = {
  id: string
  label: string
  items: MenuItem[]
}

const menuData: MenuSection[] = [
  {
    id: 'admin',
    label: '관리자',
    items: [
      { label: '물품 취득 확정 관리', path: '/acq-confirmation' },
      { label: '물품 반납 등록 관리', path: '/return-management' },
      { label: '물품 불용 등록 관리', path: '/disuse-management' },
      { label: '물품 처분 등록 관리', path: '/disposal-management' },
    ],
  },
  {
    id: 'asset',
    label: '물품 관리',
    items: [
      { label: '물품 취득 관리' },
      {
        label: '물품 운용 관리',
        isMain: true,
        children: [
          { label: '물품 운용 대장 관리', isSubItem: true },
          { label: '출력물 관리', isSubItem: true },
          { label: '물품 반납 관리', isSubItem: true },
        ],
      },
      { label: '물품 불용 관리' },
      { label: '물품 처분 관리' },
      { label: '보유 현황 조회' },
    ],
  },
  {
    id: 'ai',
    label: 'AI 예측',
    items: [{ label: '사용주기 AI 예측' }],
  },
]

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

  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path)
      setActiveDropdown(null)
    }
  }

  const renderMenuItem = (sectionId: string, item: MenuItem) => {
    const classNames = ['gnb-dropdown-item']
    if (item.isMain) {
      classNames.push('gnb-dropdown-main')
    }
    if (item.isSubItem) {
      classNames.push('gnb-dropdown-subitem')
    }

    const button = (
      <button
        key={item.label}
        type="button"
        className={classNames.join(' ')}
        onClick={() => handleItemClick(item)}
      >
        {item.label}
      </button>
    )

    if (item.children && item.children.length > 0) {
      return (
        <div key={`${sectionId}-${item.label}`}>
          {button}
          <div className="gnb-dropdown-submenu">
            {item.children.map((child) => renderMenuItem(sectionId, child))}
          </div>
        </div>
      )
    }

    return button
  }

  return (
    <nav className="gnb-with-menu">
      <div className="gnb-user-section">
        <span className="gnb-user-text">회원정보</span>
        <div className="gnb-user-divider"></div>
        <button type="button" className="gnb-user-text" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
      <div className="gnb-menu-content">
        <SystemLogo />
        <div className="gnb-menu-tabs">
          {menuData.map((section) => (
            <div key={section.id} className="gnb-dropdown">
              <button
                type="button"
                className="gnb-menu-tab"
                onClick={() => handleDropdownToggle(section.id)}
                onMouseEnter={() => setActiveDropdown(section.id)}
              >
                {section.label}
              </button>
              {activeDropdown === section.id && (
                <div
                  className="gnb-dropdown-menu"
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {section.items.map((item) => renderMenuItem(section.id, item))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="gnb-bottom-border"></div>
    </nav>
  )
}

export default GNBWithMenu
