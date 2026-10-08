import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PermissionAction, Role } from '../../types/auth';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: PermissionAction;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hasPermission } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role restrictions if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark-card border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Restricted Access
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Your current role (<span className="font-semibold capitalize text-brand-navy dark:text-brand-orange">{user.role}</span>) does not have authorization to view this section. Please contact your StockVista administrator or switch to an authorized demo profile.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check action permissions if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark-card border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Permission Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            You do not possess the required permission (<code className="font-mono text-rose-500">{requiredPermission}</code>) to access this feature.
          </p>
          <Link to="/dashboard">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
