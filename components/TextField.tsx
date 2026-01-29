import './TextField.css'

interface TextFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
}

const TextField = ({ placeholder, value, onChange, type = 'text', className = '' }: TextFieldProps) => {
  return (
    <input
      type={type}
      className={`text-field ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  )
}

export default TextField
