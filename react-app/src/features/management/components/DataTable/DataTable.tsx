import { useMemo, useState, type Key, type ReactNode } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import './DataTable.css'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  width?: number
  render: (row: T) => ReactNode
}

/**
 * 서버 사이드 페이지네이션 모드: currentPage + onPageChange 제공 시 활성화
 * 클라이언트 사이드 모드: 미제공 시 기존처럼 data 전체를 slice하여 표시
 */
interface DataTableProps<T> {
  pageKey: ManagementPageKey | string
  title: string
  data: T[]
  columns: DataTableColumn<T>[]
  getRowKey: (row: T, index: number) => Key
  totalCount?: number
  pageSize?: number
  variant?: 'upper' | 'lower'
  renderActions?: () => ReactNode
  /** 서버 사이드 페이지네이션: 현재 페이지 (제어용) */
  currentPage?: number
  /** 서버 사이드 페이지네이션: 페이지 변경 시 API 호출을 위해 부모에 알림 */
  onPageChange?: (page: number) => void
}

function DataTable<T>({
  pageKey,
  title,
  data,
  columns,
  getRowKey,
  totalCount: propTotalCount,
  pageSize = 10,
  variant,
  renderActions,
  currentPage: controlledPage,
  onPageChange,
}: DataTableProps<T>) {
  const prefix = pageKey
  const [internalPage, setInternalPage] = useState(1)

  const isServerSide = controlledPage != null && typeof onPageChange === 'function'
  const currentPage = isServerSide ? controlledPage : internalPage

  const { pageData, totalPages } = useMemo(() => {
    const safePageSize = pageSize > 0 ? pageSize : 10

    if (isServerSide && propTotalCount != null) {
      const pages = Math.max(1, Math.ceil(propTotalCount / safePageSize))
      return {
        pageData: data,
        totalPages: pages,
      }
    }

    const pages = Math.max(1, Math.ceil(data.length / safePageSize))
    const startIndex = (Math.min(currentPage, pages) - 1) * safePageSize
    return {
      pageData: data.slice(startIndex, startIndex + safePageSize),
      totalPages: pages,
    }
  }, [data, pageSize, currentPage, isServerSide, propTotalCount])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    if (isServerSide) {
      onPageChange?.(page)
    } else {
      setInternalPage(page)
    }
  }

  const tableClassNames = [
    `${prefix}-table`,
    variant ? `${prefix}-table-${variant}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const paginationClass = `${prefix}-pagination`
  const pageBtnClass = `${prefix}-page-btn`
  const pageNumClass = `${prefix}-page-num`
  const pageNumActiveClass = `${prefix}-page-num-active`
  const summaryClass = `${prefix}-pagination-summary`

  const effectiveTotal = propTotalCount ?? data.length

  /** 현재 페이지 중심으로 일정 범위만 노출, 처음/끝·말줄임으로 레이아웃 보존 */
  const visiblePageNumbers = useMemo(() => {
    const total = totalPages
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    const current = currentPage
    const windowSize = 2
    const start = Math.max(1, current - windowSize)
    const end = Math.min(total, current + windowSize)
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
  }, [totalPages, currentPage])

  return (
    <section className={tableClassNames}>
      <div className={`${prefix}-table-top`}>
        <div className={`${prefix}-table-label`}>{title}</div>
        {renderActions && (
          <div className={`${prefix}-table-actions`}>{renderActions()}</div>
        )}
      </div>

      <div className={`${prefix}-table-wrap`}>
        <div className={`${prefix}-table-wrap-inner`}>
          <table className={`${prefix}-table-el management-table-el`}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`${prefix}-th-${column.key}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="management-table-empty">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                pageData.map((row, rowIndex) => (
                  <tr key={getRowKey(row, rowIndex)}>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render(row)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${paginationClass} management-pagination`}>
        <div className="management-pagination-buttons">
          <button
            type="button"
            className={pageBtnClass}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {visiblePageNumbers.map((pageNumber, idx) =>
            pageNumber === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className={pageNumClass} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={pageNumber}
                type="button"
                className={`${pageNumClass} ${
                  pageNumber === currentPage ? pageNumActiveClass : ''
                }`.trim()}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            type="button"
            className={pageBtnClass}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
        <div className={`${summaryClass} management-pagination-summary`} aria-live="polite">
          {isServerSide ? `총 ${effectiveTotal}건` : `총 ${effectiveTotal}건 / 조회 ${data.length}건`}
        </div>
      </div>
    </section>
  )
}

export default DataTable
