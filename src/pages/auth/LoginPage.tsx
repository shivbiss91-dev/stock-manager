import React, { useState, useEffect } from 'react';
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
import { authService } from '../../services/authService';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertCircle,
  UserCheck,
  Phone,
  User as UserIcon,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid corporate email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const setupSchema = z.object({
  name: z.string().min(2, 'Full name is required (minimum 2 characters)'),
  email: z.string().email('Please enter a valid corporate email address'),
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string().min(4, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SetupFormData = z.infer<typeof setupSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, createInitialAdmin, isLoading, error, clearError, otpPendingEmail } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isFreshInstall, setIsFreshInstall] = useState<boolean | null>(null);

  // Check if system has any registered accounts
  useEffect(() => {
    let isMounted = true;
    authService.hasUsers().then((has) => {
      if (isMounted) {
        setIsFreshInstall(!has);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const setupForm = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const onLoginSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      const result = await login(data.email, data.password);
      if (result.requiresOtp) {
        setShowOtpModal(true);
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      // Handled in authStore
    }
  };

  const onSetupSubmit = async (data: SetupFormData) => {
    clearError();
    try {
      await createInitialAdmin({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      navigate('/dashboard', { replace: true });
    } catch {
      // Handled in authStore
    }
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

          <p className="text-slate-300 text-sm leading-relaxed">
            Real-time multi-hub stock management, compliant statutory e-Invoicing, and high-velocity B2B distribution tailored for Indian wholesale enterprises.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
              <span>AS-2 Inventory Valuation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
              <span>CGST, SGST & IGST Ledgers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
              <span>Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
              <span>Audit Trail & Ledger Logs</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>Enterprise Release 2.1 • FY 2026-27</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-bit Encrypted Ledger
          </span>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-6">
            <Logo size="md" showWordmark={true} />
          </div>

          {isFreshInstall === true ? (
            /* First-Time Administrator Setup Flow */
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-bold border border-brand-orange/30 mb-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Fresh Application Setup</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
                  Create Administrator Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
                  Configure your primary System Administrator account to initialize your clean ERP instance.
                </p>
              </div>

              <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Anand Mahindra"
                  leftIcon={<UserIcon className="w-4 h-4" strokeWidth={1.5} />}
                  error={setupForm.formState.errors.name?.message}
                  {...setupForm.register('name')}
                />

                <Input
                  label="Corporate Work Email"
                  type="email"
                  placeholder="e.g. admin@yourcompany.com"
                  leftIcon={<Mail className="w-4 h-4" strokeWidth={1.5} />}
                  error={setupForm.formState.errors.email?.message}
                  {...setupForm.register('email')}
                />

                <Input
                  label="Mobile Contact Number"
                  type="tel"
                  placeholder="+91 98000 00000"
                  leftIcon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
                  error={setupForm.formState.errors.phone?.message}
                  {...setupForm.register('phone')}
                />

                <Input
                  label="Master Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  error={setupForm.formState.errors.password?.message}
                  {...setupForm.register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  error={setupForm.formState.errors.confirmPassword?.message}
                  {...setupForm.register('confirmPassword')}
                />

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
                  Initialize System & Log In
                </Button>
              </form>
            </div>
          ) : (
            /* Normal Authenticated Sign-In Flow */
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
                  Welcome to StockVista
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
                  Enter your registered work credentials to access your ERP terminal.
                </p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="name@company.com"
                  leftIcon={<Mail className="w-4 h-4" strokeWidth={1.5} />}
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password')}
                />

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-[#9AA0AE] cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35]"
                      {...loginForm.register('rememberMe')}
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
            </div>
          )}
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
