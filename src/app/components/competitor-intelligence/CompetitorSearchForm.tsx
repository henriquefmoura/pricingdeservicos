// ========================================
// Competitor Search Form
// ========================================

import { useState } from 'react';
import { Search, MapPin, Tag } from 'lucide-react';
import type { CompetitorSearchInput } from '../../types/competitor';

interface Props {
  onSearch: (input: CompetitorSearchInput, userPrice?: number) => void;
  loading: boolean;
}

const COMMON_SERVICES = [
  'Instalação de ar-condicionado',
  'Limpeza residencial',
  'Pintura de parede',
  'Instalação elétrica',
  'Desentupimento',
  'Jardinagem',
  'Montagem de móveis',
  'Impermeabilização',
  'Instalação de piso',
  'Reparos hidráulicos',
];

export function CompetitorSearchForm({ onSearch, loading }: Props) {
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [keywords, setKeywords] = useState('');
  const [userPrice, setUserPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !service.trim()) return;

    onSearch(
      {
        city: city.trim(),
        service: service.trim(),
        keywords: keywords.trim() ? keywords.split(',').map((k) => k.trim()) : undefined,
      },
      userPrice.trim() ? parseFloat(userPrice.replace(',', '.')) : undefined
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        Pesquisa de Preços de Mercado
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* City */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            Cidade / Praça
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: São Paulo"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            required
          />
        </div>

        {/* Service */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <Tag className="w-3 h-3 inline mr-1" />
            Serviço
          </label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white"
            required
          >
            <option value="">Selecione...</option>
            {COMMON_SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Palavras-chave (opcional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Ex: residencial, split"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
        </div>

        {/* User price */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Seu preço (R$, opcional)
          </label>
          <input
            type="text"
            value={userPrice}
            onChange={(e) => setUserPrice(e.target.value)}
            placeholder="Ex: 350"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !city.trim() || !service.trim()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: loading ? '#94a3b8' : '#78BE20' }}
      >
        <Search className="w-4 h-4" />
        {loading ? 'Analisando...' : 'Analisar Mercado'}
      </button>
    </form>
  );
}
