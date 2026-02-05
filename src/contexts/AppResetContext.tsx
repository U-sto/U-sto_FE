import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type AppResetContextValue = {
  resetKey: number
  triggerReset: () => void
}

const AppResetContext = createContext<AppResetContextValue | undefined>(undefined)

export const AppResetProvider = ({ children }: { children: ReactNode }) => {
  const [resetKey, setResetKey] = useState(0)

  const triggerReset = useCallback(() => {
    setResetKey((prev) => prev + 1)
  }, [])

  return (
    <AppResetContext.Provider value={{ resetKey, triggerReset }}>
      {children}
    </AppResetContext.Provider>
  )
}

export const useAppReset = (): AppResetContextValue => {
  const ctx = useContext(AppResetContext)
  if (ctx === undefined) {
    throw new Error('useAppReset must be used within AppResetProvider')
  }
  return ctx
}

