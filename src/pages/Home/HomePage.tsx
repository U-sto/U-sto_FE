import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import GNBWithMenu from '../../components/GNBWithMenu'
import UserInfoCard from '../../components/UserInfoCard'
import NoticeField from '../../components/NoticeField'
import ChatBotButton from '../../components/ChatBotButton'
import './HomePage.css'

const HomePage = () => {
  const location = useLocation()

  useEffect(() => {
    // 로고 클릭으로 리셋된 경우 모든 상태 초기화
    if (location.state?.reset) {
      // 스크롤을 맨 위로
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // 모든 드롭다운 및 활성 상태 초기화를 위해 페이지 리로드 효과
      // GNBWithMenu의 드롭다운 상태는 컴포넌트 내부 상태이므로
      // 강제로 리마운트하기 위해 key를 사용하거나
      // 각 컴포넌트에서 location.state를 감지하여 초기화
    }
  }, [location.state])

  return (
    <div className="home-page">
      <GNBWithMenu key={location.state?.reset ? Date.now() : undefined} />
      <div className="home-content">
        <UserInfoCard />
        <NoticeField />
      </div>
      <ChatBotButton />
    </div>
  )
}

export default HomePage
