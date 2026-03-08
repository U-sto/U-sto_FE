export type MenuItem = {
  label: string
  path?: string
  isMain?: boolean
  isSubItem?: boolean
  children?: MenuItem[]
}

export type MenuSection = {
  id: string
  label: string
  items: MenuItem[]
}

export const menuData: MenuSection[] = [
  {
    id: 'admin',
    label: '관리자',
    items: [
      { label: '물품 취득 확정 관리', path: '/acq-confirmation' },
      { label: '물품 운용 등록 관리', path: '/operation-management' },
      { label: '물품 반납 등록 관리', path: '/return-management' },
      { label: '물품 불용 등록 관리', path: '/disuse-management' },
      { label: '물품 처분 등록 관리', path: '/disposal-management' },
    ],
  },
  {
    id: 'asset',
    label: '물품 관리',
    items: [
      { label: '물품 취득 관리', path: '/asset-management/acquisition-management' },
      {
        label: '물품 운용 관리',
        isMain: true,
        children: [
          {
            label: '물품 운용 대장 관리',
            isSubItem: true,
            path: '/asset-management/operation-management/operation-ledger',
          },
          {
            label: '출력물 관리',
            isSubItem: true,
            path: '/asset-management/operation-management/printout-management',
          },
          {
            label: '물품 반납 관리',
            isSubItem: true,
            path: '/asset-management/operation-management/return-management',
          },
        ],
      },
      {
        label: '물품 불용 관리',
        path: '/asset-management/disuse-management',
      },
      { label: '물품 처분 관리', path: '/asset-management/disposal-management' },
      { label: '보유 현황 조회', path: '/asset-management/inventory-status' },
    ],
  },
  {
    id: 'ai',
    label: 'AI 예측',
    items: [{ label: '사용주기 AI 예측', path: '/ai-forecast' }],
  },
]
