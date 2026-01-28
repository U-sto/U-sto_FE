import { useState, useRef, useEffect } from 'react'
import './DropdownSmall.css'

interface DropdownSmallProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

const DropdownSmall = ({ placeholder, value, onChange, options }: DropdownSmallProps) => {
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

  return (
    <div className="dropdown-small-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-small-button"
        onClick={handleButtonClick}
      >
        {isOpen ? (
          <input
            ref={searchInputRef}
            type="text"
            className="dropdown-small-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={value ? 'dropdown-small-selected' : 'dropdown-small-placeholder'}>
            {value || placeholder}
          </span>
        )}
        <svg
          className={`dropdown-small-arrow ${isOpen ? 'open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.5 5.25L7 8.75L10.5 5.25"
            stroke={value ? '#888C8D' : '#888C8D'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="dropdown-small-menu">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                className="dropdown-small-option"
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="dropdown-small-no-results">검색 결과가 없습니다</div>
          )}
        </div>
      )}
    </div>
  )
}

export default DropdownSmall
