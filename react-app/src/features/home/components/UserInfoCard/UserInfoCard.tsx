import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserInfo } from '../../../../api/users'
import './UserInfoCard.css'

const UserInfoCard = () => {
  const navigate = useNavigate()
  const [nameAndId, setNameAndId] = useState<string>('')
  const [org, setOrg] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getUserInfo()
      .then((res) => {
        if (cancelled) return
        const data = res.data
        if (data) {
          const name = data.usrNm ?? ''
          const id = data.usrId ?? ''
          setNameAndId(id ? `${name} (${id})` : name || '-')
          setOrg(data.orgNm ?? '')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNameAndId('-')
          setOrg('')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="user-info-card">
      <div className="user-info-card-header"></div>
      <div className="user-info-card-content">
        <div className="user-info-card-main">
          <div>
            <h3 className="user-info-card-title">회원정보</h3>
            <div className="user-info-details">
              <div className="user-info-name">
                {loading ? '불러오는 중...' : nameAndId || '-'}
              </div>
              <div className="user-info-org">{loading ? '' : org || '-'}</div>
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
