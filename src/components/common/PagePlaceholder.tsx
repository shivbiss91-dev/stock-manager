import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

interface PagePlaceholderProps {
  title: string;
  subtitle: string;
  category: string;
  phaseNumber: number;
  phaseName: string;
  actions?: React.ReactNode;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  subtitle,
  category,
  phaseNumber,
  phaseName,
  actions,
}) => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-teal dark:text-brand-orange">
              {category}
            </span>
            <Badge variant="teal" size="sm">
              Phase {phaseNumber} Target
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main card */}
      <Card
        title={`${title} Module`}
        subtitle={`Scheduled for development in Phase ${phaseNumber} (${phaseName})`}
        className="border-dashed"
      >
        <div className="py-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 dark:bg-brand-orange/10 text-brand-teal dark:text-brand-orange flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Phase 1 Foundation Ready
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The shell, design system, Indian localisation (₹ formatINR, GST calculation, Indian calendar), authentication, role access control, and routing have been established.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active User:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {user?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active Role:</span>
              <span className="font-semibold capitalize text-brand-navy dark:text-brand-orange">
                {user?.role} ({user?.roleTitle})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Role Status:</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Authorized
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard Overview
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
