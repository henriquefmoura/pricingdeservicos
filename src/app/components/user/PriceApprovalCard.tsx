import React, { useState } from 'react';
import { Check, X, ArrowRight, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { PriceApproval } from '../../store/approvalStore';
import { CurrencyInput } from '../Input';

interface PriceApprovalCardProps {
  item: PriceApproval;
  onApprove: (id: string) => void;
  onReject: (id: string, newRepasse: number, newVenda: number) => void;
}

function getMarginStyle(margin: number) {
  if (margin > 30) return { bg: '#D1FAE5', text: '#065F46' };
  if (margin >= 15) return { bg: '#FEF3C7', text: '#92400E' };
  return { bg: '#FEE2E2', text: '#991B1B' };
}

export function PriceApprovalCard({ item, onApprove, onReject }: PriceApprovalCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [repasseValue, setRepasseValue] = useState(item.proposedRepasse.toFixed(2));
  const [vendaValue, setVendaValue] = useState(item.proposedVenda.toFixed(2));

  const newRepasse = parseFloat(repasseValue.replace(/,/g, '.'));
  const newVenda = parseFloat(vendaValue.replace(/,/g, '.'));
  const calculatedMargin = !isNaN(newRepasse) && !isNaN(newVenda) && newVenda > 0
    ? ((newVenda - newRepasse) / newVenda) * 100
    : NaN;

  const handleConfirmReject = () => {
    if (isNaN(newRepasse) || isNaN(newVenda)) return;
    onReject(item.id, newRepasse, newVenda);
    setShowRejectForm(false);
  };

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header: Service Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: '#E0F2FE',
            fontSize: '11px',
            fontWeight: 600,
            color: '#0369A1',
          }}
        >
          {item.grupo}
        </span>
        {item.isNewService && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#DBEAFE',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1E40AF',
            }}
          >
            Novo
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#001022', marginBottom: '8px' }}>
        {item.descricao}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
          {item.codigo}
        </span>
        <ArrowRight size={14} style={{ color: '#9CA3AF' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#001022' }}>
          Praça {item.plaza}
        </span>
      </div>

      {/* Price Comparison */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        {item.currentVenda > 0 && (
          <>
            <span style={{ fontSize: '14px', color: '#9CA3AF', textDecoration: 'line-through' }}>
              R$ {item.currentVenda.toFixed(2)}
            </span>
            <ArrowRight size={16} style={{ color: '#9CA3AF' }} />
          </>
        )}
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#001022' }}>
          R$ {item.proposedVenda.toFixed(2)}
        </span>
        {!item.isNewService && item.variation !== 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: item.variation > 0 ? '#D1FAE5' : '#FEE2E2',
              fontSize: '12px',
              fontWeight: 600,
              color: item.variation > 0 ? '#065F46' : '#991B1B',
            }}
          >
            {item.variation > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Details Row */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280', marginBottom: '20px' }}>
        <span>Repasse: R$ {item.proposedRepasse.toFixed(2)}</span>
        <span>Venda: R$ {item.proposedVenda.toFixed(2)}</span>
        <span>Margem: {item.proposedMargem.toFixed(1)}%</span>
      </div>

      {/* Action Buttons */}
      {!showRejectForm && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onApprove(item.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#78BE20',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            Aprovar
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1.5px solid #DA291C',
              backgroundColor: '#FFFFFF',
              color: '#DA291C',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Edit3 size={16} />
            Rejeitar e Sugerir Novo Preço
          </button>
        </div>
      )}

      {/* Inline Reject Form */}
      {showRejectForm && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'end' }}>
            <CurrencyInput
              label="Repasse (R$)"
              value={repasseValue}
              onValueChange={setRepasseValue}
              placeholder="0,00"
            />

            {/* Calculated Margin Badge */}
            <div style={{ paddingBottom: '8px' }}>
              {!isNaN(calculatedMargin) && (
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '100px',
                    backgroundColor: getMarginStyle(calculatedMargin).bg,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: getMarginStyle(calculatedMargin).text }}>
                    {calculatedMargin.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <CurrencyInput
              label="Venda (R$)"
              value={vendaValue}
              onValueChange={setVendaValue}
              placeholder="0,00"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button
              onClick={handleConfirmReject}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#DA291C',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <X size={16} />
              Confirmar Rejeição
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6B7280',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
