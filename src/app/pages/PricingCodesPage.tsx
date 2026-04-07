import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ListChecks } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAuthStore } from '../store/authStore';
import { usePricingCodesStore } from '../store/pricingCodesStore';
import { PricingCodesManager } from './PricingCodesManager';

export default function PricingCodesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { initializeMockCodes } = usePricingCodesStore();

  // Initialize mock codes
  useEffect(() => {
    initializeMockCodes();
  }, [initializeMockCodes]);

  // Auth guard - only master can access
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'master') {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user || user.role !== 'master') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout
      activeNav="Códigos"
      title=""
      subtitle=""
    >
      {/* Page header banner */}
      <div
        className="rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)', padding: '24px', marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px' }}>
            <ListChecks size={24} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.015em' }}>
              Códigos para Precificação
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
              Gerencie os códigos de serviço que precisam ser precificados
            </p>
          </div>
        </div>
      </div>

      <PricingCodesManager />
    </AppLayout>
  );
}
