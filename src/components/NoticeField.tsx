import { useState } from 'react'
import './NoticeField.css'

const ITEMS_PER_PAGE = 5

interface Notice {
  id: number
  title: string
  date: string
  content: string
}

const notices: Notice[] = [
  { id: 1, title: '시스템 정기 점검 안내', date: '2026.01.10', content: '시스템 안정화를 위해 정기 점검이 진행됩니다.\n점검 시간 동안 물품관리시스템 이용이 일시적으로 제한될 수 있으니 양해 부탁드립니다.\n\n점검 일시: 2026년 1월 10일(금) 02:00 ~ 05:00\n점검 내용: 시스템 안정화 및 성능 개선' },
  { id: 2, title: '기능 개선 업데이트 안내', date: '2026.01.05', content: '물품관리시스템 기능 개선 업데이트가 적용되었습니다.\n\n변경 사항은 로그인 후 메뉴별 안내를 참고해 주세요.' },
  { id: 3, title: '물품 처분 이력 조회 오류 수정 안내', date: '2025.12.28', content: '물품 처분 이력 조회 시 발생하던 오류가 수정되었습니다.\n불편을 드려 죄송합니다.' },
  { id: 4, title: '물품 번호 연동 로직 변경 안내', date: '2025.12.20', content: '물품 번호 연동 로직이 변경되었습니다.\n기존 데이터는 자동 마이그레이션되었습니다.' },
  { id: 5, title: '시스템 안정화 작업 완료 안내', date: '2025.12.05', content: '시스템 안정화 작업이 완료되었습니다.\n이용에 불편이 있으시면 고객센터로 문의해 주세요.' },
  { id: 6, title: '시스템 정기 점검 안내', date: '2025.12.01', content: '정기 점검이 완료되었습니다. 감사합니다.' },
  { id: 7, title: '물품 등록 시 유의사항', date: '2025.11.25', content: '물품 등록 시 필수 항목을 반드시 입력해 주시기 바랍니다.\n문의사항은 관리자에게 연락해 주세요.' },
  { id: 8, title: '챗봇 관련 문의사항', date: '2025.11.03', content: '챗봇 이용 관련 문의는 우측 하단 챗봇 버튼을 통해 이용해 주세요.' },
]

const NoticeField = () => {
  const [selectedNotice, setSelectedNotice] = useState<number>(notices[0].id)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(notices.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNotices = notices.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const selectedNoticeData = notices.find(n => n.id === selectedNotice) ?? notices[0]

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePrevPage = () => {
    handlePageClick(currentPage - 1)
  }

  const handleNextPage = () => {
    handlePageClick(currentPage + 1)
  }

  return (
    <div className="notice-field">
      <div className="notice-field-content">
        <div className="notice-list-section">
          <h3 className="notice-list-title">공지사항</h3>
          <div className="notice-list-divider"></div>
          <div className="notice-list">
            {paginatedNotices.map((notice) => (
              <div
                key={notice.id}
                className={`notice-item ${notice.id === selectedNotice ? 'selected' : ''}`}
                onClick={() => setSelectedNotice(notice.id)}
              >
                <div className="notice-item-title">{notice.title}</div>
                <div className="notice-item-date">{notice.date}</div>
              </div>
            ))}
          </div>
          <div className="notice-list-divider"></div>
          <div className="notice-pagination">
            <button
              type="button"
              className="notice-pagination-arrow"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              aria-label="이전 페이지"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`notice-pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                onClick={() => handlePageClick(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              className="notice-pagination-arrow"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              aria-label="다음 페이지"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="notice-detail-divider"></div>
        
        <div className="notice-detail-section">
          <h3 className="notice-detail-title">{selectedNoticeData.title}</h3>
          <div className="notice-detail-info">
            <div className="notice-detail-divider"></div>
            <div className="notice-detail-meta">
              <span className="notice-detail-writer">시스템관리자</span>
              <span className="notice-detail-date">{selectedNoticeData.date}</span>
            </div>
            <div className="notice-detail-divider"></div>
          </div>
          <div className="notice-detail-text">
            {selectedNoticeData.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoticeField
