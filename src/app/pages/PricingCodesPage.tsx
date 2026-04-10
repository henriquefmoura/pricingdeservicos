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
        className="rounded-xl p-6 text-white shadow-lg mb-6"
        style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Códigos para Precificação</h2>
            <p className="text-white/80 text-sm mt-1">
              Gerencie os códigos de serviço que precisam ser precificados
            </p>
          </div>
        </div>
      </div>

      <PricingCodesManager />
    </AppLayout>
  );
}
