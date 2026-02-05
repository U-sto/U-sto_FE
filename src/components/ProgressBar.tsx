import './ProgressBar.css'

interface ProgressBarProps {
  step: 1 | 2 | 3
}

const ProgressBar = ({ step }: ProgressBarProps) => {
  const steps: (1 | 2 | 3)[] = [1, 2, 3]

  return (
    <div className="progress-bar">
      <div className="progress-bar-container">
        {steps.map((s) => (
          <div
            key={s}
            className={`progress-step ${s <= step ? 'active' : ''}`.trim()}
          />
        ))}
      </div>
    </div>
  )
}

export default ProgressBar

