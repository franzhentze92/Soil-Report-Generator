import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface ReportSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  useHideButton?: boolean;
  infoContent?: React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, children, className = '', collapsible = false, expanded = true, onToggle, useHideButton = false, infoContent }) => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {infoContent && (
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none"
              aria-label="Show section info"
              onClick={() => setShowInfo(true)}
            >
              <Info size={20} />
            </button>
          )}
          {collapsible && (
            useHideButton ? (
              <button
                type="button"
                onClick={onToggle}
                className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 border border-gray-300 hover:bg-gray-200"
                aria-label={expanded ? 'Hide section' : 'Show section'}
              >
                {expanded ? 'Hide' : 'Show'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="ml-2 text-gray-500 hover:text-black focus:outline-none"
                aria-label={expanded ? 'Collapse section' : 'Expand section'}
              >
                <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  ▶
                </span>
              </button>
            )
          )}
        </div>
      </CardHeader>
      {(!collapsible || expanded) && <CardContent>{children}</CardContent>}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-black" onClick={() => setShowInfo(false)} aria-label="Close info">✕</button>
            <div className="text-base text-gray-800">{infoContent}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReportSection;