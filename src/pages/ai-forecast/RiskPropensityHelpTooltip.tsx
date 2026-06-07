import { useState, useRef, useEffect } from 'react'
import './RiskPropensityHelpTooltip.css'

/** 마우스가 벗어난 뒤 패널을 닫기까지 여유 시간(ms). 이 안에 다시 들어오면 유지 */
const CLOSE_DELAY_MS = 380

/** 조달성향 드롭다운 옆 물음표 — 호버 시 설명 패널 (최소 → 표준 → 최대 순) */
const RiskPropensityHelpTooltip = () => {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleEnter = () => {
    cancelClose()
    setOpen(true)
  }

  const handleLeave = () => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
    }, CLOSE_DELAY_MS)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  return (
    <div
      className="risk-propensity-help"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className="risk-propensity-help__trigger"
        aria-label="조달성향 유형 설명"
        aria-expanded={open}
        aria-describedby={open ? 'risk-propensity-help-panel' : undefined}
      >
        ?
      </button>
      <div
        id="risk-propensity-help-panel"
        className={`risk-propensity-help__panel ${open ? 'risk-propensity-help__panel--open' : ''}`}
        role="tooltip"
        aria-hidden={!open}
      >
        <h3 className="risk-propensity-help__title">조달 성향이란?</h3>
        <div className="risk-propensity-help__scroll">
          <p className="risk-propensity-help__p risk-propensity-help__p--intro">
            조달 성향은 물품 부족 위험과 재고·예산 부담 중 무엇을 우선할지 선택하는 기준입니다.
          </p>
          <p className="risk-propensity-help__p risk-propensity-help__p--intro">
            선택한 성향에 따라 <strong>안전재고 수량과 권장발주기한</strong>이 조정됩니다.
          </p>

          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">안전재고 최소</h4>
            <p className="risk-propensity-help__p risk-propensity-help__p--tagline">
              <strong>비용 및 보관 공간 절감 중심</strong>
            </p>
            <p className="risk-propensity-help__p">
              예측된 필요수량을 중심으로 조달하고 추가 안전재고는 최소화하는 방식입니다.
            </p>
            <ul className="risk-propensity-help__list">
              <li>
                <strong>적합 대상:</strong> 조달 기간이 짧고 대체품 확보가 쉬운 일반 기자재
              </li>
              <li>
                <strong>운영 방식:</strong> 수요가 발생할 때 필요한 수량 위주로 구매
              </li>
              <li>
                <strong>장점:</strong> 재고 보관 비용과 예산 부담을 줄일 수 있음
              </li>
              <li>
                <strong>유의사항:</strong> 갑작스러운 수요 증가나 납기 지연 시 물품이 부족할 수 있음
              </li>
              <li>
                <strong>시스템 반영:</strong> 안전재고 계수 <code>0.0</code>, 추가 발주 여유{' '}
                <code>0일</code>
              </li>
            </ul>
          </section>

          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">안전재고 표준</h4>
            <p className="risk-propensity-help__p risk-propensity-help__p--tagline">
              <strong>비용과 운영 안정성의 균형</strong>
            </p>
            <p className="risk-propensity-help__p">
              과거 수요 변동과 조달 리드타임을 고려하여 일반적인 수준의 안전재고를 확보하는 방식입니다.
            </p>
            <ul className="risk-propensity-help__list">
              <li>
                <strong>적합 대상:</strong> 노트북, 모니터, 사무기기 등 일반적인 대학 기자재
              </li>
              <li>
                <strong>운영 방식:</strong> 예측수요에 표준 안전재고와 발주 여유기간을 추가
              </li>
              <li>
                <strong>장점:</strong> 과도한 재고를 방지하면서 일반적인 수요 변동에 대응 가능
              </li>
              <li>
                <strong>유의사항:</strong> 예상보다 큰 행사나 수요 급증에는 일시적인 부족이 발생할 수
                있음
              </li>
              <li>
                <strong>시스템 반영:</strong> 안전재고 계수 <code>1.28</code>, 추가 발주 여유{' '}
                <code>14일</code>
              </li>
            </ul>
          </section>

          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">안전재고 최대</h4>
            <p className="risk-propensity-help__p risk-propensity-help__p--tagline">
              <strong>수업·연구 운영의 연속성 우선</strong>
            </p>
            <p className="risk-propensity-help__p">
              결품으로 인한 교육·연구 중단을 방지하기 위해 안전재고와 발주 여유기간을 크게 확보하는
              방식입니다.
            </p>
            <ul className="risk-propensity-help__list">
              <li>
                <strong>적합 대상:</strong> 실험 장비, 서버 부품, 전산실 기자재 등 운영 중단 영향이 큰
                물품
              </li>
              <li>
                <strong>운영 방식:</strong> 예측수요에 높은 안전재고를 추가하고 발주 시점을 앞당김
              </li>
              <li>
                <strong>장점:</strong> 수요 증가와 납기 지연에도 안정적으로 대응 가능
              </li>
              <li>
                <strong>유의사항:</strong> 재고 보관 비용과 예산 부담, 장기 보관에 따른 노후화 가능성이
                증가
              </li>
              <li>
                <strong>시스템 반영:</strong> 안전재고 계수 <code>1.65</code>, 추가 발주 여유{' '}
                <code>30일</code>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default RiskPropensityHelpTooltip
