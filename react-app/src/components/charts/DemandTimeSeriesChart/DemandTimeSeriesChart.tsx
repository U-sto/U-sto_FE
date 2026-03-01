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
}

const DemandTimeSeriesChart = ({
  chart,
  height = 400,
  barColor = 'var(--usto-primary-300)',
  lineColor = '#D52E2E',
}: DemandTimeSeriesChartProps) => {
  const { data, reorderPointPeriod } = chart
  const reorderPoint = reorderPointPeriod != null
    ? data.find((d) => d.period === reorderPointPeriod)
    : undefined

  return (
    <div className="demand-time-series-chart" style={{ width: '100%', height }}>
      <div className="demand-time-series-chart__label">수요 예측 시계열</div>
      <ResponsiveContainer width="100%" height={height - 37}>
        <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--usto-primary-200)" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              fontFamily: 'var(--font-family)',
              borderRadius: 6,
              border: '1px solid var(--usto-primary-200)',
            }}
            formatter={(value: number | undefined) => [value ?? 0, '수량']}
            labelFormatter={(label) => `기간 ${label}`}
          />
          <Legend />
          <Bar
            dataKey="quantity"
            name="월별 수량 예측 (PCP)"
            fill={barColor}
            fillOpacity={0.8}
            radius={[0, 0, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="quantity"
            name="추세"
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
      {reorderPointPeriod != null && (
        <div className="demand-time-series-chart__rop-legend" aria-hidden>
          발주 시점 (ROP): 기간 {reorderPointPeriod}
        </div>
      )}
    </div>
  )
}

export default DemandTimeSeriesChart
