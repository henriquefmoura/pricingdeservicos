// ========================================
// Competitor Dashboard — Main Orchestrator
// ========================================

import { useCompetitorIntelligence } from '../../hooks/useCompetitorIntelligence';
import { CompetitorSearchForm } from './CompetitorSearchForm';
import { CompetitorPriceSummaryCard } from './CompetitorPriceSummaryCard';
import { CompetitorInsightsPanel } from './CompetitorInsightsPanel';
import { CompetitorSourcesTable } from './CompetitorSourcesTable';
import { CompetitorPriceChart } from './CompetitorPriceChart';
import { CompetitorPositionBar } from './CompetitorPositionBar';
import { CompetitorSkeleton } from './CompetitorSkeleton';
import { Crosshair } from 'lucide-react';
import type { CompetitorSearchInput } from '../../types/competitor';

export function CompetitorDashboard() {
  const { result, loading, error, analyze, clear } = useCompetitorIntelligence();

  const handleSearch = (input: CompetitorSearchInput, userPrice?: number) => {
    clear();
    analyze(input, userPrice);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <CompetitorSearchForm onSearch={handleSearch} loading={loading} />

      {/* Loading State */}
      {loading && <CompetitorSkeleton />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary Cards */}
          {result.summary && (
            <CompetitorPriceSummaryCard summary={result.summary} />
          )}

          {/* Price Position Bar */}
          {result.position && (
            <CompetitorPositionBar position={result.position} />
          )}

          {/* Price Distribution Chart */}
          {result.summary && result.normalizedPrices.length > 0 && (
            <CompetitorPriceChart
              summary={result.summary}
              prices={result.normalizedPrices}
              position={result.position}
            />
          )}

          {/* Insights */}
          {result.insights.length > 0 && (
            <CompetitorInsightsPanel insights={result.insights} />
          )}

          {/* Sources Table */}
          {result.normalizedPrices.length > 0 && (
            <CompetitorSourcesTable prices={result.normalizedPrices} />
          )}

          {/* No data state */}
          {!result.summary && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <Crosshair className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Nenhuma referência de preço encontrada para esta combinação de serviço e praça.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tente alterar o serviço, a cidade ou adicionar palavras-chave.
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <Crosshair className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Inteligência de Preços da Concorrência
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Pesquise preços de mercado para qualquer serviço e praça.
            O motor analisa múltiplas fontes e gera insights para apoiar suas decisões de pricing.
          </p>
        </div>
      )}
    </div>
  );
}
