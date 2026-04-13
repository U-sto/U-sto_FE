interface SparkleIconProps {
  size?: number
  color?: string
  className?: string
}

const SparkleIcon = ({
  size = 24,
  color = 'currentColor',
  className = '',
}: SparkleIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 큰 4각별: quadratic bezier로 안쪽으로 오목한 곡선 */}
    <path
      d="M10 2 Q11.5 8.5 18 10 Q11.5 11.5 10 18 Q8.5 11.5 2 10 Q8.5 8.5 10 2 Z"
      fill={color}
    />
    {/* 작은 4각별 */}
    <path
      d="M19 14.5 Q19.4 16.4 21 17 Q19.4 17.6 19 19.5 Q18.6 17.6 17 17 Q18.6 16.4 19 14.5 Z"
      fill={color}
    />
  </svg>
)

export default SparkleIcon
