// ========================================
// Competitor Position Bar
// ========================================
// Visual indicator of user's price position relative to the market.

import type { PricePosition } from '../../types/competitor';

interface Props {
  position: PricePosition;
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CompetitorPositionBar({ position }: Props) {
  const clampedPercent = Math.max(0, Math.min(100, position.positionPercent));

  const getColor = () => {
    if (position.userPrice < position.marketMin) return '#EF4444';
    if (position.userPrice > position.marketMax) return '#EF4444';
    if (Math.abs(position.userPrice - position.marketMedian) / position.marketMedian < 0.1) return '#78BE20';
    return '#F59E0B';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Posicionamento de Preço
        </h3>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${getColor()}20`, color: getColor() }}
        >
          {position.positionLabel}
        </span>
      </div>

      {/* Position bar */}
      <div className="relative mt-6 mb-8">
        {/* Track */}
        <div className="h-3 bg-gradient-to-r from-red-200 via-green-200 to-red-200 rounded-full" />

        {/* Market min/max labels */}
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{fmtBRL(position.marketMin)}</span>
          <span className="text-xs text-gray-400">{fmtBRL(position.marketMax)}</span>
        </div>

        {/* Median marker */}
        <div
          className="absolute top-0 w-0.5 h-5 bg-gray-400"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
            Mediana
          </span>
        </div>

        {/* User price marker */}
        <div
          className="absolute -top-1 w-5 h-5 rounded-full border-2 border-white shadow-md"
          style={{
            left: `${clampedPercent}%`,
            transform: 'translateX(-50%)',
            backgroundColor: getColor(),
          }}
        >
          <span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap"
            style={{ color: getColor() }}
          >
            {fmtBRL(position.userPrice)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500">Mínimo</p>
          <p className="text-sm font-semibold text-gray-700">{fmtBRL(position.marketMin)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Mediana</p>
          <p className="text-sm font-semibold text-green-600">{fmtBRL(position.marketMedian)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Máximo</p>
          <p className="text-sm font-semibold text-gray-700">{fmtBRL(position.marketMax)}</p>
        </div>
      </div>
    </div>
  );
}
