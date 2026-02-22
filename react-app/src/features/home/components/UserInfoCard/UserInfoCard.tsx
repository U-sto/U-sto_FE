import { useNavigate } from 'react-router-dom'
import './UserInfoCard.css'

const UserInfoCard = () => {
  const navigate = useNavigate()
  return (
    <div className="user-info-card">
      <div className="user-info-card-header"></div>
      <div className="user-info-card-content">
        <div className="user-info-card-main">
          <div>
            <h3 className="user-info-card-title">회원정보</h3>
            <div className="user-info-details">
              <div className="user-info-name">유스토 (HYUusto)</div>
              <div className="user-info-org">한양대학교 ERICA캠퍼스</div>
            </div>
          </div>
          <button
            type="button"
            className="user-info-card-btn user-info-card-btn-arrow"
            onClick={() => navigate('/user-info')}
            aria-label="회원정보 더보기"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserInfoCard
