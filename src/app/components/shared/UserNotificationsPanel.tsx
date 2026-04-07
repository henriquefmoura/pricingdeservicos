import React, { useEffect } from 'react';
import { Bell, FileText, MessageSquare, CheckCheck, Trash2 } from 'lucide-react';
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
    case 'codes_from_admin':
      return <FileText size={18} style={{ color: '#78BE20' }} />;
    case 'support_reply':
      return <MessageSquare size={18} style={{ color: '#3B82F6' }} />;
    default:
      return <Bell size={18} style={{ color: '#6B7280' }} />;
  }
}

interface UserNotificationsPanelProps {
  plaza?: string;
}

export function UserNotificationsPanel({ plaza }: UserNotificationsPanelProps) {
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

  const notifications = getNotificationsForRole('user', plaza);
  const unreadCount = getUnreadCount('user', plaza);

  const codeNotifications = notifications.filter(
    (n) => n.type === 'codes_from_admin'
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== 'codes_from_admin'
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
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={20} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', margin: 0 }}>
              Notificações
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Todas as notificações lidas'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead('user', plaza)}
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
            }}
          >
            <CheckCheck size={14} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Codes from Admin Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <FileText size={16} style={{ color: '#78BE20' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
            Novos Preços para Validação
          </h4>
          {codeNotifications.filter((n) => !n.read).length > 0 && (
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
              {codeNotifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>

        {codeNotifications.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
            }}
          >
            <FileText size={24} style={{ color: '#D1D5DB', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Nenhum novo preço para validar</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {codeNotifications.map((notification) => (
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

      {/* Other Notifications */}
      {otherNotifications.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Bell size={16} style={{ color: '#6B7280' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
              Outras Notificações
            </h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {otherNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        </div>
      )}
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
        backgroundColor: notification.read ? '#FFFFFF' : '#EFF6FF',
        border: '1px solid ' + (notification.read ? '#E5E7EB' : '#BFDBFE'),
        borderLeft: notification.priority === 'high' ? '4px solid #DC2626' : notification.priority === 'medium' ? '4px solid #F59E0B' : '4px solid #E5E7EB',
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
