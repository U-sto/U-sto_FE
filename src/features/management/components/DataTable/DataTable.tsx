import { useMemo, useState, type Key, type ReactNode } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import './DataTable.css'

/** 행 클릭과 체크박스·버튼 등이 겹치지 않도록 */
function isInteractiveRowClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.closest(
      'input, button, textarea, select, a[href], [role="button"], [role="checkbox"], label',
    ) != null
  )
}

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  /** 픽셀 단위. `select`·`check`·순번 열 너비는 DataTable 상수(이 규칙이 있으면 width 무시) */
  width?: number
  render: (row: T) => ReactNode
  /** true면 해당 셀 클릭이 tr의 onRowClick으로 전파되지 않음(체크박스 열 권장) */
  stopRowClickPropagation?: boolean
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
  /** 행 클릭 (목록 행 선택 등) */
  onRowClick?: (row: T, index: number) => void
  /** 선택된 행 스타일 */
  isRowSelected?: (row: T, index: number) => boolean
}

/** 체크 열 (20px 컨트롤 + 여백). 이 키에는 column.width 무시 */
const CHECKBOX_COLUMN_WIDTH_PX = 40

/** 체크 다음 순번 열: 「순번」·숫자 + 왼쪽 여백(12px) 반영 */
const SEQUENCE_AFTER_CHECK_WIDTH_PX = 74

/** 페이지 번호 버튼은 한 번에 최대 이 개수만 표시 (1–10, 11–20 …). ‹›는 1페이지씩, ≪≫는 블록 단위 */
const PAGE_NUMBER_WINDOW = 10

function resolveColumnWidth<T>(
  column: DataTableColumn<T>,
  columnIndex: number,
  columns: DataTableColumn<T>[],
): number | undefined {
  if (column.key === 'select' || column.key === 'check') {
    return CHECKBOX_COLUMN_WIDTH_PX
  }
  if (column.width != null) return column.width
  const first = columns[0]
  const hasCheckboxFirst =
    first != null && (first.key === 'select' || first.key === 'check')
  if (
    hasCheckboxFirst &&
    columnIndex === 1 &&
    (column.key === 'id' || column.key === 'no')
  ) {
    return SEQUENCE_AFTER_CHECK_WIDTH_PX
  }
  return undefined
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
  onRowClick,
  isRowSelected,
}: DataTableProps<T>) {
  const prefix = pageKey
  const [internalPage, setInternalPage] = useState(1)

  const isServerSide = controlledPage != null && typeof onPageChange === 'function'
  const currentPage = isServerSide ? controlledPage : internalPage

  const { pageData, totalPages } = useMemo(() => {
    const safePageSize = pageSize > 0 ? pageSize : 10

    if (isServerSide && propTotalCount != null) {
      const pages = Math.max(1, Math.ceil(propTotalCount / safePageSize))
      /** 서버가 요청 size 무시하고 더 많은 content를 줄 때에도 표시 행 수는 pageSize로 고정 */
      return {
        pageData: data.slice(0, safePageSize),
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

  /** 현재 페이지가 속한 구간의 시작(1, 11, 21 …). 번호 목록은 이 구간에서만 보이고, 10번을 눌러도 11이 끼어 보이지 않음 */
  const pageBlockStart = useMemo(() => {
    return Math.floor((currentPage - 1) / PAGE_NUMBER_WINDOW) * PAGE_NUMBER_WINDOW + 1
  }, [currentPage])

  const visiblePageNumbers = useMemo(() => {
    const end = Math.min(totalPages, pageBlockStart + PAGE_NUMBER_WINDOW - 1)
    const list: number[] = []
    for (let p = pageBlockStart; p <= end; p++) list.push(p)
    return list
  }, [totalPages, pageBlockStart])

  const canPrevBlock = pageBlockStart > 1
  const canNextBlock = pageBlockStart + PAGE_NUMBER_WINDOW <= totalPages

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
            <colgroup>
              {columns.map((column, columnIndex) => {
                const colWidth = resolveColumnWidth(column, columnIndex, columns)
                return (
                  <col
                    key={column.key}
                    style={
                      colWidth != null
                        ? { width: colWidth, minWidth: colWidth, maxWidth: colWidth }
                        : undefined
                    }
                  />
                )
              })}
            </colgroup>
            <thead>
              <tr>
                {columns.map((column, columnIndex) => {
                  const colWidth = resolveColumnWidth(column, columnIndex, columns)
                  return (
                    <th
                      key={column.key}
                      className={`${prefix}-th-${column.key}`}
                      style={
                        colWidth != null
                          ? {
                              width: colWidth,
                              minWidth: colWidth,
                              maxWidth: colWidth,
                              boxSizing: 'border-box',
                              ...(colWidth === SEQUENCE_AFTER_CHECK_WIDTH_PX
                                ? { whiteSpace: 'nowrap' as const }
                                : {}),
                            }
                          : undefined
                      }
                    >
                      {column.header}
                    </th>
                  )
                })}
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
                  <tr
                    key={getRowKey(row, rowIndex)}
                    role={onRowClick ? 'button' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={[
                      onRowClick ? 'management-table-row-clickable' : '',
                      isRowSelected?.(row, rowIndex) ? 'management-table-row-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (isInteractiveRowClickTarget(e.target)) return
                            // 행의 체크박스가 있으면 함께 토글
                            const checkbox = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>(
                              'input[type="checkbox"]',
                            )
                            if (checkbox) checkbox.click()
                            onRowClick(row, rowIndex)
                          }
                        : (e) => {
                            if (isInteractiveRowClickTarget(e.target)) return
                            const checkbox = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>(
                              'input[type="checkbox"]',
                            )
                            if (checkbox) checkbox.click()
                          }
                    }
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (isInteractiveRowClickTarget(e.target)) return
                              e.preventDefault()
                              const checkbox = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>(
                                'input[type="checkbox"]',
                              )
                              if (checkbox) checkbox.click()
                              onRowClick(row, rowIndex)
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        onClick={
                          column.stopRowClickPropagation
                            ? (e) => {
                                e.stopPropagation()
                              }
                            : undefined
                        }
                      >
                        {column.render(row)}
                      </td>
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
            onClick={() => handlePageChange(Math.max(1, pageBlockStart - PAGE_NUMBER_WINDOW))}
            disabled={!canPrevBlock}
            aria-label="이전 10페이지 구간"
          >
            «
          </button>
          <button
            type="button"
            className={pageBtnClass}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {visiblePageNumbers.map((pageNumber) => (
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
            aria-label="다음 페이지"
          >
            ›
          </button>
          <button
            type="button"
            className={pageBtnClass}
            onClick={() =>
              handlePageChange(Math.min(totalPages, pageBlockStart + PAGE_NUMBER_WINDOW))
            }
            disabled={!canNextBlock}
            aria-label="다음 10페이지 구간"
          >
            »
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
