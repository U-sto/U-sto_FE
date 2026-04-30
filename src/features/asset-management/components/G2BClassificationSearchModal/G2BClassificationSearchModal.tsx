import { useState, useEffect, useCallback, useRef } from 'react'
import Modal from '../../../../components/common/Modal/Modal'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
import { fetchG2BCategories } from '../../../../api/g2b'
import type { G2BCategoryDto } from '../../../../api/g2b'
import './G2BClassificationSearchModal.css'
import '../G2BSearchModal/G2BSearchModal.css'

export type G2BClassificationPick = {
  /** 물품분류코드 */
  code: string
  /** 물품분류명 */
  name: string
}

type ItemClassification = {
  id: string
  sequence: number
  code: string
  name: string
}

interface G2BClassificationSearchModalProps {
  isOpen: boolean
  onClose: () => void
  /** 행 클릭 시 분류명·코드 전달 후 모달은 부모에서 닫음 */
  onSelect: (pick: G2BClassificationPick) => void
}

const pageSize = 10
const PAGE_WINDOW = 2
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

  if (total <= desiredCount) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  let start = currentPage - windowSize
  let end = currentPage + windowSize

  if (start < 1) {
    start = 1
    end = desiredCount
  }

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

const G2BClassificationSearchModal = ({ isOpen, onClose, onSelect }: G2BClassificationSearchModalProps) => {
  const [classificationFilters, setClassificationFilters] = useState({ code: '', name: '' })
  const [classificationPage, setClassificationPage] = useState(1)
  const [classificationList, setClassificationList] = useState<ItemClassification[]>([])
  const [classificationTotal, setClassificationTotal] = useState(0)
  const [loadingClassification, setLoadingClassification] = useState(false)

  const classificationTotalPages = Math.max(1, Math.ceil(classificationTotal / pageSize))
  const classificationWindowPages = getWindowPages(classificationTotalPages, classificationPage, PAGE_WINDOW)

  const debouncedClassificationFilters = useDebouncedValue(classificationFilters, FILTER_DEBOUNCE_MS)

  const classFilterKeyRef = useRef<string | null>(null)

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

  const resetModalState = useCallback(() => {
    setClassificationFilters({ code: '', name: '' })
    setClassificationPage(1)
    setClassificationList([])
    setClassificationTotal(0)
    setLoadingClassification(false)
  }, [])

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

  const handleClassificationSearch = () => {
    setClassificationPage(1)
    void fetchClassificationPage(1, classificationFilters.code, classificationFilters.name)
  }

  const handleRowClick = (row: ItemClassification) => {
    onSelect({ code: row.code, name: row.name })
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      classFilterKeyRef.current = null
      resetModalState()
    }
  }, [isOpen, resetModalState])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="large"
      title="물품 분류 검색"
      className="g2b-classification-only-modal"
      showCloseButton
    >
      <div className="g2b-search-modal g2b-classification-only-inner">
        <div className="g2b-modal-content g2b-classification-only-content">
          <div className="g2b-section">
            <div className="g2b-search-container">
              <div className="g2b-search-panel">
                <div className="g2b-search-row">
                  <label className="g2b-search-label">물품분류코드</label>
                  <TextField
                    value={classificationFilters.code}
                    onChange={(e) =>
                      setClassificationFilters((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder=""
                    className="g2b-search-input g2b-input-classification-code"
                  />
                </div>
                <div className="g2b-search-row">
                  <label className="g2b-search-label">물품분류명</label>
                  <TextField
                    value={classificationFilters.name}
                    onChange={(e) =>
                      setClassificationFilters((prev) => ({ ...prev, name: e.target.value }))
                    }
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
                        <tr key={item.id} onClick={() => handleRowClick(item)}>
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
                    onClick={() =>
                      setClassificationPage((p) => Math.min(classificationTotalPages, p + 1))
                    }
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
        </div>
      </div>
    </Modal>
  )
}

export default G2BClassificationSearchModal
