import './IdDisplayField.css'

interface IdDisplayFieldProps {
  value: string
}

const IdDisplayField = ({ value }: IdDisplayFieldProps) => {
  return (
    <div className="id-display-field">
      <div className="id-display-input">
        {value || ''}
      </div>
    </div>
  )
}

export default IdDisplayField
