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
import type { DemandTimeSeriesChart as DemandTimeSeriesChartType } from '../../../api/aiForecast'
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
  const reorderPoint = reorderPointPeriod != null
    ? data.find((d) => d.period === reorderPointPeriod)
    : undefined

  return (
    <div className="demand-time-series-chart" style={{ width: '100%', height }}>
      {!hideLabel && <div className="demand-time-series-chart__label">수요 예측 시계열</div>}
      <ResponsiveContainer width="100%" height={height - 37}>
        <ComposedChart data={data} margin={{ top: 36, right: 16, left: 0, bottom: 24 }}>
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
              const value = payload[0]?.value ?? 0
              return (
                <div style={{
                  background: 'var(--usto-alt-white)',
                  border: '1px solid var(--usto-primary-200)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontFamily: 'var(--font-family)',
                  fontSize: 13,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  <p style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: lineColor,
                      flexShrink: 0,
                    }} />
                    <span style={{ color: lineColor }}>발주시점 : </span>
                    <span style={{ fontWeight: 600, color: lineColor }}>{label}</span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: barColor,
                      flexShrink: 0,
                    }} />
                    <span style={{ color: 'var(--usto-alt-black)' }}>발주수량 : </span>
                    <span style={{ fontWeight: 600, color: barColor }}>{value}</span>
                  </p>
                </div>
              )
            }}
          />
          <Legend />
          <Bar
            dataKey="quantity"
            name="수량"
            fill={barColor}
            fillOpacity={0.8}
            radius={[0, 0, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="quantity"
            name="발주시점(ROP)"
            stroke={lineColor}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          {reorderPoint && (
            <ReferenceDot
              x={reorderPoint.period}
              y={reorderPoint.quantity}
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
