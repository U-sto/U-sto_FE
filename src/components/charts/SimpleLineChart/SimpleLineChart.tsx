import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export type LineChartDataItem = {
  name: string
  [key: string]: string | number
}

type SimpleLineChartProps = {
  data: LineChartDataItem[]
  /** Y축에 그릴 데이터 키들 (여러 개면 여러 라인) */
  dataKeys: { key: string; color?: string }[]
  xAxisKey?: string
  height?: number
  title?: string
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

const SimpleLineChart = ({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  title,
}: SimpleLineChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      {title && (
        <h3 style={{ marginBottom: 8, fontSize: '1rem', fontWeight: 600 }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height - (title ? 36 : 0)}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dataKeys.map(({ key, color }, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SimpleLineChart
