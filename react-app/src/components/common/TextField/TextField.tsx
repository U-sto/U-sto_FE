import type { ChangeEvent, HTMLAttributes } from 'react'
import './TextField.css'

interface TextFieldProps {
  placeholder?: string
  value: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  readOnly?: boolean
}

const TextField = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  inputMode,
  autoComplete,
  readOnly = false,
}: TextFieldProps) => {
  return (
    <input
      type={type}
      className={`text-field ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      inputMode={inputMode}
      autoComplete={autoComplete}
    />
  )
}

export default TextField
