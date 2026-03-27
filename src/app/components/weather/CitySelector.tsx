// ========================================
// City Selector — Seleção de Praça
// ========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import type { PlazaOption, DateRangePreset } from '../../types/weather';
import { PRESET_OPTIONS } from '../../utils/dateRangePresets';

/** Praças pré-cadastradas com coordenadas conhecidas */
const DEFAULT_PLAZAS: PlazaOption[] = [
  { label: 'São Paulo', value: 'São Paulo', latitude: -23.5505, longitude: -46.6333 },
  { label: 'Rio de Janeiro', value: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729 },
  { label: 'Belo Horizonte', value: 'Belo Horizonte', latitude: -19.9191, longitude: -43.9386 },
  { label: 'Curitiba', value: 'Curitiba', latitude: -25.4284, longitude: -49.2733 },
  { label: 'Florianópolis', value: 'Florianópolis', latitude: -27.5954, longitude: -48.548 },
  { label: 'Porto Alegre', value: 'Porto Alegre', latitude: -30.0346, longitude: -51.2177 },
  { label: 'Salvador', value: 'Salvador', latitude: -12.9714, longitude: -38.5124 },
  { label: 'Recife', value: 'Recife', latitude: -8.0476, longitude: -34.877 },
  { label: 'Fortaleza', value: 'Fortaleza', latitude: -3.7172, longitude: -38.5433 },
  { label: 'Brasília', value: 'Brasília', latitude: -15.7975, longitude: -47.8919 },
  { label: 'Goiânia', value: 'Goiânia', latitude: -16.6869, longitude: -49.2648 },
  { label: 'Manaus', value: 'Manaus', latitude: -3.119, longitude: -60.0217 },
];

interface CitySelectorProps {
  selectedCity: string;
  selectedPreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
  loading: boolean;
  onCitySelect: (city: string, lat?: number, lon?: number) => void;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
  onSearch: (city: string, lat?: number, lon?: number) => void;
}

export function CitySelector({
  selectedCity,
  selectedPreset,
  customStartDate,
  customEndDate,
  loading,
  onCitySelect,
  onPresetChange,
  onCustomStartChange,
  onCustomEndChange,
  onSearch,
}: CitySelectorProps) {
  const [manualCity, setManualCity] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePlazaSelect = useCallback(
    (plaza: PlazaOption) => {
      onCitySelect(plaza.value, plaza.latitude, plaza.longitude);
      setShowDropdown(false);
      setManualCity('');
      onSearch(plaza.value, plaza.latitude, plaza.longitude);
    },
    [onCitySelect, onSearch]
  );

  const handleManualSearch = useCallback(() => {
    const trimmed = manualCity.trim();
    if (!trimmed) return;
    onCitySelect(trimmed);
    setShowDropdown(false);
    onSearch(trimmed);
  }, [manualCity, onCitySelect, onSearch]);

  const filteredPlazas = manualCity.trim()
    ? DEFAULT_PLAZAS.filter((p) =>
        p.label.toLowerCase().includes(manualCity.toLowerCase())
      )
    : DEFAULT_PLAZAS;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '16px',
      }}
    >
      {/* City selector */}
      <div ref={dropdownRef} style={{ position: 'relative', minWidth: '280px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Praça / Cidade
        </label>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              color: '#94A3B8',
            }}
          >
            <MapPin size={16} />
          </div>

          <input
            type="text"
            placeholder={selectedCity || 'Selecione uma praça...'}
            value={manualCity}
            onChange={(e) => {
              setManualCity(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualSearch();
              }
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '10px 0',
              fontSize: '14px',
              color: '#0F172A',
              backgroundColor: 'transparent',
            }}
          />

          <button
            onClick={handleManualSearch}
            disabled={loading || !manualCity.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 14px',
              border: 'none',
              backgroundColor: '#78BE20',
              color: '#FFFFFF',
              cursor: loading || !manualCity.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !manualCity.trim() ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {/* Dropdown */}
        {showDropdown && filteredPlazas.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              maxHeight: '240px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {filteredPlazas.map((plaza) => (
              <button
                key={plaza.value}
                onClick={() => handlePlazaSelect(plaza)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  backgroundColor:
                    selectedCity === plaza.value ? '#F0FDF4' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1E293B',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCity !== plaza.value) {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    selectedCity === plaza.value ? '#F0FDF4' : 'transparent';
                }}
              >
                <MapPin size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                {plaza.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preset selector */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Período Histórico
        </label>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PRESET_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onPresetChange(option.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor:
                  selectedPreset === option.value ? '#78BE20' : '#E2E8F0',
                backgroundColor:
                  selectedPreset === option.value ? '#F0FDF4' : '#FFFFFF',
                color:
                  selectedPreset === option.value ? '#166534' : '#475569',
                fontSize: '13px',
                fontWeight: selectedPreset === option.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {selectedPreset === 'custom' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '6px',
              }}
            >
              Início
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '6px',
              }}
            >
              Fim
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
