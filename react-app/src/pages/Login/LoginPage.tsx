// Components are not found at '../../components/AuthLayout' and '../../components/LoginForm'.
import React from "react";

const AuthLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h1>{title}</h1>
    <div>{children}</div>
  </div>
);

const LoginForm = () => (
  <form>
    {/* Login form fields go here */}
    <input type="text" placeholder="Username" />
    <input type="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
)

const LoginPage = () => {
  return (
    <AuthLayout title="로그인 후 이용 가능합니다.">
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
