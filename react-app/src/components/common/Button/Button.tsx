import './Button.css'

interface ButtonProps {
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const Button = ({ children, type = 'button', onClick, disabled = false, className = '' }: ButtonProps) => {
  return (
    <button
      type={type}
      className={`button ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
