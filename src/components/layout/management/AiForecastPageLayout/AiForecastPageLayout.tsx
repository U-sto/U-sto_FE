import type { ReactNode } from 'react'
import GNBWithMenu from '../GNBWithMenu/GNBWithMenu'
import '../ManagementLayoutBase/ManagementLayoutBase.css'
import './AiForecastPageLayout.css'
import ChatBotButton from '../../../../features/support/components/ChatBotButton/ChatBotButton'

export type AiForecastSidebarTab = 'ai' | 'history'

interface AiForecastPageLayoutProps {
  depthLabel: string
  activeSidebarTab: AiForecastSidebarTab
  onSidebarTabChange: (tab: AiForecastSidebarTab) => void
  children: ReactNode
}

const SIDEBAR_ITEMS: { label: string; key: AiForecastSidebarTab }[] = [
  { label: '사용주기 AI 예측', key: 'ai' },
  { label: '이전 분석 결과', key: 'history' },
]

const AiForecastPageLayout = ({
  depthLabel,
  activeSidebarTab,
  onSidebarTabChange,
  children,
}: AiForecastPageLayoutProps) => {
  const prefix = 'management'

  return (
    <div className={`${prefix}-page ai-forecast-page-layout`}>
      <GNBWithMenu />

      <div className={`${prefix}-layout`}>
        <aside className={`${prefix}-sidebar`}>
          <div className={`${prefix}-sidebar-main`}>
            <span className={`${prefix}-sidebar-main-text`}>AI 예측</span>
          </div>

          <div className={`${prefix}-sidebar-category`}>
            <div className={`${prefix}-sidebar-menu-list`}>
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${prefix}-sidebar-menu-item ${activeSidebarTab === item.key ? `${prefix}-sidebar-menu-item-active` : ''}`}
                  onClick={() => onSidebarTabChange(item.key)}
                  aria-current={activeSidebarTab === item.key ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className={`${prefix}-main`}>
          <section className={`${prefix}-depthbar`}>
            <div className={`${prefix}-depthbar-bg`} />
            <div className={`${prefix}-depthbar-track ${prefix}-depthbar-track-single`}>
              <div className={`${prefix}-depth-pill ${prefix}-depth-pill-active`}>
                <span className={`${prefix}-depth-text`}>{depthLabel}</span>
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

export default AiForecastPageLayout
