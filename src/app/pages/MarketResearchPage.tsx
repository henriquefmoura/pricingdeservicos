import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { MarketResearchForm } from '../components/MarketResearchForm';
import { useAuthStore } from '../store/authStore';
import { useMarketResearchStore } from '../store/marketResearchStore';

export default function MarketResearchPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { initializeMockResearches } = useMarketResearchStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (user.role === 'user') {
      navigate('/dashboard');
    } else if (user.role === 'master') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    initializeMockResearches();
  }, [initializeMockResearches]);

  if (!isAuthenticated || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="PesquisaMercado" title="" subtitle="">
      <MarketResearchForm />
    </AppLayout>
  );
}
