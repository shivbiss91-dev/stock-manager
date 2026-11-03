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
  Sparkles,
  AlertCircle,
  UserCheck,
  Phone,
  User as UserIcon,
  PlayCircle,
  Zap,
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
  const { login, loginDemoAdmin, createInitialAdmin, isLoading, error, clearError, otpPendingEmail } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isFreshInstall, setIsFreshInstall] = useState<boolean | null>(null);
  const [isDemoAvailable, setIsDemoAvailable] = useState(false);

  // Check if system has any registered accounts and demo mode availability
  useEffect(() => {
    let isMounted = true;
    authService.hasUsers().then((has) => {
      if (isMounted) {
        setIsFreshInstall(!has);
        setIsDemoAvailable(authService.isDemoLoginConfigured());
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleDemoLogin = async () => {
    clearError();
    try {
      await loginDemoAdmin();
      navigate(from, { replace: true });
    } catch {
      // Handled in authStore
    }
  };

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

          {/* EXPERIENCE B: SEPARATE DEMO ADMIN OPTION (SWEEDAL – DEMO ADMIN) */}
          {isDemoAvailable && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.12] via-brand-orange/[0.08] to-slate-900/40 border-2 border-amber-500/40 dark:border-amber-500/30 shadow-lg relative overflow-hidden group">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-brand-orange text-slate-950 flex items-center justify-center shadow-md font-extrabold flex-shrink-0">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-[#F2F4F8] flex items-center gap-2">
                      <span>Sweedal – Demo Admin</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      One-Click Demo Workspace
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  Instant Access
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-3.5">
                Explore a complete interactive demo workspace pre-loaded with sample Card Holders, Lanyards, Hooks, Button Bags, invoices, orders, and warehouses. <strong>No username, password, or OTP required.</strong>
              </p>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF6B35] to-[#E85924] hover:from-amber-600 hover:to-[#D44A17] text-white font-extrabold text-xs tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <PlayCircle className="w-4 h-4 fill-white/20" />
                <span>Launch Sweedal – Demo Admin Workspace</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <div className="mt-2 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>• Isolated sandboxed storage</span>
                <span>• Production data protected</span>
              </div>
            </div>
          )}

          {/* DIVIDER BETWEEN EXPERIENCES */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
            <span className="absolute bg-[#F4F7FA] dark:bg-[#05060A] px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Actual Business Login
            </span>
          </div>

          {/* EXPERIENCE A: ACTUAL ADMIN LOGIN */}
          {isFreshInstall === true ? (
            /* First-Time Administrator Setup Flow */
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/15 text-brand-orange text-xs font-bold border border-brand-orange/30 mb-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Fresh Application Setup</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
                  Configure Actual Administrator
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
                  Configure your primary corporate administrator account for real production operations.
                </p>
              </div>

              <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-3.5">
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
                  Create Actual Admin & Log In
                </Button>
              </form>
            </div>
          ) : (
            /* Normal Authenticated Sign-In Flow */
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
                  Actual Admin Sign-In
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
                  Enter your registered administrator credentials for production business operations.
                </p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3.5">
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
                  Sign In (Production Access)
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
