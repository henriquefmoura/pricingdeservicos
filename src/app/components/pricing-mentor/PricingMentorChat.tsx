import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Minimize2,
  BookOpen,
  Calculator,
  Trash2,
} from 'lucide-react';
import { PricingMentorAvatar } from './PricingMentorAvatar';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { getAllMicroLessons } from '../../services/pricingMentorService';
import type { MentorMessage } from '../../types/pricingMentor';

type ChatTab = 'chat' | 'lessons' | 'simulate';

export function PricingMentorChat() {
  const {
    messages,
    isOpen,
    isMinimized,
    toggleOpen,
    minimize,
    expand,
    sendMessage,
    requestLesson,
    requestSimulation,
    clearMessages,
  } = usePricingMentorStore();

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTab>('chat');
  const [simCurrentPrice, setSimCurrentPrice] = useState('');
  const [simCostPrice, setSimCostPrice] = useState('');
  const [simNewPrice, setSimNewPrice] = useState('');
  const [simQuantity, setSimQuantity] = useState('1');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lessons = getAllMicroLessons();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSimulate = () => {
    const cp = parseFloat(simCurrentPrice);
    const cost = parseFloat(simCostPrice);
    const np = parseFloat(simNewPrice);
    const qty = parseInt(simQuantity) || 1;
    if (isNaN(cp) || isNaN(cost) || isNaN(np)) return;
    requestSimulation(cp, cost, np, qty);
    setActiveTab('chat');
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'white',
          borderRadius: '24px',
          padding: '8px 16px 8px 8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          animation: 'mentorSlideIn 0.3s ease-out',
        }}
        onClick={expand}
      >
        <PricingMentorAvatar size={32} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
          Pricing Mentor
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 24,
        width: '380px',
        maxHeight: '560px',
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9998,
        overflow: 'hidden',
        animation: 'mentorSlideIn 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001022 0%, #0A2540 100%)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <PricingMentorAvatar size={40} expression="happy" />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700 }}>
            Pricing Mentor
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
            Seu assistente de precificação 🎯
          </div>
        </div>
        <button
          onClick={minimize}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            padding: '4px',
          }}
          aria-label="Minimizar"
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={toggleOpen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            padding: '4px',
          }}
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
        }}
      >
        {([
          { id: 'chat' as ChatTab, label: 'Chat', icon: Send },
          { id: 'lessons' as ChatTab, label: 'Aprender', icon: BookOpen },
          { id: 'simulate' as ChatTab, label: 'Simular', icon: Calculator },
        ]).map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#78BE20' : '#6B7280',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #78BE20' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {activeTab === 'chat' && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#9CA3AF' }}>
                <PricingMentorAvatar size={56} expression="wink" />
                <p style={{ marginTop: '12px', fontSize: '14px' }}>
                  Olá! Sou o <strong>Pricing Mentor</strong>. Pergunte sobre precificação, margem, custos e muito mais!
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'lessons' && (
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px' }}>
              📚 Toque em um tema para aprender:
            </p>
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  requestLesson(lesson.category);
                  setActiveTab('chat');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FAFAFA',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <BookOpen size={16} style={{ color: '#78BE20', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                    {lesson.explanation.slice(0, 60)}...
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'simulate' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              🔬 Simule cenários de preço e veja o impacto na sua margem:
            </p>
            <SimInput label="Preço atual (R$)" value={simCurrentPrice} onChange={setSimCurrentPrice} placeholder="Ex: 150" />
            <SimInput label="Custo (R$)" value={simCostPrice} onChange={setSimCostPrice} placeholder="Ex: 100" />
            <SimInput label="Novo preço (R$)" value={simNewPrice} onChange={setSimNewPrice} placeholder="Ex: 180" />
            <SimInput label="Quantidade" value={simQuantity} onChange={setSimQuantity} placeholder="Ex: 10" />
            <button
              onClick={handleSimulate}
              disabled={!simCurrentPrice || !simCostPrice || !simNewPrice}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: (!simCurrentPrice || !simCostPrice || !simNewPrice) ? '#D1D5DB' : '#78BE20',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14px',
                cursor: (!simCurrentPrice || !simCostPrice || !simNewPrice) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Simular 🚀
            </button>
          </div>
        )}
      </div>

      {/* Input Area (only for chat tab) */}
      {activeTab === 'chat' && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={clearMessages}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#D1D5DB',
              padding: '4px',
            }}
            title="Limpar conversa"
            aria-label="Limpar conversa"
          >
            <Trash2 size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo sobre precificação..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#F9FAFB',
              transition: 'border-color 0.2s',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: input.trim() ? '#78BE20' : '#E5E7EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            aria-label="Enviar"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: MentorMessage }) {
  const isMentor = message.role === 'mentor';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMentor ? 'flex-start' : 'flex-end',
        gap: '8px',
      }}
    >
      {isMentor && <PricingMentorAvatar size={28} expression="happy" />}
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: isMentor ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          backgroundColor: isMentor ? '#F0FDF4' : '#001022',
          color: isMentor ? '#1F2937' : '#FFFFFF',
          fontSize: '13px',
          lineHeight: '1.55',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}

function renderContent(text: string) {
  // Simple bold markdown **text** → <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function SimInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '4px', display: 'block' }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          fontSize: '13px',
          outline: 'none',
          backgroundColor: '#F9FAFB',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
