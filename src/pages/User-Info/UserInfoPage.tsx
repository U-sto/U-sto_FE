import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import { getUserInfo } from '../../api/users'
import { formatPhoneNumber } from '../../utils/formatPhoneNumber'
import './UserInfoPage.css'

const UserInfoPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getUserInfo()
        if (cancelled) return
        const data = res.data
        if (data) {
          setUserId(data.usrId ?? '')
          setName(data.usrNm ?? '')
          setEmail(data.email ?? '')
          setOrg(data.orgNm ?? '')
          setRole(data.roleNm ?? '')
          setPhone(formatPhoneNumber(data.sms ?? ''))
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '회원 정보를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handlePasswordChange = () => {
    navigate('/user-info/change-password')
  }

  const handlePhoneChange = () => {
    navigate('/user-info/change-phone')
  }

  const handleWithdraw = () => {
    navigate('/user-info/withdraw')
  }

  return (
    <div className="user-info-page">
      <GNBWithMenu />
      <div className="user-info-page-content">
        <h1 className="user-info-page-title">회원정보</h1>
        <div className="user-info-page-divider" aria-hidden="true" />
        <div className="user-info-form">
          <div className="user-info-form-column">
            <div className="user-info-field">
              <label className="user-info-label">아이디</label>
              <TextField
                value={userId}
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
            <div className="user-info-field">
              <label className="user-info-label">이름</label>
              <TextField
                value={name}
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
            <div className="user-info-field">
              <label className="user-info-label">소속</label>
              <TextField
                value={org}
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
            <div className="user-info-field">
              <label className="user-info-label">역할</label>
              <TextField
                value={role}
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
          </div>
          <div className="user-info-form-column">
            <div className="user-info-field">
              <label className="user-info-label">이메일</label>
              <TextField
                value={email}
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
            <div className="user-info-field">
              <div className="user-info-label-row">
                <label className="user-info-label">비밀번호</label>
                <button
                  type="button"
                  className="user-info-link"
                  onClick={handlePasswordChange}
                >
                  변경
                </button>
              </div>
              <TextField
                value="********"
                readOnly
                className="user-info-input user-info-input-readonly"
              />
            </div>
            <div className="user-info-field">
              <div className="user-info-label-row">
                <label className="user-info-label">전화번호</label>
                <button
                  type="button"
                  className="user-info-link"
                  onClick={handlePhoneChange}
                >
                  변경
                </button>
              </div>
              <TextField
                value={phone}
                readOnly
                className="user-info-input"
              />
            </div>
          </div>
        </div>
        {isLoading && <p className="user-info-message">회원 정보를 불러오는 중입니다...</p>}
        {!isLoading && error && <p className="user-info-message user-info-message-error">{error}</p>}
        <div className="user-info-withdraw-wrap">
          <button
            type="button"
            className="user-info-withdraw"
            onClick={handleWithdraw}
          >
            회원탈퇴
          </button>
        </div>
      </div>
      <ChatBotButton />
    </div>
  )
}

export default UserInfoPage
