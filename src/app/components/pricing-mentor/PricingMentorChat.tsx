import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Minimize2,
  BookOpen,
  Calculator,
  Trash2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PricingMentorAvatar } from './PricingMentorAvatar';
import { usePricingMentorStore } from '../../store/pricingMentorStore';
import { getAllMicroLessons, QUICK_ACTIONS } from '../../services/pricingMentorService';
import { getActiveProviderName, isExternalAIAvailable, getConfiguredProviders } from '../../services/pricingMentorAIService';
import type { MentorMessage } from '../../types/pricingMentor';

type ChatTab = 'chat' | 'lessons' | 'simulate';

export function PricingMentorChat() {
  const {
    messages,
    isOpen,
    isMinimized,
    isTyping,
    expression,
    userLevel,
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
  }, [messages, isTyping]);

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

  const handleQuickAction = (message: string) => {
    sendMessage(message);
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
          gap: '10px',
          background: 'white',
          borderRadius: '24px',
          padding: '10px 18px 10px 10px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          animation: 'mentorSlideIn 0.3s ease-out',
        }}
        onClick={expand}
      >
        <PricingMentorAvatar size={36} expression={expression} />
        <div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', display: 'block' }}>
            Pricing Mentor
          </span>
          <span style={{ fontSize: '11px', color: '#78BE20' }}>
            Clique para expandir
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 24,
        width: '400px',
        maxHeight: '600px',
        borderRadius: '20px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 48px rgba(0,0,0,0.2)',
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
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <PricingMentorAvatar size={44} expression={expression} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Pricing Mentor
            <Sparkles size={14} style={{ color: '#78BE20' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isExternalAIAvailable() ? '#22C55E' : '#F59E0B',
              animation: isExternalAIAvailable() ? 'mentorPulse 2s ease-in-out infinite' : undefined,
            }} />
            {isTyping ? 'Pensando...' : (
              <>
                {isExternalAIAvailable() ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Zap size={10} style={{ color: '#78BE20' }} />
                    Conectado — IA {getActiveProviderName()} • {userLevel === 'avancado' ? 'Avançado' : userLevel === 'intermediario' ? 'Intermediário' : 'Iniciante'}
                  </span>
                ) : (
                  `Assistente local • ${userLevel === 'avancado' ? 'Avançado' : userLevel === 'intermediario' ? 'Intermediário' : 'Iniciante'}`
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={minimize}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s',
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
            color: 'rgba(255,255,255,0.5)',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s',
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
              <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF' }}>
                <PricingMentorAvatar size={64} expression="wink" showLabel />
                <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                  {isExternalAIAvailable()
                    ? <>Sou seu consultor de precificação com <strong>IA avançada</strong>! Pergunte qualquer coisa sobre preços, margem, custos, estratégia ou negócios.</>
                    : <>Pergunte sobre precificação, margem, custos, estratégia ou <strong>qualquer dúvida</strong>!</>
                  }
                </p>
                {/* AI Provider badges */}
                {isExternalAIAvailable() && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    justifyContent: 'center',
                    marginTop: '8px',
                    marginBottom: '4px',
                  }}>
                    {getConfiguredProviders().map((name) => (
                      <span
                        key={name}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: name === 'Base Local' ? '#F3F4F6' : '#ECFDF5',
                          color: name === 'Base Local' ? '#6B7280' : '#059669',
                          fontSize: '9px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {name !== 'Base Local' && <Zap size={8} />}
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Quick Actions */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  justifyContent: 'center',
                  marginTop: '12px',
                }}>
                  {QUICK_ACTIONS.slice(0, 4).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.message)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FAFAFA',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#4B5563',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {action.emoji} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <PricingMentorAvatar size={28} expression="thinking" />
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '4px 16px 16px 16px',
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            {/* Quick action chips after messages */}
            {messages.length > 0 && !isTyping && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '4px',
              }}>
                {QUICK_ACTIONS.slice(0, 3).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.message)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FAFAFA',
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {action.emoji} {action.label}
                  </button>
                ))}
              </div>
            )}
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
            placeholder="Faça sua pergunta..."
            disabled={isTyping}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: isTyping ? '#F3F4F6' : '#F9FAFB',
              transition: 'border-color 0.2s',
              opacity: isTyping ? 0.7 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: input.trim() && !isTyping ? '#78BE20' : '#E5E7EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
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

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '18px' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#78BE20',
            animation: `mentorTypingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes mentorTypingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ message }: { message: MentorMessage }) {
  const isMentor = message.role === 'mentor';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMentor ? 'flex-start' : 'flex-end',
        gap: '8px',
        animation: 'mentorSlideIn 0.3s ease-out',
      }}
    >
      {isMentor && <PricingMentorAvatar size={28} expression="happy" />}
      <div
        style={{
          maxWidth: '82%',
          padding: '10px 14px',
          borderRadius: isMentor ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          backgroundColor: isMentor ? '#F0FDF4' : '#001022',
          color: isMentor ? '#1F2937' : '#FFFFFF',
          fontSize: '13px',
          lineHeight: '1.6',
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
