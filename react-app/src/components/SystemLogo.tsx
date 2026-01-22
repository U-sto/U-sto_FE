import { useNavigate, useLocation } from 'react-router-dom'
import './SystemLogo.css'

const SystemLogo = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = () => {
    // 홈페이지로 이동하면서 상태 초기화를 위한 state 전달
    if (location.pathname === '/home') {
      // 이미 홈페이지에 있으면 강제로 리로드하여 모든 상태 초기화
      navigate('/home', { state: { reset: true }, replace: true })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // 다른 페이지에 있으면 홈페이지로 이동하고 상태 초기화
      navigate('/home', { state: { reset: true }, replace: false })
      // 페이지 이동 후 스크롤을 맨 위로
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 0)
    }
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
