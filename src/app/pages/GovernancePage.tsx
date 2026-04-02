import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { useAuthStore } from '../store/authStore';
import { PricingGovernanceDashboard } from '../components/master/PricingGovernanceDashboard';

export default function GovernancePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

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
      activeNav="Governança"
      title="Acompanhamento Precificação"
      subtitle="Acompanhe o comportamento e a qualidade do processo de precificação"
    >
      <PricingGovernanceDashboard />
    </AppLayout>
  );
}
