/**
 * 물품 취득 확정 관리 API 추상화
 * 클라이언트 사이드 필터링/페이지네이션 대신 서버 사이드 방식으로 전환.
 * currentPage, pageSize, filters를 쿼리 파라미터로 전달하는 구조.
 */

export type AcqConfirmationFilters = {
  g2bName: string
  g2bNumberFrom: string
  g2bNumberTo: string
  sortDateFrom: string
  sortDateTo: string
  acquireDateFrom: string
  acquireDateTo: string
  approvalStatus: string
  category: string
}

export type AcqConfirmationRow = {
  id: number
  g2bNumber: string
  g2bName: string
  acquireDate: string
  acquireAmount: string
  sortDate: string
  operatingDept: string
  operatingStatus: string
  usefulLife: string
  quantity: number
  approvalStatus: string
}

export type FetchAcqConfirmationParams = {
  page: number
  pageSize: number
  filters: AcqConfirmationFilters
}

export type FetchAcqConfirmationResponse = {
  data: AcqConfirmationRow[]
  totalCount: number
}

/** 추상화된 API 호출 함수 - 실제 백엔드 연동 시 이 함수만 교체 */
export async function fetchAcqConfirmationList(
  params: FetchAcqConfirmationParams
): Promise<FetchAcqConfirmationResponse> {
  const { page, pageSize, filters } = params

  // TODO: 실제 API 연동 시 아래와 같이 호출
  // const query = new URLSearchParams({
  //   page: String(page),
  //   pageSize: String(pageSize),
  //   ...Object.fromEntries(
  //     Object.entries(filters).filter(([, v]) => v != null && v !== '')
  //   ),
  // })
  // const res = await fetch(`/api/acq-confirmation?${query}`)
  // return res.json()

  // 목업: 전체 데이터 생성 후 서버 사이드 필터/페이지네이션 시뮬레이션
  const g2bOptions = [
    { name: '노트북', number: '43211613-26081535' },
    { name: '데스크탑', number: '43211614-26081536' },
    { name: '프로젝터', number: '43211615-26081537' },
    { name: '회의실 의자', number: '43211616-26081538' },
  ]

  const allData: AcqConfirmationRow[] = Array.from({ length: 15 }).map((_, idx) => {
    const g2bOption = g2bOptions[idx % g2bOptions.length]
    return {
      id: idx + 1,
      g2bNumber: g2bOption.number,
      g2bName: g2bOption.name,
      acquireDate: '2026-01-21',
      acquireAmount: (1000000 * (idx + 1)).toLocaleString() + '원',
      sortDate: '2026-01-21',
      operatingDept: `운용부서 ${idx + 1}`,
      operatingStatus: '운용중',
      usefulLife: `${5 + idx}년`,
      quantity: idx + 1,
      approvalStatus: '대기',
    }
  })

  // 서버 사이드 필터링 시뮬레이션 (실제로는 API에서 처리)
  let filtered = allData

  if (filters.g2bName && filters.g2bName !== '전체') {
    filtered = filtered.filter((item) => item.g2bName === filters.g2bName)
  }
  if (filters.g2bNumberFrom || filters.g2bNumberTo) {
    filtered = filtered.filter((item) => {
      const parts = item.g2bNumber.split('-')
      const val = parseInt(parts[0] ?? '0', 10)
      if (filters.g2bNumberFrom) {
        const from = parseInt(filters.g2bNumberFrom, 10)
        if (isNaN(val) || val < from) return false
      }
      if (filters.g2bNumberTo) {
        const to = parseInt(filters.g2bNumberTo, 10)
        if (isNaN(val) || val > to) return false
      }
      return true
    })
  }
  if (filters.sortDateFrom) {
    filtered = filtered.filter((item) => item.sortDate >= filters.sortDateFrom)
  }
  if (filters.sortDateTo) {
    filtered = filtered.filter((item) => item.sortDate <= filters.sortDateTo)
  }
  if (filters.acquireDateFrom) {
    filtered = filtered.filter((item) => item.acquireDate >= filters.acquireDateFrom)
  }
  if (filters.acquireDateTo) {
    filtered = filtered.filter((item) => item.acquireDate <= filters.acquireDateTo)
  }
  if (filters.approvalStatus && filters.approvalStatus !== '전체') {
    filtered = filtered.filter((item) => item.approvalStatus === filters.approvalStatus)
  }

  const totalCount = filtered.length
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)

  return { data, totalCount }
}
