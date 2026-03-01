/**
 * AI 비서 응답 JSON 타입.
 * AI 팀에서 이 구조로 JSON을 내려주면 차트/테이블에 반영합니다.
 */
export interface AiForecastSummary {
  /** 사용자 질문 텍스트 */
  query: string
  /** 분석 대상 (예: 컴퓨터공학과) */
  target: string
  /** 리스크 수준 (예: Low (95% Service Level)) */
  risk: string
  /** 분석 기간 (예: 2026-1학기) */
  period: string
}

/** 수요 예측 시계열 - 기간별 수량 + 발주 시점(ROP) */
export interface DemandTimeSeriesPoint {
  period: number
  /** 월별 수량 예측 (PCP) */
  quantity: number
}

export interface DemandTimeSeriesChart {
  data: DemandTimeSeriesPoint[]
  /** 발주 시점이 되는 기간 (1~12 등) */
  reorderPointPeriod?: number
}

/** 자산 포트폴리오 매트릭스 - 한 점 */
export interface PortfolioPoint {
  /** 잔여 수명 (RUL) */
  rul: number
  /** 장비 중요도 */
  importance: number
  /** 구분 (스캐터 색상 등에 사용 가능) */
  category?: string
}

export interface PortfolioMatrixChart {
  data: PortfolioPoint[]
}

/** 조달 권고안 한 행 */
export interface ProcurementRecommendationRow {
  no: number
  itemName: string
  quantity: number
  estimatedBudget: string
  recommendedOrderDeadline: string
  aiComment: string
}

export interface AiForecastResponse {
  summary: AiForecastSummary
  demandTimeSeries: DemandTimeSeriesChart
  portfolioMatrix: PortfolioMatrixChart
  /** 조달 권고안 테이블 제목 (예: 2026학년도 1학기 조달권고안) */
  recommendationTitle: string
  recommendations: ProcurementRecommendationRow[]
}

const MOCK_RESPONSE: AiForecastResponse = {
  summary: {
    query:
      '이번 학기 컴퓨터공학과 실습실 장비 얼마나 교체해야 해? 수업에 지장 없게 넉넉하게 잡아줘',
    target: '컴퓨터공학과',
    risk: 'Low (95% Service Level)',
    period: '2026-1학기',
  },
  demandTimeSeries: {
    data: [
      { period: 1, quantity: 10 },
      { period: 2, quantity: 15 },
      { period: 3, quantity: 20 },
      { period: 4, quantity: 25 },
      { period: 5, quantity: 30 },
      { period: 6, quantity: 38 },
      { period: 7, quantity: 45 },
      { period: 8, quantity: 52 },
      { period: 9, quantity: 60 },
      { period: 10, quantity: 72 },
      { period: 11, quantity: 85 },
      { period: 12, quantity: 95 },
    ],
    reorderPointPeriod: 10,
  },
  portfolioMatrix: {
    data: [
      { rul: 12, importance: 90, category: 'high' },
      { rul: 8, importance: 85, category: 'high' },
      { rul: 6, importance: 70, category: 'medium' },
      { rul: 4, importance: 65, category: 'medium' },
      { rul: 2, importance: 95, category: 'high' },
      { rul: 10, importance: 45, category: 'low' },
      { rul: 7, importance: 55, category: 'low' },
      { rul: 3, importance: 80, category: 'high' },
      { rul: 5, importance: 50, category: 'medium' },
      { rul: 9, importance: 40, category: 'low' },
    ],
  },
  recommendationTitle: '2026학년도 1학기 조달권고안',
  recommendations: [
    {
      no: 1,
      itemName: '데스크탑 PC',
      quantity: 15,
      estimatedBudget: '22,500,000원',
      recommendedOrderDeadline: '2025-12-15',
      aiComment: '실습실 A동 교체 우선 권장',
    },
    {
      no: 2,
      itemName: '모니터 27인치',
      quantity: 20,
      estimatedBudget: '8,000,000원',
      recommendedOrderDeadline: '2026-01-10',
      aiComment: '재고 소진 시점 고려 발주',
    },
    {
      no: 3,
      itemName: '키보드/마우스 세트',
      quantity: 30,
      estimatedBudget: '1,500,000원',
      recommendedOrderDeadline: '2026-01-20',
      aiComment: '일괄 발주 시 단가 절감 가능',
    },
  ],
}

/**
 * AI 비서 API 호출.
 * 실제 연동 시엔 백엔드/AI 팀 엔드포인트로 교체하고, 응답을 AiForecastResponse로 파싱하면 됩니다.
 */
export async function fetchAiForecast(
  _query: string,
  _analysisCondition?: string,
): Promise<AiForecastResponse> {
  // TODO: 실제 AI 비서 API URL로 교체
  // const res = await fetch('/api/ai-forecast', { method: 'POST', body: JSON.stringify({ query, analysisCondition }) })
  // const json = await res.json(); return json as AiForecastResponse
  await new Promise((r) => setTimeout(r, 800))
  return MOCK_RESPONSE
}
