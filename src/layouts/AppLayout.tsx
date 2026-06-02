import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon, Wallet02Icon, PieChart01Icon, UserIcon, Add01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPath = location.pathname;
  
  // Decide if we should show the bottom bar & FAB
  const tabPaths = ['/', '/budgets', '/reports', '/settings'];
  const showNav = tabPaths.includes(currentPath);

  const tabs = [
    { path: '/', label: '首页', icon: Home01Icon },
    { path: '/budgets', label: '预算', icon: Wallet02Icon },
    { path: '/reports', label: '报表', icon: PieChart01Icon },
    { path: '/settings', label: '我的', icon: UserIcon },
  ];

  return (
    <div className="w-full h-screen h-[100dvh] md:max-w-[420px] md:mx-auto md:shadow-2xl md:border-x md:border-hairline bg-canvas flex flex-col relative overflow-hidden">
      {/* Page Content */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-safe">
        <Outlet />
      </main>

      {/* Bottom Navigation Tab Bar & FAB */}
      {showNav && (
        <>
          {/* Centered Floating Action Button (FAB) */}
          <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2 z-40 select-none">
            <button
              onClick={() => navigate('/transaction/new')}
              className="w-14 h-14 bg-brand-primary active:bg-brand-active text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-transform"
              aria-label="新建交易"
            >
              <HugeiconsIcon icon={Add01Icon} size={28} className="stroke-2" />
            </button>
          </div>

          {/* Tab Bar */}
          <nav
            className="w-full bg-surface-card border-t border-hairline flex justify-around items-center shrink-0 z-30 select-none safe-padding-bottom"
            style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
          >
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              // Check if path matches. Handle root path correctly
              const isActive = currentPath === tab.path;
              
              // To create space for the center FAB, we place an empty spacer at index 2
              return (
                <React.Fragment key={tab.path}>
                  {idx === 2 && <div className="w-14 h-12 shrink-0" />} {/* Spacer for FAB */}
                  
                  <button
                    onClick={() => navigate(tab.path)}
                    className={cn(
                      'flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-transform',
                      isActive ? 'text-brand-primary' : 'text-muted-token'
                    )}
                    style={{ minWidth: '48px', minHeight: '48px' }} // tap target
                  >
                    <HugeiconsIcon icon={Icon} size={20} className={isActive ? 'stroke-2' : 'stroke-1'} />
                    <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
};
export default AppLayout;
