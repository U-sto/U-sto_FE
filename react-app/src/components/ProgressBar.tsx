import './ProgressBar.css'

interface ProgressBarProps {
  step: number
  totalSteps?: number
}

const ProgressBar = ({ step = 1, totalSteps = 3 }: ProgressBarProps) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="progress-bar">
      <div 
        className="progress-bar-container"
        style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}
      >
        {steps.map((stepNum) => (
          <div
            key={stepNum}
            className={`progress-step ${stepNum === step ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ProgressBar
