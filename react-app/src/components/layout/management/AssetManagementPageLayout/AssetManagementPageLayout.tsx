import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../GNBWithMenu/GNBWithMenu'
import './AssetManagementPageLayout.css'
import ChatBotButton from '../../../../features/support/components/ChatBotButton/ChatBotButton'

export type AssetManagementPageKey =
  | 'acquisition'
  | 'operation-ledger'
  | 'printout'
  | 'return'
  | 'disuse'
  | 'disposal'
  | 'inventory-status'

interface AssetManagementPageLayoutProps {
  pageKey: AssetManagementPageKey
  depthSecondLabel: string
  depthThirdLabel?: string
  children: ReactNode
}

type SidebarItem = {
  key: AssetManagementPageKey
  label: string
  path: string
  isCategory?: boolean
}

type SidebarGroup = {
  categoryLabel: string
  children: SidebarItem[]
}

const SIDEBAR_TOP_ITEMS: SidebarItem[] = [
  { key: 'acquisition', label: '물품 취득 관리', path: '/asset-management/acquisition-management' },
]

const SIDEBAR_OPERATION_GROUP: SidebarGroup = {
  categoryLabel: '물품 운용 관리',
  children: [
    { key: 'operation-ledger', label: '물품 운용 대장 관리', path: '/asset-management/operation-management/operation-ledger' },
    { key: 'printout', label: '출력물 관리', path: '/asset-management/operation-management/printout-management' },
    { key: 'return', label: '물품 반납 관리', path: '/asset-management/operation-management/return-management' },
  ],
}

const SIDEBAR_BOTTOM_ITEMS: SidebarItem[] = [
  { key: 'disuse', label: '물품 불용 관리', path: '/asset-management/disuse-management' },
  { key: 'disposal', label: '물품 처분 관리', path: '/asset-management/disposal-management' },
  { key: 'inventory-status', label: '보유 현황 조회', path: '/asset-management/inventory-status' },
]

const AssetManagementPageLayout = ({
  pageKey,
  depthSecondLabel,
  depthThirdLabel,
  children,
}: AssetManagementPageLayoutProps) => {
  const navigate = useNavigate()
  const prefix = 'asset'

  return (
    <div className={`${prefix}-page`}>
      <GNBWithMenu />

      <div className={`${prefix}-layout`}>
        <aside className={`${prefix}-sidebar`}>
          <div className={`${prefix}-sidebar-main`}>
            <span className={`${prefix}-sidebar-main-text`}>물품 관리</span>
          </div>

          <div className={`${prefix}-sidebar-category`}>
            <div className={`${prefix}-sidebar-menu-list`}>
              {SIDEBAR_TOP_ITEMS.map((item) => {
                const isActive = item.key === pageKey
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${prefix}-sidebar-menu-item ${isActive ? `${prefix}-sidebar-menu-item-active` : ''}`}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                )
              })}
              <div className={`${prefix}-sidebar-group`}>
                <div className={`${prefix}-sidebar-group-title`}>{SIDEBAR_OPERATION_GROUP.categoryLabel}</div>
                <div className={`${prefix}-sidebar-group-list`}>
                  {SIDEBAR_OPERATION_GROUP.children.map((item) => {
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
              {SIDEBAR_BOTTOM_ITEMS.map((item) => {
                const isActive = item.key === pageKey
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${prefix}-sidebar-menu-item ${isActive ? `${prefix}-sidebar-menu-item-active` : ''}`}
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
            {/* 뎁스: 왼쪽에 물품관리 있으므로 여기선 제거 → 1=물품 취득 관리, 2=물품 기본 정보관리 */}
            <div className={`${prefix}-depthbar-track ${!(depthThirdLabel != null && depthThirdLabel !== '') ? `${prefix}-depthbar-track-single` : ''}`.trim()}>
              <div className={`${prefix}-depth-pill ${prefix}-depth-pill-active`}>
                <span className={`${prefix}-depth-text`}>{depthSecondLabel}</span>
              </div>
              {depthThirdLabel != null && depthThirdLabel !== '' && (
                <div className={`${prefix}-depth-pill`}>
                  <span className={`${prefix}-depth-text ${prefix}-depth-text-inactive`}>
                    {depthThirdLabel}
                  </span>
                </div>
              )}
            </div>
          </section>

          {children}
        </main>
      </div>

      <ChatBotButton />
    </div>
  )
}

export default AssetManagementPageLayout
