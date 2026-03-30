// ========================================
// Competitor Intelligence Page
// ========================================

import { AppLayout } from '../components/AppLayout';
import { CompetitorDashboard } from '../components/competitor-intelligence/CompetitorDashboard';

export default function CompetitorIntelligencePage() {
  return (
    <AppLayout activeNav="Concorrência" title="Inteligência Competitiva" subtitle="Análise de preços de mercado por praça e serviço">
      <CompetitorDashboard />
    </AppLayout>
  );
}
