import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
} from 'recharts'
import type { PortfolioMatrixChart as PortfolioMatrixChartType } from '../../../api/aiForecast'
import './PortfolioMatrixChart.css'

const CATEGORY_COLORS: Record<string, string> = {
  high: '#D52E2E',
  medium: 'var(--usto-primary-300)',
  low: 'var(--usto-primary-200)',
}

type PortfolioMatrixChartProps = {
  chart: PortfolioMatrixChartType
  height?: number
}

const PortfolioMatrixChart = ({ chart, height = 400 }: PortfolioMatrixChartProps) => {
  const { data } = chart
  const byCategory = data.reduce<Record<string, { rul: number; importance: number }[]>>(
    (acc, p) => {
      const key = p.category ?? 'default'
      if (!acc[key]) acc[key] = []
      acc[key].push({ rul: p.rul, importance: p.importance })
      return acc
    },
    {},
  )

  return (
    <div className="portfolio-matrix-chart" style={{ width: '100%', height }}>
      <div className="portfolio-matrix-chart__label">자산 포트폴리오 매트릭스</div>
      <ResponsiveContainer width="100%" height={height - 37}>
        <ScatterChart margin={{ top: 16, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--usto-primary-200)" />
          <XAxis
            type="number"
            dataKey="rul"
            name="잔여 수명 (RUL)"
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
            unit=""
          />
          <YAxis
            type="number"
            dataKey="importance"
            name="장비 중요도"
            tick={{ fontSize: 14, fill: 'var(--usto-alt-black)' }}
            tickLine={false}
            domain={[0, 100]}
          />
          <ZAxis range={[80, 400]} />
          <Tooltip
            contentStyle={{
              fontFamily: 'var(--font-family)',
              borderRadius: 6,
              border: '1px solid var(--usto-primary-200)',
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const v = value ?? 0
              const n = name ?? ''
              if (n === 'rul') return [v, '잔여 수명 (RUL)']
              if (n === 'importance') return [v, '장비 중요도']
              return [v, n]
            }}
          />
          <Legend />
          {Object.entries(byCategory).map(([category, points]) => (
            <Scatter
              key={category}
              name={category === 'default' ? '자산' : category}
              data={points}
              fill={CATEGORY_COLORS[category] ?? 'var(--usto-primary-300)'}
              shape="circle"
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PortfolioMatrixChart
