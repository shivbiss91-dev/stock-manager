import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, Clock } from 'lucide-react';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_SECONDS = 60; // 60 seconds warning

export const AutoLogoutWarningModal: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS);
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleEvent = () => {
      // Only reset activity silently if warning modal is not currently open
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));

    // Periodic check for inactivity
    timerRef.current = setInterval(() => {
      const inactiveFor = Date.now() - lastActivityRef.current;
      if (inactiveFor >= INACTIVITY_TIMEOUT_MS && !showWarning) {
        setShowWarning(true);
        setSecondsRemaining(COUNTDOWN_SECONDS);
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleEvent));
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, showWarning]);

  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setShowWarning(false);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, logout]);

  if (!showWarning) return null;

  return (
    <Modal
      isOpen={showWarning}
      onClose={resetActivity}
      title="Session Timeout Warning"
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          You have been inactive for a while. For wholesale data security, your session will automatically terminate in:
        </p>
        <div className="text-3xl font-extrabold text-accent-orange my-3 font-mono">
          {secondsRemaining}s
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Click below to continue your current work session.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Log Out Now
          </Button>
          <Button variant="primary" size="sm" onClick={resetActivity}>
            Stay Signed In
          </Button>
        </div>
      </div>
    </Modal>
  );
};
