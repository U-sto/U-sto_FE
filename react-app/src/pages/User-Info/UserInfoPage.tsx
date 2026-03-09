import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GNBWithMenu from '../../components/layout/management/GNBWithMenu/GNBWithMenu'
import TextField from '../../components/common/TextField/TextField'
import ChatBotButton from '../../features/support/components/ChatBotButton/ChatBotButton'
import './UserInfoPage.css'

const UserInfoPage = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('hyuusto')
  const [name, setName] = useState('유스토')
  const [email, setEmail] = useState('usto@hanyang.ac.kr')
  const [org, setOrg] = useState('한양대학교 ERICA캠퍼스')
  const [role, setRole] = useState('관리자')
  const [phone, setPhone] = useState('010-1234-5678')

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
                onChange={(e) => setPhone(e.target.value)}
                className="user-info-input"
              />
            </div>
          </div>
        </div>
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
