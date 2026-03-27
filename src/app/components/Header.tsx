import React from 'react';
import { Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: 'Master' | 'Admin' | 'Usuário';
  notificationCount?: number;
  className?: string;
}

export function Header({
  title,
  subtitle,
  userName,
  userRole,
  notificationCount = 0,
  className = '',
}: HeaderProps) {
  return (
    <header
      className={className}
      style={{
        height: '80px',
        padding: '0 40px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #F1F5F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left - Title */}
      <div>
        <h1
          style={{
            font: 'var(--font-display)',
            color: 'var(--text-display)',
            marginBottom: '4px',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ font: 'var(--font-body)', color: 'var(--text-body)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right - Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notifications */}
        <button
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
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#DA291C',
              }}
            />
          )}
        </button>

        {/* User Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
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
            }}
          >
            <User size={18} style={{ color: '#FFFFFF' }} />
          </div>
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
        </div>
      </div>
    </header>
  );
}
