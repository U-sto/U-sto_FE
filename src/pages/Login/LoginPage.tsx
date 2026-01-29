import GNB from '../../components/GNB'
import LoginForm from '../../components/LoginForm'
import './LoginPage.css'

const LoginPage = () => {
  return (
    <div className="login-page">
      <GNB />
      <div className="login-wrapper">
        <h1 className="login-title">로그인 후 이용 가능합니다.</h1>
        <LoginForm />
      </div>
    </div>
  )
}

export default LoginPage
