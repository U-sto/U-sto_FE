import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import UserInfoCard from '../../features/home/components/UserInfoCard/UserInfoCard'
import NoticeField from '../../features/home/components/NoticeField/NoticeField'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './HomePage.css'

const HomePage = () => {
  return (
    <div className="home-page">
      <GNBWithMenu />
      <div className="home-content">
        <UserInfoCard />
        <NoticeField />
      </div>
      <ChatBotButton />
    </div>
  )
}

export default HomePage
