import './RadioButton.css'

interface RadioButtonProps {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  label: string
}

const RadioButton = ({ name, value, checked, onChange, label }: RadioButtonProps) => {
  return (
    <label className="radio-label">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="radio-input"
      />
      <span className="radio-custom"></span>
      <span className="radio-text">{label}</span>
    </label>
  )
}

export default RadioButton
