// ========================================
// Weather Page — Clima da Praça
// ========================================

import { AppLayout } from '../components/AppLayout';
import { WeatherModule } from '../components/weather/WeatherModule';

export default function WeatherPage() {
  return (
    <AppLayout activeNav="Clima" title="Clima e Sazonalidade" subtitle="Condições climáticas e impacto operacional na precificação">
      <WeatherModule />
    </AppLayout>
  );
}
