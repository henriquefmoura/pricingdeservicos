// ========================================
// Weather Page — Clima da Praça
// ========================================

import { AppLayout } from '../components/AppLayout';
import { WeatherModule } from '../components/weather/WeatherModule';

export default function WeatherPage() {
  return (
    <AppLayout activeNav="Clima" title="Clima da Praça" subtitle="Condições climáticas e impacto operacional">
      <WeatherModule />
    </AppLayout>
  );
}
