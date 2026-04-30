import http from './http'
import type { ApiResponse } from './types'

/** POST /api/ai/forecast 요청 body */
export interface AiForecastRequestConditions {
  year: number
  semester: number
  org_cd: string
  dept_cd: string
  /**
   * 물품분류(명). UI에서 비어 있으면 `전체`로 전송(전 구간 검색).
   */
  category?: string
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface AiForecastRequest {
  prompt: string
  conditions: AiForecastRequestConditions
}

/** POST /api/ai/forecast 200 응답 data 구조 (백엔드 스펙) */

/** section_1: 수요 예측 시계열 */
export interface AiForecastApiTimeSeriesItem {
  month: number
  quantity: number
  is_rop: boolean
  /** ROP 월 등에서만 추가로 내려올 수 있음 */
  base_qty?: number
  rop_date?: string
  safety_stock?: number
  total_order_qty?: number
}

/** section_2: AI 전략적 조달 가이드 */
export interface AiForecastApiStrategicGuide {
  ai_summary_comment?: string
  smart_forecasting?: string
  time_to_procure?: string
  budget_guide?: string
}

/** 히스토리 등에서 ai_insight가 객체로 올 때 (스웨거 스펙) */
export interface AiForecastApiAiInsightObject {
  report_title?: string
  analysis_summary?: string
  action_item?: string
  alert_level?: string
}

/** section_3: 조달 권고안 */
export interface AiForecastApiRecommendationItem {
  id: number
  item_name: string
  quantity: number
  estimated_budget: number
  recommend_order_date: string
  ai_insight?: string | AiForecastApiAiInsightObject | null
  comment?: string | null
}

/** section_4: 알고리즘 가이드 */
export interface AiForecastApiAlgorithmGuide {
  formula_1?: string
  formula_2?: string
  formula_3?: string
}

export interface AiForecastApiData {
  /** 예측 시 사용한 질문 (히스토리 상세 등에서 내려주면 목록/결과에 그대로 사용) */
  prompt?: string
  section_1_time_series: AiForecastApiTimeSeriesItem[]
  section_2_strategic_guide: AiForecastApiStrategicGuide
  section_3_recommendations: AiForecastApiRecommendationItem[]
  section_4_algorithm_guide?: AiForecastApiAlgorithmGuide
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
  /** 기초 수량 (ROP 월 등) */
  baseQty?: number
  /** 발주 기준일 */
  rop_date?: string
  /** 안전재고 */
  safetyStock?: number
  /** 총 발주 수량 */
  totalOrderQty?: number
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

/** AI 전략적 조달 가이드 섹션 한 항목 */
export interface AiForecastGuideSection {
  title: string
  text: string
}

/** AI 전략적 조달 가이드 전체 */
export interface AiForecastGuide {
  highlight?: string
  sections: AiForecastGuideSection[]
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

/** fetchAiForecast 호출 시 화면 표시용 요약 정보 (백엔드 응답에 없어 프론트에서 파생) */
export interface AiForecastDisplaySummary {
  target: string
  risk: string
  period: string
}

/** 알고리즘 가이드 팝업용 수식 항목 */
export interface AiForecastAlgorithmGuideItem {
  label: string
  description: string
}

export interface AiForecastResponse {
  summary: AiForecastSummary
  demandTimeSeries: DemandTimeSeriesChart
  portfolioMatrix: PortfolioMatrixChart
  /** AI 전략적 조달 가이드 */
  guide?: AiForecastGuide
  /** 알고리즘 가이드 팝업 항목 */
  algorithmGuide: AiForecastAlgorithmGuideItem[]
  /** 조달 권고안 테이블 제목 (예: 2026학년도 1학기 조달권고안) */
  recommendationTitle: string
  recommendations: ProcurementRecommendationRow[]
}

function formatBudget(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

/** ai_insight가 문자열 또는 객체로 올 수 있음 — 테이블에는 문자열만 넘겨야 함 */
function resolveRecommendationAiComment(r: AiForecastApiRecommendationItem): string {
  const insight = r.ai_insight
  if (insight == null) return r.comment ?? ''
  if (typeof insight === 'string') return insight
  if (typeof insight === 'object') {
    const o = insight as AiForecastApiAiInsightObject
    const text = o.analysis_summary ?? o.report_title ?? o.action_item
    if (typeof text === 'string' && text.trim()) return text
  }
  return r.comment ?? ''
}

const ALGORITHM_FORMULA_LABELS: Record<'formula_1' | 'formula_2' | 'formula_3', string> = {
  formula_1: '적정 권장 수량',
  formula_2: '발주 시점 (ROP)',
  formula_3: '잔여 수명 (RUL)',
}

/** API 응답 data + 사용자 질문 + 화면표시용 요약을 AiForecastResponse로 변환 */
function mapApiDataToResponse(
  prompt: string,
  data: AiForecastApiData,
  displaySummary?: AiForecastDisplaySummary,
): AiForecastResponse {
  const timeSeries = Array.isArray(data.section_1_time_series) ? data.section_1_time_series : []
  const strategicGuide = data.section_2_strategic_guide ?? {}
  const recs = Array.isArray(data.section_3_recommendations) ? data.section_3_recommendations : []
  const algoGuide = data.section_4_algorithm_guide

  // section_1 → 수요 예측 시계열
  const demandTimeSeriesData: DemandTimeSeriesPoint[] = timeSeries.map((d) => {
    const point: DemandTimeSeriesPoint = {
      period: d.month,
      quantity: d.quantity,
    }
    if (d.base_qty != null && !Number.isNaN(Number(d.base_qty))) {
      point.baseQty = Number(d.base_qty)
    }
    const ropFromApi =
      d.rop_date != null && String(d.rop_date).trim() !== ''
        ? d.rop_date
        : (d as { ropDate?: string }).ropDate
    if (ropFromApi != null && String(ropFromApi).trim() !== '') {
      point.rop_date = String(ropFromApi)
    }
    if (d.safety_stock != null && !Number.isNaN(Number(d.safety_stock))) {
      point.safetyStock = Number(d.safety_stock)
    }
    if (d.total_order_qty != null && !Number.isNaN(Number(d.total_order_qty))) {
      point.totalOrderQty = Number(d.total_order_qty)
    }
    return point
  })
  const ropItem = timeSeries.find((d) => d.is_rop)
  const reorderPointPeriod = ropItem?.month

  // section_2 → AI 전략적 조달 가이드
  const guideSections: AiForecastGuideSection[] = []
  if (strategicGuide.smart_forecasting) {
    guideSections.push({
      title: '수요 산출 근거 (Smart Forecasting)',
      text: strategicGuide.smart_forecasting,
    })
  }
  if (strategicGuide.time_to_procure) {
    guideSections.push({
      title: '조달 최적화 전략 (Time-to-Procure)',
      text: strategicGuide.time_to_procure,
    })
  }
  if (strategicGuide.budget_guide) {
    guideSections.push({ title: '예산 가이드', text: strategicGuide.budget_guide })
  }
  const guide: AiForecastGuide = {
    highlight: strategicGuide.ai_summary_comment,
    sections: guideSections,
  }

  // section_4 → 알고리즘 가이드 팝업 항목
  const algorithmGuide: AiForecastAlgorithmGuideItem[] = []
  if (algoGuide) {
    ;(
      ['formula_1', 'formula_2', 'formula_3'] as const
    ).forEach((key) => {
      const text = algoGuide[key]
      if (text) {
        algorithmGuide.push({ label: ALGORITHM_FORMULA_LABELS[key], description: text })
      }
    })
  }

  const periodLabel = displaySummary?.period ?? ''
  const queryText = data.prompt?.trim() || prompt

  return {
    summary: {
      query: queryText,
      target: displaySummary?.target ?? '',
      risk: displaySummary?.risk ?? '',
      period: periodLabel,
    },
    demandTimeSeries: { data: demandTimeSeriesData, reorderPointPeriod },
    portfolioMatrix: { data: [] },
    guide,
    algorithmGuide,
    recommendationTitle: `${periodLabel} 조달권고안`,
    recommendations: recs.map((r, i) => ({
      no: i + 1,
      itemName: r.item_name,
      quantity: r.quantity,
      estimatedBudget: formatBudget(
        typeof r.estimated_budget === 'number' && !Number.isNaN(r.estimated_budget)
          ? r.estimated_budget
          : 0,
      ),
      recommendedOrderDeadline: r.recommend_order_date,
      aiComment: resolveRecommendationAiComment(r),
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
  const categoryTrimmed = ui.itemCategoryName?.trim() ?? ''
  const categoryForApi = categoryTrimmed.length > 0 ? categoryTrimmed : '전체'
  const riskLevelByPropensity: Record<string, ForecastRiskLevel> = {
    '리스크 선호': 'HIGH',
    '리스크 중립': 'MEDIUM',
    '리스크 회피': 'LOW',
    필수: 'HIGH',
    권장: 'MEDIUM',
    선택: 'LOW',
  }
  const riskLevel = (riskLevelByPropensity[ui.riskPropensity] ?? 'HIGH').toUpperCase() as ForecastRiskLevel
  const conditions: AiForecastRequestConditions = {
    year,
    semester,
    org_cd: orgCd,
    dept_cd: deptCd,
    risk_level: riskLevel,
    category: categoryForApi,
  }
  return conditions
}

/**
 * 통계 예측 분석 API
 * POST /api/ai/forecast
 * 질문(prompt)과 조건(conditions)으로 수요 예측·조달 권고안을 받아, 차트/테이블용 형식으로 반환합니다.
 */
export async function fetchAiForecast(
  prompt: string,
  conditions: AiForecastRequestConditions,
  displaySummary?: AiForecastDisplaySummary,
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
  console.log('[AI Forecast] 원본 응답:', body)
  console.log('[AI Forecast] data 필드:', body?.data)
  if (!body?.data) {
    throw new Error(body?.message ?? '분석 결과를 불러오지 못했습니다.')
  }
  const mapped = mapApiDataToResponse(prompt.trim(), body.data, displaySummary)
  console.log('[AI Forecast] 매핑된 결과:', mapped)
  return mapped
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
  | Record<string, unknown>

type AiForecastHistoryListApiData = AiForecastHistoryListApiItem[]

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/** GET /api/ai/forecast - 이전 기록 목록 조회 */
export async function fetchAiForecastHistory(): Promise<AiForecastHistoryItem[]> {
  const res = await http.get<ApiResponse<AiForecastHistoryListApiData>>('/api/ai/forecast')
  const body = res.data
  console.log('[AI Forecast History] 원본 응답:', body)
  if (!body?.data) {
    throw new Error(body?.message ?? '이전 예측 이력을 불러오지 못했습니다.')
  }

  return body.data.map((raw, index) => {
    if (typeof raw === 'string') {
      return { id: raw, title: `예측 ${index + 1}` }
    }
    const obj = raw as Record<string, unknown>
    const id = pickString(obj, 'id', 'forecastId', 'forecast_id') ?? String(index)
    // 이름 변경(PATCH) 후 서버가 내려주는 표시용 제목이 있으면 그걸 우선 (prompt보다 앞에 두지 않으면 새로고침 시 예전 프롬프트로 덮임)
    const title = String(
      pickString(
        obj,
        'name',
        'title',
        'newTitle',
        'displayName',
        'recordTitle',
        'prompt',
        'query',
        'content',
        'forecastPrompt',
        'forecast_prompt',
        'input',
      ) ?? `예측 ${index + 1}`,
    )
    const createdAt = pickString(obj, 'createdAt', 'created_at', 'createdDate', 'date')
    return { id, title, createdAt }
  })
}

/**
 * GET /api/ai/forecast/contents/{forecastId} — 기록 내용 확인 (스웨거 기준)
 */
export async function fetchAiForecastHistoryDetail(
  forecastId: string,
  displayTitle?: string,
): Promise<AiForecastResponse> {
  const id = forecastId.trim()
  const res = await http.get<ApiResponse<AiForecastApiData>>(
    `/api/ai/forecast/contents/${encodeURIComponent(id)}`,
  )
  const body = res.data
  if (!body?.data) {
    throw new Error(body?.message ?? '이전 예측 내용을 불러오지 못했습니다.')
  }
  const apiData = body.data
  const promptForDisplay = apiData.prompt?.trim() || displayTitle || '이전 예측'
  return mapApiDataToResponse(promptForDisplay, apiData)
}

/**
 * DELETE /api/ai/forecast?forecastId= — 이전 예측 기록 삭제
 */
export async function deleteAiForecastRecord(forecastId: string): Promise<void> {
  await http.delete<ApiResponse<Record<string, unknown>>>('/api/ai/forecast', {
    params: { forecastId },
  })
}

/**
 * PATCH /api/ai/forecast/{forecastId} — 기록 이름 수정
 * 스웨거에 `newTitle`·`forecastId`가 쿼리로만 적혀 있는 경우가 있어, 경로 + 쿼리로 맞춤.
 * (빈 JSON 본문 `{}`만 보내면 Spring에서 400이 나는 경우가 있음)
 */
export async function patchAiForecastRecordTitle(
  forecastId: string,
  title: string,
): Promise<void> {
  const newTitle = title.trim()
  const id = forecastId.trim()
  await http.patch<ApiResponse<unknown>>(
    `/api/ai/forecast/${encodeURIComponent(id)}`,
    undefined,
    {
      params: {
        forecastId: id,
        newTitle,
      },
    },
  )
}
