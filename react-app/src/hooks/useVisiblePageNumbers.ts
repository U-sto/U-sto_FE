import { useMemo } from 'react'

/**
 * 현재 페이지 중심 + 말줄임 동적 페이지네이션.
 * totalPages, currentPage, windowSize를 받아 표시할 페이지 번호 배열을 반환.
 * 7개 이하면 전부, 초과 시 1 ... start~end ... total 형태.
 */
export function useVisiblePageNumbers(
  totalPages: number,
  currentPage: number,
  windowSize: number = 2,
): (number | 'ellipsis')[] {
  return useMemo(() => {
    const total = Math.max(1, totalPages)
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    const start = Math.max(1, currentPage - windowSize)
    const end = Math.min(total, currentPage + windowSize)
    const list: (number | 'ellipsis')[] = []
    if (start > 1) {
      list.push(1)
      if (start > 2) list.push('ellipsis')
    }
    for (let p = start; p <= end; p++) list.push(p)
    if (end < total) {
      if (end < total - 1) list.push('ellipsis')
      list.push(total)
    }
    return list
  }, [totalPages, currentPage, windowSize])
}
