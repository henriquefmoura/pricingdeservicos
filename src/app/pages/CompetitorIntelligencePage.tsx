// ========================================
// Competitor Intelligence Page
// ========================================

import { AppLayout } from '../components/AppLayout';
import { CompetitorDashboard } from '../components/competitor-intelligence/CompetitorDashboard';

export default function CompetitorIntelligencePage() {
  return (
    <AppLayout activeNav="Concorrência" title="" subtitle="">
      <CompetitorDashboard />
    </AppLayout>
  );
}
