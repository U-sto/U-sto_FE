import { useState, useEffect, useCallback } from 'react'
import { useVisiblePageNumbers } from '../../../../hooks/useVisiblePageNumbers'
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
  number: string
  categoryCode?: string
  identificationCode?: string
  sortDate?: string
  operatingStatus?: string
  usefulLife?: string
  acquireAmount?: string
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

function mapCategoryToClassification(dto: G2BCategoryDto, index: number): ItemClassification {
  return {
    id: dto.id ?? String(index),
    sequence: dto.sequence ?? index + 1,
    code: dto.code,
    name: dto.name,
  }
}

function mapItemToDetail(dto: G2BItemDto, index: number): ItemDetail {
  const identificationCode = dto.identificationCode ?? dto.itemCode ?? ''
  const name = dto.name ?? dto.itemName ?? ''
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
    acquireAmount: dto.acquireAmount,
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

  const classificationVisiblePages = useVisiblePageNumbers(
    classificationTotalPages,
    classificationPage,
  )
  const itemDetailVisiblePages = useVisiblePageNumbers(itemDetailTotalPages, itemDetailPage)

  /** 왼쪽: GET /api/g2b/categories - 물품 분류 조회 */
  const loadCategories = useCallback(
    async (page: number) => {
      setLoadingClassification(true)
      try {
        const res = await fetchG2BCategories({
          code: classificationFilters.code || undefined,
          name: classificationFilters.name || undefined,
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
    },
    [classificationFilters.code, classificationFilters.name],
  )

  /** 오른쪽: GET /api/g2b/items - 물품 품목 조회 */
  const loadItems = useCallback(
    async (page: number) => {
      setLoadingItemDetail(true)
      try {
        const res = await fetchG2BItems({
          categoryCode: itemDetailFilters.classificationCode || undefined,
          itemCode: itemDetailFilters.identificationCode || undefined,
          itemName: itemDetailFilters.name || undefined,
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
    },
    [
      itemDetailFilters.classificationCode,
      itemDetailFilters.identificationCode,
      itemDetailFilters.name,
    ],
  )

  useEffect(() => {
    if (isOpen) loadCategories(classificationPage)
  }, [isOpen, classificationPage, loadCategories])

  const handleClassificationSearch = () => {
    setClassificationPage(1)
    setSelectedClassification(null)
    loadCategories(1)
  }

  const handleItemDetailSearch = () => {
    setItemDetailPage(1)
    setSelectedItemDetail(null)
    setHasSearchedItems(true)
    loadItems(1)
  }

  useEffect(() => {
    if (!isOpen || !hasSearchedItems || itemDetailPage === 1) return
    loadItems(itemDetailPage)
  }, [isOpen, hasSearchedItems, itemDetailPage, loadItems])

  useEffect(() => {
    if (!isOpen) setHasSearchedItems(false)
  }, [isOpen])

  const handleConfirm = () => {
    if (selectedItemDetail) {
      onSelect({
        id: selectedItemDetail.id,
        name: selectedItemDetail.name,
        number: selectedItemDetail.identificationCode,
        categoryCode: selectedItemDetail.classificationCode,
        sortDate: selectedItemDetail.sortDate ?? '',
        operatingStatus: selectedItemDetail.operatingStatus ?? '',
        usefulLife: selectedItemDetail.usefulLife ?? '',
        acquireAmount: selectedItemDetail.acquireAmount ?? '',
      })
      // 초기화
      setClassificationFilters({ code: '', name: '' })
      setItemDetailFilters({ classificationCode: '', identificationCode: '', name: '' })
      setSelectedClassification(null)
      setSelectedItemDetail(null)
      setClassificationPage(1)
      setItemDetailPage(1)
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
                        onClick={() => {
                          setSelectedClassification(item)
                          setItemDetailFilters((prev) => ({ ...prev, classificationCode: item.code }))
                          setItemDetailPage(1)
                        }}
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
                  onClick={() => setClassificationPage((p) => Math.max(1, p - 1))}
                  disabled={classificationPage === 1}
                >
                  ‹
                </button>
                {classificationVisiblePages.map((pageNum, idx) =>
                  pageNum === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="g2b-page-num" aria-hidden>
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      type="button"
                      className={`g2b-page-num ${classificationPage === pageNum ? 'g2b-page-num-active' : ''}`}
                      onClick={() => setClassificationPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="g2b-page-btn"
                  onClick={() => setClassificationPage((p) => Math.min(classificationTotalPages, p + 1))}
                  disabled={classificationPage === classificationTotalPages}
                >
                  ›
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
                    onClick={() => setItemDetailPage((p) => Math.max(1, p - 1))}
                    disabled={itemDetailPage === 1}
                  >
                    ‹
                  </button>
                  {itemDetailVisiblePages.map((pageNum, idx) =>
                    pageNum === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="g2b-page-num" aria-hidden>
                        …
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        className={`g2b-page-num ${itemDetailPage === pageNum ? 'g2b-page-num-active' : ''}`}
                        onClick={() => setItemDetailPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className="g2b-page-btn"
                    onClick={() => setItemDetailPage((p) => Math.min(itemDetailTotalPages, p + 1))}
                    disabled={itemDetailPage === itemDetailTotalPages}
                  >
                    ›
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
