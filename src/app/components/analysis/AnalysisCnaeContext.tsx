// ========================================
// Analysis CNAE Context
// ========================================
// Exibe informações de CNAE associadas ao serviço selecionado.

import { Building2 } from 'lucide-react';
import type { CnaeContext } from '../../types/pricingAnalysis';

interface Props {
  cnae: CnaeContext | null;
}

const PRESENCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  alta: { label: 'Alta Presença', color: '#166534', bg: '#DCFCE7' },
  media: { label: 'Presença Moderada', color: '#92400E', bg: '#FEF3C7' },
  baixa: { label: 'Baixa Presença', color: '#991B1B', bg: '#FEE2E2' },
};

export function AnalysisCnaeContext({ cnae }: Props) {
  if (!cnae?.enabled) {
    return null;
  }

  const presence = cnae.estimatedPresenceLevel
    ? PRESENCE_LABELS[cnae.estimatedPresenceLevel]
    : null;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Building2 size={14} style={{ color: '#FFF' }} />
        </div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          Atividades Econômicas (CNAE)
        </h4>
        {presence && (
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
            backgroundColor: presence.bg, color: presence.color, marginLeft: 'auto',
          }}>
            {presence.label}
          </span>
        )}
      </div>

      {cnae.cnaeCodes && cnae.cnaeCodes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {cnae.cnaeDescriptions && cnae.cnaeDescriptions.length > 0 ? (
            cnae.cnaeDescriptions.map((desc, i) => (
              <div key={i} style={{
                padding: '6px 10px', borderRadius: '8px',
                backgroundColor: '#F3F4F6', fontSize: '12px',
              }}>
                <span style={{ fontWeight: 600, color: '#4B5563' }}>{desc.id}</span>
                <span style={{ color: '#9CA3AF', margin: '0 4px' }}>•</span>
                <span style={{ color: '#6B7280' }}>{desc.descricao}</span>
              </div>
            ))
          ) : (
            cnae.cnaeCodes.map((code, i) => (
              <span key={i} style={{
                padding: '4px 8px', borderRadius: '6px',
                backgroundColor: '#EDE9FE', color: '#6D28D9',
                fontSize: '12px', fontWeight: 500,
              }}>
                {code}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
