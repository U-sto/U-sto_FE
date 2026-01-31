import { useNavigate, useLocation } from 'react-router-dom'
import { useAppReset } from '../contexts/AppResetContext'
import './SystemLogo.css'

const SystemLogo = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { triggerReset } = useAppReset()

  const handleClick = () => {
    const isHome = location.pathname === '/home'
    navigate('/home', { replace: isHome })
    triggerReset()
  }

  return (
    <div className="system-logo" onClick={handleClick}>
      <div className="system-logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6H4C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6ZM20 16H4V8H20V16Z" fill="currentColor"/>
          <path d="M6 10H18V12H6V10ZM6 13H14V15H6V13Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="system-logo-text">물품관리시스템</div>
    </div>
  )
}

export default SystemLogo
