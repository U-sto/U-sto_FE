import type { ReactNode } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'

interface FilterPanelProps {
  pageKey: ManagementPageKey
  /** 클래스 prefix 오버라이드 (예: asset 관리 페이지에서 operation-ledger-filter 사용 시) */
  filterPrefix?: string
  children: ReactNode
}

const FilterPanel = ({ pageKey, filterPrefix, children }: FilterPanelProps) => {
  const prefix = filterPrefix ?? pageKey

  return (
    <section className={`${prefix}-filter`}>
      <div className={`${prefix}-filter-wrapper`}>{children}</div>
    </section>
  )
}

export default FilterPanel
