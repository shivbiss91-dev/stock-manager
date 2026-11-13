import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/shell/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AllItemsPage } from './pages/items/AllItemsPage';
import { ItemDetailPage } from './pages/items/ItemDetailPage';
import { StockMovementsPage } from './pages/items/StockMovementsPage';
import { InvoicesListPage } from './pages/sales/InvoicesListPage';
import { CreateInvoicePage } from './pages/sales/CreateInvoicePage';
import { QuotationsPage } from './pages/sales/QuotationsPage';
import { SalesOrdersPage } from './pages/sales/SalesOrdersPage';
import { SalesReturnsPage } from './pages/sales/SalesReturnsPage';
import { PurchaseOrdersPage } from './pages/purchases/PurchaseOrdersPage';
import { GoodsReceivedPage } from './pages/purchases/GoodsReceivedPage';
import { SupplierBillsPage } from './pages/purchases/SupplierBillsPage';
import { WarehousesPage } from './pages/warehouses/WarehousesPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { CustomersPage } from './pages/parties/CustomersPage';
import { SuppliersPage } from './pages/parties/SuppliersPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { ApprovalsPage } from './pages/approvals/ApprovalsPage';
import { UsersPage } from './pages/users/UsersPage';
import { BackupPage } from './pages/backup/BackupPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes inside AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredModule="module_dashboard">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Item & Product Routes */}
          <Route
            path="/items"
            element={
              <ProtectedRoute requiredModule="module_items">
                <AllItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:itemId"
            element={
              <ProtectedRoute requiredModule="module_items">
                <ItemDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/materials" element={<Navigate to="/items" replace />} />

          {/* Warehouses & Movements */}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute requiredModule="module_warehouses">
                <WarehousesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute requiredModule="module_stock">
                <StockMovementsPage />
              </ProtectedRoute>
            }
          />

          {/* Invoicing Routes */}
          <Route
            path="/sales/invoices"
            element={
              <ProtectedRoute requiredModule="module_invoices" allowedRoles={['admin', 'manager', 'staff']}>
                <InvoicesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/invoices/new"
            element={
              <ProtectedRoute requiredModule="module_invoices" allowedRoles={['admin', 'manager', 'staff']}>
                <CreateInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/invoices/create"
            element={
              <ProtectedRoute requiredModule="module_invoices" allowedRoles={['admin', 'manager', 'staff']}>
                <CreateInvoicePage />
              </ProtectedRoute>
            }
          />

          {/* Orders & Quotations */}
          <Route
            path="/sales/quotations"
            element={
              <ProtectedRoute requiredModule="module_orders" allowedRoles={['admin', 'manager', 'staff']}>
                <QuotationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/orders"
            element={
              <ProtectedRoute requiredModule="module_orders" allowedRoles={['admin', 'manager', 'staff']}>
                <SalesOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/returns"
            element={
              <ProtectedRoute requiredModule="module_orders" allowedRoles={['admin', 'manager', 'staff']}>
                <SalesReturnsPage />
              </ProtectedRoute>
            }
          />

          {/* Purchases */}
          <Route
            path="/purchases/orders"
            element={
              <ProtectedRoute requiredModule="module_orders" allowedRoles={['admin', 'manager', 'staff']}>
                <PurchaseOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/grn"
            element={
              <ProtectedRoute requiredModule="module_orders" allowedRoles={['admin', 'manager', 'staff']}>
                <GoodsReceivedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/bills"
            element={
              <ProtectedRoute requiredModule="module_invoices" allowedRoles={['admin', 'manager', 'staff']}>
                <SupplierBillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers"
            element={
              <ProtectedRoute requiredModule="module_transfers" allowedRoles={['admin', 'manager', 'staff']}>
                <TransfersPage />
              </ProtectedRoute>
            }
          />

          {/* Customers & Suppliers */}
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />

          {/* Intelligence, Reports & Documents */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredModule="module_reports" allowedRoles={['admin', 'manager', 'viewer']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/documents" element={<DocumentsPage />} />

          {/* Approvals (Phase 7 - Admin & Manager) */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ApprovalsPage />
              </ProtectedRoute>
            }
          />

          {/* Staff & Roles (Admin only) */}
          <Route
            path="/users-roles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* Backup (Admin only) */}
          <Route
            path="/backup"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <BackupPage />
              </ProtectedRoute>
            }
          />

          {/* Settings (Admin-only unless explicitly delegated with module_settings) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredModule="module_settings" allowedRoles={['admin', 'manager', 'staff']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
