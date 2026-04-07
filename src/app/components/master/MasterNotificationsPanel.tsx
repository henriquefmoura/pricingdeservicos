import React, { useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Flag, Trash2, CheckCheck } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification } from '../../types/notification';

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'support_request':
      return <MessageSquare size={18} style={{ color: '#F59E0B' }} />;
    case 'plaza_pricing_complete':
      return <CheckCircle2 size={18} style={{ color: '#78BE20' }} />;
    case 'support_reply':
      return <MessageSquare size={18} style={{ color: '#3B82F6' }} />;
    default:
      return <Bell size={18} style={{ color: '#6B7280' }} />;
  }
}

function getPriorityStyle(priority: Notification['priority']): React.CSSProperties {
  switch (priority) {
    case 'high':
      return { borderLeft: '4px solid #DC2626' };
    case 'medium':
      return { borderLeft: '4px solid #F59E0B' };
    default:
      return { borderLeft: '4px solid #E5E7EB' };
  }
}

export function MasterNotificationsPanel() {
  const {
    getNotificationsForRole,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    initializeMockNotifications,
  } = useNotificationStore();

  useEffect(() => {
    initializeMockNotifications();
  }, [initializeMockNotifications]);

  const notifications = getNotificationsForRole('master');
  const unreadCount = getUnreadCount('master');

  const supportNotifications = notifications.filter(
    (n) => n.type === 'support_request' || n.type === 'support_reply'
  );
  const completionNotifications = notifications.filter(
    (n) => n.type === 'plaza_pricing_complete'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(120, 190, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} style={{ color: '#78BE20' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', margin: 0 }}>
              Central de Notificações
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas as notificações lidas'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead('master')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#6B7280',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCheck size={14} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Support Notifications Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <MessageSquare size={16} style={{ color: '#F59E0B' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
            Suporte — Admins & Usuários
          </h4>
          {supportNotifications.filter((n) => !n.read).length > 0 && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                fontSize: '11px',
                fontWeight: 600,
                color: '#92400E',
              }}
            >
              {supportNotifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>

        {supportNotifications.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
            }}
          >
            <MessageSquare size={24} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Nenhuma solicitação de suporte</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {supportNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pricing Completion Notifications Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Flag size={16} style={{ color: '#78BE20' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
            Conclusão de Precificação por Praça
          </h4>
          {completionNotifications.filter((n) => !n.read).length > 0 && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: '#D1FAE5',
                fontSize: '11px',
                fontWeight: 600,
                color: '#065F46',
              }}
            >
              {completionNotifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>

        {completionNotifications.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
            }}
          >
            <CheckCircle2 size={24} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Nenhuma praça concluiu precificação ainda</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completionNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: notification.read ? '#FFFFFF' : '#FEFCE8',
        border: '1px solid ' + (notification.read ? '#E5E7EB' : '#FEF3C7'),
        ...getPriorityStyle(notification.priority),
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          {getNotificationIcon(notification.type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
              {notification.title}
            </h5>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                {timeAgo(notification.createdAt)}
              </span>
              {!notification.read && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#3B82F6',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0', lineHeight: '1.4' }}>
            {notification.message}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            {notification.plaza && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#F3F4F6',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#4B5563',
                }}
              >
                {notification.plaza}
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              de {notification.fromUserName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Trash2 size={14} style={{ color: '#D1D5DB' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
