import './CheckCircle.css'

interface CheckCircleProps {
  size?: number
}

const CheckCircle = ({ size = 100 }: CheckCircleProps) => {
  return (
    <div className="check-circle" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill="var(--usto-primary-200)" />
        <path
          d="M27.08 50L41.67 64.58L72.92 35.42"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default CheckCircle
