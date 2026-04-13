import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type AssetDetailOverride = {
  acquireAmount: string
  usefulLife: string
  remarks: string
}

type OverridesMap = Record<string, AssetDetailOverride>

type AssetDetailOverridesContextValue = {
  getOverride: (itemUniqueNumber: string) => AssetDetailOverride | null
  setOverride: (itemUniqueNumber: string, value: AssetDetailOverride) => void
}

const AssetDetailOverridesContext = createContext<
  AssetDetailOverridesContextValue | undefined
>(undefined)

export const AssetDetailOverridesProvider = ({ children }: { children: ReactNode }) => {
  const [overrides, setOverrides] = useState<OverridesMap>({})

  const getOverride = useCallback((itemUniqueNumber: string): AssetDetailOverride | null => {
    const o = overrides[itemUniqueNumber]
    return o ?? null
  }, [overrides])

  const setOverride = useCallback(
    (itemUniqueNumber: string, value: AssetDetailOverride) => {
      setOverrides((prev) => ({
        ...prev,
        [itemUniqueNumber]: value,
      }))
    },
    [],
  )

  return (
    <AssetDetailOverridesContext.Provider value={{ getOverride, setOverride }}>
      {children}
    </AssetDetailOverridesContext.Provider>
  )
}

export const useAssetDetailOverrides = (): AssetDetailOverridesContextValue => {
  const ctx = useContext(AssetDetailOverridesContext)
  if (ctx === undefined) {
    throw new Error(
      'useAssetDetailOverrides must be used within AssetDetailOverridesProvider',
    )
  }
  return ctx
}
