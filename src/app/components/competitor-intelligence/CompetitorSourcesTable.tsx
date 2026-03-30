// ========================================
// Competitor Sources Table
// ========================================

import { ExternalLink, Globe } from 'lucide-react';
import type { NormalizedPrice, SourceType } from '../../types/competitor';

interface Props {
  prices: NormalizedPrice[];
}

const SOURCE_LABELS: Record<SourceType, string> = {
  marketplace: 'Marketplace',
  institucional: 'Institucional',
  classificado: 'Classificado',
  busca: 'Busca',
  conteudo: 'Conteúdo',
  interna: 'Interna',
};

const SOURCE_COLORS: Record<SourceType, string> = {
  marketplace: 'bg-blue-100 text-blue-700',
  institucional: 'bg-green-100 text-green-700',
  classificado: 'bg-amber-100 text-amber-700',
  busca: 'bg-gray-100 text-gray-700',
  conteudo: 'bg-purple-100 text-purple-700',
  interna: 'bg-emerald-100 text-emerald-700',
};

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function CompetitorSourcesTable({ prices }: Props) {
  if (prices.length === 0) return null;

  // Sort by confidence descending
  const sorted = [...prices].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4 text-gray-400" />
        Fontes de Dados ({prices.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Fonte</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Unidade</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Confiança</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Cidade</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((price, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-3">
                  <span className="flex items-center gap-1.5 text-gray-700" title={price.source}>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{extractDomain(price.source)}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[price.sourceType]}`}>
                    {SOURCE_LABELS[price.sourceType]}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                  {fmtBRL(price.value)}
                </td>
                <td className="py-2.5 px-3 text-center text-gray-500 text-xs">
                  {price.unit ?? '—'}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs font-medium ${
                    price.confidence >= 70 ? 'text-green-600' :
                    price.confidence >= 40 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {price.confidence}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-xs text-gray-500">
                  {price.city ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
