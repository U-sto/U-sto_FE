import { useState } from 'react'
import AiForecastPageLayout from '../../components/layout/management/AiForecastPageLayout/AiForecastPageLayout'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import Dropdown from '../../components/common/Dropdown/Dropdown'
import DataTable, {
  type DataTableColumn,
} from '../../features/management/components/DataTable/DataTable'
import DemandTimeSeriesChart from '../../components/charts/DemandTimeSeriesChart/DemandTimeSeriesChart'
import PortfolioMatrixChart from '../../components/charts/PortfolioMatrixChart/PortfolioMatrixChart'
import {
  fetchAiForecast,
  buildForecastConditions,
  type AiForecastResponse,
  type ProcurementRecommendationRow,
} from '../../api/aiForecast'
import { OPERATING_DEPARTMENT_SELECT_OPTIONS } from '../../constants/departments'
import './AiForecastPage.css'

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027']
const SEMESTER_OPTIONS = ['1학기', '2학기']
const OPERATING_DEPT_OPTIONS = OPERATING_DEPARTMENT_SELECT_OPTIONS
const RISK_OPTIONS = ['필수', '권장', '선택']

const DEFAULT_ANALYSIS_CONDITION = {
  year: '2026',
  semester: '1학기',
  campus: '한양대학교 ERICA캠퍼스',
  operatingDept: '선택',
  itemCategoryName: '',
  riskPropensity: '필수',
} as const

type TabId = 'query' | 'result'

const AiForecastPage = () => {
  const [query, setQuery] = useState('')
  const [analysisConditionOpen, setAnalysisConditionOpen] = useState(false)
  const [analysisCondition, setAnalysisCondition] = useState(DEFAULT_ANALYSIS_CONDITION)
  const [activeTab, setActiveTab] = useState<TabId>('query')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiForecastResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetCondition = () => {
    setAnalysisCondition({ ...DEFAULT_ANALYSIS_CONDITION })
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setError(null)
    setLoading(true)
    try {
      const conditions = buildForecastConditions(analysisCondition)
      const data = await fetchAiForecast(query.trim(), conditions)
      setResult(data)
      setActiveTab('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePdf = () => {
    // TODO: PDF 내보내기 연동
    window.alert('PDF 저장 기능은 준비 중입니다.')
  }

  const recommendationColumns: DataTableColumn<ProcurementRecommendationRow>[] = [
    { key: 'no', header: '순번', render: (row) => row.no },
    { key: 'itemName', header: '품목명', render: (row) => row.itemName },
    { key: 'quantity', header: '수량', render: (row) => row.quantity },
    { key: 'estimatedBudget', header: '추정예산', render: (row) => row.estimatedBudget },
    {
      key: 'recommendedOrderDeadline',
      header: '권장발주기한',
      render: (row) => row.recommendedOrderDeadline,
    },
    { key: 'aiComment', header: 'AI분석코멘트', render: (row) => row.aiComment },
  ]

  return (
    <AiForecastPageLayout depthLabel="사용주기 AI 예측">
      <div className="ai-forecast-tabs">
        <button
          type="button"
          className={`ai-forecast-tab ${activeTab === 'query' ? 'ai-forecast-tab--active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          사용주기 AI 예측
        </button>
        <button
          type="button"
          className={`ai-forecast-tab ${activeTab === 'result' ? 'ai-forecast-tab--active' : ''}`}
          onClick={() => setActiveTab('result')}
        >
          분석 결과
        </button>
      </div>

      {activeTab === 'query' && (
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
                <span className="ai-forecast-info-desc-line2">
                  학과별 장비 수명 예측 ･ 적정 재고량 계산 ･ 예산 계획을 도와드릴 수 있습니다.
                </span>
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
                  disabled={loading}
                >
                  {loading ? '분석 중...' : '검색'}
                </Button>
              </div>

              <div className="ai-forecast-analysis-condition">
                <button
                  type="button"
                  className="ai-forecast-analysis-condition-header"
                  onClick={() => setAnalysisConditionOpen((prev) => !prev)}
                  aria-expanded={analysisConditionOpen}
                >
                  <span className="ai-forecast-analysis-condition-title">분석조건</span>
                  <span
                    className={`ai-forecast-analysis-condition-caret ${analysisConditionOpen ? 'ai-forecast-analysis-condition-caret--open' : ''}`}
                    aria-hidden
                  >
                    {analysisConditionOpen ? '▲' : '▼'}
                  </span>
                </button>
                {analysisConditionOpen && (
                  <div className="ai-forecast-analysis-condition-body">
                    <div className="ai-forecast-analysis-condition-row">
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">년도</label>
                        <Dropdown
                          size="small"
                          placeholder="선택"
                          value={analysisCondition.year}
                          onChange={(value) =>
                            setAnalysisCondition((prev) => ({ ...prev, year: value }))
                          }
                          options={YEAR_OPTIONS}
                          ariaLabel="년도 선택"
                        />
                      </div>
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">학기</label>
                        <Dropdown
                          size="small"
                          placeholder="선택"
                          value={analysisCondition.semester}
                          onChange={(value) =>
                            setAnalysisCondition((prev) => ({ ...prev, semester: value }))
                          }
                          options={SEMESTER_OPTIONS}
                          ariaLabel="학기 선택"
                        />
                      </div>
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">캠퍼스</label>
                        <TextField
                          value={analysisCondition.campus}
                          readOnly
                          className="ai-forecast-analysis-condition-input ai-forecast-analysis-condition-input--readonly"
                        />
                      </div>
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">운용부서</label>
                        <Dropdown
                          size="small"
                          placeholder="선택"
                          value={analysisCondition.operatingDept}
                          onChange={(value) =>
                            setAnalysisCondition((prev) => ({ ...prev, operatingDept: value }))
                          }
                          options={OPERATING_DEPT_OPTIONS}
                          ariaLabel="운용부서 선택"
                        />
                      </div>
                    </div>
                    <div className="ai-forecast-analysis-condition-row">
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">물품분류명</label>
                        <TextField
                          value={analysisCondition.itemCategoryName}
                          onChange={(e) =>
                            setAnalysisCondition((prev) => ({
                              ...prev,
                              itemCategoryName: e.target.value,
                            }))
                          }
                          placeholder=""
                          className="ai-forecast-analysis-condition-input"
                        />
                      </div>
                      <div className="ai-forecast-analysis-condition-field">
                        <label className="ai-forecast-analysis-condition-label">리스크성향</label>
                        <Dropdown
                          size="small"
                          placeholder="선택"
                          value={analysisCondition.riskPropensity}
                          onChange={(value) =>
                            setAnalysisCondition((prev) => ({ ...prev, riskPropensity: value }))
                          }
                          options={RISK_OPTIONS}
                          ariaLabel="리스크성향 선택"
                        />
                      </div>
                      <div className="ai-forecast-analysis-condition-row-end">
                        <button
                          type="button"
                          className="ai-forecast-analysis-condition-reset"
                          onClick={handleResetCondition}
                        >
                          초기화
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {error && <p className="ai-forecast-error">{error}</p>}
          </section>
        </main>
      )}

      {activeTab === 'result' && (
        <main className="ai-forecast-result">
          {result ? (
            <>
              <div className="ai-forecast-result-header">
                <Button
                  type="button"
                  className="ai-forecast-pdf-btn"
                  onClick={handleSavePdf}
                >
                  PDF로 저장
                </Button>
              </div>
              <div className="ai-forecast-result-inner">
                <div className="ai-forecast-result-banner">
                <div className="ai-forecast-result-banner-text">
                  <p>입력하신 조건에 따라</p>
                  <p>다음과 같이 분석이 완료되었습니다.</p>
                </div>
              </div>

              <div className="ai-forecast-result-row1">
                <div className="ai-forecast-query-bubble">
                  <p>{result.summary.query}</p>
                </div>
                <div className="ai-forecast-params">
                  <div className="ai-forecast-param">
                    <span className="ai-forecast-param-label">Target :</span>
                    <span className="ai-forecast-param-value">{result.summary.target}</span>
                  </div>
                  <div className="ai-forecast-param">
                    <span className="ai-forecast-param-label">Risk :</span>
                    <span className="ai-forecast-param-value">{result.summary.risk}</span>
                  </div>
                  <div className="ai-forecast-param">
                    <span className="ai-forecast-param-label">Period :</span>
                    <span className="ai-forecast-param-value">{result.summary.period}</span>
                  </div>
                </div>
              </div>

              <div className="ai-forecast-charts">
                <div className="ai-forecast-chart-block">
                  <DemandTimeSeriesChart chart={result.demandTimeSeries} height={437} />
                </div>
                <div className="ai-forecast-chart-block">
                  <PortfolioMatrixChart chart={result.portfolioMatrix} height={437} />
                </div>
              </div>

              <div className="ai-forecast-table-section">
                <DataTable<ProcurementRecommendationRow>
                  pageKey="ai-forecast"
                  title={result.recommendationTitle}
                  data={result.recommendations}
                  columns={recommendationColumns}
                  getRowKey={(row) => row.no}
                  pageSize={10}
                  renderActions={() => null}
                />
              </div>
              </div>
            </>
          ) : (
            <div className="ai-forecast-result-empty">
              <p>질문을 입력한 뒤 검색하면 분석 결과가 여기에 표시됩니다.</p>
              <Button type="button" onClick={() => setActiveTab('query')}>
                질문하러 가기
              </Button>
            </div>
          )}
        </main>
      )}
    </AiForecastPageLayout>
  )
}

export default AiForecastPage
