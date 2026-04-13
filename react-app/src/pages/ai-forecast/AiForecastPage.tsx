import { useEffect, useMemo, useRef, useState } from 'react'
import SparkleIcon from '../../components/common/SparkleIcon/SparkleIcon'
import AiForecastPageLayout from '../../components/layout/management/AiForecastPageLayout/AiForecastPageLayout'
import TextField from '../../components/common/TextField/TextField'
import Button from '../../components/common/Button/Button'
import Dropdown from '../../components/common/Dropdown/Dropdown'
import DataTable, {
  type DataTableColumn,
} from '../../features/management/components/DataTable/DataTable'
import DemandTimeSeriesChart from '../../components/charts/DemandTimeSeriesChart/DemandTimeSeriesChart'
import {
  fetchAiForecast,
  buildForecastConditions,
  fetchAiForecastHistory,
  fetchAiForecastHistoryDetail,
  deleteAiForecastRecord,
  type AiForecastResponse,
  type AiForecastDisplaySummary,
  type ProcurementRecommendationRow,
  type AiForecastHistoryItem,
} from '../../api/aiForecast'
import {
  fetchOperatingDepartments,
  buildOperatingDepartmentSelect,
} from '../../api/organization'
import G2BClassificationSearchModal from '../../features/asset-management/components/G2BClassificationSearchModal/G2BClassificationSearchModal'
import RiskPropensityHelpTooltip from './RiskPropensityHelpTooltip'
import './AiForecastPage.css'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L16.65 16.65"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const YEAR_OPTIONS = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => String(2024 + i))
const SEMESTER_OPTIONS = ['1학기', '여름학기', '2학기', '겨울학기']
const RISK_OPTIONS = ['리스크 선호', '리스크 중립', '리스크 회피']

const CAMPUS_FIXED = '한양대학교 ERICA캠퍼스'

type AnalysisCondition = {
  year: string
  semester: string
  campus: string
  operatingDept: string
  itemCategoryName: string
  riskPropensity: string
}

const DEFAULT_ANALYSIS_CONDITION: AnalysisCondition = {
  year: '2026',
  semester: '1학기',
  campus: CAMPUS_FIXED,
  operatingDept: '선택',
  itemCategoryName: '',
  riskPropensity: '리스크 선호',
}

/** 분석조건 → 검색창 자동 문장 생성 */
function buildAutoPrompt(condition: {
  year: string
  semester: string
  operatingDept: string
  itemCategoryName: string
  riskPropensity: string
}): string {
  const dept = condition.operatingDept === '선택' ? '' : condition.operatingDept
  const category = condition.itemCategoryName.trim()
  const categoryPart = category ? `${category} ` : '전체 '
  const riskTextMap: Record<string, string> = {
    '리스크 선호': '타이트하게(재고 최소화)',
    '리스크 중립': '적정하게',
    '리스크 회피': '넉넉하게(결품 방지)',
    필수: '타이트하게(재고 최소화)',
    권장: '적정하게',
    선택: '넉넉하게(결품 방지)',
  }
  const riskText = riskTextMap[condition.riskPropensity] ?? '적정하게'
  const deptPart = dept ? `${dept}의 ` : ''
  return `${condition.year}년 ${condition.semester} ${deptPart}${categoryPart}교체 수요 분석해 줘. 수업에 지장 없게 ${riskText} 잡아줘.`
}

type TabId = 'query' | 'result' | 'history'

const HISTORY_PAGE_SIZE = 10

function parseHistorySortTime(createdAt?: string): number {
  if (!createdAt?.trim()) return NaN
  const t = Date.parse(createdAt)
  return Number.isNaN(t) ? NaN : t
}

const AiForecastPage = () => {
  const [query, setQuery] = useState('')
  const lastAutoQueryRef = useRef('')
  const [analysisConditionOpen, setAnalysisConditionOpen] = useState(true)
  const [analysisCondition, setAnalysisCondition] = useState(DEFAULT_ANALYSIS_CONDITION)
  const [activeTab, setActiveTab] = useState<TabId>('query')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiForecastResponse | null>(null)
  const [algorithmGuideOpen, setAlgorithmGuideOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<AiForecastHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyPageIndex, setHistoryPageIndex] = useState(0)
  /** 이전 예측 이력 탭 — 제목 검색 */
  const [historyTitleSearch, setHistoryTitleSearch] = useState('')
  const [historySelectedIds, setHistorySelectedIds] = useState<Set<string>>(() => new Set())
  const [historyDeleting, setHistoryDeleting] = useState(false)
  const [operatingDeptOptions, setOperatingDeptOptions] = useState<string[]>(['선택'])
  const [deptLabelToCd, setDeptLabelToCd] = useState<Record<string, string>>({})
  const [orgCdForForecast, setOrgCdForForecast] = useState('7008277')
  const [isG2BClassificationModalOpen, setIsG2BClassificationModalOpen] = useState(false)

  const getFirstSelectableDept = (options: string[]) => options.find((opt) => opt !== '선택') ?? '선택'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchOperatingDepartments()
        if (cancelled) return
        const { options, labelToDeptCd } = buildOperatingDepartmentSelect(rows)
        setOperatingDeptOptions(options)
        setDeptLabelToCd(labelToDeptCd)
        const firstDept = getFirstSelectableDept(options)
        setAnalysisCondition((prev) =>
          prev.operatingDept === '선택' && firstDept !== '선택'
            ? { ...prev, operatingDept: firstDept }
            : prev,
        )
        const orgCd = rows.find((r) => typeof r.orgCd === 'string' && r.orgCd.trim())?.orgCd
        if (orgCd) setOrgCdForForecast(orgCd)
      } catch {
        if (cancelled) return
        setOperatingDeptOptions(['선택'])
        setDeptLabelToCd({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** 분석조건이 바뀔 때마다 검색창 자동 완성 — 항상 덮어씀 (스펙 기준) */
  useEffect(() => {
    const generated = buildAutoPrompt(analysisCondition)
    lastAutoQueryRef.current = generated
    setQuery(generated)
  }, [analysisCondition])

  // 히스토리 탭이 처음 켜질 때 서버에서 기록 목록을 불러온다.
  useEffect(() => {
    if (activeTab !== 'history' || historyLoaded || historyLoading) return
    ;(async () => {
      setHistoryError(null)
      setHistoryLoading(true)
      try {
        const list = await fetchAiForecastHistory()
        setHistory(list)
      } catch (e) {
        setHistoryError(
          e instanceof Error ? e.message : '이전 예측 이력을 불러오지 못했습니다.',
        )
      } finally {
        setHistoryLoading(false)
        setHistoryLoaded(true)
      }
    })()
  }, [activeTab, historyLoaded, historyLoading])

  /** 최신순(생성일 내림차순). 날짜 없는 항목은 뒤로 */
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const ta = parseHistorySortTime(a.createdAt)
      const tb = parseHistorySortTime(b.createdAt)
      if (!Number.isNaN(ta) && !Number.isNaN(tb)) return tb - ta
      if (!Number.isNaN(ta)) return -1
      if (!Number.isNaN(tb)) return 1
      return 0
    })
  }, [history])

  const filteredHistory = useMemo(() => {
    const q = historyTitleSearch.trim().toLowerCase()
    if (!q) return sortedHistory
    return sortedHistory.filter((item) =>
      String(item.title ?? '')
        .toLowerCase()
        .includes(q),
    )
  }, [sortedHistory, historyTitleSearch])

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE))

  const paginatedHistory = useMemo(() => {
    const start = historyPageIndex * HISTORY_PAGE_SIZE
    return filteredHistory.slice(start, start + HISTORY_PAGE_SIZE)
  }, [filteredHistory, historyPageIndex])

  useEffect(() => {
    setHistoryPageIndex(0)
  }, [historyTitleSearch])

  useEffect(() => {
    setHistoryPageIndex((p) => Math.min(p, Math.max(0, historyTotalPages - 1)))
  }, [historyTotalPages])

  useEffect(() => {
    if (activeTab !== 'history') setHistorySelectedIds(new Set())
  }, [activeTab])

  const toggleHistorySelect = (id: string) => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelectedHistory = async () => {
    if (historySelectedIds.size === 0) return
    if (!window.confirm(`선택한 ${historySelectedIds.size}건을 삭제할까요?`)) return
    setHistoryDeleting(true)
    const ids = [...historySelectedIds]
    const succeeded: string[] = []
    let lastError: Error | null = null
    try {
      for (const id of ids) {
        try {
          await deleteAiForecastRecord(id)
          succeeded.push(id)
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e))
        }
      }
      setHistory((prev) => prev.filter((h) => !succeeded.includes(h.id)))
      setHistorySelectedIds((prev) => {
        const next = new Set(prev)
        succeeded.forEach((id) => next.delete(id))
        return next
      })
      if (succeeded.length < ids.length) {
        window.alert(
          lastError
            ? `일부만 삭제되었습니다. (${succeeded.length}/${ids.length})\n${lastError.message}`
            : `일부만 삭제되었습니다. (${succeeded.length}/${ids.length})`,
        )
      }
    } finally {
      setHistoryDeleting(false)
    }
  }

  const handleResetCondition = () => {
    const firstDept = getFirstSelectableDept(operatingDeptOptions)
    const next = { ...DEFAULT_ANALYSIS_CONDITION, operatingDept: firstDept }
    setAnalysisCondition(next)
    /** 초기화 시 검색창도 새 조건 기준으로 갱신 */
    const generated = buildAutoPrompt(next)
    lastAutoQueryRef.current = generated
    setQuery(generated)
  }

  const handleSearch = async () => {
    /** 물품분류명 비어 있으면 API에서 전체 검색. 나머지 조건 + 검색어 필수 */
    const isConditionMissing =
      !analysisCondition.year ||
      !analysisCondition.semester ||
      !analysisCondition.campus ||
      !analysisCondition.operatingDept ||
      analysisCondition.operatingDept === '선택' ||
      !analysisCondition.riskPropensity
    if (isConditionMissing || !query.trim()) {
      window.alert('모든 조건을 입력해 주세요.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const conditions = buildForecastConditions(analysisCondition, {
        campusOrgCd: orgCdForForecast,
        deptLabelToCd,
      })
      if (!conditions.dept_cd?.trim()) {
        window.alert('모든 조건을 입력해 주세요.')
        return
      }
      const riskDisplayMap: Record<string, string> = {
        '리스크 선호': 'High',
        '리스크 중립': 'Medium',
        '리스크 회피': 'Low (95% Service Level)',
        필수: 'High',
        권장: 'Medium',
        선택: 'Low (95% Service Level)',
      }
      const displaySummary: AiForecastDisplaySummary = {
        target: analysisCondition.operatingDept === '선택' ? '' : analysisCondition.operatingDept,
        risk: riskDisplayMap[analysisCondition.riskPropensity] ?? analysisCondition.riskPropensity,
        period: `${analysisCondition.year} - ${analysisCondition.semester}`,
      }
      const data = await fetchAiForecast(query.trim(), conditions, displaySummary)
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
        <button
          type="button"
          className={`ai-forecast-tab ${activeTab === 'history' ? 'ai-forecast-tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          이전 예측 이력
        </button>
      </div>

      {activeTab === 'history' && historyLoading && (
        <main className="ai-forecast-history ai-forecast-history--no-data">
          <p className="ai-forecast-history-empty">이전 예측 이력을 불러오는 중입니다...</p>
        </main>
      )}

      {activeTab === 'history' && !historyLoading && historyError && (
        <main className="ai-forecast-history ai-forecast-history--no-data">
          <p className="ai-forecast-history-empty">{historyError}</p>
        </main>
      )}

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
                          options={operatingDeptOptions}
                          ariaLabel="운용부서 선택"
                        />
                      </div>
                    </div>
                    <div className="ai-forecast-analysis-condition-row">
                      <div className="ai-forecast-analysis-condition-field ai-forecast-analysis-condition-field--g2b-class">
                        <label className="ai-forecast-analysis-condition-label" htmlFor="ai-forecast-item-category-name">
                          물품분류명
                        </label>
                        <div className="ai-forecast-g2b-class-input-wrap">
                          <TextField
                            id="ai-forecast-item-category-name"
                            value={analysisCondition.itemCategoryName}
                            onChange={(e) =>
                              setAnalysisCondition((prev) => ({
                                ...prev,
                                itemCategoryName: e.target.value,
                              }))
                            }
                            placeholder=""
                            className="ai-forecast-analysis-condition-input ai-forecast-g2b-class-input"
                          />
                          <button
                            type="button"
                            className="ai-forecast-g2b-class-search-btn"
                            aria-label="물품분류명 검색"
                            onClick={() => setIsG2BClassificationModalOpen(true)}
                          >
                            <SearchIcon />
                          </button>
                        </div>
                      </div>
                      <div className="ai-forecast-analysis-condition-field ai-forecast-risk-field">
                        <label className="ai-forecast-analysis-condition-label">리스크성향</label>
                        <div className="ai-forecast-risk-dropdown-row">
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
                          <RiskPropensityHelpTooltip />
                        </div>
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
                {result.algorithmGuide.length > 0 && (
                  <button
                    type="button"
                    className="ai-forecast-algo-btn"
                    onClick={() => setAlgorithmGuideOpen(true)}
                  >
                    <span className="ai-forecast-algo-btn-icon">?</span>
                    알고리즘 안내
                  </button>
                )}
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
                      <SparkleIcon size={40} color="var(--usto-primary-300)" className="ai-forecast-banner-sparkle" />
                      <div>
                        <p>입력하신 조건에 따라</p>
                        <p>다음과 같이 분석이 완료되었습니다.</p>
                      </div>
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

                <div className="ai-forecast-guide-and-chart">
                  {/* 좌측: AI 전략적 조달 가이드 */}
                  <div className="ai-forecast-guide-wrapper">
                    <p className="ai-forecast-guide-panel-label">AI 전략적 조달 가이드</p>
                  <div className="ai-forecast-guide-panel">
                    {result.guide?.highlight && (
                      <div className="ai-forecast-guide-highlight">
                        {result.guide.highlight}
                      </div>
                    )}
                    {result.guide?.sections && result.guide.sections.length > 0 ? (
                      result.guide.sections.map((section, idx) => (
                        <div key={idx} className="ai-forecast-guide-section">
                          <p className="ai-forecast-guide-section-title">{section.title}</p>
                          <p className="ai-forecast-guide-section-text">{section.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="ai-forecast-guide-empty">
                        <p>분석 결과 가이드가 없습니다.</p>
                      </div>
                    )}
                  </div>
                  </div>
                  {/* 우측: 수요 예측 시계열 */}
                  <div className="ai-forecast-chart-wrapper">
                    <p className="ai-forecast-guide-panel-label">수요 예측 시계열</p>
                    <div className="ai-forecast-chart-block">
                      <DemandTimeSeriesChart chart={result.demandTimeSeries} height={437} hideLabel />
                    </div>
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
            {/* 알고리즘 가이드 팝업 */}
          {algorithmGuideOpen && (
            <div
              className="ai-forecast-algo-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="알고리즘 안내"
              onClick={() => setAlgorithmGuideOpen(false)}
            >
              <div
                className="ai-forecast-algo-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="ai-forecast-algo-modal-header">
                  <h2 className="ai-forecast-algo-modal-title">알고리즘 안내</h2>
                  <button
                    type="button"
                    className="ai-forecast-algo-modal-close"
                    onClick={() => setAlgorithmGuideOpen(false)}
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>
                <div className="ai-forecast-algo-modal-body">
                  {result.algorithmGuide.map((item, idx) => (
                    <div key={idx} className="ai-forecast-algo-item">
                      <p className="ai-forecast-algo-item-label">{item.label}</p>
                      <p className="ai-forecast-algo-item-desc">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      {activeTab === 'history' && !historyLoading && !historyError && (
        <main
          className={
            sortedHistory.length === 0
              ? 'ai-forecast-history ai-forecast-history--no-data'
              : 'ai-forecast-history'
          }
        >
          {sortedHistory.length === 0 ? (
            <p className="ai-forecast-history-empty">아직 저장된 예측 이력이 없습니다.</p>
          ) : (
            <div className="ai-forecast-history-inner">
              <div className="ai-forecast-history-search" role="search">
                <div className="ai-forecast-history-search-header">
                  <span className="ai-forecast-history-search-heading" id="ai-forecast-history-search-title">
                    제목 검색
                  </span>
                  <button
                    type="button"
                    className="ai-forecast-history-delete-btn"
                    disabled={historyDeleting || historySelectedIds.size === 0}
                    onClick={() => void handleDeleteSelectedHistory()}
                  >
                    {historyDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
                <label className="ai-forecast-history-search-label" htmlFor="ai-forecast-history-search-input">
                  <span className="visually-hidden">검색어</span>
                  <TextField
                    id="ai-forecast-history-search-input"
                    value={historyTitleSearch}
                    onChange={(e) => setHistoryTitleSearch(e.target.value)}
                    placeholder="제목에 포함된 글자로 찾기"
                    className="ai-forecast-history-search-input"
                    autoComplete="off"
                  />
                </label>
              </div>
              {filteredHistory.length === 0 ? (
                <p className="ai-forecast-history-empty ai-forecast-history-empty--inline">
                  검색 조건에 맞는 예측이 없습니다.
                </p>
              ) : (
                <>
              <div
                className={
                  filteredHistory.length > HISTORY_PAGE_SIZE
                    ? 'ai-forecast-history-list-wrap ai-forecast-history-list-wrap--with-pager'
                    : 'ai-forecast-history-list-wrap'
                }
              >
              <ul className="ai-forecast-history-list">
                {paginatedHistory.map((item) => (
                  <li key={item.id} className="ai-forecast-history-item">
                    <div className="ai-forecast-history-row">
                      <input
                        type="checkbox"
                        className="ai-forecast-history-checkbox"
                        checked={historySelectedIds.has(item.id)}
                        onChange={() => toggleHistorySelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${item.title} 선택`}
                      />
                      <button
                        type="button"
                        className="ai-forecast-history-button"
                        onClick={async () => {
                          try {
                            const detail = await fetchAiForecastHistoryDetail(item.id, item.title)
                            setResult(detail)
                            setActiveTab('result')
                          } catch (e) {
                            window.alert(
                              e instanceof Error
                                ? e.message
                                : '이전 예측 내용을 불러오지 못했습니다.',
                            )
                          }
                        }}
                      >
                        <div className="ai-forecast-history-title">{item.title}</div>
                        {item.createdAt && (
                          <div className="ai-forecast-history-meta">{item.createdAt}</div>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              </div>
              {filteredHistory.length > HISTORY_PAGE_SIZE && (
                <div className="ai-forecast-history-pager" role="navigation" aria-label="예측 이력 페이지">
                  <button
                    type="button"
                    className="ai-forecast-history-pager-btn"
                    disabled={historyPageIndex <= 0}
                    onClick={() => setHistoryPageIndex((p) => Math.max(0, p - 1))}
                  >
                    이전
                  </button>
                  <span className="ai-forecast-history-pager-info">
                    {historyPageIndex + 1} / {historyTotalPages}
                  </span>
                  <button
                    type="button"
                    className="ai-forecast-history-pager-btn"
                    disabled={historyPageIndex >= historyTotalPages - 1}
                    onClick={() =>
                      setHistoryPageIndex((p) => Math.min(historyTotalPages - 1, p + 1))
                    }
                  >
                    다음
                  </button>
                </div>
              )}
                </>
              )}
            </div>
          )}
        </main>
      )}
      <G2BClassificationSearchModal
        isOpen={isG2BClassificationModalOpen}
        onClose={() => setIsG2BClassificationModalOpen(false)}
        onSelect={(pick) => {
          setAnalysisCondition((prev) => ({ ...prev, itemCategoryName: pick.name }))
        }}
      />
    </AiForecastPageLayout>
  )
}

export default AiForecastPage
