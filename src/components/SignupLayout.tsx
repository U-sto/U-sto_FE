import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import GNB from './GNB'
import ProgressBar from './ProgressBar'
import './SignupLayout.css'

interface SignupLayoutProps {
  step: 1 | 2 | 3
  title: string
  subtitle?: ReactNode
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  formClassName?: string
}

const SignupLayout = ({
  step,
  title,
  subtitle,
  children,
  onSubmit,
  formClassName = '',
}: SignupLayoutProps) => {
  return (
    <div className="signup-layout">
      <GNB />
      <div className="signup-layout-wrapper">
        <h1 className="signup-layout-title">{title}</h1>
        <ProgressBar step={step} />
        {subtitle != null && (
          <p className="signup-layout-subtitle">{subtitle}</p>
        )}
        <form
          className={`signup-layout-form ${formClassName}`.trim()}
          onSubmit={onSubmit}
        >
          {children}
        </form>
        <div className="signup-layout-footer">
          <Link to="/login" className="signup-layout-link">
            기존 계정 로그인
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignupLayout
