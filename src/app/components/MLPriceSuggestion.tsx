import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';
import type { MLPriceSuggestion, MLFactor } from '../types/mlPricing';

interface MLPriceSuggestionCardProps {
  suggestion: MLPriceSuggestion;
  onUseVenda: (venda: number) => void;
  onUseRepasse: (repasse: number) => void;
  onUseBoth: (venda: number, repasse: number) => void;
  /** Callback chamado quando admin usa os preços sugeridos (para log de comportamento) */
  onAccepted?: () => void;
}

function FactorIcon({ impact }: { impact: MLFactor['impact'] }) {
  if (impact === 'positivo') return <TrendingUp size={12} style={{ color: '#15803D' }} />;
  if (impact === 'negativo') return <TrendingDown size={12} style={{ color: '#DC2626' }} />;
  return <Minus size={12} style={{ color: '#6B7280' }} />;
}

function ConfidenceBar({ confidence, level }: { confidence: number; level: MLPriceSuggestion['confidenceLevel'] }) {
  const colors = {
    alta: { bar: '#78BE20', text: '#15803D', bg: '#DCFCE7' },
    media: { bar: '#F59E0B', text: '#92400E', bg: '#FEF3C7' },
    baixa: { bar: '#EF4444', text: '#991B1B', bg: '#FEE2E2' },
  };
  const c = colors[level];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${confidence}%`,
            backgroundColor: c.bar,
            borderRadius: '3px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: '100px',
          backgroundColor: c.bg,
          color: c.text,
          whiteSpace: 'nowrap',
        }}
      >
        {confidence}% • confiança {level}
      </span>
    </div>
  );
}

export function MLPriceSuggestionCard({
  suggestion,
  onUseVenda,
  onUseRepasse,
  onUseBoth,
  onAccepted,
}: MLPriceSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleUseBoth = () => {
    onUseBoth(suggestion.suggestedVenda, suggestion.suggestedRepasse);
    onAccepted?.();
  };

  const handleUseVenda = () => {
    onUseVenda(suggestion.suggestedVenda);
    onAccepted?.();
  };

  const handleUseRepasse = () => {
    onUseRepasse(suggestion.suggestedRepasse);
    onAccepted?.();
  };

  const positiveFactors = suggestion.keyFactors.filter((f) => f.impact === 'positivo');
  const negativeFactors = suggestion.keyFactors.filter((f) => f.impact === 'negativo');

  return (
    <div
      style={{
        backgroundColor: 'rgba(206, 220, 0, 0.07)',
        border: '1.5px dashed #CEDC00',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#CEDC00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} style={{ color: '#001022' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', margin: 0 }}>
            Sugestão ML · {suggestion.historicoSemanas} semana(s) de dados
          </p>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>
            {suggestion.grupoServico}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
          title={expanded ? 'Recolher detalhes' : 'Ver detalhes'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Price suggestion pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '120px', backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280', margin: '0 0 2px 0' }}>REPASSE SUGERIDO</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#001022', margin: '0 0 6px 0' }}>
            R$ {suggestion.suggestedRepasse.toFixed(2)}
          </p>
          <button
            onClick={handleUseRepasse}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid #CEDC00',
              backgroundColor: 'transparent',
              color: '#001022',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Usar repasse
          </button>
        </div>

        <div style={{ flex: 1, minWidth: '120px', backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280', margin: '0 0 2px 0' }}>VENDA SUGERIDA</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#001022', margin: '0 0 2px 0' }}>
            R$ {suggestion.suggestedVenda.toFixed(2)}
          </p>
          <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 6px 0' }}>
            Faixa: R$ {suggestion.vendaMin.toFixed(2)} – R$ {suggestion.vendaMax.toFixed(2)}
          </p>
          <button
            onClick={handleUseVenda}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid #CEDC00',
              backgroundColor: 'transparent',
              color: '#001022',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Usar venda
          </button>
        </div>
      </div>

      {/* Use both button */}
      <button
        onClick={handleUseBoth}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#CEDC00',
          color: '#001022',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <Zap size={13} />
        Aplicar ambos os preços sugeridos
      </button>

      {/* Confidence bar */}
      <ConfidenceBar confidence={suggestion.confidence} level={suggestion.confidenceLevel} />

      {/* Estimated margin */}
      {suggestion.estimatedMargem > 0 && (
        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
          Margem estimada com os preços sugeridos:{' '}
          <strong style={{ color: suggestion.estimatedMargem > 15 ? '#15803D' : '#92400E' }}>
            {suggestion.estimatedMargem.toFixed(1)}%
          </strong>
        </p>
      )}

      {/* Expandable details */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Summary */}
          <p style={{ fontSize: '12px', color: '#374151', margin: 0, padding: '10px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px', borderLeft: '3px solid #CEDC00' }}>
            {suggestion.summary}
          </p>

          {/* Factors */}
          {positiveFactors.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#15803D', marginBottom: '6px' }}>
                Fatores favoráveis
              </p>
              {positiveFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <FactorIcon impact={f.impact} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>
                    <strong>{f.label}:</strong> {f.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {negativeFactors.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', marginBottom: '6px' }}>
                Fatores de atenção
              </p>
              {negativeFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                  <FactorIcon impact={f.impact} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>
                    <strong>{f.label}:</strong> {f.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {suggestion.confidence < 45 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                border: '1px solid #F59E0B',
              }}
            >
              <AlertCircle size={14} style={{ color: '#92400E', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '11px', color: '#92400E', margin: 0 }}>
                Dados insuficientes para alta confiança. Solicite ao master o upload de mais semanas de dados históricos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
