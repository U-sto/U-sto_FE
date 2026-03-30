import { useCallback, useEffect, useRef, useState } from 'react'
import './ChatBotButton.css'
import {
  sendAiChat,
  getChatThreads,
  deleteChatThread,
  getChatMessages,
  fetchAiItemAssets,
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

type ChatBotPersistedState = {
  sessions: ChatSession[]
  currentSessionId: string | null
}

const CHATBOT_STORAGE_KEY = 'usto.chatbot.sessions.v1'

function extractAiItemAssetSearchParams(query: string): { itmNo?: string; g2bDn?: string } {
  const q = query.trim()
  if (!q) return {}
  const itmNoMatch = q.match(/\bM\d{6,}\b/i)
  if (itmNoMatch?.[0]) {
    return { itmNo: itmNoMatch[0].toUpperCase() }
  }
  return { g2bDn: q }
}

function formatAssetRowsForChat(rows: Awaited<ReturnType<typeof fetchAiItemAssets>>): string {
  if (!rows.length) return ''
  const top = rows.slice(0, 3)
  const lines = top.map((r, idx) => {
    const itmNo = String(r.itmNo ?? '-')
    const g2bDn = String(r.g2bDn ?? '-')
    const operSts = String(r.operSts ?? '-')
    const deptNm = String(r.deptNm ?? '-')
    return `${idx + 1}) 물품번호 ${itmNo} / 목록명 ${g2bDn} / 상태 ${operSts} / 부서 ${deptNm}`
  })
  return `관련 물품 조회 결과:\n${lines.join('\n')}`
}

const LayoutToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="4" width="7" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    <rect x="13.5" y="4" width="7" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

const SendArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 19V5M12 5l-5 5M12 5l5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20h4l10.5-10.5-4-4L4 16v4zM13.5 6.5l4 4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChatBotButton = ({ onClick }: ChatBotButtonProps) => {
  const loadPersistedState = useCallback((): ChatBotPersistedState | null => {
    try {
      const raw = window.localStorage.getItem(CHATBOT_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<ChatBotPersistedState>
      if (!Array.isArray(parsed.sessions)) return null
      const sessions = parsed.sessions
        .filter((s): s is ChatSession => {
          if (!s || typeof s !== 'object') return false
          if (typeof s.id !== 'string' || typeof s.title !== 'string') return false
          return Array.isArray(s.messages)
        })
        .map((s) => ({
          id: s.id,
          title: s.title,
          messages: s.messages.filter(
            (m): m is ChatMessage =>
              !!m &&
              typeof m === 'object' &&
              typeof m.id === 'number' &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.text === 'string',
          ),
        }))
      if (sessions.length === 0) return null
      const parsedCurrentSessionId =
        typeof parsed.currentSessionId === 'string' ? parsed.currentSessionId : null
      const safeCurrentSessionId =
        parsedCurrentSessionId && sessions.some((s) => s.id === parsedCurrentSessionId)
          ? parsedCurrentSessionId
          : sessions[0].id
      return {
        sessions,
        currentSessionId: safeCurrentSessionId,
      }
    } catch {
      return null
    }
  }, [])

  const [isOpen, setIsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessionMenuOpenId, setSessionMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [input, setInput] = useState('')
  const newSessionId = useCallback(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}`
  }, [])

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const persisted = loadPersistedState()
    if (persisted?.sessions?.length) return persisted.sessions
    const id = newSessionId()
    return [{ id, title: '새 채팅 1', messages: [] }]
  })
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const persisted = loadPersistedState()
    if (persisted?.currentSessionId) return persisted.currentSessionId
    return persisted?.sessions?.[0]?.id ?? newSessionId()
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) ?? sessions[0]
  const activeSessionId = currentSession?.id ?? ''
  const messages = currentSession?.messages ?? []

  useEffect(() => {
    if (!sessionMenuOpenId) return
    const onDocClick = (e: MouseEvent) => {
      const el = menuRef.current
      if (el && !el.contains(e.target as Node)) {
        setSessionMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [sessionMenuOpenId])

  useEffect(() => {
    if (!sessions.length) return
    if (!sessions.some((s) => s.id === currentSessionId)) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId])

  useEffect(() => {
    const payload: ChatBotPersistedState = {
      sessions,
      currentSessionId,
    }
    try {
      window.localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [sessions, currentSessionId])

  const updateCurrentSessionMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: updater(session.messages) }
            : session,
        ),
      )
    },
    [activeSessionId],
  )

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
    if (onClick) onClick()
  }

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setSessionMenuOpenId(null)
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
    setSessionMenuOpenId(null)
    setError(null)
    setLoading(false)
  }

  const handleRenameSessionById = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return
    const nextTitle = window.prompt('채팅방 이름을 입력해 주세요.', session.title)
    const trimmed = nextTitle?.trim()
    if (!trimmed) return
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s)),
    )
    setSessionMenuOpenId(null)
  }

  const handleDeleteSessionById = (sessionId: string) => {
    setError(null)
    setLoading(false)
    setSessionMenuOpenId(null)
    if (sessions.length <= 1) {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, messages: [] } : session,
        ),
      )
      return
    }
    deleteChatThread(sessionId)
      .then(() => {
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== sessionId)
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
        setSessions((prev) => {
          const prevById = new Map(prev.map((s) => [s.id, s] as const))
          const newSessions: ChatSession[] = threadIds.map((id, i) => ({
            id,
            title: prevById.get(id)?.title ?? `채팅방 ${i + 1}`,
            messages: prevById.get(id)?.messages ?? [],
          }))
          setCurrentSessionId((current) =>
            current && newSessions.some((s) => s.id === current) ? current : newSessions[0].id,
          )
          return newSessions
        })
      })
      .catch(() => {
        if (!cancelled) setError(null)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !activeSessionId || !currentSession || messages.length > 0) {
      return
    }
    let cancelled = false
    setError(null)
    getChatMessages(activeSessionId)
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
  }, [isOpen, activeSessionId, currentSession?.messages.length])

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
      const searchParams = extractAiItemAssetSearchParams(trimmed)
      const [answer, assetRows] = await Promise.all([
        sendAiChat(activeSessionId, trimmed),
        fetchAiItemAssets(searchParams).catch(() => []),
      ])
      const text = answer && answer.trim().length > 0 ? answer : '응답을 가져오지 못했습니다.'
      const assetContext = formatAssetRowsForChat(assetRows)
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: assetContext ? `${assetContext}\n\n${text}` : text,
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
          <aside
            className={`chatbot-sidebar${sidebarOpen ? ' chatbot-sidebar--open' : ''}`}
            aria-hidden={!sidebarOpen}
          >
            <div className="chatbot-sidebar-scroll">
              <ul className="chatbot-session-list" role="list">
                {sessions.map((session) => {
                  const isActive = session.id === currentSessionId
                  return (
                    <li
                      key={session.id}
                      className={`chatbot-session-item${isActive ? ' chatbot-session-item--active' : ''}`}
                    >
                      <button
                        type="button"
                        className="chatbot-session-item-main"
                        onClick={() => handleSessionChange(session.id)}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          handleRenameSessionById(session.id)
                        }}
                      >
                        <span className="chatbot-session-item-title">{session.title}</span>
                      </button>
                      <div className="chatbot-session-item-actions" ref={sessionMenuOpenId === session.id ? menuRef : undefined}>
                        <button
                          type="button"
                          className="chatbot-session-more"
                          aria-label="세션 메뉴"
                          aria-expanded={sessionMenuOpenId === session.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionMenuOpenId((id) => (id === session.id ? null : session.id))
                          }}
                        >
                          ···
                        </button>
                        {sessionMenuOpenId === session.id && (
                          <div className="chatbot-session-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className="chatbot-session-menu-item"
                              onClick={() => handleRenameSessionById(session.id)}
                            >
                              <PencilIcon />
                              이름 수정
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="chatbot-session-menu-item chatbot-session-menu-item--danger"
                              onClick={() => handleDeleteSessionById(session.id)}
                            >
                              <span className="chatbot-session-menu-x" aria-hidden>
                                ×
                              </span>
                              채팅 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="chatbot-sidebar-footer">
              <button type="button" className="chatbot-sidebar-new" onClick={handleNewSession}>
                <span className="chatbot-sidebar-new-icon" aria-hidden>
                  +
                </span>
                <span className="chatbot-sidebar-new-label">← 새 채팅</span>
              </button>
            </div>
          </aside>

          <div className="chatbot-main">
            <header className="chatbot-main-header">
              <div className="chatbot-main-header-left">
                <button
                  type="button"
                  className="chatbot-icon-btn"
                  aria-label={sidebarOpen ? '세션 목록 접기' : '세션 목록 펼치기'}
                  aria-pressed={sidebarOpen}
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <LayoutToggleIcon />
                </button>
                {!sidebarOpen && (
                  <button
                    type="button"
                    className="chatbot-icon-btn chatbot-icon-btn--round"
                    aria-label="새 채팅"
                    onClick={handleNewSession}
                  >
                    +
                  </button>
                )}
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
                placeholder="내용을 입력하세요."
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
                <SendArrowIcon />
              </button>
            </form>
          </div>
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
