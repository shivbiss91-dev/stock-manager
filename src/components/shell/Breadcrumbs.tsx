import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  materials: 'Materials',
  items: 'Items & Products',
  warehouses: 'Warehouses',
  'stock-movements': 'Stock Movements',
  sales: 'Sales',
  quotations: 'Quotations',
  'sales-orders': 'Sales Orders',
  invoices: 'GST Invoices',
  create: 'Create Invoice',
  returns: 'Returns & Credit Notes',
  purchases: 'Purchases',
  'purchase-orders': 'Purchase Orders',
  grn: 'Goods Received (GRN)',
  'supplier-bills': 'Supplier Bills',
  transfers: 'Transfers',
  customers: 'Customers',
  suppliers: 'Suppliers',
  reports: 'Reports & Analytics',
  documents: 'Documents',
  approvals: 'Approvals',
  'audit-log': 'Audit Log',
  'users-roles': 'Users & Roles',
  settings: 'Settings',
  favourites: 'Favourites',
  backup: 'Data Backup',
  wood: 'Wood & Timber',
  metal: 'Metals & Alloys',
  plastic: 'Polymers & Plastics',
  glass: 'Glass & Silica',
  fabric: 'Industrial Fabrics',
  rubber: 'Rubber & Elastomers',
  paper: 'Paper & Packaging',
  ceramic: 'Ceramics & Minerals',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs">
      <Link
        to="/dashboard"
        className="flex items-center text-slate-500 hover:text-brand-navy dark:text-slate-400 dark:hover:text-white transition-colors"
        title="Dashboard Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = ROUTE_LABELS[segment] || decodeURIComponent(segment.replace(/-/g, ' '));

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-white capitalize truncate max-w-[150px]">
                {label}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-slate-500 hover:text-brand-navy dark:text-slate-400 dark:hover:text-white transition-colors capitalize truncate max-w-[120px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
