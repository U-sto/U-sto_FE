import { useEffect } from 'react'
import { useAppReset } from '../../contexts/AppResetContext'
import GNBWithMenu from '../../components/GNBWithMenu'
import UserInfoCard from '../../components/UserInfoCard'
import NoticeField from '../../components/NoticeField'
import ChatBotButton from '../../components/ChatBotButton'
import './HomePage.css'

const HomePage = () => {
  const { resetKey } = useAppReset()

  useEffect(() => {
    if (resetKey > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [resetKey])

  return (
    <div className="home-page">
      <GNBWithMenu key={resetKey} />
      <div className="home-content">
        <UserInfoCard />
        <NoticeField />
      </div>
      <ChatBotButton />
    </div>
  )
}

export default HomePage
