import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export type BarChartDataItem = {
  name: string
  [key: string]: string | number
}

type SimpleBarChartProps = {
  data: BarChartDataItem[]
  /** 막대에 그릴 데이터 키들 (여러 개면 그룹 막대) */
  dataKeys: { key: string; color?: string; name?: string }[]
  xAxisKey?: string
  height?: number
  title?: string
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

const SimpleBarChart = ({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  title,
}: SimpleBarChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      {title && (
        <h3 style={{ marginBottom: 8, fontSize: '1rem', fontWeight: 600 }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height - (title ? 36 : 0)}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dataKeys.map(({ key, color, name }, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={name ?? key}
              fill={color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SimpleBarChart
