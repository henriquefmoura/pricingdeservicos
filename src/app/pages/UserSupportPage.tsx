import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { SupportChatPanel } from '../components/shared/SupportChatPanel';
import { useAuthStore } from '../store/authStore';
import { useResponsive } from '../hooks/useResponsive';

export default function UserSupportPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { gap } = useResponsive();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'user') {
      navigate(user.role === 'master' ? '/home' : '/admin');
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
    <AppLayout activeNav="Suporte" title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap(24)}px` }}>
        {/* Page header banner */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Suporte</h2>
              <p className="text-white/80 text-sm mt-1">
                Comunique-se com o Admin da sua praça
              </p>
            </div>
          </div>
        </div>

        <SupportChatPanel
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserRole="user"
          currentPlaza={user.plaza}
          targetRole="admin"
          targetLabel="Admin"
        />
      </div>
    </AppLayout>
  );
}
