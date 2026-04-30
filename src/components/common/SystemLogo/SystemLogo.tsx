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
        <img src="/usto_symbol.svg" alt="" width={42} height={29} />
      </span>
      <span className="system-logo-text">물품관리시스템</span>
    </button>
  )
}

export default SystemLogo
