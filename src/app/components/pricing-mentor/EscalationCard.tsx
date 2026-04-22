import { MessageCircle, Mail, X } from 'lucide-react';

/** WhatsApp link with pre-filled message */
const WHATSAPP_URL =
  'https://wa.me/5511976019360?text=Ol%C3%A1%20Pedro%20II%2C%20preciso%20de%20ajuda%20com%20a%20calculadora%20de%20pricing.';

/** mailto link with subject and body */
const MAILTO_URL =
  'mailto:suporte@empresa.com.br?subject=Ajuda%20com%20Calculadora%20de%20Pricing&body=Ol%C3%A1%20Pedro%20II%2C%0APreciso%20de%20ajuda%20com%20a%20calculadora%20de%20pricing.%20Poderia%20me%20apoiar%3F';

interface EscalationCardProps {
  onDismiss: () => void;
}

/**
 * Card de escalonamento para especialista humano (Pedro II).
 * Exibe opções de contato via WhatsApp e e-mail.
 */
export function EscalationCard({ onDismiss }: EscalationCardProps) {
  return (
    <div
      style={{
        margin: '8px 0',
        padding: '16px',
        borderRadius: '14px',
        backgroundColor: '#F0FDF4',
        border: '1px solid #BBF7D0',
        boxShadow: '0 2px 12px rgba(120, 190, 32, 0.12)',
        animation: 'mentorSlideIn 0.3s ease-out',
        position: 'relative',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9CA3AF',
          padding: '2px',
        }}
        aria-label="Fechar sugestão de especialista"
      >
        <X size={14} />
      </button>

      <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
        🧑‍💼 Falar com especialista
      </div>
      <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 12px' }}>
        Se preferir, você pode falar com o nosso especialista Pedro II para receber apoio mais direto.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {/* WhatsApp button */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chamar Pedro II no WhatsApp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            border: 'none',
          }}
        >
          <MessageCircle size={14} />
          Chamar no WhatsApp
        </a>

        {/* Email button */}
        <a
          href={MAILTO_URL}
          aria-label="Enviar e-mail para Pedro II"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            color: '#1F2937',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            border: '1px solid #D1D5DB',
          }}
        >
          <Mail size={14} />
          Enviar e-mail
        </a>
      </div>
    </div>
  );
}
