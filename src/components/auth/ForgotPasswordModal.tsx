import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuthStore } from '../../store/authStore';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const msg = await forgotPassword(email);
      setStatusMessage(msg);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not process password recovery.'
      );
    }
  };

  const handleClose = () => {
    setEmail('');
    setStatusMessage(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Account Password"
      subtitle="Enter your verified corporate email to receive recovery instructions"
      size="md"
    >
      {statusMessage ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recovery Link Sent
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
              {statusMessage}
            </p>
          </div>
          <Button variant="primary" size="md" onClick={handleClose} className="w-full">
            Back to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Corporate Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. admin@stockvista.in"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="md" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isLoading}
              disabled={!email}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
