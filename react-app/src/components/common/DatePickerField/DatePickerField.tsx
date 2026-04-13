import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { format, parse, isValid } from 'date-fns'
import type { ChangeEvent } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePickerField.css'

registerLocale('ko', ko)

interface DatePickerFieldProps {
  value: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

const DATE_FORMAT = 'yyyy-MM-dd'

const DatePickerField = ({
  value,
  onChange,
  placeholder = '날짜 선택',
  className = '',
  readOnly = false,
}: DatePickerFieldProps) => {
  const parsed = value ? parse(value, DATE_FORMAT, new Date()) : null
  const selected = parsed && isValid(parsed) ? parsed : null

  const handleChange = (date: Date | null) => {
    if (!onChange) return
    const syntheticEvent = {
      target: { value: date ? format(date, DATE_FORMAT) : '' },
    } as ChangeEvent<HTMLInputElement>
    onChange(syntheticEvent)
  }

  return (
    <ReactDatePicker
      selected={selected}
      onChange={handleChange}
      dateFormat="yyyy-MM-dd"
      locale="ko"
      placeholderText={placeholder}
      readOnly={readOnly}
      className={`text-field date-picker-field ${className}`}
      calendarClassName="date-picker-calendar"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      autoComplete="off"
    />
  )
}

export default DatePickerField
