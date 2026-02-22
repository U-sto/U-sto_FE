import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../GNBWithMenu/GNBWithMenu'
import '../AssetManagementPageLayout/AssetManagementPageLayout.css'
import './AiForecastPageLayout.css'

interface AiForecastPageLayoutProps {
  depthLabel: string
  children: ReactNode
}

const SIDEBAR_ITEMS = [
  { label: '사용주기 AI 예측', path: '/ai-forecast' },
]

const AiForecastPageLayout = ({ depthLabel, children }: AiForecastPageLayoutProps) => {
  const navigate = useNavigate()
  const prefix = 'asset'

  return (
    <div className={`${prefix}-page`}>
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
                  key={item.path}
                  type="button"
                  className={`${prefix}-sidebar-menu-item ${prefix}-sidebar-menu-item-active`}
                  onClick={() => navigate(item.path)}
                  aria-current="page"
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
            <div className={`${prefix}-depthbar-track ai-forecast-depthbar-track`}>
              <div className={`${prefix}-depth-pill ${prefix}-depth-pill-active`}>
                <span className={`${prefix}-depth-text`}>{depthLabel}</span>
              </div>
            </div>
          </section>

          {children}
        </main>
      </div>
    </div>
  )
}

export default AiForecastPageLayout
