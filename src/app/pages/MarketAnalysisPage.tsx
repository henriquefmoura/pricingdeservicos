import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { SharedAnalysisPanel } from '../components/shared/SharedAnalysisPanel';
import { useAuthStore } from '../store/authStore';

export default function MarketAnalysisPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

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

  if (!isAuthenticated || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#6B7280' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <AppLayout activeNav="AnaliseMercado" title="Análise de Mercado" subtitle="Análise de mercado e inteligência de preços">
      <SharedAnalysisPanel userPlaza={user?.plaza} userRole="admin" />
    </AppLayout>
  );
}
