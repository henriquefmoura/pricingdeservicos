import React, { useState } from 'react';
import { AnalysisPanel } from '../analysis/AnalysisPanel';
import { usePricingAnalysis } from '../../hooks/usePricingAnalysis';
import { ANALYSIS_SERVICES, ANALYSIS_PLAZAS, getDefaultAnalysisPlaza } from '../../utils/analysisConstants';

interface SharedAnalysisPanelProps {
  userPlaza?: string;
  userRole: 'admin' | 'user';
}

export function SharedAnalysisPanel({ userPlaza, userRole }: SharedAnalysisPanelProps) {
  const [analysisService, setAnalysisService] = useState(ANALYSIS_SERVICES[0]);
  const [analysisPlaza, setAnalysisPlaza] = useState(getDefaultAnalysisPlaza(userPlaza));
  const [analysisPrice, setAnalysisPrice] = useState(150);

  const analysisData = usePricingAnalysis({
    serviceId: analysisService.id,
    serviceName: analysisService.name,
    pracaId: analysisPlaza,
    pracaName: analysisPlaza,
    currentPrice: analysisPrice,
    enabled: true,
  });

  const title =
    userRole === 'admin'
      ? 'Contexto de Mercado e Decisão'
      : 'Análise para Validação';

  const subtitle =
    userRole === 'admin'
      ? 'Selecione um serviço e praça para receber análise inteligente e recomendações'
      : 'Use estas análises para fundamentar sua decisão de aprovação ou rejeição';

  return (
    <div style={{ maxWidth: '1440px' }}>
      {/* Controls Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#001022', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          {subtitle}
        </p>

        {/* Selectors Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Service selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Serviço
            </label>
            <select
              value={analysisService.id}
              onChange={(e) => {
                const svc = ANALYSIS_SERVICES.find((s) => s.id === e.target.value);
                if (svc) setAnalysisService(svc);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                color: '#001022',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {ANALYSIS_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Plaza selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Praça
            </label>
            <select
              value={analysisPlaza}
              onChange={(e) => setAnalysisPlaza(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                color: '#001022',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {ANALYSIS_PLAZAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Current price */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Preço Atual (R$)
            </label>
            <input
              type="number"
              value={analysisPrice}
              onChange={(e) => setAnalysisPrice(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                color: '#001022',
                backgroundColor: '#FFFFFF',
              }}
              min={0}
              step={0.01}
            />
          </div>

          {/* Proposed price */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Preço Proposto (R$)
            </label>
            <input
              type="number"
              value={analysisData.proposedPrice}
              onChange={(e) => analysisData.setProposedPrice(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #78BE20',
                fontSize: '13px',
                color: '#001022',
                backgroundColor: '#F0FDF4',
                fontWeight: 600,
              }}
              min={0}
              step={0.01}
            />
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      <AnalysisPanel
        context={analysisData.context}
        loading={analysisData.loading}
        error={analysisData.error}
        onRefresh={analysisData.refresh}
        competitorContext={analysisData.competitorContext}
        cnaeContext={analysisData.cnaeContext}
      />
    </div>
  );
}
