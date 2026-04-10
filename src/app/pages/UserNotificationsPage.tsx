import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { UserNotificationsPanel } from '../components/shared/UserNotificationsPanel';
import { useAuthStore } from '../store/authStore';

export default function UserNotificationsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role === 'master') {
      navigate('/master-notifications');
    } else if (user.role === 'admin') {
      navigate('/admin-notifications');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user || user.role !== 'user') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="Notificações" title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
        {/* Page header banner */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Notificações</h2>
              <p className="text-white/80 text-sm mt-1">
                {`Novos preços e atualizações para a praça ${user?.plaza || ''}`}
              </p>
            </div>
          </div>
        </div>

        <UserNotificationsPanel plaza={user?.plaza} />
      </div>
    </AppLayout>
  );
}
