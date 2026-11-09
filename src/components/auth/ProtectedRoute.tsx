import React, { useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PermissionAction, Role, AppPermissionModule, hasModuleAccess, APP_MODULES } from '../../types/auth';
import { userService } from '../../services/userService';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: PermissionAction;
  requiredModule?: AppPermissionModule;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  requiredModule,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hasPermission, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Real-time deactivation enforcement: If account was deactivated by Admin, immediately revoke session
  if (!user.isDemo) {
    const liveAccount = userService.getUserByIdSync(user.id);
    if (liveAccount && (liveAccount.status === 'deactivated' || liveAccount.status === 'suspended')) {
      logout();
      return (
        <Navigate
          to="/login"
          state={{ error: 'Your account has been deactivated by the administrator. Session revoked.' }}
          replace
        />
      );
    }
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
            Your current role (<span className="font-semibold capitalize text-brand-navy dark:text-brand-orange">{user.role}</span>) does not have authorization to view this section. Please contact your StockVista administrator.
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

  // Check individual module permission if specified
  if (requiredModule && !hasModuleAccess(user, requiredModule)) {
    const moduleDef = APP_MODULES.find((m) => m.id === requiredModule);
    const moduleName = moduleDef?.label || requiredModule;

    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark-card border border-amber-200 dark:border-amber-900/60 rounded-2xl p-6 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Module Permission Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
            Your staff account does not have access to the <strong className="text-slate-900 dark:text-white">{moduleName}</strong> module.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-500 mb-6">
            Module access is managed by your System Administrator. You can request access through Staff Management.
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
