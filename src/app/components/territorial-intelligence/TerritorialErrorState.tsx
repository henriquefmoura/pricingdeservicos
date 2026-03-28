// ========================================
// Territorial Error State
// ========================================

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function TerritorialErrorState({ message = 'Erro ao carregar dados territoriais.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Erro</h3>
      <p className="text-sm text-gray-500 max-w-md mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 px-4 py-2 bg-[#78BE20] text-white rounded-lg hover:bg-[#6aab1a] text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      )}
    </div>
  );
}
