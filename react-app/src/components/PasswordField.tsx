import { useState } from 'react'
import './PasswordField.css'

interface PasswordFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PasswordField = ({ placeholder, value, onChange }: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="password-field-wrapper">
      <input
        type={showPassword ? 'text' : 'password'}
        className="password-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 10C12 10 8.73 12.11 7 15.5C8.73 18.89 12 21 16 21C20 21 23.27 18.89 25 15.5C23.27 12.11 20 10 16 10ZM16 19C13.79 19 12 17.21 12 15C12 12.79 13.79 11 16 11C18.21 11 20 12.79 20 15C20 17.21 18.21 19 16 19ZM16 13C14.34 13 13 14.34 13 16C13 17.66 14.34 19 16 19C17.66 19 19 17.66 19 16C19 14.34 17.66 13 16 13Z"
            fill={value ? '#58828E' : '#BEC3C3'}
          />
          {!showPassword && (
            <line
              x1="6"
              y1="26"
              x2="26"
              y2="6"
              stroke={value ? '#58828E' : '#BEC3C3'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
    </div>
  )
}

export default PasswordField
