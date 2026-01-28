import { useState, useRef, useEffect } from 'react'
import './Dropdown.css'
import './DropdownSmall.css'

interface DropdownProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  size?: 'large' | 'small'
}

const Dropdown = ({ placeholder, value, onChange, options, size = 'large' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [searchTerm, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleButtonClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0])
    }
  }

  const isSmall = size === 'small'
  const wrapperClass = isSmall ? 'dropdown-small-wrapper' : 'dropdown-wrapper'
  const buttonClass = isSmall ? 'dropdown-small-button' : 'dropdown-button'
  const searchInputClass = isSmall ? 'dropdown-small-search-input' : 'dropdown-search-input'
  const selectedClass = isSmall ? 'dropdown-small-selected' : 'dropdown-selected'
  const placeholderClass = isSmall ? 'dropdown-small-placeholder' : 'dropdown-placeholder'
  const arrowClass = isSmall ? 'dropdown-small-arrow' : 'dropdown-arrow'
  const menuClass = isSmall ? 'dropdown-small-menu' : 'dropdown-menu'
  const optionClass = isSmall ? 'dropdown-small-option' : 'dropdown-option'
  const noResultsClass = isSmall ? 'dropdown-small-no-results' : 'dropdown-no-results'

  return (
    <div className={wrapperClass} ref={dropdownRef}>
      <button
        type="button"
        className={buttonClass}
        onClick={handleButtonClick}
      >
        {isOpen ? (
          <input
            ref={searchInputRef}
            type="text"
            className={searchInputClass}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={value ? selectedClass : placeholderClass}>
            {value || placeholder}
          </span>
        )}
        {isSmall ? (
          <svg
            className={`${arrowClass} ${isOpen ? 'open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="var(--dropdown-small-arrow-color)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            className={`${arrowClass} ${isOpen ? 'open' : ''}`}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.67 12L16 21.33L25.33 12"
              stroke={
                value
                  ? 'var(--dropdown-arrow-selected-color)'
                  : 'var(--dropdown-arrow-default-color)'
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {isOpen && (
        <div className={menuClass}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={optionClass}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <div className={noResultsClass}>검색 결과가 없습니다</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown
