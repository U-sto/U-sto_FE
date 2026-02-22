import { useState, useRef, useEffect, useMemo, useId, type ChangeEvent, type KeyboardEvent } from 'react'
import './Dropdown.css'

interface DropdownProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  size?: 'large' | 'small'
  /** 접근성: 스크린 리더용 레이블 (버튼과 연결) */
  ariaLabel?: string
}

const Dropdown = ({ placeholder, value, onChange, options, size = 'large', ariaLabel }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const listboxId = useId()
  const triggerId = useId()

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      setHighlightedIndex(0)
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    if (searchTerm === '') {
      return options
    }
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    )
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
      setHighlightedIndex(0)
    }
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(0)
  }

  /** 키보드 내비게이션: ArrowUp, ArrowDown, Enter, Escape 지원 (WAI-ARIA listbox 패턴) */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleButtonClick()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
      default:
        break
    }
  }

  /** Arrow 키로 하이라이트 변경 시 해당 옵션으로 스크롤 */
  useEffect(() => {
    optionRefs.current.get(highlightedIndex)?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const isSmall = size === 'small'
  const wrapperClass = isSmall ? 'dropdown-small-wrapper' : 'dropdown-wrapper'
  const buttonClass = isSmall ? 'dropdown-small-button' : 'dropdown-button'
  const searchInputClass = isSmall
    ? 'dropdown-small-search-input'
    : 'dropdown-search-input'
  const selectedClass = isSmall ? 'dropdown-small-selected' : 'dropdown-selected'
  const placeholderClass = isSmall
    ? 'dropdown-small-placeholder'
    : 'dropdown-placeholder'
  const arrowClass = isSmall ? 'dropdown-small-arrow' : 'dropdown-arrow'
  const menuClass = isSmall ? 'dropdown-small-menu' : 'dropdown-menu'
  const optionClass = isSmall ? 'dropdown-small-option' : 'dropdown-option'
  const noResultsClass = isSmall
    ? 'dropdown-small-no-results'
    : 'dropdown-no-results'

  return (
    <div className={wrapperClass} ref={dropdownRef}>
      {isOpen ? (
        <div id={triggerId} className={buttonClass}>
          <input
            ref={searchInputRef}
            type="text"
            className={searchInputClass}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            onClick={(e) => e.stopPropagation()}
            aria-label={ariaLabel ?? (placeholder || '선택')}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={filteredOptions.length > 0 ? `option-${highlightedIndex}` : undefined}
          />
          {isSmall ? (
            <svg
              className={`${arrowClass} open`}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="var(--usto-gray-200)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className={`${arrowClass} open`}
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.67 12L16 21.33L25.33 12"
                stroke={value ? 'var(--usto-primary-300)' : 'var(--usto-gray-100)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ) : (
        <button
          type="button"
          id={triggerId}
          className={buttonClass}
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={ariaLabel ?? (placeholder || '선택')}
        >
          <span className={value ? selectedClass : placeholderClass}>
            {value || placeholder}
          </span>
          {isSmall ? (
            <svg
              className={arrowClass}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="var(--usto-gray-200)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className={arrowClass}
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.67 12L16 21.33L25.33 12"
                stroke={value ? 'var(--usto-primary-300)' : 'var(--usto-gray-100)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
      {isOpen && (
        <div
          id={listboxId}
          className={menuClass}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <button
                key={option}
                id={`option-${idx}`}
                ref={(el) => {
                  if (el) optionRefs.current.set(idx, el)
                }}
                type="button"
                role="option"
                aria-selected={value === option}
                className={`${optionClass} ${idx === highlightedIndex ? 'dropdown-option-highlighted' : ''}`.trim()}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {option}
              </button>
            ))
          ) : (
            <div className={noResultsClass} role="status">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dropdown
