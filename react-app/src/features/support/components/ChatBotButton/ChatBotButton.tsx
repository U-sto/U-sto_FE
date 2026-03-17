import { useCallback, useEffect, useRef, useState } from 'react'
import './ChatBotButton.css'
import {
  sendAiChat,
  getChatThreads,
  deleteChatThread,
  getChatMessages,
} from '../../../../api/supportChat'

interface ChatBotButtonProps {
  onClick?: () => void
}

type ChatMessageRole = 'user' | 'assistant'

interface ChatMessage {
  id: number
  role: ChatMessageRole
  text: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
}

const ChatBotButton = ({ onClick }: ChatBotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const newSessionId = useCallback(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}`
  }, [])

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const id = newSessionId()
    return [
      {
        id,
        title: '새 채팅 1',
        messages: [],
      },
    ]
  })
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => sessions[0]?.id ?? newSessionId(),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ?? sessions[0]
  const messages = currentSession?.messages ?? []

  const updateCurrentSessionMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: updater(session.messages) }
            : session,
        ),
      )
    },
    [currentSessionId],
  )

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
    if (onClick) onClick()
  }

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setError(null)
    setLoading(false)
  }

  const handleNewSession = () => {
    const newId = newSessionId()
    const index = sessions.length + 1
    const newSession: ChatSession = {
      id: newId,
      title: `새 채팅 ${index}`,
      messages: [],
    }
    setSessions((prev) => [...prev, newSession])
    setCurrentSessionId(newId)
    setError(null)
    setLoading(false)
  }

  const handleRenameSession = () => {
    if (!currentSession) return
    const nextTitle = window.prompt('채팅방 이름을 입력해 주세요.', currentSession.title)
    const trimmed = nextTitle?.trim()
    if (!trimmed) return
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? { ...session, title: trimmed } : session,
      ),
    )
  }

  const handleDeleteSession = () => {
    setError(null)
    setLoading(false)
    if (sessions.length <= 1) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? { ...session, messages: [] } : session,
        ),
      )
      return
    }
    const threadIdToDelete = currentSessionId
    deleteChatThread(threadIdToDelete)
      .then(() => {
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== threadIdToDelete)
          const next = filtered[0]
          if (next) setCurrentSessionId(next.id)
          return filtered
        })
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '채팅방 삭제에 실패했습니다.')
      })
  }

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [])

  const defaultGreeting: ChatMessage = {
    id: Date.now(),
    role: 'assistant',
    text: '안녕하세요, 물품관리시스템 AI 챗봇 입니다.\n무엇을 도와 드릴까요?',
  }

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom()
    }
  }, [isOpen, messages.length, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    getChatThreads()
      .then((threadIds) => {
        if (cancelled || !threadIds.length) return
        const newSessions: ChatSession[] = threadIds.map((id, i) => ({
          id,
          title: `채팅방 ${i + 1}`,
          messages: [],
        }))
        setSessions(newSessions)
        setCurrentSessionId(newSessions[0].id)
      })
      .catch(() => {
        if (!cancelled) setError(null)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !currentSessionId || !currentSession || messages.length > 0) {
      return
    }
    let cancelled = false
    setError(null)
    getChatMessages(currentSessionId)
      .then((list) => {
        if (cancelled) return
        if (list.length > 0) {
          const mapped: ChatMessage[] = list.map((msg, idx) => ({
            id: msg.order ?? idx,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            text: msg.content ?? '',
          }))
          updateCurrentSessionMessages(() => mapped)
        } else {
          updateCurrentSessionMessages(() => [defaultGreeting])
        }
      })
      .catch(() => {
        if (!cancelled) {
          updateCurrentSessionMessages(() => [defaultGreeting])
        }
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, currentSessionId, currentSession?.messages.length])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    }
    updateCurrentSessionMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const answer = await sendAiChat(currentSessionId, trimmed)
      const text = answer && answer.trim().length > 0 ? answer : '응답을 가져오지 못했습니다.'
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text,
      }
      updateCurrentSessionMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '챗봇 응답 호출에 실패했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isOpen && (
        <section className="chatbot-panel" aria-label="AI 챗봇 대화창">
          <header className="chatbot-panel-header">
            <div className="chatbot-session-controls">
              <select
                className="chatbot-session-select"
                value={currentSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                aria-label="이전 채팅 선택"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="chatbot-session-new"
                onClick={handleNewSession}
              >
                새 채팅
              </button>
              <button
                type="button"
                className="chatbot-session-rename"
                onClick={handleRenameSession}
              >
                이름 변경
              </button>
              <button
                type="button"
                className="chatbot-session-delete"
                onClick={handleDeleteSession}
              >
                삭제
              </button>
            </div>
            <button
              type="button"
              className="chatbot-panel-close"
              aria-label="챗봇 닫기"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chatbot-panel-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message chatbot-message-${msg.role}`}
              >
                <div className="chatbot-message-bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message chatbot-message-assistant chatbot-message-loading">
                <div className="chatbot-message-bubble">답변을 생성하고 있습니다...</div>
              </div>
            )}
            {error && <div className="chatbot-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-panel-footer" onSubmit={handleSubmit}>
            <input
              className="chatbot-input"
              type="text"
              placeholder="질문을 입력해 주세요."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={loading || !input.trim()}
              aria-label="메시지 전송"
            >
              전송
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-button"
        aria-label="챗봇 열기"
        onClick={handleToggle}
      >
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 4.17C13.5 4.17 4.17 13.5 4.17 25C4.17 30.58 6.5 35.58 10.25 39.17L4.17 45.83L11.67 42.08C15.25 44.17 19.58 45.42 24.17 45.42C35.67 45.42 45.42 36.08 45.42 25C45.42 13.5 35.67 4.17 25 4.17Z"
            fill="var(--usto-alt-white)"
          />
          <path
            d="M14.58 18.75H35.42V21.77H14.58V18.75ZM14.58 25H29.17V28.02H14.58V25ZM14.58 31.25H26.04V34.27H14.58V31.25Z"
            fill="var(--usto-primary-300)"
          />
        </svg>
      </button>
    </>
  )
}

export default ChatBotButton

