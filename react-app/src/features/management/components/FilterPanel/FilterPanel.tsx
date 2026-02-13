import type { ReactNode } from 'react'
import type { ManagementPageKey } from '../../../../components/layout/management/ManagementPageLayout/ManagementPageLayout'

interface FilterPanelProps {
  pageKey: ManagementPageKey
  children: ReactNode
}

const FilterPanel = ({ pageKey, children }: FilterPanelProps) => {
  const prefix = pageKey

  return (
    <section className={`${prefix}-filter`}>
      <div className={`${prefix}-filter-wrapper`}>{children}</div>
    </section>
  )
}

export default FilterPanel
