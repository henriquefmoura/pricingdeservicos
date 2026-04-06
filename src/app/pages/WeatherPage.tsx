// ========================================
// Weather Page — Clima da Praça
// ========================================

import { AppLayout } from '../components/AppLayout';
import { WeatherModule } from '../components/weather/WeatherModule';

export default function WeatherPage() {
  return (
    <AppLayout activeNav="Clima" title="" subtitle="">
      <WeatherModule />
    </AppLayout>
  );
}
