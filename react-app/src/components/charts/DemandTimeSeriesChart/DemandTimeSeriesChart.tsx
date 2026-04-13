import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from 'recharts'
import type {
  DemandTimeSeriesChart as DemandTimeSeriesChartType,
  DemandTimeSeriesPoint,
} from '../../../api/aiForecast'
import './DemandTimeSeriesChart.css'

type DemandTimeSeriesChartProps = {
  chart: DemandTimeSeriesChartType
  height?: number
  barColor?: string
  lineColor?: string
  hideLabel?: boolean
}

const DemandTimeSeriesChart = ({
  chart,
  height = 400,
  barColor = 'var(--usto-primary-300)',
  lineColor = '#D52E2E',
  hideLabel = false,
}: DemandTimeSeriesChartProps) => {
  const { data, reorderPointPeriod } = chart
  const normalizedData: (DemandTimeSeriesPoint & { totalOrderQty: number })[] = data.map((d) => ({
    ...d,
    totalOrderQty: d.totalOrderQty ?? 0,
  }))
  const reorderPoint = reorderPointPeriod != null
    ? normalizedData.find((d) => d.period === reorderPointPeriod)
    : undefined

  return (
    <div className="demand-time-series-chart" style={{ width: '100%', height }}>
      {!hideLabel && <div className="demand-time-series-chart__label">수요 예측 시계열</div>}
      <ResponsiveContainer width="100%" height={height - 37}>
        <ComposedChart data={normalizedData} margin={{ top: 36, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--usto-primary-200)" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
            label={{ value: '(월)', position: 'insideBottomRight', offset: -4, fontSize: 12, fill: 'var(--usto-gray-200)' }}
          />
          <YAxis
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            label={{ value: '(개수)', angle: 0, position: 'insideTopLeft', dy: -34, fontSize: 12, fill: 'var(--usto-gray-200)' }}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'var(--font-family)',
              borderRadius: 6,
              border: '1px solid var(--usto-primary-200)',
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              // Recharts payload[].payload는 시리즈별로 잘린 객체일 수 있어, X축 period로 원본 행을 찾는다.
              const labelPeriod =
                label !== undefined && label !== null && label !== ''
                  ? typeof label === 'number'
                    ? label
                    : Number(label)
                  : NaN
              const rawFromData =
                Number.isFinite(labelPeriod) && labelPeriod > 0
                  ? normalizedData.find((d) => d.period === labelPeriod)
                  : undefined
              const raw =
                rawFromData ?? (payload[0]?.payload as DemandTimeSeriesPoint | undefined)
              const periodNum = raw?.period ?? (label != null ? Number(label) : NaN)
              const monthHeading =
                Number.isFinite(periodNum) && periodNum > 0 ? `${periodNum}월` : String(label ?? '')
              const value = raw?.quantity ?? (payload[0]?.value as number) ?? 0
              const extraRows: { label: string; value: string | number }[] = []
              if (raw?.baseQty != null) {
                extraRows.push({ label: '기초수량', value: raw.baseQty })
              }
              if (raw?.safetyStock != null) {
                extraRows.push({ label: '안전재고', value: raw.safetyStock })
              }
              if (raw?.rop_date) {
                extraRows.push({ label: '발주 마감 기한', value: raw.rop_date })
              }
              return (
                <div
                  style={{
                    background: 'var(--usto-alt-white)',
                    border: '1px solid var(--usto-primary-200)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontFamily: 'var(--font-family)',
                    fontSize: 13,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minWidth: 200,
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--usto-alt-black)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {monthHeading}
                  </p>
                  <p style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: lineColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--usto-alt-black)', fontWeight: 500 }}>총 발주수량 : </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: lineColor,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {raw?.totalOrderQty ?? 0}
                    </span>
                  </p>
                  <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: barColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'var(--usto-alt-black)', fontWeight: 500 }}>예상 고장 수량 : </span>
                    <span style={{ fontWeight: 600, color: barColor }}>{value}</span>
                  </p>
                  {extraRows.length > 0 && (
                    <ul
                      style={{
                        margin: 0,
                        padding: '8px 0 0',
                        borderTop: '1px solid var(--usto-primary-100)',
                        listStyle: 'none',
                      }}
                    >
                      {extraRows.map((row) => (
                        <li
                          key={row.label}
                          style={{
                            margin: '0 0 4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            color: 'var(--usto-alt-black)',
                          }}
                        >
                          <span style={{ color: 'var(--usto-gray-200)' }}>{row.label}</span>
                          <span style={{ fontWeight: 600, color: barColor }}>{row.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            }}
          />
          <Legend />
          <Bar
            dataKey="quantity"
            name="예상 고장 수량"
            fill={barColor}
            fillOpacity={0.8}
            radius={[0, 0, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="totalOrderQty"
            name="총 발주수량"
            stroke={lineColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          {reorderPoint && (
            <ReferenceDot
              x={reorderPoint.period}
              y={reorderPoint.totalOrderQty}
              r={8}
              fill={lineColor}
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DemandTimeSeriesChart
