import { useState } from 'react'
import AiForecastPageLayout from '../../components/layout/management/AiForecastPageLayout/AiForecastPageLayout'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import Dropdown from '../../components/common/Dropdown/Dropdown'
import './AiForecastPage.css'

const ANALYSIS_OPTIONS = ['분석조건 선택', '학과별', '장비별', '연도별']

const AiForecastPage = () => {
  const [query, setQuery] = useState('')
  const [analysisCondition, setAnalysisCondition] = useState(ANALYSIS_OPTIONS[0])

  const handleSearch = () => {
    // TODO: AI 예측 API 연동
  }

  return (
    <AiForecastPageLayout depthLabel="사용주기 AI 예측">
      <main className="ai-forecast-main">
        <section className="ai-forecast-content">
          <div className="ai-forecast-info">
            <div className="ai-forecast-info-icon" aria-hidden="true">
              <img src="/AIchartIcon.png" alt="" width={74} height={60} />
            </div>
            <h1 className="ai-forecast-info-heading">안녕하세요!</h1>
            <p className="ai-forecast-info-desc">
              저는 대학 기자재 수요예측 및 조달 최적화 AI입니다.
              <br />
              <span className="ai-forecast-info-desc-line2">학과별 장비 수명 예측 ･ 적정 재고량 계산 ･ 예산 계획을 도와드릴 수 있습니다.</span>
            </p>
          </div>

          <div className="ai-forecast-search-field">
            <div className="ai-forecast-search-row">
              <TextField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이번 학기 컴퓨터공학과 실습실 장비 얼마나 교체해야 해? 수업에 지장 없게 넉넉하게 잡아줘"
                className="ai-forecast-search-input"
              />
              <Button
                type="button"
                className="ai-forecast-search-btn"
                onClick={handleSearch}
              >
                검색
              </Button>
            </div>
            <div className="ai-forecast-search-filter">
              <Dropdown
                size="small"
                placeholder="분석조건"
                value={analysisCondition}
                onChange={(value: string) => setAnalysisCondition(value)}
                options={ANALYSIS_OPTIONS}
                ariaLabel="분석조건 선택"
              />
            </div>
          </div>
        </section>
      </main>
    </AiForecastPageLayout>
  )
}

export default AiForecastPage
