import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const AcquisitionListPage = lazy(
  () => import('../pages/asset-management/acquisition-management/AcquisitionListPage'),
)
const AcquisitionManagementPage = lazy(
  () => import('../pages/asset-management/acquisition-management/AcquisitionManagementPage'),
)
const OperationLedgerPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/operation-ledger/OperationLedgerPage'
    ),
)
const OperationLedgerDetailPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/operation-ledger/OperationLedgerDetailPage'
    ),
)
const OperationTransferPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/operation-transfer/OperationTransferPage'
    ),
)
const OperationTransferRegistrationPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/operation-transfer/OperationTransferRegistrationPage'
    ),
)
const PrintoutManagementPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/printout-management/PrintoutManagementPage'
    ),
)
const AssetReturnManagementPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/return-management/ReturnManagementPage'
    ),
)
const ReturnRegistrationPage = lazy(
  () =>
    import(
      '../pages/asset-management/operation-management/return-management/ReturnRegistrationPage'
    ),
)
const AssetDisuseManagementPage = lazy(
  () => import('../pages/asset-management/disuse-management/DisuseManagementPage'),
)
const DisuseRegistrationPage = lazy(
  () => import('../pages/asset-management/disuse-management/DisuseRegistrationPage'),
)
const AssetDisposalManagementPage = lazy(
  () => import('../pages/asset-management/disposal-management/DisposalManagementPage'),
)
const DisposalRegistrationPage = lazy(
  () => import('../pages/asset-management/disposal-management/DisposalRegistrationPage'),
)
const InventoryStatusPage = lazy(
  () => import('../pages/asset-management/inventory-status/InventoryStatusPage'),
)
const InventoryStatusDetailPage = lazy(
  () => import('../pages/asset-management/inventory-status/InventoryStatusDetailPage'),
)

const AssetManagementRoutes = () => (
  <Suspense fallback={<div className="loading-fallback">로딩 중...</div>}>
    <Routes>
      <Route path="acquisition-management" element={<AcquisitionListPage />} />
      <Route path="acquisition-management/register" element={<AcquisitionManagementPage />} />
      <Route
        path="operation-management/operation-ledger"
        element={<OperationLedgerPage />}
      />
      <Route
        path="operation-management/operation-ledger/detail"
        element={<OperationLedgerDetailPage />}
      />
      <Route
        path="operation-management/operation-transfer"
        element={<OperationTransferPage />}
      />
      <Route
        path="operation-management/operation-transfer/register"
        element={<OperationTransferRegistrationPage />}
      />
      <Route
        path="operation-management/printout-management"
        element={<PrintoutManagementPage />}
      />
      <Route
        path="operation-management/return-management"
        element={<AssetReturnManagementPage />}
      />
      <Route
        path="operation-management/return-management/register"
        element={<ReturnRegistrationPage />}
      />
      <Route path="disuse-management" element={<AssetDisuseManagementPage />} />
      <Route
        path="disuse-management/register"
        element={<DisuseRegistrationPage />}
      />
      <Route path="disposal-management" element={<AssetDisposalManagementPage />} />
      <Route
        path="disposal-management/register"
        element={<DisposalRegistrationPage />}
      />
      <Route path="inventory-status" element={<InventoryStatusPage />} />
      <Route path="inventory-status/detail" element={<InventoryStatusDetailPage />} />
    </Routes>
  </Suspense>
)

export default AssetManagementRoutes
