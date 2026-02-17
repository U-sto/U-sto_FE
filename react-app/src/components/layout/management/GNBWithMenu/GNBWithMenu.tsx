import { useState, useRef, useEffect, useId, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SystemLogo from '../../../common/SystemLogo/SystemLogo'
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
      { label: '물품 운용 등록 관리', path: '/operation-management' },
      { label: '물품 반납 등록 관리', path: '/return-management' },
      { label: '물품 불용 등록 관리', path: '/disuse-management' },
      { label: '물품 처분 등록 관리', path: '/disposal-management' },
    ],
  },
  {
    id: 'asset',
    label: '물품 관리',
    items: [
      { label: '물품 취득 관리', path: '/asset-management/acquisition-management' },
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const menuId = useId()

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu)
    setFocusedIndex(activeDropdown === menu ? -1 : 0)
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

  /** WAI-ARIA: 드롭다운 메뉴 키보드 내비게이션 (ArrowUp, ArrowDown, Enter, Escape) */
  const flatItems = (section: MenuSection) =>
    section.items.flatMap((item) =>
      item.children && item.children.length > 0 ? item.children : [item],
    )

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>, section: MenuSection) => {
    if (activeDropdown !== section.id) return
    const items = flatItems(section)
    const count = items.length
    if (count === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < count - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : count - 1))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        const item = items[focusedIndex >= 0 ? focusedIndex : 0]
        if (item?.path) {
          navigate(item.path)
          setActiveDropdown(null)
        }
        break
      case 'Escape':
        e.preventDefault()
        setActiveDropdown(null)
        setFocusedIndex(-1)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.gnb-with-menu')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /** 접근성: 드롭다운 열릴 때 메뉴에 포커스 이동하여 키보드 내비게이션 활성화 */
  useEffect(() => {
    if (activeDropdown) {
      const el = menuRefs.current.get(activeDropdown)
      el?.focus()
    }
  }, [activeDropdown])

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
        role="menuitem"
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
                aria-haspopup="menu"
                aria-expanded={activeDropdown === section.id}
                aria-controls={`${menuId}-${section.id}`}
                aria-label={`${section.label} 메뉴`}
              >
                {section.label}
              </button>
              {activeDropdown === section.id && (
                <div
                  id={`${menuId}-${section.id}`}
                  ref={(el) => el && menuRefs.current.set(section.id, el)}
                  className="gnb-dropdown-menu"
                  role="menu"
                  aria-label={section.label}
                  tabIndex={-1}
                  onKeyDown={(e) => handleMenuKeyDown(e, section)}
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
