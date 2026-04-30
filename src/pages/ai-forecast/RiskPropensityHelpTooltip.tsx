import { useState, useRef, useEffect } from 'react'
import './RiskPropensityHelpTooltip.css'

/** 마우스가 벗어난 뒤 패널을 닫기까지 여유 시간(ms). 이 안에 다시 들어오면 유지 */
const CLOSE_DELAY_MS = 380

/** 리스크성향 드롭다운 옆 물음표 — 호버 시 설명 패널 (선호 → 중립 → 회피 순) */
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
        aria-label="리스크성향 유형 설명"
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
        <h3 className="risk-propensity-help__title">리스크 성향이란?</h3>
        <div className="risk-propensity-help__scroll">
          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">
              리스크 선호형 (비용 절감 및 공간 최적화 중심)
            </h4>
            <p className="risk-propensity-help__p">
              보관 비용이나 관리 인력을 줄이기 위해 재고를 최소화하려는 태도입니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>주요 대상:</strong> 내용 연수가 긴 고가의 교육용 기자재(PC, 실험 장비), 가구류.
            </p>
            <p className="risk-propensity-help__p">
              <strong>특징:</strong> 재고를 쌓아두지 않고 수요가 발생할 때마다{' '}
              <strong>‘수시 구매’</strong>하거나, 필요할 때 빌려 쓰는 ‘렌탈 방식’을 선호합니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>리스크 관리:</strong> 당장 나가는 관리 예산을 줄일 수 있고 창고 공간을 아낄 수 있습니다.
              하지만 조달청 입찰 절차 등 대학 특유의 복잡한 구매 행정 프로세스 때문에, 필요한 시점에
              물건이 도착하지 않는(납기 지연) 리스크가 매우 큽니다.
            </p>
          </section>

          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">리스크 중립형 (효율적 행정 중심)</h4>
            <p className="risk-propensity-help__p">
              과거의 사용량 데이터를 분석하여 최적의 구매 시점과 수량을 정하는 태도입니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>주요 대상:</strong> 복사용지, 토너, 사무용 비품, 청소용품 등 일반 행정 소모품.
            </p>
            <p className="risk-propensity-help__p">
              <strong>특징:</strong> 매달 혹은 분기별 사용량을 체크하여 재고가 일정 수준(발주점) 이하로
              떨어지면 자동으로 구매합니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>리스크 관리:</strong> 가장 합리적인 방식이지만, 갑작스러운 신입생 증가나 대규모
              행사 등으로 수요가 폭증하면 일시적으로 물품이 부족해지는 리스크가 있습니다.
            </p>
          </section>

          <section className="risk-propensity-help__section">
            <h4 className="risk-propensity-help__heading">리스크 회피형 (안정성 및 공공성 중심)</h4>
            <p className="risk-propensity-help__p">
              대학의 핵심 기능인 교육과 연구가 중단되는 상황을 극도로 경계하는 태도입니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>주요 대상:</strong> 연구실 실험 기자재용 특수 가스, 중앙 도서관 서버 부품, 전산실
              소모품, 학위수여식용 학위복 등.
            </p>
            <p className="risk-propensity-help__p">
              <strong>특징:</strong> “없어서는 안 될 것”들에 대해 항상 과잉 재고를 유지합니다. 예산을 미리
              확보하여 학기 초에 대량으로 구매해 쌓아둡니다.
            </p>
            <p className="risk-propensity-help__p">
              <strong>리스크 관리:</strong> 물품 부족으로 인해 연구가 중단되거나 행정 시스템이 마비되는
              것을 막는 것이 최우선입니다. 하지만 연말에 재고 조사(실사) 때 남는 물품이 너무 많으면 예산
              낭비로 지적받을 리스크가 있습니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default RiskPropensityHelpTooltip
