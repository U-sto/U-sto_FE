import { useCallback, useState } from 'react'

const DATE_RANGE_ERROR_MESSAGE = '비교날짜 이 후의 날짜를 선택해주세요 !'

export type DateRangeConfig<T> = {
  fromKey: keyof T
  toKey: keyof T
  errorKey: string
}

export function useManagementFilter<T extends Record<string, unknown>>(options: {
  initialFilters: T
  dateRanges: DateRangeConfig<T>[]
}) {
  const { initialFilters, dateRanges } = options
  const [filters, setFilters] = useState<T>(initialFilters)
  const [searchedFilters, setSearchedFilters] = useState<T | null>(null)
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({})

  const validateDateRange = useCallback(
    (
      baseDate: string,
      compareDate: string,
      setError: (error: string) => void,
    ) => {
      if (baseDate && compareDate && compareDate < baseDate) {
        setError(DATE_RANGE_ERROR_MESSAGE)
      } else {
        setError('')
      }
    },
    [],
  )

  const setDateError = useCallback((key: string, value: string) => {
    setDateErrors((prev) => ({ ...prev, [key]: value }))
  }, [])

  const onReset = useCallback(() => {
    setFilters(initialFilters)
    setDateErrors({})
    setSearchedFilters(null)
  }, [initialFilters])

  /** 날짜 범위 검증 후 검색 필터 확정. 검증 실패 시 false, 성공 시 true 반환. */
  const onSearch = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {}
    let hasError = false
    for (const { fromKey, toKey, errorKey } of dateRanges) {
      const from = String(filters[fromKey] ?? '')
      const to = String(filters[toKey] ?? '')
      if (from && to && to < from) {
        nextErrors[errorKey] = DATE_RANGE_ERROR_MESSAGE
        hasError = true
      }
    }
    setDateErrors(nextErrors)
    if (hasError) return false
    setSearchedFilters({ ...filters })
    return true
  }, [filters, dateRanges])

  return {
    filters,
    setFilters,
    searchedFilters,
    dateErrors,
    setDateError,
    validateDateRange,
    onReset,
    onSearch,
  }
}
