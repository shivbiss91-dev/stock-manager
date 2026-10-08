import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  User,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  CreditCard,
  Trash2,
  Copy,
  Check,
  Printer,
  Share2,
  FileCheck,
  Truck,
  Download,
  HelpCircle,
  QrCode,
  ShieldCheck,
  ChevronDown,
  Info,
  X,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { invoiceService, COMPANY_GSTIN } from '../../services/invoiceService';
import { inventoryService } from '../../services/inventoryService';
import { Customer, Invoice, InvoiceStatus } from '../../types/sales';
import { ComputedInventoryItem } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { numberToWordsINR } from '../../utils/numberToWords';
import { formatDate } from '../../utils/dateUtils';
import { INDIAN_STATES, toPaise, toINR, calculateGSTBreakup } from '../../utils/gstUtils';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { AddNewCustomerModal } from '../../components/sales/AddNewCustomerModal';
import { PrintInvoiceModal } from '../../components/sales/PrintInvoiceModal';
import { EWayBillModal } from '../../components/sales/EWayBillModal';
import { ShareInvoiceModal } from '../../components/sales/ShareInvoiceModal';

interface LineItemForm {
  key: string;
  itemId: string;
  name: string;
  sku: string;
  hsnCode: string;
  image?: string;
  quantity: number;
  availableStock: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number;
  isCustomLine?: boolean;
}

export const CreateInvoicePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const preselectedItemId = searchParams.get('itemId');

  // Header State
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-27-00041');
  const [copiedInvoiceNumber, setCopiedInvoiceNumber] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<InvoiceStatus>('sent');

  // Step 1: Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // Step 2: Delivery & Supply
  const [shippingAddress, setShippingAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState('27'); // Default Maharashtra

  // Step 3: Payment Terms
  const [paymentTerms, setPaymentTerms] = useState<number>(30); // 30 days default
  const [paymentMode, setPaymentMode] = useState('Credit (30 Days)');
  const [partPaymentAmount, setPartPaymentAmount] = useState<number>(0);

  // Step 4: Line Items
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState<ComputedInventoryItem[]>([]);
  const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

  // Modals & Generated Invoices
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEWayModalOpen, setIsEWayModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave dirty tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load next invoice number & preselected item
  useEffect(() => {
    invoiceService.getNextInvoiceNumber().then(setInvoiceNumber);

    // Default select first customer
    customerService.getCustomers().then((list) => {
      if (list.length > 0 && !selectedCustomer) {
        const first = list[0];
        setSelectedCustomer(first);
        setShippingAddress(first.shippingAddress || first.billingAddress);
        setPlaceOfSupplyCode(first.stateCode);
        setPaymentTerms(first.paymentTermsDays || 30);
      }
    });

    if (preselectedItemId) {
      inventoryService.getItemById(preselectedItemId).then((item) => {
        if (item) {
          addItemToInvoice(item);
        }
      });
    }
  }, [preselectedItemId]);

  // Customer search debounced
  useEffect(() => {
    if (!customerSearch.trim()) {
      customerService.getCustomers().then(setCustomerResults);
      return;
    }
    const timer = setTimeout(() => {
      customerService.getCustomers(customerSearch).then(setCustomerResults);
    }, 150);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Item catalog search debounced
  useEffect(() => {
    if (!itemSearchQuery.trim()) {
      inventoryService.getItems({ pageSize: 8 }).then((res) => setItemSearchResults(res.items));
      return;
    }
    const timer = setTimeout(() => {
      inventoryService
        .getItems({ search: itemSearchQuery.trim(), pageSize: 12 })
        .then((res) => setItemSearchResults(res.items));
    }, 150);
    return () => clearTimeout(timer);
  }, [itemSearchQuery]);

  // Calculate Due Date based on invoice date + payment terms
  const dueDate = useMemo(() => {
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + paymentTerms);
    return d.toISOString().split('T')[0];
  }, [invoiceDate, paymentTerms]);

  // Place of supply detection
  const isInterState = placeOfSupplyCode !== '27'; // 27 = Maharashtra (Warehouse base)

  // Calculations: integer paise precision to match rules
  const calculations = useMemo(() => {
    let subtotalTaxablePaise = 0;
    let totalDiscountPaise = 0;
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    const computedRows = lineItems.map((row) => {
      const grossPaise = toPaise(row.quantity * row.rate);
      const discPaise = Math.round((grossPaise * row.discountPercent) / 100);
      const taxablePaise = grossPaise - discPaise;
      const taxableINR = toINR(taxablePaise);

      totalDiscountPaise += discPaise;
      subtotalTaxablePaise += taxablePaise;

      let rowCgst = 0;
      let rowSgst = 0;
      let rowIgst = 0;

      if (isInterState) {
        const igstP = Math.round((taxablePaise * row.gstRate) / 100);
        rowIgst = toINR(igstP);
        igstPaise += igstP;
      } else {
        const halfRate = row.gstRate / 2;
        const cgstP = Math.round((taxablePaise * halfRate) / 100);
        const sgstP = Math.round((taxablePaise * halfRate) / 100);
        rowCgst = toINR(cgstP);
        rowSgst = toINR(sgstP);
        cgstPaise += cgstP;
        sgstPaise += sgstP;
      }

      const rowTax = isInterState ? rowIgst : rowCgst + rowSgst;
      const rowTotal = taxableINR + rowTax;

      return {
        ...row,
        taxableINR,
        rowCgst,
        rowSgst,
        rowIgst,
        rowTax,
        rowTotal,
      };
    });

    const subtotalTaxable = toINR(subtotalTaxablePaise);
    const totalDiscount = toINR(totalDiscountPaise);
    const cgstTotal = toINR(cgstPaise);
    const sgstTotal = toINR(sgstPaise);
    const igstTotal = toINR(igstPaise);
    const totalTax = isInterState ? igstTotal : cgstTotal + sgstTotal;

    const rawGrandTotal = subtotalTaxable + totalTax;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

    const balanceDue = Math.max(0, grandTotal - partPaymentAmount);

    return {
      computedRows,
      subtotalTaxable,
      totalDiscount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalTax,
      roundOff,
      grandTotal,
      balanceDue,
    };
  }, [lineItems, isInterState, partPaymentAmount]);

  // Credit limit evaluation
  const isCreditLimitExceeded = useMemo(() => {
    if (!selectedCustomer) return false;
    const projectedOutstanding = selectedCustomer.outstandingBalanceINR + calculations.grandTotal;
    return projectedOutstanding > selectedCustomer.creditLimitINR;
  }, [selectedCustomer, calculations.grandTotal]);

  const creditDeficit = useMemo(() => {
    if (!selectedCustomer) return 0;
    const projected = selectedCustomer.outstandingBalanceINR + calculations.grandTotal;
    return Math.max(0, projected - selectedCustomer.creditLimitINR);
  }, [selectedCustomer, calculations.grandTotal]);

  // Add Item to lines
  const addItemToInvoice = (item: ComputedInventoryItem) => {
    setHasUnsavedChanges(true);
    // If item already in lines, increment qty
    const existingIndex = lineItems.findIndex((l) => l.itemId === item.id);
    if (existingIndex >= 0) {
      setLineItems((prev) =>
        prev.map((row, idx) =>
          idx === existingIndex ? { ...row, quantity: row.quantity + 1 } : row
        )
      );
    } else {
      // Determine wholesale volume discount (e.g. 5% if high tier)
      let initialDiscount = 0;
      if (selectedCustomer?.tier === 'Distributor Platinum') initialDiscount = 5;

      setLineItems((prev) => [
        ...prev,
        {
          key: `row-${Date.now()}-${item.id}`,
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          hsnCode: item.hsnCode,
          image: item.images[0],
          quantity: 10,
          availableStock: item.currentStock,
          unit: item.unit,
          rate: item.sellingPrice,
          discountPercent: initialDiscount,
          gstRate: item.gstRate,
        },
      ]);
    }
    setIsItemSearchOpen(false);
    setItemSearchQuery('');
  };

  // Add Custom Line (freight, packaging, etc.)
  const addCustomLine = () => {
    setHasUnsavedChanges(true);
    setLineItems((prev) => [
      ...prev,
      {
        key: `custom-${Date.now()}`,
        itemId: `custom-${Date.now()}`,
        name: 'Logistics Freight & Loading Charges',
        sku: 'SRV-FREIGHT',
        hsnCode: '996511',
        quantity: 1,
        availableStock: 9999,
        unit: 'service',
        rate: 3500,
        discountPercent: 0,
        gstRate: 18,
        isCustomLine: true,
      },
    ]);
  };

  const removeLineItem = (key: string) => {
    setHasUnsavedChanges(true);
    setLineItems((prev) => prev.filter((r) => r.key !== key));
  };

  const updateLineItem = (key: string, patch: Partial<LineItemForm>) => {
    setHasUnsavedChanges(true);
    setLineItems((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const updated = { ...r, ...patch };
        // Apply wholesale tier if quantity >= 50
        if (patch.quantity !== undefined && patch.quantity >= 50 && updated.discountPercent === 0) {
          updated.discountPercent = 4; // Automatic 4% bulk discount tier
        }
        return updated;
      })
    );
  };

  const copyInvoiceNumberToClipboard = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedInvoiceNumber(true);
    setTimeout(() => setCopiedInvoiceNumber(false), 2000);
  };

  // Select customer handler
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setShippingAddress(cust.shippingAddress || cust.billingAddress);
    setPlaceOfSupplyCode(cust.stateCode);
    setPaymentTerms(cust.paymentTermsDays || 30);
    setIsCustomerDropdownOpen(false);
    setCustomerSearch('');
    setHasUnsavedChanges(true);
  };

  // Handle Save / Submit
  const handleSaveInvoice = async (saveStatus: InvoiceStatus = 'sent', autoOpenPrint = false) => {
    if (!selectedCustomer) {
      addNotification({
        title: 'Customer Required',
        message: 'Please select a wholesale customer before generating the invoice.',
        type: 'warning',
      });
      return null;
    }

    if (lineItems.length === 0) {
      addNotification({
        title: 'No Items Added',
        message: 'Please add at least one line item to generate a valid tax invoice.',
        type: 'warning',
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      const stateObj = INDIAN_STATES.find((s) => s.code === placeOfSupplyCode);
      const stateName = stateObj ? stateObj.name : 'Maharashtra';

      const newInv = await invoiceService.createInvoice({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.companyName,
        customerGstin: selectedCustomer.gstin,
        billingAddress: selectedCustomer.billingAddress,
        shippingAddress: shippingAddress.trim() || selectedCustomer.billingAddress,
        placeOfSupplyStateCode: placeOfSupplyCode,
        placeOfSupplyStateName: stateName,
        warehouseId: 'wh-001',
        warehouseName: 'Bhiwandi Central Hub (MH)',
        date: new Date(invoiceDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        paymentMode,
        amountPaid: partPaymentAmount,
        status: saveStatus,
        createdBy: user?.name || 'Authorized Billing Officer',
        items: lineItems.map((row) => ({
          itemId: row.itemId,
          name: row.name,
          sku: row.sku,
          hsnCode: row.hsnCode,
          quantity: row.quantity,
          unit: row.unit,
          rate: row.rate,
          discountPercent: row.discountPercent,
          gstRate: row.gstRate,
        })),
      });

      setCreatedInvoice(newInv);
      setHasUnsavedChanges(false);

      addNotification({
        title: saveStatus === 'draft' ? 'Draft Saved' : 'Invoice Generated',
        message: `${newInv.invoiceNumber} for ${formatINR(newInv.grandTotal)} generated successfully.`,
        type: 'success',
      });

      if (autoOpenPrint) {
        setIsPrintModalOpen(true);
      }

      return newInv;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invoice';
      addNotification({
        title: 'Invoice Error',
        message: msg,
        type: 'error',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // E-Invoice Generation
  const handleGenerateEInvoice = async () => {
    let inv = createdInvoice;
    if (!inv) {
      inv = await handleSaveInvoice('sent', false);
    }
    if (!inv) return;

    try {
      const updated = await invoiceService.generateEInvoice(inv.id);
      setCreatedInvoice(updated);
      addNotification({
        title: 'E-Invoice IRN Generated',
        message: `IRN Hash registered with IRP Portal for ${updated.invoiceNumber}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'E-Invoice generation failed';
      addNotification({ title: 'IRP Validation Error', message: msg, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Bar matching Image 4 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Create GST Tax Invoice
            </h1>
            {/* Status Chip */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : status === 'partially_paid'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  : status === 'draft'
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  : 'bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-accent-teal'
              }`}
            >
              ● {status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Section 31 CGST Act compliant tax invoice with automatic HSN lookup and place-of-supply classification.
          </p>
        </div>

        {/* Invoice Metadata (Invoice Number, Date Picker) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Invoice Number with copy */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-[11px] text-slate-400 mr-2">Invoice No:</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {invoiceNumber}
            </span>
            <button
              onClick={copyInvoiceNumberToClipboard}
              className="ml-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              title="Copy Invoice Number"
            >
              {copiedInvoiceNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-[11px] text-slate-400 mr-1.5">Date:</span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Form Sections (8 Cols) vs Sticky Invoice Summary (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Steps 1, 2, 3, 4 (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Customer Selection */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-accent-teal text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Customer & Tax Identity
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="text-xs font-semibold text-primary-600 dark:text-accent-teal hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Customer</span>
              </button>
            </div>

            {/* Customer Search & Picker */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  placeholder="Search buyer by company name, GSTIN (e.g. 27AAAC...), or phone..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {isCustomerDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {customerResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{cust.companyName}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                          GSTIN: {cust.gstin} • {cust.city}, {cust.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {cust.tier}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Limit: {formatINR(cust.creditLimitINR)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Customer Card with Credit Limit Warning */}
            {selectedCustomer && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedCustomer.companyName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Contact: {selectedCustomer.contactPerson} • {selectedCustomer.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {selectedCustomer.gstin}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedCustomer.tier}
                    </span>
                  </div>
                </div>

                {/* Credit Limit & Outstanding Balance meter */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Approved Credit Limit</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(selectedCustomer.creditLimitINR)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Current Outstanding</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {formatINR(selectedCustomer.outstandingBalanceINR)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Payment Terms</span>
                    <p className="font-semibold text-primary-600 dark:text-accent-teal">
                      {selectedCustomer.paymentTermsDays} Days Net
                    </p>
                  </div>
                </div>

                {/* Credit Limit Exceeded Alert */}
                {isCreditLimitExceeded && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Credit Limit Warning</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                        This billing would push the customer's total exposure to{' '}
                        <strong>
                          {formatINR(selectedCustomer.outstandingBalanceINR + calculations.grandTotal)}
                        </strong>
                        , exceeding their credit limit by <strong>{formatINR(creditDeficit)}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2 & STEP 3: Delivery Address & Commercial Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 2: Delivery & Place of Supply */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-accent-teal text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Place of Supply & Delivery
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Place of Supply (State) *
                </label>
                <select
                  value={placeOfSupplyCode}
                  onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isInterState
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    ● {isInterState ? 'INTER-STATE (IGST Applied)' : 'INTRA-STATE (CGST + SGST Applied)'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Consignee Shipping Address
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-[11px] text-primary-600 dark:text-accent-teal hover:underline"
                  >
                    {isEditingAddress ? 'Save' : 'Change Address'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    {shippingAddress || 'No address specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3: Payment Terms & Mode */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-accent-teal text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Terms & Modes
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Terms & Due Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="0">Immediate / Cash</option>
                    <option value="7">7 Days</option>
                    <option value="15">15 Days</option>
                    <option value="30">30 Days Net</option>
                    <option value="45">45 Days</option>
                    <option value="60">60 Days</option>
                  </select>

                  <div className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Due:</span>
                    <span className="font-semibold">{formatDate(dueDate)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Credit (30 Days)">Credit (Standard Net)</option>
                  <option value="Bank Transfer (RTGS/NEFT)">Bank Transfer (RTGS / NEFT)</option>
                  <option value="UPI / QR Code">UPI / Instant QR</option>
                  <option value="Cheque / Draft">Cheque / Demand Draft</option>
                  <option value="Cash Against Delivery">Cash Against Delivery (CAD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advance / Part Payment (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={partPaymentAmount || ''}
                  onChange={(e) => setPartPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Add Line Items */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-accent-teal text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Invoice Line Items
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Item rates are exclusive of GST. Wholesale price tiers apply automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addCustomLine}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                >
                  + Add Custom Line
                </button>
              </div>
            </div>

            {/* Barcode & Catalog Item Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={itemSearchQuery}
                onFocus={() => setIsItemSearchOpen(true)}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setIsItemSearchOpen(true);
                }}
                placeholder="Scan barcode, enter SKU, HSN, or search product name..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* Item Search Dropdown */}
              {isItemSearchOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {itemSearchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => addItemToInvoice(prod)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{prod.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            SKU: {prod.sku} • HSN: {prod.hsnCode} • Stock: {prod.currentStock} {prod.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {formatINR(prod.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">+{prod.gstRate}% GST</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items Table matching Image 4 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Item & HSN</th>
                    <th className="py-2.5 px-2 font-semibold">SKU</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-28">Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-right w-24">Rate (₹)</th>
                    <th className="py-2.5 px-2 font-semibold text-right w-20">Disc (%)</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-16">GST %</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-28">Amount (₹)</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {calculations.computedRows.length > 0 ? (
                    calculations.computedRows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {/* Item Name & HSN */}
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-slate-900 dark:text-white leading-tight">
                            {row.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>HSN: {row.hsnCode}</span>
                            {row.quantity > row.availableStock && (
                              <span className="text-amber-600 dark:text-amber-400 font-sans font-semibold">
                                (Exceeds stock: {row.availableStock} {row.unit})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.sku}
                        </td>

                        {/* Quantity Stepper */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 w-24 mx-auto">
                            <button
                              type="button"
                              onClick={() =>
                                updateLineItem(row.key, { quantity: Math.max(1, row.quantity - 1) })
                              }
                              className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) =>
                                updateLineItem(row.key, {
                                  quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="w-10 text-center text-xs font-semibold bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateLineItem(row.key, { quantity: row.quantity + 1 })}
                              className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Rate */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={row.rate}
                            onChange={(e) =>
                              updateLineItem(row.key, {
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-1.5 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.discountPercent}
                            onChange={(e) =>
                              updateLineItem(row.key, {
                                discountPercent: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-14 px-1.5 py-1 text-right text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-2.5 px-2 text-center font-medium">
                          {row.gstRate}%
                        </td>

                        {/* Amount (taxable + tax) */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatINR(row.rowTotal)}
                        </td>

                        {/* Delete button */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(row.key)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No items added yet. Search or scan an item above to add to invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sticky Invoice Summary (4 Cols) matching Image 4 */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Invoice Summary & Tax Ledger
            </h3>

            {/* Calculations lines */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  Taxable Subtotal
                  <Info className="w-3 h-3 text-slate-400" title="Sum of all taxable line items" />
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatINR(calculations.subtotalTaxable)}
                </span>
              </div>

              {calculations.totalDiscount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Trade Discount</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    -{formatINR(calculations.totalDiscount)}
                  </span>
                </div>
              )}

              {/* CGST + SGST vs IGST */}
              {isInterState ? (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Integrated GST (IGST)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatINR(calculations.igstTotal)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Central GST (CGST)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatINR(calculations.cgstTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>State GST (SGST)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatINR(calculations.sgstTotal)}
                    </span>
                  </div>
                </>
              )}

              {calculations.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off</span>
                  <span>{calculations.roundOff > 0 ? `+₹${calculations.roundOff}` : `-₹${Math.abs(calculations.roundOff)}`}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-3 border-t-2 border-slate-900 dark:border-slate-700 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block uppercase">
                    Grand Total
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Inclusive of all taxes</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                  {formatINR(calculations.grandTotal)}
                </span>
              </div>

              {/* Amount in words */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">
                  Amount in Words:
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {numberToWordsINR(calculations.grandTotal)}
                </p>
              </div>

              {/* Part payment balance */}
              {partPaymentAmount > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Balance Payable:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatINR(calculations.balanceDue)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons matching Template */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveInvoice('sent', true)}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white shadow-sm transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print & Save Tax Invoice</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGenerateEInvoice}
                  disabled={isSubmitting}
                  className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-[#F2F4F8] transition flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-brand-orange" />
                  <span>E-Invoice IRN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (createdInvoice) {
                      setIsEWayModalOpen(true);
                    } else {
                      handleSaveInvoice('sent', false).then((inv) => {
                        if (inv) setIsEWayModalOpen(true);
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-[#F2F4F8] transition flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-[#3B5BFF]" />
                  <span>E-Way Bill</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice('draft')}
                  disabled={isSubmitting}
                  className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-[#F2F4F8] transition"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (createdInvoice) {
                      setIsShareModalOpen(true);
                    } else {
                      handleSaveInvoice('sent', false).then((inv) => {
                        if (inv) setIsShareModalOpen(true);
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  className="py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-[#F2F4F8] transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Share Invoice</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Links */}
            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <p>All amounts computed in Indian Rupees (₹)</p>
              <p>
                Company GSTIN: <strong className="font-mono text-slate-600 dark:text-slate-300">{COMPANY_GSTIN}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddCustomerModalOpen && (
        <AddNewCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          onCustomerCreated={(newCust) => handleSelectCustomer(newCust)}
        />
      )}

      {isPrintModalOpen && createdInvoice && (
        <PrintInvoiceModal
          invoice={createdInvoice}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isEWayModalOpen && createdInvoice && (
        <EWayBillModal
          invoice={createdInvoice}
          isOpen={isEWayModalOpen}
          onClose={() => setIsEWayModalOpen(false)}
          onEWayBillGenerated={(updated) => setCreatedInvoice(updated)}
        />
      )}

      {isShareModalOpen && createdInvoice && (
        <ShareInvoiceModal
          invoice={createdInvoice}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
