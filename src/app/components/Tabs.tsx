import React from 'react';

interface TabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '', style }: TabsProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '32px',
        borderBottom: '1px solid #E5E7EB',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              position: 'relative',
              padding: '16px 0',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: '15px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#001022' : '#6B7280',
              }}
            >
              {tab.label}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <div
                style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#78BE20' : '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isActive ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {tab.count}
                </span>
              </div>
            )}
            {/* Active Border */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#78BE20',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}