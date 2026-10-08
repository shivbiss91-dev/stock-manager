import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { OtpModal } from '../../components/auth/OtpModal';
import { ForgotPasswordModal } from '../../components/auth/ForgotPasswordModal';
import { useAuthStore } from '../../store/authStore';
import { MOCK_USERS } from '../../data/users';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid corporate email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, otpPendingEmail } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@stockvista.in',
      password: 'admin123',
      rememberMe: true,
    },
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      const result = await login(data.email, data.password);
      if (result.requiresOtp) {
        setShowOtpModal(true);
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      // Handled in store
    }
  };

  const handleSelectDemoUser = (user: typeof MOCK_USERS[0]) => {
    setValue('email', user.email);
    setValue('password', user.passwordHash);
    clearError();
  };

  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FA] dark:bg-[#05060A] text-slate-800 dark:text-[#F2F4F8] transition-colors relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#8A3A1A]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#3B5BFF]/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Left Column: Brand Hero & Indian Wholesale Context (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B1F3A] dark:bg-[#070913] text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-200/50 dark:border-white/[0.06]">
        <div className="relative z-10">
          <Logo size="lg" className="text-white" showWordmark={true} />
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-white/[0.06] border border-white/15 text-xs font-semibold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Enterprise B2B Wholesale Inventory & Billing</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Streamlined Warehouse Logistics & Multi-State GST Billing
          </h1>

          <p className="text-slate-300 dark:text-[#9AA0AE] text-sm leading-relaxed">
            StockVista empowers Indian wholesale manufacturers and distributors with real-time stock tracking across 4 central hubs, HSN tax automation, and instant e-invoicing.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-[#1A1D26] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#3B5BFF]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold">4 Major Hubs</p>
                <p className="text-xs text-slate-400">Bhiwandi, Panvel, Okhla, Peenya</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-[#1A1D26] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-orange" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold">GST Compliant</p>
                <p className="text-xs text-slate-400">CGST/SGST, IGST & E-Way Bills</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          &copy; 2026 StockVista Logistics Technologies Pvt. Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Column: Login Card & Demo Selector */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Logo size="lg" showWordmark={true} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Sign In to Terminal
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
              Select a pre-configured role or enter your credentials
            </p>
          </div>

          {/* Demo User Fast Selectors */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.08]">
            <p className="text-[11px] font-bold text-slate-500 dark:text-[#9AA0AE] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Demo Profiles</span>
              <span className="text-[10px] text-brand-orange font-normal">
                Click to autofill
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectDemoUser(u)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:border-brand-orange text-left transition-all hover:shadow-sm group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center font-bold text-xs text-brand-orange flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-[#F2F4F8] truncate group-hover:text-brand-orange">
                      {u.name}
                    </p>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">
                      {u.role} {u.requiresOtp ? '(2FA)' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="e.g. admin@stockvista.in"
              leftIcon={<Mail className="w-4 h-4" strokeWidth={1.5} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-[#9AA0AE] cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35]"
                  {...register('rememberMe')}
                />
                <span>Remember this terminal</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-brand-orange font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full"
            >
              Sign In to StockVista
            </Button>
          </form>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-400">
            <strong>Admin Security Note:</strong> Logging in as <code>admin@stockvista.in</code> triggers the 2-Factor OTP verification modal (demo OTP: <code>123456</code>). Manager, Staff, and Viewer profiles log in directly.
          </div>
        </div>
      </div>

      {/* Modals */}
      <OtpModal
        isOpen={showOtpModal || !!otpPendingEmail}
        onClose={() => setShowOtpModal(false)}
        onSuccess={handleOtpSuccess}
      />

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};
