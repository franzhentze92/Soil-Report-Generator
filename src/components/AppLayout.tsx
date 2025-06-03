import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import SoilReportGenerator from './SoilReportGenerator';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Content */}
      <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex-1">
        <SoilReportGenerator />
      </main>
      <div className="w-full text-center py-4 text-gray-600 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
        Powered by NTS G.R.O.W
      </div>
    </div>
  );
};

export default AppLayout;