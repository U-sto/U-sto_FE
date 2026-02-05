import { useState } from 'react'
import './NoticeField.css'

interface Notice {
  id: number
  title: string
  date: string
}

const NoticeField = () => {
  const [selectedNotice, setSelectedNotice] = useState<number>(1)

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

  const selectedNoticeData = notices.find(n => n.id === selectedNotice) || notices[0]

  return (
    <div className="notice-field">
      <div className="notice-field-content">
        <div className="notice-list-section">
          <h3 className="notice-list-title">공지사항</h3>
          <div className="notice-list-divider"></div>
          <div className="notice-list">
            {notices.map((notice) => (
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
            <button className="notice-pagination-arrow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="notice-pagination-number active">1</span>
            <span className="notice-pagination-number">2</span>
            <span className="notice-pagination-number">3</span>
            <span className="notice-pagination-number">4</span>
            <span className="notice-pagination-number">5</span>
            <button className="notice-pagination-arrow">
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
            시스템 안정화를 위해 정기 점검이 진행됩니다.
            점검 시간 동안 물품관리시스템 이용이 일시적으로 제한될 수 있으니 양해 부탁드립니다.

            점검 일시: 2026년 1월 10일(금) 02:00 ~ 05:00
            점검 내용: 시스템 안정화 및 성능 개선
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoticeField
