import { Link } from 'react-router-dom'
import './FindIdTabs.css'

interface FindIdTabsProps {
  activeTab: 'id' | 'password'
}

const FindIdTabs = ({ activeTab }: FindIdTabsProps) => {
  return (
    <div className="find-id-tabs">
      <Link to="/find-id" className={`find-id-tab ${activeTab === 'id' ? 'active' : ''}`}>
        <span className="find-id-tab-text">아이디 찾기</span>
        <div className={`find-id-tab-indicator ${activeTab === 'id' ? 'active' : ''}`}></div>
      </Link>
      <Link to="/find-password" className={`find-id-tab ${activeTab === 'password' ? 'active' : ''}`}>
        <span className="find-id-tab-text">비밀번호 찾기</span>
        <div className={`find-id-tab-indicator ${activeTab === 'password' ? 'active' : ''}`}></div>
      </Link>
    </div>
  )
}

export default FindIdTabs
