import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AutoLogoutWarningModal } from './AutoLogoutWarningModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { TexturePatternsDefs } from '../common/TexturePatterns';
import { useThemeStore } from '../../store/themeStore';

export const AppLayout: React.FC = () => {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-[#05060A] text-slate-800 dark:text-[#F2F4F8] transition-colors p-0 sm:p-2.5 md:p-4 lg:p-5 flex justify-center items-start">
      {/* Global SVG Pattern Defs for Texture-rich Cards */}
      <TexturePatternsDefs />

      {/* Main App Container Panel: #0B0D14, 24px radius, 1px border, large shadow */}
      <div className="w-full max-w-[1720px] min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-2.5rem)] bg-white dark:bg-[#0B0D14] rounded-none sm:rounded-[24px] border-0 sm:border border-slate-200/90 dark:border-white/[0.06] shadow-none sm:shadow-panel flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Icon Rail (Desktop persistent + Mobile drawer) */}
        <Sidebar />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen md:min-h-0 bg-transparent">
          {/* Header */}
          <TopBar />

          {/* Page Viewport */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 w-full mx-auto overflow-y-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Global Modals & Overlays */}
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <AutoLogoutWarningModal />
    </div>
  );
};
