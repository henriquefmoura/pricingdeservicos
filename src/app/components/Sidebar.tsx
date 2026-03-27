import React, { useState } from 'react';
import { Upload, BarChart2, Calculator, LayoutDashboard, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

export type UserRole = 'Master' | 'Admin' | 'Usuário';
export type NavItem = 'Upload' | 'Análise' | 'Simulador' | 'Dashboard' | 'Admin';

interface SidebarProps {
  activeItem: NavItem;
  userRole: UserRole;
  userName: string;
  isCollapsed?: boolean;
  onItemClick: (item: NavItem) => void;
  onLogout: () => void;
  onToggleCollapse?: () => void;
}

const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: 'Upload', label: 'Upload', icon: Upload },
  { id: 'Análise', label: 'Análise', icon: BarChart2 },
  { id: 'Simulador', label: 'Simulador', icon: Calculator },
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'Admin', label: 'Admin', icon: Settings },
];

const roleStyles: Record<UserRole, { bg: string; text: string }> = {
  Master: { bg: '#78BE20', text: '#FFFFFF' },
  Admin: { bg: '#CEDC00', text: '#001022' },
  Usuário: { bg: '#3B82F6', text: '#FFFFFF' },
};

export function Sidebar({
  activeItem,
  userRole,
  userName,
  isCollapsed = false,
  onItemClick,
  onLogout,
  onToggleCollapse,
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<NavItem | null>(null);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  const roleStyle = roleStyles[userRole];

  return (
    <div
      style={{
        width: isCollapsed ? '64px' : '240px',
        height: '100vh',
        backgroundColor: '#001022',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'width 0.3s ease',
      }}
    >
      {/* Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            right: '-12px',
            top: '24px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#78BE20',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: '#FFFFFF',
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* TOP - Logo Area */}
      <div
        style={{
          padding: isCollapsed ? '24px 0' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {isCollapsed ? (
          <Logo variant="compact" />
        ) : (
          <Logo variant="full" />
        )}
      </div>

      {/* MIDDLE - Nav Items */}
      <nav
        style={{
          flex: 1,
          padding: isCollapsed ? '16px 8px' : '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: isCollapsed ? '12px 0' : '12px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isActive
                  ? 'rgba(120, 190, 32, 0.10)'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
            >
              {/* Active Left Border */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: '#78BE20',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                size={20}
                style={{
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                  flexShrink: 0,
                }}
              />

              {/* Label */}
              {!isCollapsed && (
                <span
                  style={{
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM - User Info & Logout */}
      <div
        style={{
          padding: isCollapsed ? '16px 8px' : '20px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: isCollapsed ? 'center' : 'stretch',
        }}
      >
        {/* Role Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isCollapsed ? '6px' : '6px 12px',
            borderRadius: '100px',
            backgroundColor: roleStyle.bg,
            alignSelf: isCollapsed ? 'center' : 'flex-start',
          }}
        >
          <span
            style={{
              color: roleStyle.text,
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {isCollapsed ? userRole.charAt(0) : userRole}
          </span>
        </div>

        {/* Username */}
        {!isCollapsed && (
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: 400,
            }}
          >
            {userName}
          </span>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: isCollapsed ? '8px' : '8px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <LogOut
            size={16}
            style={{
              color: isLogoutHovered ? '#DA291C' : 'rgba(255, 255, 255, 0.6)',
              transition: 'color 0.2s ease',
            }}
          />
          {!isCollapsed && (
            <span
              style={{
                color: isLogoutHovered ? '#DA291C' : 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: 400,
                transition: 'color 0.2s ease',
              }}
            >
              Sair
            </span>
          )}
        </button>
      </div>
    </div>
  );
}