import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatBotLanding from './ChatBotLanding'
import './ChatBotButton.css'
import { inferMenuActionButtons, mergeActionButtons } from '../../../../constants/chatMenuInference'
import {
  sendAiChat,
  deleteChatThread,
  getChatMessages,
  fetchAiItemAssets,
  patchChatThreadTitle,
  createChatThreadWithQuery,
  type AiChatActionButton,
} from '../../../../api/supportChat'

interface ChatBotButtonProps {
  onClick?: () => void
}

type ChatMessageRole = 'user' | 'assistant'

interface ChatMessage {
  id: number
  role: ChatMessageRole
  text: string
  actionButtons?: AiChatActionButton[]
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

function isLocalSessionId(id: string): boolean {
  return id.startsWith('local-')
}

function truncateSessionTitle(text: string, max = 28): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function parseChatbotStorage(): ChatBotPersistedState | null {
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
}

/** localStorage에서만 초기화. 세션 없으면 빈 목록(챗봇만 켠 상태에서는 POST /threads 호출 안 함) */
function readInitialChatState(): ChatBotPersistedState {
  const persisted = parseChatbotStorage()
  if (persisted?.sessions?.length) {
    return {
      sessions: persisted.sessions,
      currentSessionId: persisted.currentSessionId,
    }
  }
  return {
    sessions: [],
    currentSessionId: null,
  }
}

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

/** 사이드바 토글 — Sidebar.svg (데스크톱 제공) */
const LayoutToggleIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 12.6667V35.3333M12 20.5333C12 17.5467 12 16.0533 12.5813 14.912C13.0927 13.9085 13.9085 13.0927 14.912 12.5813C16.0533 12 17.5467 12 20.5333 12H27.4667C30.4533 12 31.9467 12 33.088 12.5813C34.0915 13.0927 34.9073 13.9085 35.4187 14.912C36 16.0533 36 17.5467 36 20.5333V27.4667C36 30.4533 36 31.9467 35.4187 33.088C34.9073 34.0915 34.0915 34.9073 33.088 35.4187C31.9467 36 30.4533 36 27.4667 36H20.5333C17.5467 36 16.0533 36 14.912 35.4187C13.9085 34.9073 13.0927 34.0915 12.5813 33.088C12 31.9467 12 30.4533 12 27.4667V20.5333Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SendArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

/** 사이드바 닫힘 시 헤더 새 채팅 */
const NewChatPlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
    />
  </svg>
)

type ChatPanelSurface = 'landing' | 'chat'

const ChatBotButton = ({ onClick }: ChatBotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessionMenuOpenId, setSessionMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [input, setInput] = useState('')

  const [sessions, setSessions] = useState<ChatSession[]>(() => readInitialChatState().sessions)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => readInitialChatState().currentSessionId,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [panelSurface, setPanelSurface] = useState<ChatPanelSurface>('landing')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const currentSession = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId)
    : undefined
  const activeSessionId = currentSession?.id ?? ''
  const messages = currentSession?.messages ?? []

  useEffect(() => {
    if (panelSurface === 'chat' && isOpen) {
      setSidebarOpen(true)
    }
  }, [panelSurface, isOpen])

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
    if (sessions.length === 0) {
      if (currentSessionId != null) setCurrentSessionId(null)
      return
    }
    if (currentSessionId != null && !sessions.some((s) => s.id === currentSessionId)) {
      setCurrentSessionId(null)
      return
    }
    /** 새 채팅 → 랜딩에서는 선택 세션 없음(null) 유지, 첫 전송 시에만 쓰레드 생성 */
    if (panelSurface === 'landing') {
      return
    }
    if (!currentSessionId || !sessions.some((s) => s.id === currentSessionId)) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId, panelSurface])

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
    setIsOpen((prev) => {
      const opening = !prev
      if (opening) {
        setPanelSurface('landing')
      }
      return opening
    })
    if (onClick) onClick()
  }

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setPanelSurface('chat')
    setSessionMenuOpenId(null)
    setError(null)
    setLoading(false)
  }

  /** 새 채팅: 쓰레드/로컬방 생성 없이 랜딩으로만 이동 — 첫 전송 시 POST /threads */
  const handleNewSession = () => {
    setError(null)
    setLoading(false)
    setSessionMenuOpenId(null)
    setInput('')
    setCurrentSessionId(null)
    setPanelSurface('landing')
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
    if (!isLocalSessionId(sessionId)) {
      void patchChatThreadTitle(sessionId, trimmed).catch(() => {
        // 서버 반영 실패 시에도 로컬 이름은 유지
      })
    }
  }

  const handleDeleteSessionById = (sessionId: string) => {
    setSessionMenuOpenId(null)

    /** 마지막 한 개여도 목록·서버에서 완전히 제거 (이전: 메시지만 비워서 제목만 남고 GET으로 복구되던 문제 방지) */
    if (sessions.length <= 1) {
      if (!isLocalSessionId(sessionId)) {
        void deleteChatThread(sessionId).catch(() => {
          // 서버 동기화 실패 무시
        })
      }
      setSessions([])
      setCurrentSessionId(null)
      setPanelSurface('landing')
      setError(null)
      return
    }

    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId)
      const next = filtered[0]
      if (next) setCurrentSessionId(next.id)
      return filtered
    })

    if (!isLocalSessionId(sessionId)) {
      void deleteChatThread(sessionId).catch(() => {
        // 서버 동기화 실패 무시
      })
    }
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
    if (
      !isOpen ||
      panelSurface === 'landing' ||
      !activeSessionId ||
      isLocalSessionId(activeSessionId) ||
      !currentSession ||
      messages.length > 0
    ) {
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
  }, [
    isOpen,
    panelSurface,
    activeSessionId,
    messages.length,
    updateCurrentSessionMessages,
    currentSession,
  ])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return

    if (panelSurface === 'landing') {
      setPanelSurface('chat')
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
    }
    const sessionIdBeforeSend = activeSessionId
    /** 서버 쓰레드 없음(또는 아직 발급 전 local-*)일 때만 POST /api/ai/chat/threads + query */
    const useCreateThreadFlow =
      !sessionIdBeforeSend || isLocalSessionId(sessionIdBeforeSend)

    if (!useCreateThreadFlow) {
      updateCurrentSessionMessages((prev) => [...prev, userMessage])
    }
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const searchParams = extractAiItemAssetSearchParams(trimmed)

      if (useCreateThreadFlow) {
        const { threadId, aiChatResponse } = await createChatThreadWithQuery(trimmed)
        const assetRows = await fetchAiItemAssets(searchParams).catch(() => [])
        const assetContext = formatAssetRowsForChat(assetRows)
        let replyText =
          typeof aiChatResponse.reply === 'string' && aiChatResponse.reply.trim().length > 0
            ? aiChatResponse.reply.trim()
            : '응답을 가져오지 못했습니다.'
        if (assetContext) {
          replyText = `${assetContext}\n\n${replyText}`
        }
        const inferred = inferMenuActionButtons(trimmed, replyText)
        const buttons = mergeActionButtons(
          Array.isArray(aiChatResponse.action_buttons) ? aiChatResponse.action_buttons : undefined,
          inferred,
        )
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          text: replyText,
          actionButtons: buttons,
        }

        if (sessionIdBeforeSend) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionIdBeforeSend
                ? {
                    ...s,
                    id: threadId,
                    title:
                      s.title === '새 대화' || /^새 대화( \d+)?$/.test(s.title)
                        ? truncateSessionTitle(trimmed)
                        : s.title,
                    messages: [...s.messages, userMessage, assistantMessage],
                  }
                : s,
            ),
          )
        } else {
          setSessions((prev) => [
            ...prev,
            {
              id: threadId,
              title: truncateSessionTitle(trimmed),
              messages: [userMessage, assistantMessage],
            },
          ])
        }
        setCurrentSessionId(threadId)
      } else {
        const [aiData, assetRows] = await Promise.all([
          sendAiChat(sessionIdBeforeSend, trimmed),
          fetchAiItemAssets(searchParams).catch(() => []),
        ])
        const rawReply = typeof aiData.reply === 'string' ? aiData.reply : ''
        const text = rawReply.trim().length > 0 ? rawReply.trim() : '응답을 가져오지 못했습니다.'
        const assetContext = formatAssetRowsForChat(assetRows)
        const inferred = inferMenuActionButtons(trimmed, text)
        const buttons = mergeActionButtons(
          Array.isArray(aiData.action_buttons) ? aiData.action_buttons : undefined,
          inferred,
        )
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          text: assetContext ? `${assetContext}\n\n${text}` : text,
          actionButtons: buttons,
        }
        updateCurrentSessionMessages((prev) => [...prev, assistantMessage])
      }
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
        <section
          className={`chatbot-panel${panelSurface === 'landing' ? ' chatbot-panel--landing' : ''}`}
          aria-label="AI 챗봇 대화창"
        >
          <div
            className={`chatbot-main${panelSurface === 'landing' ? ' chatbot-main--landing' : ''}`}
          >
            <header
              className={`chatbot-main-header${
                panelSurface === 'landing' ? ' chatbot-main-header--landing' : ''
              }`}
            >
              <div className="chatbot-main-header-left">
                <button
                  type="button"
                  className="chatbot-icon-btn chatbot-icon-btn--sidebar-toggle"
                  aria-label={sidebarOpen ? '세션 목록 접기' : '세션 목록 펼치기'}
                  aria-pressed={sidebarOpen}
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <LayoutToggleIcon />
                </button>
                {!sidebarOpen && (
                  <button
                    type="button"
                    className="chatbot-icon-btn chatbot-icon-btn--round chatbot-icon-btn--new-chat"
                    aria-label="새 채팅"
                    onClick={handleNewSession}
                  >
                    <NewChatPlusIcon />
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

            {panelSurface === 'landing' ? (
              <ChatBotLanding
                loading={loading}
                error={error}
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                sendIcon={<SendArrowIcon />}
              />
            ) : (
            <div className="chatbot-panel-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chatbot-message chatbot-message-${msg.role}`}
                >
                  <div className="chatbot-message-stack">
                    {msg.text.trim().length > 0 && (
                      <div className="chatbot-message-bubble">{msg.text}</div>
                    )}
                    {msg.role === 'assistant' &&
                      msg.actionButtons &&
                      msg.actionButtons.length > 0 && (
                        <div className="chatbot-message-actions" role="group" aria-label="바로가기">
                          {msg.actionButtons.map((btn) => {
                            const url = btn.url?.trim() ?? ''
                            const isInternal =
                              url.startsWith('/') && !url.startsWith('//') && !url.includes('://')
                            if (isInternal) {
                              return (
                                <Link
                                  key={`${url}-${btn.label}`}
                                  to={url}
                                  className="chatbot-action-link"
                                >
                                  {btn.label}
                                </Link>
                              )
                            }
                            return (
                              <a
                                key={`${url}-${btn.label}`}
                                href={url || '#'}
                                className="chatbot-action-link"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {btn.label}
                              </a>
                            )
                          })}
                        </div>
                      )}
                  </div>
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
            )}

            {panelSurface === 'chat' && (
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
            )}
          </div>

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
                      <div
                        className="chatbot-session-item-actions"
                        ref={sessionMenuOpenId === session.id ? menuRef : undefined}
                      >
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
                <span className="chatbot-sidebar-new-label">새 채팅</span>
              </button>
            </div>
          </aside>
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
