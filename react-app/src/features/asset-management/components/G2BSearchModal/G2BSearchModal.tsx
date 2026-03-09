import { useState, useMemo } from 'react'
import { useVisiblePageNumbers } from '../../../../hooks/useVisiblePageNumbers'
import Modal from '../../../../components/common/Modal/Modal'
import TextField from '../../../../components/common/TextField/TextField'
import Button from '../../../../components/common/Button/Button'
import TitlePill from '../../../../components/common/TitlePill/TitlePill'
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

// 임시 목업 데이터
const MOCK_CLASSIFICATION_DATA: ItemClassification[] = [
  { id: '1', sequence: 1, code: 'CLS001', name: 'IT기기' },
  { id: '2', sequence: 2, code: 'CLS002', name: '가구' },
  { id: '3', sequence: 3, code: 'CLS003', name: '영상기기' },
  { id: '4', sequence: 4, code: 'CLS004', name: '사무용품' },
]

const MOCK_ITEM_DETAIL_DATA: ItemDetail[] = [
  { id: '1', sequence: 1, classificationCode: 'CLS001', identificationCode: '43211613-26081535', name: '노트북', sortDate: '2024-12-01', operatingStatus: '운용중', usefulLife: '5', acquireAmount: '1500000' },
  { id: '2', sequence: 2, classificationCode: 'CLS001', identificationCode: '43211614-26081536', name: '데스크탑', sortDate: '2024-11-15', operatingStatus: '운용중', usefulLife: '5', acquireAmount: '1200000' },
  { id: '3', sequence: 3, classificationCode: 'CLS001', identificationCode: '43211615-26081537', name: '모니터', sortDate: '2024-10-20', operatingStatus: '운용중', usefulLife: '3', acquireAmount: '350000' },
  { id: '4', sequence: 4, classificationCode: 'CLS002', identificationCode: '43211616-26081538', name: '회의실 의자', sortDate: '2024-09-10', operatingStatus: '운용중', usefulLife: '10', acquireAmount: '180000' },
  { id: '5', sequence: 5, classificationCode: 'CLS002', identificationCode: '43211617-26081539', name: '책상', sortDate: '2024-08-05', operatingStatus: '운용중', usefulLife: '10', acquireAmount: '250000' },
  { id: '6', sequence: 6, classificationCode: 'CLS003', identificationCode: '43211618-26081540', name: '프로젝터', sortDate: '2024-07-01', operatingStatus: '운용중', usefulLife: '5', acquireAmount: '800000' },
]

const G2BSearchModal = ({ isOpen, onClose, onSelect }: G2BSearchModalProps) => {
  // 물품 분류 상태
  const [classificationFilters, setClassificationFilters] = useState({
    code: '',
    name: '',
  })
  const [classificationPage, setClassificationPage] = useState(1)
  const [selectedClassification, setSelectedClassification] = useState<ItemClassification | null>(null)

  // 물품 품목 상태
  const [itemDetailFilters, setItemDetailFilters] = useState({
    classificationCode: '',
    identificationCode: '',
    name: '',
  })
  const [itemDetailPage, setItemDetailPage] = useState(1)
  const [selectedItemDetail, setSelectedItemDetail] = useState<ItemDetail | null>(null)

  const pageSize = 10

  // 물품 분류 필터링 및 페이지네이션
  const filteredClassifications = useMemo(() => {
    let filtered = MOCK_CLASSIFICATION_DATA.filter((item) => {
      const codeMatch = !classificationFilters.code || item.code.toLowerCase().includes(classificationFilters.code.toLowerCase())
      const nameMatch = !classificationFilters.name || item.name.toLowerCase().includes(classificationFilters.name.toLowerCase())
      return codeMatch && nameMatch
    })
    return filtered
  }, [classificationFilters])

  const classificationPageData = useMemo(() => {
    const startIndex = (classificationPage - 1) * pageSize
    return filteredClassifications.slice(startIndex, startIndex + pageSize)
  }, [filteredClassifications, classificationPage])

  const classificationTotalPages = Math.ceil(filteredClassifications.length / pageSize)

  // 물품 품목 필터링 및 페이지네이션
  const filteredItemDetails = useMemo(() => {
    let filtered = MOCK_ITEM_DETAIL_DATA.filter((item) => {
      const codeMatch = !itemDetailFilters.classificationCode || item.classificationCode.toLowerCase().includes(itemDetailFilters.classificationCode.toLowerCase())
      const idMatch = !itemDetailFilters.identificationCode || item.identificationCode.toLowerCase().includes(itemDetailFilters.identificationCode.toLowerCase())
      const nameMatch = !itemDetailFilters.name || item.name.toLowerCase().includes(itemDetailFilters.name.toLowerCase())
      return codeMatch && idMatch && nameMatch
    })
    return filtered
  }, [itemDetailFilters])

  const itemDetailPageData = useMemo(() => {
    const startIndex = (itemDetailPage - 1) * pageSize
    return filteredItemDetails.slice(startIndex, startIndex + pageSize)
  }, [filteredItemDetails, itemDetailPage])

  const itemDetailTotalPages = Math.ceil(filteredItemDetails.length / pageSize)

  const classificationVisiblePages = useVisiblePageNumbers(
    classificationTotalPages,
    classificationPage,
  )
  const itemDetailVisiblePages = useVisiblePageNumbers(
    itemDetailTotalPages,
    itemDetailPage,
  )

  const handleClassificationSearch = () => {
    setClassificationPage(1)
    setSelectedClassification(null)
  }

  const handleItemDetailSearch = () => {
    setItemDetailPage(1)
    setSelectedItemDetail(null)
  }

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
                  {classificationPageData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    classificationPageData.map((item) => (
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
                총 {filteredClassifications.length}건 / 조회 {filteredClassifications.length}건
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
                  {itemDetailPageData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="g2b-empty">
                        조회된 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    itemDetailPageData.map((item) => (
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
                  총 {filteredItemDetails.length}건 / 조회 {filteredItemDetails.length}건
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
