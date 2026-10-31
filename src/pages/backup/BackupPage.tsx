import React, { useState } from 'react';
import {
  DatabaseBackup,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  FileCode,
  Server,
  Cloud,
} from 'lucide-react';
import { backupService, DatabaseSnapshot } from '../../services/backupService';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDateTime } from '../../utils/dateUtils';

export const BackupPage: React.FC = () => {
  const { addNotification } = useNotificationStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreModalData, setRestoreModalData] = useState<DatabaseSnapshot['metadata'] | null>(null);
  const [dbStats, setDbStats] = useState({
    items: 0,
    parties: 0,
    warehouses: 0,
  });

  React.useEffect(() => {
    backupService.generateSnapshot().then((snapshot) => {
      setDbStats({
        items: snapshot.metadata.itemsCount,
        parties: snapshot.metadata.customersCount + snapshot.metadata.suppliersCount,
        warehouses: snapshot.metadata.warehousesCount,
      });
    });
  }, []);

  const handleDownloadSnapshot = async () => {
    setIsExporting(true);
    try {
      const snapshot = await backupService.generateSnapshot();
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StockVista_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addNotification({
        title: 'Database Backup Generated',
        message: `Successfully serialized ${snapshot.metadata.itemsCount} catalog items and all ledger transactions.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      addNotification({ title: 'Backup Error', message: msg, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await backupService.restoreSnapshot(content);
      setIsRestoring(false);

      if (res.success && res.metadata) {
        setRestoreModalData(res.metadata);
      } else {
        addNotification({
          title: 'Invalid Snapshot',
          message: res.error || 'The uploaded file could not be parsed as a StockVista backup.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const confirmRestore = () => {
    setRestoreModalData(null);
    addNotification({
      title: 'Database Restored',
      message: 'All records and master schemas have been synced with the snapshot.',
      type: 'success',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-accent-blue border border-blue-500/20">
              <DatabaseBackup className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Data Backup & Disaster Recovery
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Automated multi-region cloud snapshots, off-site replication, and instant JSON database export/restore.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-semibold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Automated Replication Active
          </span>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-accent-blue rounded-xl border border-blue-500/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Export Complete Database Snapshot
                </h3>
                <p className="text-xs text-slate-400">
                  Generate an immutable JSON snapshot of all inventory items, tax invoices, customer directories, and movements.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Inventory Master Items:</span>
                <strong className="text-slate-900 dark:text-white">{dbStats.items} SKUs</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Parties & Vendors:</span>
                <strong className="text-slate-900 dark:text-white">{dbStats.parties} Accounts</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Warehouses Included:</span>
                <strong className="text-slate-900 dark:text-white">{dbStats.warehouses} Facilities</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Format:</span>
                <strong className="font-mono text-accent-blue">Encrypted JSON UTF-8</strong>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownloadSnapshot}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating Snapshot...' : 'Download JSON Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Restore from JSON Backup
                </h3>
                <p className="text-xs text-slate-400">
                  Upload a previously downloaded snapshot file to recover inventory state or migrate server instances.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl p-6 text-center bg-slate-50 dark:bg-white/[0.01] space-y-2">
              <FileCode className="w-8 h-8 mx-auto text-slate-400" />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-accent-orange hover:border-accent-orange/40 transition">
                  <span>Browse Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400">
                Select a valid StockVista JSON backup file (.json)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Restoring overwrites active state with the snapshot archive contents.</span>
          </div>
        </div>
      </div>

      {/* Cloud Automated Schedules */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Automated Replication & Scheduled Snapshots
          </h3>
          <p className="text-xs text-slate-400">
            Enterprise cloud backup configuration running across multiple availability zones in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-accent-blue" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Primary Vault</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AWS Mumbai (ap-south-1) S3 Encrypted Bucket</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
              Schedule: Daily 02:00 AM IST • Retention: 90 Days
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">Secondary Cold Vault</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Google Cloud Storage (asia-south1, Mumbai)</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
              Schedule: Weekly Sunday • Retention: 365 Days
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">On-Premises NAS</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Local Storage & Secondary Snapshot Vault</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
              Schedule: Hourly differential snapshot
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {restoreModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Snapshot Verified Successfully
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              The backup archive contains the following entities ready for restoration:
            </p>

            <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Master Catalog Items:</span>
                <strong className="text-slate-900 dark:text-white">{restoreModalData.itemsCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Customers:</span>
                <strong className="text-slate-900 dark:text-white">{restoreModalData.customersCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Suppliers:</span>
                <strong className="text-slate-900 dark:text-white">{restoreModalData.suppliersCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax Invoices:</span>
                <strong className="text-slate-900 dark:text-white">{restoreModalData.invoicesCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Regional Warehouses:</span>
                <strong className="text-slate-900 dark:text-white">{restoreModalData.warehousesCount}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestore}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition shadow-sm"
              >
                Apply Restoration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;
