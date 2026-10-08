import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types/sales';
import { customerService } from '../../services/customerService';
import { validateGSTIN, getStateCodeFromGSTIN, getStateNameByCode, INDIAN_STATES } from '../../utils/gstUtils';
import { useNotificationStore } from '../../store/notificationStore';

interface AddNewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export const AddNewCustomerModal: React.FC<AddNewCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const { addNotification } = useNotificationStore();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('27'); // Maharashtra default
  const [city, setCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('2500000'); // ₹25 Lakhs
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [tier, setTier] = useState<'Wholesale Standard' | 'Distributor Platinum' | 'Retail Partner'>('Wholesale Standard');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto detect state from GSTIN when typed
  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setGstin(upper);
    if (upper.length >= 2) {
      const code = getStateCodeFromGSTIN(upper);
      if (code && INDIAN_STATES.some((s) => s.code === code)) {
        setStateCode(code);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!companyName.trim()) {
      setErrorMsg('Company or Trade Name is required.');
      return;
    }

    if (!validateGSTIN(gstin)) {
      setErrorMsg('Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 27AAACS1429B1Z4).');
      return;
    }

    if (!city.trim() || !billingAddress.trim()) {
      setErrorMsg('City and Billing Address are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalShipping = sameAsBilling ? billingAddress.trim() : shippingAddress.trim() || billingAddress.trim();
      const stateName = getStateNameByCode(stateCode);

      const created = await customerService.createCustomer({
        name: companyName.trim(),
        companyName: companyName.trim(),
        gstin: gstin.trim(),
        stateCode,
        state: stateName,
        city: city.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: finalShipping,
        pincode: `${stateCode}0001`,
        contactPerson: contactPerson.trim() || 'Managing Director',
        phone: phone.trim() || '+91 98200 00000',
        email: email.trim() || `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        creditLimitINR: parseFloat(creditLimit) || 1000000,
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 30,
        tier,
      });

      addNotification({
        title: 'Customer Created',
        message: `${created.companyName} (${created.gstin}) enrolled successfully.`,
        type: 'success',
      });

      onCustomerCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register customer';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060A]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F2F4F8]">
                Register Wholesale Customer
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                Enrol new B2B buyer with automated GST verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company / Trade Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Trade Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Furnishings & Hardware LLP"
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN (15 Digits) *
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="27AAACS1429B1Z4"
                maxLength={15}
                required
                className="w-full px-3 py-2 text-sm font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
              {gstin && (
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  {validateGSTIN(gstin) ? (
                    <span className="text-emerald-500 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid GSTIN Format ({getStateNameByCode(stateCode)})
                    </span>
                  ) : (
                    <span className="text-amber-500">
                      Must be 15 characters (State: {stateCode})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State of Registration *
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 dark:bg-dark-card"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code} className="dark:bg-dark-card">
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authorized Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mr. Rajesh Patel"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / District *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* Billing Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Billing Address *
              </label>
              <textarea
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Office / Premises street address..."
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {/* Shipping Address toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/20 text-accent-orange focus:ring-accent-orange bg-transparent cursor-pointer"
                />
                <span>Shipping / Warehouse Address is identical to Billing Address</span>
              </label>

              {!sameAsBilling && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery / Warehouse Gate Address
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Consignee warehouse address for delivery..."
                    className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              )}
            </div>

            {/* Commercial terms */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                step="50000"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credit Period
              </label>
              <select
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 dark:bg-dark-card"
              >
                <option value="0" className="dark:bg-dark-card">Immediate / Cash Against Delivery</option>
                <option value="7" className="dark:bg-dark-card">7 Days</option>
                <option value="15" className="dark:bg-dark-card">15 Days</option>
                <option value="30" className="dark:bg-dark-card">30 Days (Standard Net)</option>
                <option value="45" className="dark:bg-dark-card">45 Days</option>
                <option value="60" className="dark:bg-dark-card">60 Days</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-2"
            >
              {isSubmitting ? 'Registering...' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
