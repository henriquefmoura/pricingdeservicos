import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar, NavItem, UserRole } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useResponsive } from '../hooks/useResponsive';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav: NavItem;
  title: string;
  subtitle: string;
}

export function AppLayout({ children, activeNav, title, subtitle }: AppLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { getUnreadCount, initializeMockNotifications } = useNotificationStore();
  const { isMobile, isTablet, mainPadding } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize notifications
  React.useEffect(() => {
    initializeMockNotifications();
  }, [initializeMockNotifications]);

  // Close sidebar on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const userName = user?.name || 'Usuário';
  const userRole: UserRole = user?.role === 'master' ? 'Master' : user?.role === 'admin' ? 'Admin' : 'Usuário';

  // Dynamic notification count based on role
  const notificationRole = user?.role || 'user';
  const notificationCount = getUnreadCount(notificationRole as 'master' | 'admin' | 'user', user?.plaza);

  const handleNavClick = (item: NavItem) => {
    // Close sidebar on mobile after navigation
    if (isMobile) setSidebarOpen(false);

    switch (item) {
      case 'Upload':
        navigate('/home');
        break;
      case 'Análise':
        navigate('/analysis');
        break;
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Clima':
        navigate('/weather');
        break;
      case 'Territorial':
        navigate('/territorial');
        break;
      case 'Concorrência':
        navigate('/competitor');
        break;
      case 'Admin':
        navigate('/admin');
        break;
      case 'PesquisaMercado':
        navigate('/market-research');
        break;
      case 'Governança':
        navigate('/governance');
        break;
      case 'Códigos':
        navigate('/pricing-codes');
        break;
      case 'Notificações':
        if (user?.role === 'master') navigate('/master-notifications');
        else if (user?.role === 'admin') navigate('/admin-notifications');
        else navigate('/user-notifications');
        break;
      case 'Suporte':
        if (user?.role === 'admin') navigate('/admin-support');
        else navigate('/user-support');
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNotificationClick = () => {
    if (user?.role === 'master') navigate('/master-notifications');
    else if (user?.role === 'admin') navigate('/admin-notifications');
    else navigate('/user-notifications');
  };

  const showMobileOverlay = isMobile || isTablet;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', overflow: 'hidden' }}>
      {/* Mobile sidebar overlay backdrop */}
      {showMobileOverlay && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Sidebar - mobile: overlay, desktop: static */}
      <div
        style={{
          ...(showMobileOverlay
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
              }
            : {}),
        }}
      >
        <Sidebar
          activeItem={activeNav}
          userRole={userRole}
          userName={userName}
          onItemClick={handleNavClick}
          onLogout={handleLogout}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header
          title={title}
          subtitle={subtitle}
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick}
          showMenuButton={showMobileOverlay}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: mainPadding }}>
          {children}
        </main>
      </div>
    </div>
  );
}
