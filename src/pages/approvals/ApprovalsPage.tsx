import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  FileText,
  Search,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { approvalsService, ApprovalRequest } from '../../services/approvalsService';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDate } from '../../utils/dateUtils';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const isAdmin = user?.role === 'admin';

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [actionItem, setActionItem] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    approvalsService.getApprovals().then((data) => {
      if (isMounted) {
        setApprovals(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;

    if (actionItem.action === 'reject' && !reviewNotes.trim()) {
      addNotification({
        title: 'Review Note Mandatory',
        message: 'Please provide a clear justification note when rejecting a request.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionItem.action === 'approve') {
        const updated = await approvalsService.approveRequest(
          actionItem.id,
          user?.name || 'Administrator',
          reviewNotes.trim()
        );
        setApprovals(approvals.map((a) => (a.id === updated.id ? updated : a)));
        addNotification({
          title: 'Request Approved',
          message: `${updated.targetTitle} changes have taken effect.`,
          type: 'success',
        });
      } else {
        const updated = await approvalsService.rejectRequest(
          actionItem.id,
          user?.name || 'Administrator',
          reviewNotes.trim()
        );
        setApprovals(approvals.map((a) => (a.id === updated.id ? updated : a)));
        addNotification({
          title: 'Request Rejected',
          message: `${updated.targetTitle} modification request was turned down.`,
          type: 'info',
        });
      }
      setActionItem(null);
      setReviewNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = approvals.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.targetTitle.toLowerCase().includes(q) ||
        a.requestedBy.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Authorization & Approvals Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {approvals.filter((a) => a.status === 'pending').length} Pending Requests
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Two-tier verification queue: non-admin modifications to selling prices, stock adjustments, and special discounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, requested staff member, or reason..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-accent-orange text-white shadow-sm'
                  : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading approvals queue...</div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4 hover:border-accent-orange/40 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'price_adjustment'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : item.type === 'stock_adjustment'
                        ? 'bg-blue-500/10 text-accent-blue border border-blue-500/20'
                        : item.type === 'discount_approval'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {item.type.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.targetTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted {formatDate(item.requestedAt)}</span>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Active Parameter</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 line-through decoration-rose-500">
                    {item.oldValue}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Proposed Value</span>
                  <p className="font-bold text-accent-orange mt-0.5">
                    {item.newValue}
                  </p>
                </div>
              </div>

              {/* Staff Justification */}
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Justification / Client Context:</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 italic">
                  "{item.reason}"
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Requested by <strong className="text-slate-200">{item.requestedBy}</strong> ({item.requestedByRole})
                </p>
              </div>

              {/* Status & Review Notes */}
              {item.status !== 'pending' && (
                <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] text-xs flex items-start gap-2 border border-slate-200 dark:border-white/[0.06]">
                  {item.status === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {item.status} by {item.reviewedBy}
                    </span>
                    {item.reviewNotes && (
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Notes: {item.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons (For Admins) */}
              {item.status === 'pending' && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => setActionItem({ id: item.id, action: 'reject' })}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => setActionItem({ id: item.id, action: 'approve' })}
                        className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Modification</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Pending administrator review
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 template-card rounded-[20px] border border-slate-200 dark:border-white/[0.06] space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No approval requests match filter
            </p>
            <p className="text-xs">All submitted staff requests have been processed.</p>
          </div>
        )}
      </div>

      {/* Review Dialog Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {actionItem.action === 'approve' ? 'Approve Modification Request' : 'Reject Modification Request'}
            </h3>
            <p className="text-xs text-slate-400">
              {actionItem.action === 'approve'
                ? 'Approving will commit the proposed price/stock parameter change to the database.'
                : 'Please explain why this modification cannot be accepted.'}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Review Notes {actionItem.action === 'reject' && '*'}
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    actionItem.action === 'approve'
                      ? 'e.g. Approved per sales manager confirmation'
                      : 'e.g. Special pricing below mill minimum margin floor'
                  }
                  required={actionItem.action === 'reject'}
                  className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActionItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition ${
                    actionItem.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionItem.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
