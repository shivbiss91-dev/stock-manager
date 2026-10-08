import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  Filter,
  Monitor,
  Globe,
  Clock,
  ArrowRight,
  Info,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { auditLogService } from '../../services/auditLogService';
import { AuditLogEntry, AuditActionType } from '../../types/audit';
import { formatDateTime } from '../../utils/dateUtils';
import { useNotificationStore } from '../../store/notificationStore';

export const AuditLogPage: React.FC = () => {
  const { addNotification } = useNotificationStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditLogService.getAuditLogs({
        module: selectedModule,
        action: selectedAction,
        search: searchQuery,
      });
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      addNotification({
        title: 'No Data to Export',
        message: 'There are no audit logs matching your current filters.',
        type: 'warning',
      });
      return;
    }

    const headers = ['ID', 'Timestamp (IST)', 'User', 'Role', 'Action', 'Module', 'Target ID', 'Description', 'Old Value', 'New Value', 'IP Address', 'Device'];
    const rows = logs.map((log) => [
      log.id,
      formatDateTime(log.timestamp),
      `"${log.userName}"`,
      log.userRole,
      log.action,
      log.module,
      log.targetId || '-',
      `"${log.targetDescription.replace(/"/g, '""')}"`,
      `"${(log.oldValue || '-').replace(/"/g, '""')}"`,
      `"${(log.newValue || '-').replace(/"/g, '""')}"`,
      log.ipAddress,
      `"${log.device}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockVista_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification({
      title: 'Audit Log Exported',
      message: `Exported ${logs.length} audit trail records to CSV.`,
      type: 'success',
    });
  };

  const getActionBadgeColor = (action: AuditActionType) => {
    switch (action) {
      case 'approval_granted':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'approval_rejected':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'price_update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'stock_adjustment':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'invoice_created':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'login':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Enterprise Audit Log
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Read-only chronological record of all administrative modifications, logins, and financial events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/[0.08] transition shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, target ID, description, or IP address..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            >
              <option value="all" className="dark:bg-dark-card">All Actions</option>
              <option value="login" className="dark:bg-dark-card">User Login</option>
              <option value="price_update" className="dark:bg-dark-card">Price Updates</option>
              <option value="stock_adjustment" className="dark:bg-dark-card">Stock Adjustments</option>
              <option value="invoice_created" className="dark:bg-dark-card">Invoice Creations</option>
              <option value="approval_granted" className="dark:bg-dark-card">Approvals Granted</option>
              <option value="approval_rejected" className="dark:bg-dark-card">Approvals Rejected</option>
              <option value="grn_received" className="dark:bg-dark-card">GRN Inward</option>
              <option value="transfer_dispatched" className="dark:bg-dark-card">Transfer Dispatched</option>
              <option value="settings_updated" className="dark:bg-dark-card">Settings Updates</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent-blue text-white hover:bg-accent-blue/90 transition shadow-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Module tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Module:
          </span>
          {['all', 'Inventory', 'Sales', 'Purchases', 'Logistics', 'Security', 'Settings'].map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1 text-xs font-medium rounded-xl whitespace-nowrap transition ${
                selectedModule.toLowerCase() === mod.toLowerCase()
                  ? 'bg-accent-orange text-white font-bold shadow-sm'
                  : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              {mod === 'all' ? 'All Modules' : mod}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Timestamp (IST)</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Action & Module</th>
                <th className="px-4 py-3.5">Target & Context</th>
                <th className="px-4 py-3.5">Change Delta (Old ➔ New)</th>
                <th className="px-4 py-3.5">IP & Device</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Loading audit trail events...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{formatDateTime(entry.timestamp)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {entry.id}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {entry.userName}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-white/[0.05] text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                        {entry.userRole}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeColor(
                            entry.action
                          )}`}
                        >
                          {entry.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Module: <strong className="text-slate-600 dark:text-slate-300">{entry.module}</strong>
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                        {entry.targetDescription}
                      </div>
                      {entry.targetId && (
                        <span className="text-[10px] font-mono text-accent-blue dark:text-accent-blue">
                          ID: {entry.targetId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      {entry.oldValue || entry.newValue ? (
                        <div className="space-y-1">
                          {entry.oldValue && (
                            <div className="text-[11px] text-rose-500 line-through">
                              {entry.oldValue}
                            </div>
                          )}
                          {entry.newValue && (
                            <div className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                              {entry.oldValue && <ArrowRight className="w-3 h-3 flex-shrink-0" />}
                              <span>{entry.newValue}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No state change recorded</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{entry.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]" title={entry.device}>
                        <Monitor className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{entry.device}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(entry)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-accent-blue hover:underline transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No audit records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Audit Event Details ({selectedLog.id})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {formatDateTime(selectedLog.timestamp)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/[0.06]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Operator</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedLog.userName} ({selectedLog.userRole})
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">{selectedLog.userId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Module / Action</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">
                    {selectedLog.module} ➔ {selectedLog.action.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Description</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.06]">
                  {selectedLog.targetDescription}
                </p>
              </div>

              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Delta Changes</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] text-rose-500 font-bold block">Previous Value</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-1">{selectedLog.oldValue || '-'}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-500 font-bold block">New Value</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-1">{selectedLog.newValue || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/[0.06] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client IP Address:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser / User Agent:</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{selectedLog.device}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
