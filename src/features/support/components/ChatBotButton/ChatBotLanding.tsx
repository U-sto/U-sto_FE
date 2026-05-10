import type { FormEvent, ReactNode } from 'react'

export interface ChatBotLandingProps {
  loading: boolean
  error: string | null
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  sendIcon: ReactNode
}

/** 챗봇 패널 첫 진입(랜딩) — 본문 + 입력 폼 */
const ChatBotLanding = ({
  loading,
  error,
  input,
  onInputChange,
  onSubmit,
  sendIcon,
}: ChatBotLandingProps) => (
  <>
    <div className="chatbot-landing-body">
      <div className="chatbot-landing-copy">
        <h2 className="chatbot-landing-title">무엇을 도와드릴까요?</h2>
        <p className="chatbot-landing-sub">
          물품관리시스템에 대해 궁금한 점을 자유롭게 질문해 주세요.
        </p>
      </div>
      {loading && (
        <p className="chatbot-landing-loading" aria-live="polite">
          <span className="chatbot-landing-loading-dot" aria-hidden />
          답변을 생성하고 있습니다...
        </p>
      )}
      {error && <div className="chatbot-landing-error">{error}</div>}
    </div>

    <form
      className="chatbot-panel-footer chatbot-panel-footer--landing"
      onSubmit={onSubmit}
    >
      <div className="chatbot-landing-field">
        <input
          className="chatbot-input chatbot-input--landing"
          type="text"
          placeholder="챗봇에게 물어보기"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="chatbot-send-btn chatbot-send-btn--landing"
          disabled={loading || !input.trim()}
          aria-label="메시지 전송"
        >
          {sendIcon}
        </button>
      </div>
    </form>
  </>
)

export default ChatBotLanding
