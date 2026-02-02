import './TextField.css'

interface TextFieldProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

const TextField = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  inputMode,
}: TextFieldProps) => {
  return (
    <input
      type={type}
      className={`text-field ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      inputMode={inputMode}
    />
  )
}

export default TextField
