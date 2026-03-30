import http from './http'
import type { ApiResponse } from './types'

/** POST /api/ai/forecast 요청 body */
export interface AiForecastRequestConditions {
  year: number
  semester: number
  org_cd: string
  dept_cd: string
  category: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface AiForecastRequest {
  prompt: string
  conditions: AiForecastRequestConditions
}

/** POST /api/ai/forecast 200 응답 data 구조 (백엔드 스펙) */
export interface AiForecastApiSummary {
  target_text: string
  risk_text: string
  period_text: string
}

export interface AiForecastApiChartForecastItem {
  label: string
  demand: number
  threshold: number
}

export interface AiForecastApiChartPortfolioItem {
  item_name: string
  x_rul: number
  y_importance: number
  group: string
}

export interface AiForecastApiRecommendationItem {
  item_name: string
  quantity: number
  budget: number
  order_date: string
  comment: string
}

export interface AiForecastApiData {
  summary: AiForecastApiSummary
  chart_forecast: AiForecastApiChartForecastItem[]
  chart_portfolio: AiForecastApiChartPortfolioItem[]
  recommendations: AiForecastApiRecommendationItem[]
}

/**
 * AI 비서 응답 JSON 타입 (페이지/차트용).
 * API 응답을 이 구조로 변환해 사용합니다.
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

function formatBudget(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

/** API 응답 data + 사용자 질문을 페이지/차트용 AiForecastResponse로 변환 */
function mapApiDataToResponse(
  prompt: string,
  data: AiForecastApiData,
): AiForecastResponse {
  const summary = data.summary
  const forecast = data.chart_forecast ?? []
  const portfolio = data.chart_portfolio ?? []
  const recs = data.recommendations ?? []

  const demandTimeSeriesData = forecast.map((d, i) => ({
    period: i + 1,
    quantity: d.demand,
  }))
  const reorderIndex = forecast.findIndex((d) => d.threshold != null && d.demand >= d.threshold)
  const reorderPointPeriod =
    reorderIndex >= 0 ? reorderIndex + 1 : (forecast.length >= 1 ? forecast.length : undefined)

  return {
    summary: {
      query: prompt,
      target: summary?.target_text ?? '',
      risk: summary?.risk_text ?? '',
      period: summary?.period_text ?? '',
    },
    demandTimeSeries: {
      data: demandTimeSeriesData,
      reorderPointPeriod,
    },
    portfolioMatrix: {
      data: portfolio.map((p) => ({
        rul: p.x_rul,
        importance: p.y_importance,
        category: p.group || undefined,
      })),
    },
    recommendationTitle: `${summary?.period_text ?? ''} 조달권고안`,
    recommendations: recs.map((r, i) => ({
      no: i + 1,
      itemName: r.item_name,
      quantity: r.quantity,
      estimatedBudget: formatBudget(r.budget),
      recommendedOrderDeadline: r.order_date,
      aiComment: r.comment,
    })),
  }
}

/** UI 분석조건 (페이지에서 사용) -> API conditions 변환용 */
export interface AiForecastUiCondition {
  year: string
  semester: string
  campus: string
  operatingDept: string
  itemCategoryName: string
  riskPropensity: string
}

export interface BuildForecastConditionOptions {
  campusOrgCd?: string
  deptLabelToCd?: Record<string, string>
}

type ForecastRiskLevel = AiForecastRequestConditions['risk_level']

const ORG_CD_BY_CAMPUS: Record<string, string> = {
  '한양대학교 ERICA캠퍼스': '7008277',
  '한양대학교 서울캠퍼스': '7002282',
}

function normalizeDeptName(label: string): string {
  // 중복 부서명 구분용으로 붙인 " (DEPT_CD)" suffix는 API 요청에서 제거
  return label.replace(/\s\([A-Za-z0-9_-]+\)$/, '').trim()
}

export function buildForecastConditions(
  ui: AiForecastUiCondition,
  options?: BuildForecastConditionOptions,
): AiForecastRequestConditions {
  const year = parseInt(ui.year, 10) || new Date().getFullYear()
  const semesterByLabel: Record<string, number> = {
    '1학기': 1,
    여름학기: 2,
    '2학기': 3,
    겨울학기: 4,
  }
  const semester = semesterByLabel[ui.semester] ?? 1
  const departmentLabel = ui.operatingDept === '선택' ? '' : normalizeDeptName(ui.operatingDept)
  const deptCd = departmentLabel ? options?.deptLabelToCd?.[departmentLabel] ?? '' : ''
  const orgCd = options?.campusOrgCd?.trim() || ORG_CD_BY_CAMPUS[ui.campus] || '7008277'
  const category = ui.itemCategoryName?.trim() || ''
  const riskLevelByPropensity: Record<string, ForecastRiskLevel> = {
    필수: 'HIGH',
    권장: 'MEDIUM',
    선택: 'LOW',
  }
  const riskLevel = (riskLevelByPropensity[ui.riskPropensity] ?? 'HIGH').toUpperCase() as ForecastRiskLevel
  return {
    year,
    semester,
    org_cd: orgCd,
    dept_cd: deptCd,
    category,
    risk_level: riskLevel,
  }
}

/**
 * 통계 예측 분석 API
 * POST /api/ai/forecast
 * 질문(prompt)과 조건(conditions)으로 수요 예측·조달 권고안을 받아, 차트/테이블용 형식으로 반환합니다.
 */
export async function fetchAiForecast(
  prompt: string,
  conditions: AiForecastRequestConditions,
): Promise<AiForecastResponse> {
  const payload: AiForecastRequest = {
    prompt: prompt.trim(),
    conditions,
  }
  const res = await http.post<ApiResponse<AiForecastApiData>>(
    '/api/ai/forecast',
    payload,
  )
  const body = res.data
  if (!body?.data) {
    throw new Error(body?.message ?? '분석 결과를 불러오지 못했습니다.')
  }
  return mapApiDataToResponse(prompt.trim(), body.data)
}

/** 이전 AI 예측 기록 요약 한 건 */
export interface AiForecastHistoryItem {
  /** 서버에서 발급한 기록 ID (forecastId) */
  id: string
  /** 목록에 표시할 제목 (일반적으로 사용자가 입력한 질문) */
  title: string
  /** 생성 일시 (선택) */
  createdAt?: string
}

type AiForecastHistoryListApiItem =
  | string
  | {
      id?: string
      forecastId?: string
      title?: string
      prompt?: string
      createdAt?: string
    }

type AiForecastHistoryListApiData = AiForecastHistoryListApiItem[]

/** GET /api/ai/forecast - 이전 기록 목록 조회 */
export async function fetchAiForecastHistory(): Promise<AiForecastHistoryItem[]> {
  const res = await http.get<ApiResponse<AiForecastHistoryListApiData>>('/api/ai/forecast')
  const body = res.data
  if (!body?.data) {
    throw new Error(body?.message ?? '이전 예측 이력을 불러오지 못했습니다.')
  }

  return body.data.map((raw, index) => {
    if (typeof raw === 'string') {
      return {
        id: raw,
        title: `예측 ${index + 1}`,
      }
    }
    const id = raw.id ?? raw.forecastId
    const title = raw.title ?? raw.prompt ?? `예측 ${index + 1}`
    return {
      id: id ?? String(index),
      title,
      createdAt: raw.createdAt,
    }
  })
}

/**
 * GET /api/ai/forecast/contents - 특정 예측 기록 상세 조회
 * @param forecastId 기록 ID
 * @param displayTitle 요약 탭에 표시할 질문/제목 (없으면 target_text를 사용)
 */
export async function fetchAiForecastHistoryDetail(
  forecastId: string,
  displayTitle?: string,
): Promise<AiForecastResponse> {
  const res = await http.get<ApiResponse<AiForecastApiData>>(
    '/api/ai/forecast/contents',
    { params: { forecastId } },
  )
  const body = res.data
  if (!body?.data) {
    throw new Error(body?.message ?? '이전 예측 내용을 불러오지 못했습니다.')
  }
  const apiData = body.data
  const promptForDisplay = displayTitle || apiData.summary?.target_text || '이전 예측'
  return mapApiDataToResponse(promptForDisplay, apiData)
}
