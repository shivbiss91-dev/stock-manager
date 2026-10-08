import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { otpPendingEmail, otpMaskedPhone, verifyOtp, resendOtp, isLoading, error, cancelOtp } =
    useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setCanResend(false);
      setResendStatus(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const clean = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    try {
      await verifyOtp(code);
      onSuccess();
    } catch {
      // error handled in store
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const msg = await resendOtp();
      setResendStatus(msg);
      setCanResend(false);
      setCountdown(30);
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    }
  };

  const handleModalClose = () => {
    cancelOtp();
    onClose();
  };

  const fillDemoOtp = () => {
    const demo = ['1', '2', '3', '4', '5', '6'];
    setOtp(demo);
    inputRefs.current[5]?.focus();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Admin 2-Factor Authentication"
      subtitle="Security verification for administrative wholesale access"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-orange/10 text-accent-orange flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            A 6-digit verification code was sent to registered terminal phone{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {otpMaskedPhone || '+91 98200 ****45'}
            </span>{' '}
            and email{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {otpPendingEmail}
            </span>
            .
          </p>
        </div>

        {/* 6 Digit Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 py-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 dark:border-white/[0.08] template-input text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 focus:border-transparent transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendStatus && (
          <p className="text-xs text-emerald-500 text-center font-medium">
            {resendStatus}
          </p>
        )}

        {/* Helper demo button */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
          <span>Demo master code: <strong className="text-accent-orange font-mono">123456</strong></span>
          <button
            type="button"
            onClick={fillDemoOtp}
            className="text-accent-orange font-bold hover:underline"
          >
            Auto-fill
          </button>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="text-accent-orange font-semibold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{canResend ? 'Resend OTP' : `Resend in ${countdown}s`}</span>
          </button>

          <button
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
          >
            Cancel
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={otp.join('').length < 6}
          className="w-full"
        >
          Verify & Sign In to StockVista
        </Button>
      </form>
    </Modal>
  );
};
