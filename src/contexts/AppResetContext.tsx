import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type AppResetContextValue = {
  resetKey: number
  triggerReset: () => void
}

const AppResetContext = createContext<AppResetContextValue | null>(null)

export const AppResetProvider = ({ children }: { children: ReactNode }) => {
  const [resetKey, setResetKey] = useState(0)

  const triggerReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  return (
    <AppResetContext.Provider value={{ resetKey, triggerReset }}>
      {children}
    </AppResetContext.Provider>
  )
}

export const useAppReset = (): AppResetContextValue => {
  const ctx = useContext(AppResetContext)
  if (!ctx) {
    throw new Error('useAppReset must be used within AppResetProvider')
  }
  return ctx
}
