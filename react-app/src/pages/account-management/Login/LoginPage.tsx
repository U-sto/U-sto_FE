import AuthLayout from '../../../components/layout/auth/AuthLayout/AuthLayout'
import LoginForm from '../../../features/auth/components/LoginForm/LoginForm'

const LoginPage = () => {
  return (
    <AuthLayout title="로그인 후 이용 가능합니다.">
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
