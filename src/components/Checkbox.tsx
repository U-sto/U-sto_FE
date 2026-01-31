import './Checkbox.css'

interface CheckboxProps {
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label: string
}

const Checkbox = ({ checked, onChange, label }: CheckboxProps) => {
  return (
    <label className="checkbox-label">
      <input
        type="checkbox"
        className="checkbox-input"
        checked={checked}
        onChange={onChange}
      />
      <span className="checkbox-custom"></span>
      <span className="checkbox-text">{label}</span>
    </label>
  )
}

export default Checkbox
