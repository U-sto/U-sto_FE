import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getUserInfo, type UserInfo } from '../api/users'
import { ACCESS_TOKEN_KEY } from '../api/types'

type AuthUserContextValue = {
  user: UserInfo | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  clear: () => void
}

const AuthUserContext = createContext<AuthUserContextValue | undefined>(undefined)

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
    if (!token) {
      setUser(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body = await getUserInfo()
      setUser(body.data ?? null)
    } catch (e) {
      setUser(null)
      setError(e instanceof Error ? e.message : '사용자 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const clear = useCallback(() => {
    setUser(null)
    setError(null)
    setLoading(false)
  }, [])

  const value = useMemo<AuthUserContextValue>(
    () => ({ user, loading, error, refresh, clear }),
    [user, loading, error, refresh, clear],
  )

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>
}

export function useAuthUser(): AuthUserContextValue {
  const ctx = useContext(AuthUserContext)
  if (ctx === undefined) {
    throw new Error('useAuthUser must be used within AuthUserProvider')
  }
  return ctx
}
