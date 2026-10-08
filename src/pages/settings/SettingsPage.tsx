import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Landmark,
  FileText,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { settingsService, CompanySettings } from '../../services/settingsService';
import { auditLogService } from '../../services/auditLogService';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'invoicing' | 'notifications'>('company');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="p-12 text-center text-slate-400">Loading system settings...</div>;
  }

  const handleInputChange = (field: keyof CompanySettings, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      await settingsService.updateSettings(settings);

      // Audit log the update
      await auditLogService.logAction({
        userId: user?.id || 'usr-001',
        userName: user?.name || 'Administrator',
        userRole: user?.role || 'admin',
        action: 'settings_updated',
        module: 'Settings',
        targetDescription: 'Company profile, GSTIN configuration, and invoice parameters updated',
      });

      addNotification({
        title: 'Settings Saved',
        message: 'System parameters and invoice billing defaults have been updated.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      addNotification({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-xl text-accent-blue border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                System Configuration & Preferences
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory company profile, RTGS bank details, GST default rules, and notification preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.06] pb-2 overflow-x-auto">
        {[
          { id: 'company', label: 'Company & GSTIN', icon: Building2 },
          { id: 'bank', label: 'Bank RTGS Details', icon: Landmark },
          { id: 'invoicing', label: 'Invoicing & Tax Rules', icon: FileText },
          { id: 'notifications', label: 'Alerts & Messages', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-accent-orange text-white shadow-sm'
                  : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Company Profile */}
        {activeTab === 'company' && (
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2">
              Legal Identity & Tax Registration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trade / Display Name
                </label>
                <input
                  type="text"
                  value={settings.tradeName}
                  onChange={(e) => handleInputChange('tradeName', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (15-Character) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={settings.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PAN Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={settings.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Warehouse Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  State & GST State Code
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="col-span-2 px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                  <input
                    type="text"
                    value={settings.stateCode}
                    onChange={(e) => handleInputChange('stateCode', e.target.value)}
                    placeholder="27"
                    className="px-3 py-2.5 font-mono text-center template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Billing Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support / Billing Phone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bank RTGS */}
        {activeTab === 'bank' && (
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2">
              Bank Account for RTGS / NEFT / IMPS Remittance (Printed on Invoices)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2.5 font-mono template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IFSC Code (11-Character) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={settings.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Branch Location
                </label>
                <input
                  type="text"
                  value={settings.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business UPI VPA
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  className="w-full px-3 py-2.5 font-mono template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Invoicing & GST Rules */}
        {activeTab === 'invoicing' && (
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2">
              Billing Defaults & Statutory Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                  className="w-full px-3 py-2.5 font-mono template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Payment Terms (Days)
                </label>
                <input
                  type="number"
                  value={settings.defaultPaymentTermsDays}
                  onChange={(e) => handleInputChange('defaultPaymentTermsDays', Number(e.target.value))}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-Way Bill Mandatory Value Limit (₹)
                </label>
                <input
                  type="number"
                  value={settings.eWayBillThreshold}
                  onChange={(e) => handleInputChange('eWayBillThreshold', Number(e.target.value))}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateEInvoice}
                    onChange={(e) => handleInputChange('autoGenerateEInvoice', e.target.checked)}
                    className="rounded text-accent-orange focus:ring-accent-orange"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Auto-prompt 64-char IRN E-Invoice on invoice finalization
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateEWayBill}
                    onChange={(e) => handleInputChange('autoGenerateEWayBill', e.target.checked)}
                    className="rounded text-accent-orange focus:ring-accent-orange"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Prompt 12-digit E-Way Bill for consignments exceeding ₹50,000
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Terms & Conditions on Tax Invoices
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultTermsAndConditions}
                  onChange={(e) => handleInputChange('defaultTermsAndConditions', e.target.value)}
                  className="w-full px-3 py-2.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2">
              Dispatch Alerts & Warehouse Messaging
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] cursor-pointer template-input hover:border-accent-orange/30 transition">
                <input
                  type="checkbox"
                  checked={settings.lowStockEmailAlerts}
                  onChange={(e) => handleInputChange('lowStockEmailAlerts', e.target.checked)}
                  className="mt-0.5 rounded text-accent-orange focus:ring-accent-orange"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Daily Low Stock Summary Email
                  </span>
                  <span className="text-slate-400">
                    Sends 08:00 AM IST digest of all inventory SKU below safety reorder threshold to purchase manager.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] cursor-pointer template-input hover:border-accent-orange/30 transition">
                <input
                  type="checkbox"
                  checked={settings.smsDispatchAlerts}
                  onChange={(e) => handleInputChange('smsDispatchAlerts', e.target.checked)}
                  className="mt-0.5 rounded text-accent-orange focus:ring-accent-orange"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Inter-Hub Truck Dispatch SMS Notifications
                  </span>
                  <span className="text-slate-400">
                    Notifies recipient warehouse inward team when truck departs Bhiwandi corridor.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] cursor-pointer template-input hover:border-accent-orange/30 transition">
                <input
                  type="checkbox"
                  checked={settings.whatsappInvoicing}
                  onChange={(e) => handleInputChange('whatsappInvoicing', e.target.checked)}
                  className="mt-0.5 rounded text-accent-orange focus:ring-accent-orange"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    WhatsApp Business Invoice Sharing Integration
                  </span>
                  <span className="text-slate-400">
                    Enables one-click PDF and payment link dispatch directly to customer billing contact.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
