import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../GNBWithMenu/GNBWithMenu'
import '../ManagementLayoutBase/ManagementLayoutBase.css'
import ChatBotButton from '../../../../features/support/components/ChatBotButton/ChatBotButton'

export type ManagementPageKey = 'acq' | 'operation' | 'return' | 'disuse' | 'disposal'

interface ManagementPageLayoutProps {
  pageKey: ManagementPageKey
  depthSecondLabel: string
  children: ReactNode
}

type SidebarItem = {
  key: ManagementPageKey
  label: string
  path: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'acq', label: '물품 취득 확정 관리', path: '/acq-confirmation' },
  { key: 'operation', label: '물품 운용 등록 관리', path: '/operation-management' },
  { key: 'return', label: '물품 반납 등록 관리', path: '/return-management' },
  { key: 'disuse', label: '물품 불용 등록 관리', path: '/disuse-management' },
  { key: 'disposal', label: '물품 처분 등록 관리', path: '/disposal-management' },
]

const ManagementPageLayout = ({
  pageKey,
  depthSecondLabel,
  children,
}: ManagementPageLayoutProps) => {
  const navigate = useNavigate()
  const prefix = 'management'

  return (
    <div className={`${prefix}-page ${pageKey}-page`}>
      <GNBWithMenu />

      <div className={`${prefix}-layout`}>
        <aside className={`${prefix}-sidebar`}>
          <div className={`${prefix}-sidebar-main`}>
            <span className={`${prefix}-sidebar-main-text`}>관리자</span>
          </div>

          <div className={`${prefix}-sidebar-category`}>
            <div className={`${prefix}-sidebar-menu-list`}>
              <div className={`${prefix}-sidebar-group`}>
                <div className={`${prefix}-sidebar-group-title`}>관리자 메뉴</div>
                <div className={`${prefix}-sidebar-group-list`}>
                  {SIDEBAR_ITEMS.map((item) => {
                    const isActive = item.key === pageKey
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`${prefix}-sidebar-menu-item ${prefix}-sidebar-menu-item-sub ${isActive ? `${prefix}-sidebar-menu-item-active` : ''}`}
                        onClick={() => navigate(item.path)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className={`${prefix}-main`}>
          <section className={`${prefix}-depthbar`}>
            <div className={`${prefix}-depthbar-bg`} />
            <div className={`${prefix}-depthbar-track`}>
              <div className={`${prefix}-depth-pill ${prefix}-depth-pill-active`}>
                <span className={`${prefix}-depth-text`}>관리자 메뉴</span>
              </div>
              <div className={`${prefix}-depth-pill`}>
                <span className={`${prefix}-depth-text ${prefix}-depth-text-inactive`}>
                  {depthSecondLabel}
                </span>
              </div>
            </div>
          </section>

          <div className={`${prefix}-main-body`}>{children}</div>
        </main>
      </div>

      <ChatBotButton />
    </div>
  )
}

export default ManagementPageLayout
