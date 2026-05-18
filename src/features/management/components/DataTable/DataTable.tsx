import { useEffect, useMemo, useRef, useState, type Key, type ReactNode } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'
import './DataTable.css'

/** 행 클릭과 버튼·링크 등이 겹치지 않도록 (행 선택용 체크박스는 제외 — onRowClick과 함께 쓰임) */
function isInteractiveRowClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    return false
  }
  if (target.closest('input[type="checkbox"]')) {
    return false
  }
  const lab = target.closest('label')
  if (lab?.querySelector('input[type="checkbox"]')) {
    return false
  }
  return (
    target.closest(
      'input:not([type="checkbox"]), button, textarea, select, a[href], [role="button"], [role="checkbox"], label',
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
  /** 섹션 제목(테이블 라벨) 오른쪽 안내 문구 */
  titleHint?: ReactNode
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
  /**
   * 체크박스가 React state와 동기화된(controlled) 목록일 때 함께 전달.
   * 드래그 선택 시 DOM 조작 대신 이 콜백으로만 상태를 바꿔야 첫 행·마지막 클릭 오동작을 막을 수 있음.
   */
  getRowCheckboxChecked?: (row: T) => boolean
  setRowCheckboxChecked?: (row: T, checked: boolean) => void
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
  titleHint,
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
  getRowCheckboxChecked,
  setRowCheckboxChecked,
}: DataTableProps<T>) {
  const prefix = pageKey
  const [internalPage, setInternalPage] = useState(1)
  const [isDragSelecting, setIsDragSelecting] = useState(false)
  const dragActionRef = useRef<'check' | 'uncheck' | null>(null)
  const suppressNextRowClickRef = useRef(false)
  const suppressNextCheckboxNativeClickRef = useRef(false)
  const dragVisitedRowIndicesRef = useRef<Set<number>>(new Set())
  const dragAnchorRowIndexRef = useRef<number | null>(null)
  const dragBaselineCheckedRef = useRef<Map<number, boolean>>(new Map())

  const isControlledCheckbox =
    typeof getRowCheckboxChecked === 'function' &&
    typeof setRowCheckboxChecked === 'function'

  const isServerSide = controlledPage != null && typeof onPageChange === 'function'
  const currentPage = isServerSide ? controlledPage : internalPage

  /** 목록 데이터가 바뀌면(조회·초기화·페이지 이동 등) 드래그 중 ref가 이전 행 인덱스를 물고 체크가 복구되는 것을 막음 */
  useEffect(() => {
    setIsDragSelecting(false)
    dragActionRef.current = null
    dragVisitedRowIndicesRef.current.clear()
    dragAnchorRowIndexRef.current = null
    dragBaselineCheckedRef.current = new Map()
    suppressNextRowClickRef.current = false
    suppressNextCheckboxNativeClickRef.current = false
  }, [data])

  useEffect(() => {
    if (!isDragSelecting) return
    const onMouseUp = () => {
      if (dragVisitedRowIndicesRef.current.size > 1) {
        suppressNextRowClickRef.current = true
        suppressNextCheckboxNativeClickRef.current = true
      }
      dragVisitedRowIndicesRef.current.clear()
      dragAnchorRowIndexRef.current = null
      dragBaselineCheckedRef.current = new Map()
      setIsDragSelecting(false)
      dragActionRef.current = null
    }
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('blur', onMouseUp)
    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('blur', onMouseUp)
    }
  }, [isDragSelecting])

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

  const applyControlledDragRange = (currentRowIndex: number) => {
    if (!isControlledCheckbox) return
    const anchor = dragAnchorRowIndexRef.current
    if (anchor == null) return
    const rangeStart = Math.min(anchor, currentRowIndex)
    const rangeEnd = Math.max(anchor, currentRowIndex)
    pageData.forEach((candidateRow, candidateIndex) => {
      const baselineChecked = dragBaselineCheckedRef.current.get(candidateIndex) ?? false
      const inRange = candidateIndex >= rangeStart && candidateIndex <= rangeEnd
      const shouldBeChecked = baselineChecked || inRange
      const currentChecked = getRowCheckboxChecked!(candidateRow)
      if (currentChecked !== shouldBeChecked) {
        setRowCheckboxChecked!(candidateRow, shouldBeChecked)
      }
    })
  }

  return (
    <section
      className={`${tableClassNames}${isDragSelecting ? ' management-table-dragging' : ''}`}
      onClickCapture={(e) => {
        if (!suppressNextCheckboxNativeClickRef.current) return
        // Consume stale suppression on the very next click regardless of target.
        // If it is not consumed here, a later intentional checkbox click can be swallowed.
        suppressNextCheckboxNativeClickRef.current = false
        const target = e.target
        if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return
        // After a drag-select ends, cancel the release click's native checkbox toggle once.
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className={`${prefix}-table-top`}>
        <div className="management-table-title-row">
          <div className={`${prefix}-table-label`}>{title}</div>
          {titleHint != null && titleHint !== '' ? (
            <p className="management-table-title-hint">{titleHint}</p>
          ) : null}
        </div>
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
                    onMouseDown={(e) => {
                      if (e.button !== 0) return
                      const isCheckboxTarget =
                        e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
                      if (!isCheckboxTarget && isInteractiveRowClickTarget(e.target)) return
                      const tr = e.currentTarget as HTMLElement
                      const checkbox = tr.querySelector<HTMLInputElement>('input[type="checkbox"]')
                      if (!checkbox || checkbox.disabled) return

                      // Drag selection is additive: keep existing checks and only add newly visited rows.
                      // This prevents the first checked row from being unintentionally turned off.
                      const nextAction: 'check' | 'uncheck' = 'check'
                      dragActionRef.current = nextAction
                      dragVisitedRowIndicesRef.current = new Set([rowIndex])
                      dragAnchorRowIndexRef.current = rowIndex
                      if (isControlledCheckbox) {
                        const baseline = new Map<number, boolean>()
                        pageData.forEach((candidateRow, candidateIndex) => {
                          baseline.set(candidateIndex, getRowCheckboxChecked!(candidateRow))
                        })
                        dragBaselineCheckedRef.current = baseline
                        // 체크박스 직접 클릭: 여기서 범위를 적용하면 직후 네이티브 click이 또 토글해
                        // 체크→즉시 해제처럼 보임. 드래그는 onMouseEnter에서만 범위 적용.
                        if (!isCheckboxTarget) {
                          applyControlledDragRange(rowIndex)
                        }
                      }
                      setIsDragSelecting(true)

                      // Checkbox direct click should remain native to avoid double toggles
                      // (native onChange + row click handler). Drag to other rows is still handled
                      // by onMouseEnter while isDragSelecting is true.
                      if (isCheckboxTarget) return

                      const currentlyChecked = isControlledCheckbox
                        ? getRowCheckboxChecked!(row)
                        : checkbox.checked
                      // If the row is already checked, let click handler perform uncheck toggle.
                      // We still keep drag mode active so dragging to other rows can add checks.
                      if (currentlyChecked) return

                      const shouldCheck = nextAction === 'check'
                      if (isControlledCheckbox) {
                        setRowCheckboxChecked!(row, shouldCheck)
                      } else {
                        checkbox.checked = shouldCheck
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                      // mousedown에서 이미 체크 상태를 바꿨으므로 이어지는 click 이중 토글 방지
                      suppressNextRowClickRef.current = true
                      onRowClick?.(row, rowIndex)
                      e.preventDefault()
                    }}
                    onMouseEnter={(e) => {
                      if (!isDragSelecting) return
                      const action = dragActionRef.current
                      if (!action) return
                      const tr = e.currentTarget as HTMLElement
                      const checkbox = tr.querySelector<HTMLInputElement>('input[type="checkbox"]')
                      if (!checkbox || checkbox.disabled) return
                      dragVisitedRowIndicesRef.current.add(rowIndex)
                      const shouldBeChecked = action === 'check'
                      if (isControlledCheckbox) {
                        applyControlledDragRange(rowIndex)
                      } else {
                        if (checkbox.checked === shouldBeChecked) return
                        checkbox.checked = shouldBeChecked
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                    }}
                    onClick={
                      onRowClick
                        ? (e) => {
                            if (suppressNextRowClickRef.current) {
                              suppressNextRowClickRef.current = false
                              return
                            }
                            if (
                              e.target instanceof HTMLInputElement &&
                              e.target.type === 'checkbox'
                            ) {
                              return
                            }
                            if (isInteractiveRowClickTarget(e.target)) return
                            const tr = e.currentTarget as HTMLElement
                            const checkbox = tr.querySelector<HTMLInputElement>(
                              'input[type="checkbox"]',
                            )
                            if (isControlledCheckbox) {
                              const cur = getRowCheckboxChecked!(row)
                              const nextChecked = !cur
                              setRowCheckboxChecked!(row, nextChecked)
                              if (nextChecked) onRowClick(row, rowIndex)
                            } else if (checkbox) {
                              checkbox.click()
                              onRowClick(row, rowIndex)
                            }
                          }
                        : (e) => {
                            if (suppressNextRowClickRef.current) {
                              suppressNextRowClickRef.current = false
                              return
                            }
                            if (
                              e.target instanceof HTMLInputElement &&
                              e.target.type === 'checkbox'
                            ) {
                              return
                            }
                            if (isInteractiveRowClickTarget(e.target)) return
                            const tr = e.currentTarget as HTMLElement
                            const checkbox = tr.querySelector<HTMLInputElement>(
                              'input[type="checkbox"]',
                            )
                            if (isControlledCheckbox) {
                              const cur = getRowCheckboxChecked!(row)
                              setRowCheckboxChecked!(row, !cur)
                            } else if (checkbox) {
                              checkbox.click()
                            }
                          }
                    }
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (isInteractiveRowClickTarget(e.target)) return
                              e.preventDefault()
                              const checkbox = (
                                e.currentTarget as HTMLElement
                              ).querySelector<HTMLInputElement>('input[type="checkbox"]')
                              if (isControlledCheckbox) {
                                const cur = getRowCheckboxChecked!(row)
                                const nextChecked = !cur
                                setRowCheckboxChecked!(row, nextChecked)
                                if (nextChecked) onRowClick(row, rowIndex)
                              } else if (checkbox) {
                                checkbox.click()
                                onRowClick(row, rowIndex)
                              }
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`management-td-${column.key}`}
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
