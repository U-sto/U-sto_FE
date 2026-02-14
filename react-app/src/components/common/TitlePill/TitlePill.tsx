import './TitlePill.css'

interface TitlePillProps {
  children: React.ReactNode
  className?: string
}

const TitlePill = ({ children, className = '' }: TitlePillProps) => {
  return (
    <span className={`title-pill ${className}`.trim()}>
      {children}
    </span>
  )
}

export default TitlePill
