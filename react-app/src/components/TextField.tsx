import './TextField.css'

interface TextFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
}

const TextField = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  inputMode,
  autoComplete,
}: TextFieldProps) => {
  return (
    <input
      type={type}
      className={`text-field ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      inputMode={inputMode}
      autoComplete={autoComplete}
    />
  )
}

export default TextField
