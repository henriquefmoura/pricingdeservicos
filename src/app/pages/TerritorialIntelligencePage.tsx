// ========================================
// Territorial Intelligence Page
// ========================================

import { AppLayout } from '../components/AppLayout';
import { TerritorialDashboard } from '../components/territorial-intelligence/TerritorialDashboard';

export default function TerritorialIntelligencePage() {
  return (
    <AppLayout activeNav="Territorial" title="Inteligência Territorial" subtitle="Análise socioeconômica e de oferta por praça">
      <TerritorialDashboard />
    </AppLayout>
  );
}
