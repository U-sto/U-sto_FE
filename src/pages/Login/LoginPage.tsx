import AuthLayout from '../../components/AuthLayout'
import LoginForm from '../../components/LoginForm'

const LoginPage = () => {
  return (
    <AuthLayout title="로그인 후 이용 가능합니다.">
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
