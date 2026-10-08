import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/uiStore';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
  category: string;
  items: { key: string; description: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: 'Navigation',
    items: [
      { key: 'G then D', description: 'Go to Dashboard Home' },
      { key: 'G then M', description: 'Go to Materials Categories' },
      { key: 'G then I', description: 'Go to Invoices' },
      { key: 'G then W', description: 'Go to Warehouses' },
      { key: 'N', description: 'Create New GST Tax Invoice' },
    ],
  },
  {
    category: 'Search & Tools',
    items: [
      { key: 'Ctrl + K  /  ⌘K', description: 'Open Global Search' },
      { key: '/', description: 'Quick Search Focus' },
      { key: '?', description: 'Open Keyboard Shortcuts Help' },
      { key: 'Esc', description: 'Close any active modal or drawer' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC = () => {
  const navigate = useNavigate();
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen, setGlobalSearchOpen } =
    useUIStore();

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const now = Date.now();

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setGlobalSearchOpen(true);
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/sales/invoices/create');
        return;
      }

      // 'G then ...' sequence detection
      if (lastKey === 'g' && now - lastKeyTime < 1000) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          navigate('/materials');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          navigate('/sales/invoices');
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          navigate('/warehouses');
        }
        lastKey = '';
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        lastKey = 'g';
        lastKeyTime = now;
      } else {
        lastKey = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setKeyboardShortcutsOpen, setGlobalSearchOpen]);

  return (
    <Modal
      isOpen={keyboardShortcutsOpen}
      onClose={() => setKeyboardShortcutsOpen(false)}
      title="Keyboard Shortcuts"
      subtitle="Speed up your wholesale inventory operations"
      size="md"
    >
      <div className="space-y-5">
        {SHORTCUTS.map((group) => (
          <div key={group.category}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              {group.category}
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]"
                >
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {item.description}
                  </span>
                  <kbd className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] shadow-sm text-slate-900 dark:text-accent-orange">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
