import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { SupportChatPanel } from '../components/shared/SupportChatPanel';
import { useAuthStore } from '../store/authStore';
import { useSupportStore } from '../store/supportStore';
import { useNotificationStore } from '../store/notificationStore';
import { AlertTriangle, X, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface PendingTicket {
  subject: string;
  message: string;
}

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { createThread, addMessage } = useSupportStore();
  const { addNotification } = useNotificationStore();
  const [pendingTicket, setPendingTicket] = useState<PendingTicket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate(user.role === 'master' ? '/home' : '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Check for pending ticket from navigation state
  useEffect(() => {
    const state = location.state as { pendingTicket?: PendingTicket } | null;
    if (state?.pendingTicket) {
      setPendingTicket(state.pendingTicket);
      // Clear location state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleConfirmTicket = () => {
    if (!pendingTicket || !user) return;

    const threadId = createThread({
      subject: pendingTicket.subject,
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: user.plaza,
    });

    addMessage(threadId, {
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      toPlaza: user.plaza,
      message: pendingTicket.message,
    });

    addNotification({
      type: 'support_request',
      title: `Novo chamado: ${pendingTicket.subject}`,
      message: pendingTicket.message.length > 100 ? pendingTicket.message.substring(0, 100) + '...' : pendingTicket.message,
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'admin',
      toRole: 'master',
      plaza: user.plaza,
      priority: 'medium',
    });

    toast.success('Chamado de suporte aberto com sucesso!');
    setPendingTicket(null);
  };

  const handleCancelTicket = () => {
    setPendingTicket(null);
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="Suporte" title="" subtitle="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
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
              <h2 className="text-2xl font-bold tracking-tight">
                Suporte
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Comunique-se diretamente com o Master
              </p>
            </div>
          </div>
        </div>

        <SupportChatPanel
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserRole="admin"
          currentPlaza={user.plaza}
          targetRole="master"
          targetLabel="Master"
        />
      </div>

      {/* Confirmation Popup Overlay */}
      {pendingTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={handleCancelTicket}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', margin: 0 }}>
                  Confirmar envio de chamado
                </h3>
              </div>
              <button
                onClick={handleCancelTicket}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px' }}>
                Deseja realmente enviar este chamado de suporte ao Master?
              </p>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E5E7EB',
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#001022', margin: '0 0 8px' }}>
                  {pendingTicket.subject}
                </p>
                <pre
                  style={{
                    fontSize: '12px',
                    color: '#4B5563',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                  }}
                >
                  {pendingTicket.message}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleCancelTicket}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#6B7280',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTicket}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#78BE20',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                <Send size={14} />
                Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
