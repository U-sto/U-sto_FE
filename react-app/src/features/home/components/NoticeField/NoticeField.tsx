import { useMemo, useState } from 'react'
import './NoticeField.css'

interface Notice {
  id: number
  title: string
  date: string
}

const PAGE_SIZE = 5

const NoticeField = () => {
  const [selectedNotice, setSelectedNotice] = useState<number | null>(1)
  const [currentPage, setCurrentPage] = useState(1)

  const notices: Notice[] = [
    { id: 1, title: '시스템 정기 점검 안내', date: '2026.01.10' },
    { id: 2, title: '기능 개선 업데이트 안내', date: '2026.01.05' },
    { id: 3, title: '물품 처분 이력 조회 오류 수정 안내', date: '2025.12.28' },
    { id: 4, title: '물품 번호 연동 로직 변경 안내', date: '2025.12.20' },
    { id: 5, title: '시스템 안정화 작업 완료 안내', date: '2025.12.05' },
    { id: 6, title: '시스템 정기 점검 안내', date: '2025.12.01' },
    { id: 7, title: '물품 등록 시 유의사항', date: '2025.11.25' },
    { id: 8, title: '챗봇 관련 문의사항', date: '2025.11.03' },
  ]

  const hasNotices = notices.length > 0

  /** totalCount 기반 동적 페이지네이션: 하드코딩(1,2,3,4,5) 대신 totalPages 계산 */
  const totalCount = notices.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  )

  /** currentPage, PAGE_SIZE 기반으로 현재 페이지에 표시할 공지 목록 */
  const pagedNotices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return notices.slice(start, start + PAGE_SIZE)
  }, [notices, currentPage])

  const selectedNoticeData =
    hasNotices && selectedNotice != null
      ? notices.find((n) => n.id === selectedNotice) ?? notices[0]
      : null

  return (
    <div className="notice-field">
      <div className="notice-field-content">
        <div className="notice-list-section">
          <h3 className="notice-list-title">공지사항</h3>
          <div className="notice-list-divider"></div>
          <div className="notice-list">
            {hasNotices ? (
              pagedNotices.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  className={`notice-item ${
                    notice.id === selectedNotice ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedNotice(notice.id)}
                >
                  <div className="notice-item-title">{notice.title}</div>
                  <div className="notice-item-date">{notice.date}</div>
                </button>
              ))
            ) : (
              <div className="notice-empty">등록된 공지사항이 없습니다.</div>
            )}
          </div>
          <div className="notice-list-divider"></div>
          <div className="notice-pagination" role="navigation" aria-label="공지사항 페이지네이션">
            <button
              type="button"
              className="notice-pagination-arrow"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="이전 페이지"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`notice-pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
                aria-label={`${pageNum}페이지`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              className="notice-pagination-arrow"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
          {selectedNoticeData ? (
            <>
              <h3 className="notice-detail-title">{selectedNoticeData.title}</h3>
              <div className="notice-detail-info">
                <div className="notice-detail-divider"></div>
                <div className="notice-detail-meta">
                  <span className="notice-detail-writer">시스템관리자</span>
                  <span className="notice-detail-date">
                    {selectedNoticeData.date}
                  </span>
                </div>
                <div className="notice-detail-divider"></div>
              </div>
              <div className="notice-detail-text">
                시스템 안정화를 위해 정기 점검이 진행됩니다.
                점검 시간 동안 물품관리시스템 이용이 일시적으로 제한될 수 있으니 양해
                부탁드립니다.

                점검 일시: 2026년 1월 10일(금) 02:00 ~ 05:00
                점검 내용: 시스템 안정화 및 성능 개선
              </div>
            </>
          ) : (
            <p className="notice-empty">표시할 공지사항이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default NoticeField
