import { useState, useRef, useEffect, useId, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SystemLogo from '../../../common/SystemLogo/SystemLogo'
import { logout } from '../../../../api/auth'
import { menuData, type MenuItem, type MenuSection } from '../../../../constants/menu'
import './GNBWithMenu.css'

const GNBWithMenu = () => {
  const navigate = useNavigate()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const menuId = useId()

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu)
    setFocusedIndex(-1)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path)
      setActiveDropdown(null)
    }
  }

  /** WAI-ARIA: 모든 깊이의 메뉴를 평탄화 (재귀)하여 키보드 내비게이션에 사용. 부모(자식 있는 항목)도 포함. */
  const flattenMenuItems = (items: MenuItem[]): MenuItem[] =>
    items.flatMap((item) =>
      item.children && item.children.length > 0
        ? [item, ...flattenMenuItems(item.children)]
        : [item],
    )
  const flatItems = (section: MenuSection) => flattenMenuItems(section.items)

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

  const renderMenuItem = (
    sectionId: string,
    item: MenuItem,
    selfFlatIndex?: number,
    childrenStartFlatIndex?: number,
  ) => {
    const classNames = ['gnb-dropdown-item']
    if (item.isMain) {
      classNames.push('gnb-dropdown-main')
    }
    if (item.isSubItem) {
      classNames.push('gnb-dropdown-subitem')
    }
    const isFocused =
      activeDropdown === sectionId &&
      selfFlatIndex !== undefined &&
      focusedIndex === selfFlatIndex
    if (isFocused) {
      classNames.push('gnb-dropdown-item-focused')
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

    if (item.children && item.children.length > 0 && childrenStartFlatIndex !== undefined) {
      return (
        <div key={`${sectionId}-${item.label}`}>
          {button}
          <div className="gnb-dropdown-submenu">
            {item.children.map((child, i) =>
              renderMenuItem(sectionId, child, childrenStartFlatIndex + i, undefined),
            )}
          </div>
        </div>
      )
    }

    return button
  }

  const renderSectionItems = (section: MenuSection) => {
    let flatIdx = 0
    return section.items.map((item) => {
      if (item.children && item.children.length > 0) {
        const parentIdx = flatIdx++
        const childrenStart = flatIdx
        flatIdx += item.children.length
        return renderMenuItem(section.id, item, parentIdx, childrenStart)
      }
      return renderMenuItem(section.id, item, flatIdx++, undefined)
    })
  }

  return (
    <nav className="gnb-with-menu" onMouseLeave={() => { setActiveDropdown(null); setFocusedIndex(-1) }}>
      <div className="gnb-user-section">
        <button
          type="button"
          className="gnb-user-text"
          onClick={() => navigate('/user-info')}
        >
          회원정보
        </button>
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
                className={`gnb-menu-tab${activeDropdown === section.id ? ' gnb-menu-tab--active' : ''}`}
                onClick={() => handleDropdownToggle(section.id)}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === section.id}
                aria-controls={`${menuId}-mega`}
                aria-label={`${section.label} 메뉴`}
              >
                {section.label}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="gnb-bottom-border"></div>

      {activeDropdown && (
        <div
          id={`${menuId}-mega`}
          ref={(el) => el && menuRefs.current.set(activeDropdown, el)}
          className="gnb-mega-menu"
          role="menu"
          tabIndex={-1}
          onKeyDown={(e) => {
            const section = menuData.find((s) => s.id === activeDropdown)
            if (section) handleMenuKeyDown(e, section)
          }}
        >
          <div className="gnb-mega-menu-inner">
            {menuData.map((section) => (
              <div key={section.id} className="gnb-mega-column">
                <p className={`gnb-mega-column-header${activeDropdown === section.id ? ' gnb-mega-column-header--active' : ''}`}>
                  {section.label}
                </p>
                <div className="gnb-mega-column-items">
                  {renderSectionItems(section)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

export default GNBWithMenu
