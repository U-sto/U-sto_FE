import { useState, useEffect, useCallback, useRef } from 'react'
// useVisiblePageNumbers는 기존 페이지에서 쓰지만, 이 모달은 버튼 겹침 방지를 위해 직접 window 페이지를 사용한다.
import Modal from '../../../../components/common/Modal/Modal'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import { fetchG2BCategories, fetchG2BItems } from '../../../../api/g2b'
import type { G2BCategoryDto, G2BItemDto } from '../../../../api/g2b'
import './G2BSearchModal.css'

export type G2BItem = {
  id: string
  name: string
  /** 표시용 복합번호 (물품분류코드-물품식별코드). 하위 호환용 */
  number: string
  /** 물품분류코드 (G2B목록번호 앞칸) */
  categoryCode?: string
  /** 물품식별코드 (G2B목록번호 뒤칸) */
  identificationCode?: string
  sortDate?: string
  operatingStatus?: string
  usefulLife?: string
  acquireAmount?: string
}

/** 모달 선택값 → 필터의 G2B목록번호 앞(분류코드)·뒤(식별코드) */
export function getG2BListNumberParts(item: G2BItem): { prefix: string; suffix: string } {
  if (item.categoryCode != null && item.categoryCode !== '') {
    return {
      prefix: item.categoryCode,
      suffix: item.identificationCode ?? '',
    }
  }
  if (item.identificationCode != null && item.identificationCode !== '') {
    return { prefix: '', suffix: item.identificationCode }
  }
  const num = item.number ?? ''
  const idx = num.indexOf('-')
  if (idx === -1) return { prefix: num, suffix: '' }
  return { prefix: num.slice(0, idx), suffix: num.slice(idx + 1) }
}

// 물품 분류 타입
export type ItemClassification = {
  id: string
  sequence: number
  code: string
  name: string
}

// 물품 품목 타입
export type ItemDetail = {
  id: string
  sequence: number
  classificationCode: string
  identificationCode: string
  name: string
  sortDate?: string
  operatingStatus?: string
  usefulLife?: string
  acquireAmount?: string
}

interface G2BSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: G2BItem) => void
}

const pageSize = 10
const PAGE_WINDOW = 2
/** 분류/품목 필터 입력 후 API 호출 간격 (서버 부담 완화) */
const FILTER_DEBOUNCE_MS = 400

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

function getWindowPages(totalPages: number, currentPage: number, windowSize: number) {
  const total = Math.max(1, totalPages)
  const desiredCount = windowSize * 2 + 1

  // total이 적으면 전부 표시
  if (total <= desiredCount) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // 기본: 현재 페이지 기준으로 양쪽 windowSize
  let start = currentPage - windowSize
  let end = currentPage + windowSize

  // 앞쪽에 붙으면 1부터 desiredCount까지 고정
  if (start < 1) {
    start = 1
    end = desiredCount
  }

  // 뒤쪽에 붙으면 total-desiredCount+1부터 total까지 고정
  if (end > total) {
    end = total
    start = total - desiredCount + 1
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function mapCategoryToClassification(dto: G2BCategoryDto, index: number): ItemClassification {
  return {
    id: dto.id ?? String(index),
    sequence: dto.sequence ?? index + 1,
    code: dto.mCd ?? dto.code ?? '',
    name: dto.mNm ?? dto.name ?? '',
  }
}

function mapItemToDetail(dto: G2BItemDto, index: number): ItemDetail {
  const identificationCode = dto.dCd ?? dto.identificationCode ?? dto.itemCode ?? ''
  const name = dto.dNm ?? dto.name ?? dto.itemName ?? ''
  const classificationCode = dto.classificationCode ?? dto.categoryCode ?? ''
  return {
    id: dto.id ?? String(index),
    sequence: dto.sequence ?? index + 1,
    classificationCode,
    identificationCode,
    name,
    sortDate: dto.sortDate,
    operatingStatus: dto.operatingStatus,
    usefulLife: dto.usefulLife,
    acquireAmount: dto.upr != null ? String(dto.upr) : dto.acquireAmount,
  }
}

const G2BSearchModal = ({ isOpen, onClose, onSelect }: G2BSearchModalProps) => {
  // 물품 분류 상태
  const [classificationFilters, setClassificationFilters] = useState({ code: '', name: '' })
  const [classificationPage, setClassificationPage] = useState(1)
  const [selectedClassification, setSelectedClassification] = useState<ItemClassification | null>(null)
  const [classificationList, setClassificationList] = useState<ItemClassification[]>([])
  const [classificationTotal, setClassificationTotal] = useState(0)
  const [loadingClassification, setLoadingClassification] = useState(false)

  // 물품 품목 상태
  const [itemDetailFilters, setItemDetailFilters] = useState({
    classificationCode: '',
    identificationCode: '',
    name: '',
  })
  const [itemDetailPage, setItemDetailPage] = useState(1)
  const [selectedItemDetail, setSelectedItemDetail] = useState<ItemDetail | null>(null)
  const [itemDetailList, setItemDetailList] = useState<ItemDetail[]>([])
  const [itemDetailTotal, setItemDetailTotal] = useState(0)
  const [loadingItemDetail, setLoadingItemDetail] = useState(false)
  const [hasSearchedItems, setHasSearchedItems] = useState(false)

  const classificationTotalPages = Math.max(1, Math.ceil(classificationTotal / pageSize))
  const itemDetailTotalPages = Math.max(1, Math.ceil(itemDetailTotal / pageSize))

  // 기존 말줄임(1 ... n) 표시는 버튼 겹침을 유발해서, window 방식(현재±2) + 처음/끝 이동(« »)으로 대체
  const classificationWindowPages = getWindowPages(classificationTotalPages, classificationPage, PAGE_WINDOW)
  const itemDetailWindowPages = getWindowPages(itemDetailTotalPages, itemDetailPage, PAGE_WINDOW)

  const debouncedClassificationFilters = useDebouncedValue(classificationFilters, FILTER_DEBOUNCE_MS)
  const debouncedItemDetailFilters = useDebouncedValue(itemDetailFilters, FILTER_DEBOUNCE_MS)

  /** 왼쪽 분류 필터 키가 바뀌면 첫 페이지로만 조회(페이지 번호 혼선 방지) */
  const classFilterKeyRef = useRef<string | null>(null)
  /** 즉시 조회 직후 디바운스 effect가 같은 요청을 한 번 더 보내지 않도록 */
  const skipDebouncedItemFetch = useRef(false)

  /** 왼쪽: GET /api/g2b/categories */
  const fetchClassificationPage = useCallback(async (page: number, code: string, name: string) => {
    setLoadingClassification(true)
    try {
      const res = await fetchG2BCategories({
        code: code || undefined,
        name: name || undefined,
        page: page - 1,
        size: pageSize,
      })
      setClassificationList((res.content ?? []).map(mapCategoryToClassification))
      setClassificationTotal(res.totalElements ?? 0)
    } catch (e) {
      setClassificationList([])
      setClassificationTotal(0)
      console.error('G2B 물품 분류 조회 실패:', e)
    } finally {
      setLoadingClassification(false)
    }
  }, [])

  type ItemDetailFilterFields = {
    classificationCode: string
    identificationCode: string
    name: string
  }

  /** 오른쪽: GET /api/g2b/items — 필터 값을 인자로 받아 즉시 조회(왼쪽 분류 클릭 시 등) */
  const loadItemsWithFilters = useCallback(async (page: number, filters: ItemDetailFilterFields) => {
    setLoadingItemDetail(true)
    try {
      const res = await fetchG2BItems({
        categoryCode: filters.classificationCode || undefined,
        itemCode: filters.identificationCode || undefined,
        itemName: filters.name || undefined,
        page: page - 1,
        size: pageSize,
      })
      setItemDetailList((res.content ?? []).map(mapItemToDetail))
      setItemDetailTotal(res.totalElements ?? 0)
    } catch (e) {
      setItemDetailList([])
      setItemDetailTotal(0)
      console.error('G2B 물품 품목 조회 실패:', e)
    } finally {
      setLoadingItemDetail(false)
    }
  }, [])

  /** 현재 상태의 itemDetailFilters로 품목 조회 */
  const loadItems = useCallback(
    async (page: number) => loadItemsWithFilters(page, itemDetailFilters),
    [itemDetailFilters, loadItemsWithFilters],
  )

  const resetModalState = useCallback(() => {
    // 필터/선택/페이지/결과를 모두 초기화
    setClassificationFilters({ code: '', name: '' })
    setClassificationPage(1)
    setSelectedClassification(null)
    setClassificationList([])
    setClassificationTotal(0)
    setLoadingClassification(false)

    setItemDetailFilters({ classificationCode: '', identificationCode: '', name: '' })
    setItemDetailPage(1)
    setSelectedItemDetail(null)
    setItemDetailList([])
    setItemDetailTotal(0)
    setLoadingItemDetail(false)
    setHasSearchedItems(false)
  }, [])

  /** 왼쪽: 디바운스된 분류코드·분류명이 바뀔 때만 1페이지 조회 (키 입력 시 과다 호출 방지) */
  useEffect(() => {
    if (!isOpen) return
    const code = debouncedClassificationFilters.code
    const name = debouncedClassificationFilters.name
    const key = `${code}\0${name}`
    if (classFilterKeyRef.current === key) return
    classFilterKeyRef.current = key
    setClassificationPage(1)
    void fetchClassificationPage(1, code, name)
  }, [
    isOpen,
    debouncedClassificationFilters.code,
    debouncedClassificationFilters.name,
    fetchClassificationPage,
  ])

  /** 왼쪽: 페이지만 바뀔 때 (필터는 디바운스 값과 일치할 때) 추가 페이지 조회 */
  useEffect(() => {
    if (!isOpen) return
    if (classificationPage === 1) return
    const code = debouncedClassificationFilters.code
    const name = debouncedClassificationFilters.name
    const key = `${code}\0${name}`
    if (classFilterKeyRef.current !== key) return
    void fetchClassificationPage(classificationPage, code, name)
  }, [
    isOpen,
    classificationPage,
    debouncedClassificationFilters.code,
    debouncedClassificationFilters.name,
    fetchClassificationPage,
  ])

  /** 조회 버튼: 디바운스를 기다리지 않고 현재 입력값으로 즉시 조회 */
  const handleClassificationSearch = () => {
    setClassificationPage(1)
    setSelectedClassification(null)
    void fetchClassificationPage(1, classificationFilters.code, classificationFilters.name)
  }

  const handleItemDetailSearch = () => {
    setItemDetailPage(1)
    setSelectedItemDetail(null)
    setHasSearchedItems(true)
    skipDebouncedItemFetch.current = true
    void loadItems(1)
  }

  /** 왼쪽 물품 분류 행 클릭 시: 분류코드 반영 + 해당 분류 품목 즉시 조회 */
  const handleClassificationRowSelect = (row: ItemClassification) => {
    setSelectedClassification(row)
    setSelectedItemDetail(null)
    setItemDetailPage(1)
    setHasSearchedItems(true)
    skipDebouncedItemFetch.current = true
    const next = { ...itemDetailFilters, classificationCode: row.code }
    setItemDetailFilters(next)
    void loadItemsWithFilters(1, next)
  }

  /** 오른쪽: 물품분류코드·식별코드·품목명 중 하나라도 있으면 디바운스 후 자동 조회 */
  useEffect(() => {
    if (!isOpen) return
    const f = debouncedItemDetailFilters
    const hasAny =
      Boolean(f.classificationCode?.trim()) ||
      Boolean(f.identificationCode?.trim()) ||
      Boolean(f.name?.trim())
    if (!hasAny) return
    if (skipDebouncedItemFetch.current) {
      skipDebouncedItemFetch.current = false
      return
    }
    setItemDetailPage(1)
    setSelectedItemDetail(null)
    void loadItemsWithFilters(1, f)
  }, [isOpen, debouncedItemDetailFilters, loadItemsWithFilters])

  /** 오른쪽: 2페이지 이상 페이지네이션 */
  useEffect(() => {
    if (!isOpen || itemDetailPage === 1) return
    void loadItems(itemDetailPage)
  }, [isOpen, itemDetailPage, loadItems])

  useEffect(() => {
    if (!isOpen) {
      classFilterKeyRef.current = null
      skipDebouncedItemFetch.current = false
      resetModalState()
    }
  }, [isOpen, resetModalState])

  const handleConfirm = () => {
    if (selectedItemDetail) {
      const classificationCd =
        selectedClassification?.code ||
        selectedItemDetail.classificationCode ||
        itemDetailFilters.classificationCode ||
        ''
      const identificationCd = selectedItemDetail.identificationCode || ''
      const compositeNumber =
        classificationCd && identificationCd
          ? `${classificationCd}-${identificationCd}`
          : identificationCd || classificationCd

      onSelect({
        id: selectedItemDetail.id,
        name: selectedItemDetail.name,
        number: compositeNumber,
        categoryCode: classificationCd,
        identificationCode: identificationCd,
        sortDate: selectedItemDetail.sortDate ?? '',
        operatingStatus: selectedItemDetail.operatingStatus ?? '',
        usefulLife: selectedItemDetail.usefulLife ?? '',
        acquireAmount: selectedItemDetail.acquireAmount ?? '',
      })
      // 닫힐 때 초기화되지만, 선택 확정 시에도 바로 초기화
      resetModalState()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="g2b" className="g2b-modal-no-title" showCloseButton={true}>
      <div className="g2b-search-modal">
        <div className="g2b-modal-content">
          {/* 왼쪽: 물품 분류 목록 */}
          <div className="g2b-section">
            <div className="g2b-search-container">
              <div className="g2b-search-panel">
                <div className="g2b-search-row">
                  <label className="g2b-search-label">물품분류코드</label>
                  <TextField
                    value={classificationFilters.code}
                    onChange={(e) => setClassificationFilters((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder=""
                    className="g2b-search-input g2b-input-classification-code"
                  />
                </div>
                <div className="g2b-search-row">
                  <label className="g2b-search-label">물품분류명</label>
                  <TextField
                    value={classificationFilters.name}
                    onChange={(e) => setClassificationFilters((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder=""
                    className="g2b-search-input g2b-input-classification-name"
                  />
                  <Button className="g2b-search-btn" onClick={handleClassificationSearch}>
                    조회
                  </Button>
                </div>
              </div>
            </div>

            <div className="g2b-section-title-row">
              <TitlePill>물품 분류 목록</TitlePill>
            </div>

            <div className="g2b-table-container">
              <div className="g2b-table-wrapper">
              <table className="g2b-table">
                <thead>
                  <tr>
                    <th className="g2b-th-sequence">순번</th>
                    <th className="g2b-th-code">물품분류코드</th>
                    <th className="g2b-th-name">물품분류명</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClassification ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회 중...
                      </td>
                    </tr>
                  ) : classificationList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    classificationList.map((item) => (
                      <tr
                        key={item.id}
                        className={selectedClassification?.id === item.id ? 'g2b-row-selected' : ''}
                        onClick={() => handleClassificationRowSelect(item)}
                      >
                        <td className="g2b-td-sequence">{item.sequence}</td>
                        <td className="g2b-td-code">{item.code}</td>
                        <td className="g2b-td-name">{item.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="g2b-pagination">
              <div className="g2b-pagination-buttons">
                <button
                  type="button"
                  className="g2b-page-btn"
                  onClick={() => setClassificationPage(1)}
                  disabled={classificationPage === 1}
                  aria-label="첫 페이지"
                >
                  «
                </button>
                <button
                  type="button"
                  className="g2b-page-btn"
                  onClick={() => setClassificationPage((p) => Math.max(1, p - 1))}
                  disabled={classificationPage === 1}
                >
                  ‹
                </button>
                {classificationWindowPages.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`g2b-page-num ${classificationPage === pageNum ? 'g2b-page-num-active' : ''}`}
                    onClick={() => setClassificationPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  className="g2b-page-btn"
                  onClick={() => setClassificationPage((p) => Math.min(classificationTotalPages, p + 1))}
                  disabled={classificationPage === classificationTotalPages}
                >
                  ›
                </button>
                <button
                  type="button"
                  className="g2b-page-btn"
                  onClick={() => setClassificationPage(classificationTotalPages)}
                  disabled={classificationPage === classificationTotalPages}
                  aria-label="마지막 페이지"
                >
                  »
                </button>
              </div>
              <div className="g2b-pagination-summary">
                총 {classificationTotal}건 / 조회 {classificationTotal}건
              </div>
            </div>
            </div>
          </div>

          {/* 오른쪽: 물품 품목 목록 */}
          <div className="g2b-section">
            <div className="g2b-search-container">
              <div className="g2b-search-panel">
              <div className="g2b-search-row">
                <label className="g2b-search-label">물품분류코드</label>
                <TextField
                  value={itemDetailFilters.classificationCode}
                  onChange={(e) => setItemDetailFilters((prev) => ({ ...prev, classificationCode: e.target.value }))}
                  placeholder=""
                  className="g2b-search-input g2b-input-item-classification-code"
                />
              </div>
              <div className="g2b-search-row">
                <label className="g2b-search-label">물품식별코드</label>
                <TextField
                  value={itemDetailFilters.identificationCode}
                  onChange={(e) => setItemDetailFilters((prev) => ({ ...prev, identificationCode: e.target.value }))}
                  placeholder=""
                  className="g2b-search-input g2b-input-identification-code"
                />
                <label className="g2b-search-label g2b-search-label-inline">물품품목명</label>
                <TextField
                  value={itemDetailFilters.name}
                  onChange={(e) => setItemDetailFilters((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder=""
                  className="g2b-search-input g2b-input-item-name"
                />
                <Button className="g2b-search-btn" onClick={handleItemDetailSearch}>
                  조회
                </Button>
              </div>
              </div>
            </div>

            <div className="g2b-section-title-row">
              <TitlePill>물품 품목 목록</TitlePill>
            </div>

            <div className="g2b-table-container">
              <div className="g2b-table-wrapper">
              <table className="g2b-table">
                <thead>
                  <tr>
                    <th className="g2b-th-sequence">순번</th>
                    <th className="g2b-th-code">물품식별코드</th>
                    <th className="g2b-th-name">물품품목명</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingItemDetail ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회 중...
                      </td>
                    </tr>
                  ) : itemDetailList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    itemDetailList.map((item) => (
                      <tr
                        key={item.id}
                        className={selectedItemDetail?.id === item.id ? 'g2b-row-selected' : ''}
                        onClick={() => setSelectedItemDetail(item)}
                      >
                        <td className="g2b-td-sequence">{item.sequence}</td>
                        <td className="g2b-td-code">{item.identificationCode}</td>
                        <td className="g2b-td-name">{item.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>

              <div className="g2b-pagination">
                <div className="g2b-pagination-buttons">
                  <button
                    type="button"
                    className="g2b-page-btn"
                    onClick={() => setItemDetailPage(1)}
                    disabled={itemDetailPage === 1}
                    aria-label="첫 페이지"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="g2b-page-btn"
                    onClick={() => setItemDetailPage((p) => Math.max(1, p - 1))}
                    disabled={itemDetailPage === 1}
                  >
                    ‹
                  </button>
                  {itemDetailWindowPages.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`g2b-page-num ${itemDetailPage === pageNum ? 'g2b-page-num-active' : ''}`}
                      onClick={() => setItemDetailPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="g2b-page-btn"
                    onClick={() => setItemDetailPage((p) => Math.min(itemDetailTotalPages, p + 1))}
                    disabled={itemDetailPage === itemDetailTotalPages}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="g2b-page-btn"
                    onClick={() => setItemDetailPage(itemDetailTotalPages)}
                    disabled={itemDetailPage === itemDetailTotalPages}
                    aria-label="마지막 페이지"
                  >
                    »
                  </button>
                </div>
                <div className="g2b-pagination-summary">
                  총 {itemDetailTotal}건 / 조회 {itemDetailTotal}건
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="g2b-modal-footer">
          <Button
            className="g2b-confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedItemDetail}
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default G2BSearchModal
