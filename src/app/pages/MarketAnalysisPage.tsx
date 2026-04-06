import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp } from 'lucide-react';
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
      <div className="space-y-6">
        {/* Gradient header banner */}
        <div
          className="rounded-xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(to right, #001022, #1a3a1a, #78BE20)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Análise de Mercado</h2>
              <p className="text-white/80 text-sm mt-1">
                Análise de mercado e inteligência de preços
              </p>
            </div>
          </div>
        </div>

        <SharedAnalysisPanel userPlaza={user?.plaza} userRole="admin" />
      </div>
    </AppLayout>
  );
}
