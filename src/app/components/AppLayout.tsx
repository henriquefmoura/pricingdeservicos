import React from 'react';
import { useNavigate } from 'react-router';
import { Sidebar, NavItem, UserRole } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

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

  // Initialize notifications
  React.useEffect(() => {
    initializeMockNotifications();
  }, [initializeMockNotifications]);

  const userName = user?.name || 'Usuário';
  const userRole: UserRole = user?.role === 'master' ? 'Master' : user?.role === 'admin' ? 'Admin' : 'Usuário';

  // Dynamic notification count based on role
  const notificationRole = user?.role || 'user';
  const notificationCount = getUnreadCount(notificationRole as 'master' | 'admin' | 'user', user?.plaza);

  const handleNavClick = (item: NavItem) => {
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

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC' }}>
      <Sidebar
        activeItem={activeNav}
        userRole={userRole}
        userName={userName}
        onItemClick={handleNavClick}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          title={title}
          subtitle={subtitle}
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
