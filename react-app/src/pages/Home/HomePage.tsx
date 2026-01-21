import GNBWithMenu from '../../components/GNBWithMenu'
import UserInfoCard from '../../components/UserInfoCard'
import NoticeField from '../../components/NoticeField'
import ChatBotButton from '../../components/ChatBotButton'
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
