import type { ReactNode } from 'react'
import GNB from '../GNB/GNB'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
  /** 상단 헤더 (예: FindIdTabs) */
  header?: ReactNode
  /** 상단에 표시할 제목 (선택) */
  title?: string | ReactNode
  /** 제목 정렬 (기본: center) */
  titleAlign?: 'left' | 'center'
  /** 제목 아래 부가 설명 (선택) */
  subtitle?: ReactNode
  /** 부제목 정렬 (기본: center) */
  subtitleAlign?: 'left' | 'center'
  /** 하단 링크 영역 (선택) */
  footer?: ReactNode
  /** 콘텐츠 영역 추가 클래스명 */
  contentClassName?: string
}

const AuthLayout = ({
  children,
  header,
  title,
  titleAlign = 'center',
  subtitle,
  subtitleAlign = 'center',
  footer,
  contentClassName = '',
}: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <GNB />
      <div className={`auth-layout-content ${contentClassName}`.trim()}>
        {header != null && <div className="auth-layout-header">{header}</div>}
        {title != null && (
          <div className={`auth-layout-title${titleAlign === 'left' ? ' auth-layout-title-left' : ''}`}>
            {typeof title === 'string' ? <h1 className="auth-layout-title-text">{title}</h1> : title}
          </div>
        )}
        {subtitle != null && (
          <div className={`auth-layout-subtitle${subtitleAlign === 'left' ? ' auth-layout-subtitle-left' : ''}`}>
            {subtitle}
          </div>
        )}
        <div className="auth-layout-body">{children}</div>
        {footer != null && <div className="auth-layout-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default AuthLayout
