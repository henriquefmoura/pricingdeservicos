// ========================================
// useCompetitorIntelligence Hook
// ========================================

import { useState, useCallback } from 'react';
import type {
  CompetitorSearchInput,
  CompetitorAnalysisResult,
  NormalizedPrice,
} from '../types/competitor';
import { searchCompetitorPrices } from '../services/competitor/competitorSearchService';
import { scrapeSearchResults } from '../services/competitor/competitorScraperService';
import { parseScrapedContent } from '../services/competitor/competitorParserService';
import { runNormalizationPipeline } from '../services/competitor/competitorNormalizer';
import { aggregatePrices } from '../services/competitor/competitorAggregator';
import { buildAnalysisResult } from '../services/competitor/competitorInsightsEngine';

export interface UseCompetitorIntelligenceReturn {
  result: CompetitorAnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyze: (input: CompetitorSearchInput, userPrice?: number) => Promise<void>;
  clear: () => void;
}

export function useCompetitorIntelligence(): UseCompetitorIntelligenceReturn {
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (input: CompetitorSearchInput, userPrice?: number) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1 & 2: Search for competitor prices across multiple sources
      const searchResults = await searchCompetitorPrices(input);

      if (searchResults.length === 0) {
        setResult(buildAnalysisResult(input, null, [], userPrice));
        return;
      }

      // Step 3: Scrape content from search results
      const scrapedContent = await scrapeSearchResults(
        searchResults,
        input.service,
        input.city
      );

      // Step 4: Parse scraped content for prices
      const rawPrices = parseScrapedContent(scrapedContent);

      // Step 5 & 6: Normalize, deduplicate, filter outliers
      const normalizedPrices: NormalizedPrice[] = runNormalizationPipeline(
        rawPrices,
        input.city
      );

      // Step 7 & 8: Aggregate into summary
      const summary = aggregatePrices(normalizedPrices, input.service, input.city);

      // Build complete analysis result with insights
      const analysisResult = buildAnalysisResult(input, summary, normalizedPrices, userPrice);

      setResult(analysisResult);
    } catch {
      setError('Erro ao analisar preços de concorrentes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clear };
}
