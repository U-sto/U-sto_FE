import { useState, useEffect } from 'react'
import { fetchCommonCodeGroup, type CommonCodeGroup } from '../api/codes'

const groupCache = new Map<string, CommonCodeGroup | null>()
const inflightMap = new Map<string, Promise<CommonCodeGroup | null>>()

function loadCommonCodeGroup(groupName: string): Promise<CommonCodeGroup | null> {
  if (groupCache.has(groupName)) {
    return Promise.resolve(groupCache.get(groupName) ?? null)
  }
  let p = inflightMap.get(groupName)
  if (!p) {
    p = fetchCommonCodeGroup(groupName)
      .then((g) => {
        groupCache.set(groupName, g)
        return g
      })
      .finally(() => {
        inflightMap.delete(groupName)
      })
    inflightMap.set(groupName, p)
  }
  return p
}

/** 테스트용 캐시 초기화 */
export function clearCommonCodeGroupCache(groupName?: string): void {
  if (groupName !== undefined) {
    groupCache.delete(groupName)
  } else {
    groupCache.clear()
  }
}

/**
 * GET /api/codes/{groupName} — 그룹별 1회 로드 후 캐시 (동일 groupName 동시 요청 합침)
 */
export function useCommonCodeGroup(groupName: string): {
  group: CommonCodeGroup | null
  loading: boolean
  error: Error | null
} {
  const cached = groupCache.get(groupName)
  const [group, setGroup] = useState<CommonCodeGroup | null>(() => cached ?? null)
  const [loading, setLoading] = useState(() => !groupCache.has(groupName))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(!groupCache.has(groupName))
    setError(null)
    loadCommonCodeGroup(groupName)
      .then((g) => {
        if (!cancelled) setGroup(g)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [groupName])

  return { group, loading, error }
}
