import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Plus, ChevronLeft, Clock, CheckCircle2, X } from 'lucide-react';
import { useSupportStore } from '../../store/supportStore';
import { useNotificationStore } from '../../store/notificationStore';
import type { SupportThread } from '../../types/notification';

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

interface SupportChatPanelProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'admin' | 'user';
  currentPlaza?: string;
  targetRole: 'master' | 'admin';
  targetLabel: string; // e.g. "Master" or "Admin"
}

export function SupportChatPanel({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentPlaza,
  targetRole,
  targetLabel,
}: SupportChatPanelProps) {
  const {
    getThreadsForRole,
    createThread,
    addMessage,
    closeThread,
    markThreadMessagesRead,
    getUnreadThreadCount,
    initializeMockThreads,
  } = useSupportStore();
  const { addNotification } = useNotificationStore();

  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMockThreads();
  }, [initializeMockThreads]);

  const threads = getThreadsForRole(currentUserRole, currentPlaza);
  const unreadCount = getUnreadThreadCount(currentUserRole, currentPlaza);
  const activeThread = threads.find((t) => t.id === selectedThread);

  useEffect(() => {
    if (selectedThread) {
      markThreadMessagesRead(selectedThread, currentUserRole);
    }
  }, [selectedThread, currentUserRole, markThreadMessagesRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    addMessage(selectedThread, {
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserRole: currentUserRole,
      toRole: targetRole,
      toPlaza: currentPlaza,
      message: newMessage.trim(),
    });

    // Create notification for the target
    addNotification({
      type: 'support_reply',
      title: `Nova mensagem de ${currentUserName}`,
      message: newMessage.trim().substring(0, 100) + (newMessage.length > 100 ? '...' : ''),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserRole: currentUserRole,
      toRole: targetRole,
      toPlaza: currentPlaza,
      plaza: currentPlaza,
      priority: 'medium',
    });

    setNewMessage('');
  };

  const handleCreateThread = () => {
    if (!newSubject.trim() || !newFirstMessage.trim()) return;

    const threadId = createThread({
      subject: newSubject.trim(),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserRole: currentUserRole,
      toRole: targetRole,
      plaza: currentPlaza,
    });

    addMessage(threadId, {
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserRole: currentUserRole,
      toRole: targetRole,
      toPlaza: currentPlaza,
      message: newFirstMessage.trim(),
    });

    // Create notification
    addNotification({
      type: 'support_request',
      title: `Novo chamado: ${newSubject.trim()}`,
      message: newFirstMessage.trim().substring(0, 100) + (newFirstMessage.length > 100 ? '...' : ''),
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserRole: currentUserRole,
      toRole: targetRole,
      toPlaza: currentPlaza,
      plaza: currentPlaza,
      priority: 'medium',
    });

    setNewSubject('');
    setNewFirstMessage('');
    setShowNewThread(false);
    setSelectedThread(threadId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Thread List View
  if (!selectedThread) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <MessageSquare size={20} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', margin: 0 }}>
                Suporte — {targetLabel}
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                {unreadCount > 0 ? `${unreadCount} conversa(s) com mensagens novas` : 'Nenhuma mensagem nova'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#78BE20',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            <Plus size={14} />
            Novo Chamado
          </button>
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#001022', margin: 0 }}>
                Novo Chamado de Suporte
              </h4>
              <button
                onClick={() => setShowNewThread(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} style={{ color: '#6B7280' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                placeholder="Assunto do chamado..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <textarea
                placeholder={`Descreva sua dúvida ou problema para o ${targetLabel}...`}
                value={newFirstMessage}
                onChange={(e) => setNewFirstMessage(e.target.value)}
                rows={4}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleCreateThread}
                disabled={!newSubject.trim() || !newFirstMessage.trim()}
                style={{
                  alignSelf: 'flex-end',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: newSubject.trim() && newFirstMessage.trim() ? '#78BE20' : '#D1D5DB',
                  cursor: newSubject.trim() && newFirstMessage.trim() ? 'pointer' : 'default',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}
              >
                <Send size={14} />
                Enviar
              </button>
            </div>
          </div>
        )}

        {/* Thread List */}
        {threads.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
            }}
          >
            <MessageSquare size={32} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#001022', margin: '0 0 4px' }}>
              Nenhuma conversa ainda
            </h4>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              Clique em "Novo Chamado" para iniciar uma conversa com o {targetLabel}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserRole={currentUserRole}
                onClick={() => setSelectedThread(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Chat Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <button
          onClick={() => setSelectedThread(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={20} style={{ color: '#6B7280' }} />
        </button>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#001022', margin: 0 }}>
            {activeThread?.subject || 'Conversa'}
          </h4>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
            {activeThread?.status === 'open' ? 'Aberto' : 'Fechado'}
            {activeThread?.plaza && ` · Praça ${activeThread.plaza}`}
          </p>
        </div>
        {activeThread?.status === 'open' && (
          <button
            onClick={() => {
              closeThread(selectedThread);
              setSelectedThread(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6B7280',
            }}
          >
            <CheckCircle2 size={14} />
            Encerrar
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#F8FAFC',
        }}
      >
        {activeThread?.messages.map((msg) => {
          const isMine = msg.fromUserRole === currentUserRole;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  backgroundColor: isMine ? '#78BE20' : '#FFFFFF',
                  color: isMine ? '#FFFFFF' : '#001022',
                  border: isMine ? 'none' : '1px solid #E5E7EB',
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isMine ? 'rgba(255,255,255,0.8)' : '#9CA3AF',
                    margin: '0 0 4px',
                  }}
                >
                  {msg.fromUserName}
                </p>
                <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: isMine ? 'rgba(255,255,255,0.6)' : '#D1D5DB',
                    margin: '6px 0 0',
                    textAlign: 'right',
                  }}
                >
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {activeThread?.status === 'open' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            borderRadius: '0 0 12px 12px',
          }}
        >
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: newMessage.trim() ? '#78BE20' : '#E5E7EB',
              cursor: newMessage.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} style={{ color: '#FFFFFF' }} />
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            backgroundColor: '#F3F4F6',
            borderRadius: '0 0 12px 12px',
          }}
        >
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Este chamado foi encerrado</p>
        </div>
      )}
    </div>
  );
}

function ThreadCard({
  thread,
  currentUserRole,
  onClick,
}: {
  thread: SupportThread;
  currentUserRole: string;
  onClick: () => void;
}) {
  const hasUnread = thread.messages.some(
    (m) => !m.read && m.fromUserRole !== currentUserRole
  );
  const lastMessage = thread.messages[thread.messages.length - 1];

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: hasUnread ? '#F0FDF4' : '#FFFFFF',
        border: '1px solid ' + (hasUnread ? '#BBF7D0' : '#E5E7EB'),
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#001022', margin: 0 }}>
            {thread.subject}
          </h5>
          {hasUnread && (
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#78BE20',
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: thread.status === 'open' ? '#D1FAE5' : '#F3F4F6',
              fontSize: '10px',
              fontWeight: 600,
              color: thread.status === 'open' ? '#065F46' : '#9CA3AF',
            }}
          >
            {thread.status === 'open' ? 'Aberto' : 'Fechado'}
          </span>
          {thread.plaza && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F3F4F6',
                fontSize: '10px',
                fontWeight: 500,
                color: '#4B5563',
              }}
            >
              {thread.plaza}
            </span>
          )}
        </div>
      </div>
      {lastMessage && (
        <p
          style={{
            fontSize: '13px',
            color: '#6B7280',
            margin: '0 0 4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 500 }}>{lastMessage.fromUserName}:</span>{' '}
          {lastMessage.message}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={12} style={{ color: '#D1D5DB' }} />
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
          {timeAgo(thread.updatedAt)}
        </span>
        <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
          {thread.messages.length} mensagem(ns)
        </span>
      </div>
    </div>
  );
}
