import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
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
      title="Códigos para Precificação"
      subtitle="Gerencie os códigos de serviço que precisam ser precificados"
    >
      <PricingCodesManager />
    </AppLayout>
  );
}
