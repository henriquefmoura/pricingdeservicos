// ========================================
// Analysis Alerts Panel
// ========================================
// Painel de alertas e justificativas.

import React from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import type { AnalysisAlert } from '../../types/pricingAnalysis';

interface Props {
  alerts: AnalysisAlert[];
  positiveSignals: string[];
  negativeSignals: string[];
}

export function AnalysisAlertsPanel({ alerts, positiveSignals, negativeSignals }: Props) {
  return (
    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
        Alertas e Justificativas
      </h4>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Signals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Positive */}
        {positiveSignals.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} />
              SINAIS FAVORÁVEIS ({positiveSignals.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {positiveSignals.map((signal, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ECFDF5',
                    fontSize: '12px',
                    color: '#065F46',
                    lineHeight: 1.4,
                  }}
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative */}
        {negativeSignals.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} />
              SINAIS DE ATENÇÃO ({negativeSignals.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {negativeSignals.map((signal, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#FEF2F2',
                    fontSize: '12px',
                    color: '#991B1B',
                    lineHeight: 1.4,
                  }}
                >
                  {signal}
                </div>
              ))}
            </div>
          </div>
        )}

        {positiveSignals.length === 0 && negativeSignals.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '12px', borderRadius: '8px', backgroundColor: '#F9FAFB', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Sem sinais adicionais identificados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: AnalysisAlert }) {
  const config = getSeverityConfig(alert.severity);

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '8px',
      backgroundColor: config.bg,
      borderLeft: `3px solid ${config.borderColor}`,
      display: 'flex',
      gap: '10px',
    }}>
      {config.icon}
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: config.titleColor, marginBottom: '2px' }}>
          {alert.title}
        </p>
        <p style={{ fontSize: '12px', color: config.textColor, lineHeight: 1.4 }}>
          {alert.description}
        </p>
      </div>
    </div>
  );
}

function getSeverityConfig(severity: 'info' | 'warning' | 'critical') {
  switch (severity) {
    case 'critical':
      return {
        bg: '#FEF2F2',
        borderColor: '#DC2626',
        titleColor: '#991B1B',
        textColor: '#B91C1C',
        icon: <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />,
      };
    case 'warning':
      return {
        bg: '#FFFBEB',
        borderColor: '#D97706',
        titleColor: '#92400E',
        textColor: '#B45309',
        icon: <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />,
      };
    default:
      return {
        bg: '#EFF6FF',
        borderColor: '#3B82F6',
        titleColor: '#1E40AF',
        textColor: '#1D4ED8',
        icon: <Info size={16} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '1px' }} />,
      };
  }
}
