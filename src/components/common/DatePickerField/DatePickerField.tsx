import ReactDatePicker, { registerLocale } from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { format, parse, isValid, getDaysInMonth } from 'date-fns'
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

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 31 }, (_, idx) => currentYear - 15 + idx)
  const monthOptions = Array.from({ length: 12 }, (_, idx) => idx)

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
      renderCustomHeader={({ date, changeYear, changeMonth }) => {
        const baseDate = selected ?? date
        const year = baseDate.getFullYear()
        const month = baseDate.getMonth()
        const day = baseDate.getDate()
        const dayOptions = Array.from(
          { length: getDaysInMonth(new Date(year, month, 1)) },
          (_, idx) => idx + 1,
        )

        const applyDateByHeader = (nextYear: number, nextMonth: number, nextDay: number) => {
          const safeDay = Math.min(
            Math.max(nextDay, 1),
            getDaysInMonth(new Date(nextYear, nextMonth, 1)),
          )
          handleChange(new Date(nextYear, nextMonth, safeDay))
        }

        return (
          <div className="date-picker-calendar__header-selects">
            <select
              className="date-picker-calendar__header-select"
              value={year}
              onChange={(e) => {
                const nextYear = Number(e.target.value)
                changeYear(nextYear)
                applyDateByHeader(nextYear, month, day)
              }}
              disabled={readOnly}
            >
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}년
                </option>
              ))}
            </select>
            <select
              className="date-picker-calendar__header-select"
              value={month}
              onChange={(e) => {
                const nextMonth = Number(e.target.value)
                changeMonth(nextMonth)
                applyDateByHeader(year, nextMonth, day)
              }}
              disabled={readOnly}
            >
              {monthOptions.map((monthOption) => (
                <option key={monthOption} value={monthOption}>
                  {monthOption + 1}월
                </option>
              ))}
            </select>
            <select
              className="date-picker-calendar__header-select"
              value={day}
              onChange={(e) => {
                const nextDay = Number(e.target.value)
                applyDateByHeader(year, month, nextDay)
              }}
              disabled={readOnly}
            >
              {dayOptions.map((dayOption) => (
                <option key={dayOption} value={dayOption}>
                  {dayOption}일
                </option>
              ))}
            </select>
          </div>
        )
      }}
      autoComplete="off"
    />
  )
}

export default DatePickerField
