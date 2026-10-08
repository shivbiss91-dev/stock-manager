import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Package,
  Layers,
  FileText,
  Users,
  Warehouse as WarehouseIcon,
  CheckSquare,
  History,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Page' | 'Material' | 'Document' | 'Customer';
  path: string;
  icon: React.ReactNode;
}

const QUICK_SEARCH_ITEMS: SearchItem[] = [
  {
    id: 's-1',
    title: 'Dashboard Overview',
    subtitle: 'Real-time KPI metrics, stock donut, logistics and alerts',
    category: 'Page',
    path: '/dashboard',
    icon: <Package className="w-4 h-4 text-brand-teal" />,
  },
  {
    id: 's-2',
    title: 'Wood & Timber Materials (1,248 Items)',
    subtitle: 'Hardwood, Plywood, Teak, MDF & Veneers catalogue',
    category: 'Material',
    path: '/materials/wood',
    icon: <Layers className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 's-3',
    title: 'Create GST Tax Invoice',
    subtitle: 'Generate E-Invoice with IRN, wholesale price tiers and Indian GST',
    category: 'Document',
    path: '/sales/invoices/create',
    icon: <FileText className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: 's-4',
    title: 'GST Sales Invoices',
    subtitle: 'View, filter, download A4 tax invoices and track payments',
    category: 'Document',
    path: '/sales/invoices',
    icon: <FileText className="w-4 h-4 text-brand-orange" />,
  },
  {
    id: 's-5',
    title: 'Bhiwandi Central Hub (MH)',
    subtitle: 'Main distribution hub, 1,840 items, 82.5% utilization',
    category: 'Page',
    path: '/warehouses',
    icon: <WarehouseIcon className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 's-6',
    title: 'Approval Requests',
    subtitle: 'Review price modifications, discounts & inventory adjustments',
    category: 'Page',
    path: '/approvals',
    icon: <CheckSquare className="w-4 h-4 text-purple-500" />,
  },
  {
    id: 's-7',
    title: 'Customer Directory & Ledgers',
    subtitle: '150+ wholesale clients across Indian states with GSTIN',
    category: 'Customer',
    path: '/customers',
    icon: <Users className="w-4 h-4 text-indigo-500" />,
  },
];

export const GlobalSearchModal: React.FC = () => {
  const navigate = useNavigate();
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  const filtered = query.trim()
    ? QUICK_SEARCH_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_SEARCH_ITEMS;

  const handleSelect = (path: string) => {
    setGlobalSearchOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <AnimatePresence>
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGlobalSearchOpen(false)}
            className="fixed inset-0 bg-[#05060A]/80 backdrop-blur-md"
          />

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            className="relative w-full max-w-2xl template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden z-10"
          >
            {/* Input Row */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, materials, customers, invoices or SKU..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setGlobalSearchOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions */}
            <div className="p-2 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{query ? 'Search Results' : 'Quick Navigation & Recent'}</span>
                {!query && (
                  <span className="flex items-center gap-1 font-normal text-slate-400">
                    <History className="w-3 h-3" /> Press ↵ to open
                  </span>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching results for "{query}"
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-accent-orange transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-white/[0.06]">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent-orange opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.08] text-[10px] font-mono">
                    Esc
                  </kbd>{' '}
                  to close
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.08] text-[10px] font-mono">
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">StockVista Global Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
