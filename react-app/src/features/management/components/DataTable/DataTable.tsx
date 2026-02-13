import { useMemo, useState } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import './DataTable.css'

export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  width?: number
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  pageKey: ManagementPageKey | string
  title: string
  data: T[]
  columns: DataTableColumn<T>[]
  getRowKey: (row: T, index: number) => React.Key
  totalCount?: number
  pageSize?: number
  variant?: 'upper' | 'lower'
  renderActions?: () => React.ReactNode
}

function DataTable<T>({
  pageKey,
  title,
  data,
  columns,
  getRowKey,
  totalCount,
  pageSize = 10,
  variant,
  renderActions,
}: DataTableProps<T>) {
  const prefix = pageKey
  const [currentPage, setCurrentPage] = useState(1)

  const { pageData, totalPages } = useMemo(() => {
    const safePageSize = pageSize > 0 ? pageSize : 10
    const pages = Math.max(1, Math.ceil(data.length / safePageSize))
    const clampedPage = Math.min(currentPage, pages)
    const startIndex = (clampedPage - 1) * safePageSize
    return {
      pageData: data.slice(startIndex, startIndex + safePageSize),
      totalPages: pages,
    }
  }, [data, pageSize, currentPage])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
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

  const effectiveTotal = totalCount ?? data.length

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, idx) => idx + 1),
    [totalPages],
  )

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
          {pageNumbers.map((pageNumber) => (
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
          ))}
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
          총 {effectiveTotal}건 / 조회 {data.length}건
        </div>
      </div>
    </section>
  )
}

export default DataTable
