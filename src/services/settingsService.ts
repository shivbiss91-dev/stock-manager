import { StorageService, STORAGE_KEYS } from './storageService';

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  cin: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email: string;
  phone: string;
  website: string;

  // Bank details
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;

  // Invoicing rules
  invoicePrefix: string;
  defaultPaymentTermsDays: number;
  autoGenerateEInvoice: boolean;
  autoGenerateEWayBill: boolean;
  eWayBillThreshold: number;
  defaultTermsAndConditions: string;

  // Notifications
  lowStockEmailAlerts: boolean;
  smsDispatchAlerts: boolean;
  whatsappInvoicing: boolean;
}

const CLEAN_DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  tradeName: '',
  gstin: '',
  pan: '',
  cin: '',
  address: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  email: '',
  phone: '',
  website: '',

  bankName: '',
  accountName: '',
  accountNumber: '',
  ifscCode: '',
  branch: '',
  upiId: '',

  invoicePrefix: 'INV',
  defaultPaymentTermsDays: 30,
  autoGenerateEInvoice: false,
  autoGenerateEWayBill: false,
  eWayBillThreshold: 50000,
  defaultTermsAndConditions:
    '1. Goods once sold will not be taken back without prior authorization.\n2. Payment due strictly as per agreed terms.\n3. Subject to local jurisdiction.',

  lowStockEmailAlerts: true,
  smsDispatchAlerts: false,
  whatsappInvoicing: false,
};

export const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<CompanySettings>(STORAGE_KEYS.SETTINGS, CLEAN_DEFAULT_SETTINGS);
  },

  async updateSettings(patch: Partial<CompanySettings>): Promise<CompanySettings> {
    await new Promise((res) => setTimeout(res, 50));
    const current = StorageService.get<CompanySettings>(STORAGE_KEYS.SETTINGS, CLEAN_DEFAULT_SETTINGS);
    const updated = { ...current, ...patch };
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  /**
   * Helper to seed settings for testing
   */
  _seedSettingsForTesting(settings: Partial<CompanySettings>): void {
    const updated = { ...CLEAN_DEFAULT_SETTINGS, ...settings };
    StorageService.set(STORAGE_KEYS.SETTINGS, updated);
  },
};
