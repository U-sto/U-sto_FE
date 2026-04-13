import { useNavigate, useLocation } from 'react-router-dom'
import './SystemLogo.css'

const SystemLogo = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    const isAlreadyHome = location.pathname === '/home'
    navigate('/home', { replace: isAlreadyHome })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button type="button" className="system-logo" onClick={handleClick}>
      <span className="system-logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6H4C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6ZM20 16H4V8H20V16Z" fill="currentColor"/>
          <path d="M6 10H18V12H6V10ZM6 13H14V15H6V13Z" fill="currentColor"/>
        </svg>
      </span>
      <span className="system-logo-text">물품관리시스템</span>
    </button>
  )
}

export default SystemLogo
