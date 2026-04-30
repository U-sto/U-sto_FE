import { useEffect, useMemo, useState } from 'react'
import {
  buildOperatingDepartmentSelect,
  fetchOperatingDepartments,
} from '../api/organization'
import {
  DEPARTMENT_NAME_TO_DEPT_CD,
  OPERATING_DEPARTMENT_FILTER_OPTIONS,
} from '../constants/departments'

/**
 * 운용부서 필터 옵션
 * - 우선: /api/organization/departments
 * - 실패 시: 기존 정적 상수 옵션
 */
export function useOperatingDepartmentFilterOptions(): string[] {
  const [dynamicOptions, setDynamicOptions] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchOperatingDepartments()
        if (cancelled) return
        const { options, labelToDeptCd } = buildOperatingDepartmentSelect(rows)
        // 조회 시 deptCd 매핑이 정확히 붙도록 런타임 매핑 테이블 갱신
        Object.keys(DEPARTMENT_NAME_TO_DEPT_CD).forEach((k) => {
          delete DEPARTMENT_NAME_TO_DEPT_CD[k]
        })
        Object.entries(labelToDeptCd).forEach(([label, deptCd]) => {
          DEPARTMENT_NAME_TO_DEPT_CD[label] = deptCd
          // "부서명 (코드)" 라벨의 부서명 단독 값도 함께 매핑
          const m = label.match(/^(.*)\s\(([A-Za-z0-9_-]{2,32})\)$/)
          if (m?.[1]) {
            const nm = m[1].trim()
            if (nm && !DEPARTMENT_NAME_TO_DEPT_CD[nm]) {
              DEPARTMENT_NAME_TO_DEPT_CD[nm] = deptCd
            }
          }
        })
        const normalized = options.filter((v) => v !== '선택')
        setDynamicOptions(['전체', ...normalized])
      } catch {
        if (!cancelled) setDynamicOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () => (dynamicOptions.length > 0 ? dynamicOptions : OPERATING_DEPARTMENT_FILTER_OPTIONS),
    [dynamicOptions],
  )
}

