import './UserInfoCard.css'

const UserInfoCard = () => {
  return (
    <div className="user-info-card">
      <div className="user-info-card-header"></div>
      <div className="user-info-card-content">
        <h3 className="user-info-card-title">회원정보</h3>
        <div className="user-info-details">
          <div className="user-info-name">유스토 (HYUusto)</div>
          <div className="user-info-org">한양대학교 ERICA캠퍼스</div>
          <div className="user-info-divider"></div>
          <div className="user-info-dept">소프트웨어융합대학 행정팀</div>
        </div>
      </div>
    </div>
  )
}

export default UserInfoCard
