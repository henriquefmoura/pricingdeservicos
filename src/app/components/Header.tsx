import React from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: 'Master' | 'Admin' | 'Usuário';
  notificationCount?: number;
  onNotificationClick?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function Header({
  title,
  subtitle,
  userName,
  userRole,
  notificationCount = 0,
  onNotificationClick,
  showMenuButton,
  onMenuClick,
  className = '',
}: HeaderProps) {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;

  return (
    <header
      className={className}
      style={{
        height: compact ? '56px' : '80px',
        padding: compact ? '0 16px' : '0 40px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #F1F5F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Left - Menu button + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={22} style={{ color: '#374151' }} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              font: 'var(--font-display)',
              color: 'var(--text-display)',
              marginBottom: subtitle ? '4px' : 0,
              fontSize: compact ? '16px' : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
          {subtitle && !isMobile && (
            <p style={{
              font: 'var(--font-body)',
              color: 'var(--text-body)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right - Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '10px' : '20px', flexShrink: 0 }}>
        {/* Notifications */}
        <button
          onClick={onNotificationClick}
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#F3F4F6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Bell size={20} style={{ color: '#6B7280' }} />
          {notificationCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: '#DA291C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </div>
          )}
        </button>

        {/* User Info - compact on mobile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: compact ? '8px' : '12px',
            padding: compact ? '6px 8px' : '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#78BE20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={18} style={{ color: '#FFFFFF' }} />
          </div>
          {!isMobile && (
            <div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#001022',
                  lineHeight: 1.2,
                }}
              >
                {userName}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  lineHeight: 1.2,
                }}
              >
                {userRole}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
