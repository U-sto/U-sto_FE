import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../GNBWithMenu/GNBWithMenu'
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
  { key: 'acq', label: '물품취득확정관리', path: '/acq-confirmation' },
  { key: 'operation', label: '물품운용등록관리', path: '/operation-management' },
  { key: 'return', label: '물품반납등록관리', path: '/return-management' },
  { key: 'disuse', label: '물품불용등록관리', path: '/disuse-management' },
  { key: 'disposal', label: '물품처분등록관리', path: '/disposal-management' },
]

const ManagementPageLayout = ({
  pageKey,
  depthSecondLabel,
  children,
}: ManagementPageLayoutProps) => {
  const navigate = useNavigate()
  const prefix = pageKey

  return (
    <div className={`management-page ${prefix}-page`}>
      <GNBWithMenu />

      <div className={`${prefix}-layout`}>
        <aside className={`${prefix}-sidebar`}>
          <div className={`${prefix}-sidebar-main`}>
            <span className={`${prefix}-sidebar-main-text`}>관리자</span>
          </div>

          <div className={`${prefix}-sidebar-category`}>
            <div className={`${prefix}-sidebar-category-title`}>관리자 메뉴</div>
            <div className={`${prefix}-sidebar-menu-list`}>
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.key === pageKey
                const classNames = [
                  `${prefix}-sidebar-menu-item`,
                  isActive ? `${prefix}-sidebar-menu-item-active` : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={classNames}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                )
              })}
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
                <span
                  className={`${prefix}-depth-text ${prefix}-depth-text-inactive`}
                >
                  {depthSecondLabel}
                </span>
              </div>
            </div>
          </section>

          {children}
        </main>
      </div>

      <ChatBotButton />
    </div>
  )
}

export default ManagementPageLayout
