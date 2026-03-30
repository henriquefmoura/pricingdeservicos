// ========================================
// Territorial Map — Interactive Leaflet
// ========================================

import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import type { Layer, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchBrazilStatesGeoJSON, fetchMunicipiosGeoJSON } from '../../services/ibgeMapService';
import type { GeoJSONFeatureCollection } from '../../services/ibgeMapService';
import { generateMeiDensityForMunicipalities, generateProfessionalMarkers } from '../../services/companySupplyService';
import type { LeroyStore, CnaeProfessionalMarker } from '../../types/territorial';
import { getLeroyStoresByUF, LEROY_MERLIN_STORES } from '../../data/leroyStores';
import { Store, Users, Briefcase } from 'lucide-react';

interface Props {
  selectedUF?: string;
  selectedIbgeCode?: string;
  onCityClick?: (ibgeCode: string, name: string) => void;
  onStateClick?: (ufCode: string) => void;
  showLeroyStores?: boolean;
}

// ----------------------------------------
// Custom icons
// ----------------------------------------

const leroyIcon = new L.DivIcon({
  className: 'leroy-marker',
  html: `<div style="
    width: 32px; height: 32px;
    background: #78BE20;
    border: 3px solid #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    font-size: 14px; font-weight: bold; color: #fff;
  ">LM</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const cnaeCompanyIcon = new L.DivIcon({
  className: 'cnae-company-marker',
  html: `<div style="
    width: 22px; height: 22px;
    background: #3b82f6;
    border: 2px solid #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    font-size: 10px; font-weight: bold; color: #fff;
  ">E</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const cnaeMeiIcon = new L.DivIcon({
  className: 'cnae-mei-marker',
  html: `<div style="
    width: 22px; height: 22px;
    background: #f59e0b;
    border: 2px solid #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    font-size: 10px; font-weight: bold; color: #fff;
  ">M</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [map, center, zoom]);
  return null;
}

export function TerritorialMap({
  selectedUF,
  selectedIbgeCode,
  onCityClick,
  onStateClick,
  showLeroyStores = true,
}: Props) {
  const [statesGeo, setStatesGeo] = useState<GeoJSONFeatureCollection | null>(null);
  const [munGeo, setMunGeo] = useState<GeoJSONFeatureCollection | null>(null);
  const [center, setCenter] = useState<[number, number]>([-14.235, -51.925]);
  const [zoom, setZoom] = useState(4);
  const [layerToggles, setLayerToggles] = useState({
    leroy: true,
    meiDensity: false,
    cnaeProfessionals: false,
  });
  const geoKeyRef = useRef(0);

  // Leroy stores for current view
  const visibleStores: LeroyStore[] = selectedUF
    ? getLeroyStoresByUF(selectedUF)
    : LEROY_MERLIN_STORES;

  // MEI density data from municipalities GeoJSON
  const meiDensityData = useMemo<Record<string, number>>(() => {
    if (!munGeo) return {};
    return generateMeiDensityForMunicipalities(munGeo.features);
  }, [munGeo]);

  // Professional markers for selected city
  const professionalMarkers = useMemo<CnaeProfessionalMarker[]>(() => {
    if (!selectedIbgeCode || !munGeo) return [];
    // Find the centroid of the selected municipality from GeoJSON
    const feature = munGeo.features.find((f) => {
      const code = String(f.properties?.codarea ?? f.id ?? '');
      return code === selectedIbgeCode;
    });
    if (!feature?.geometry) return [];

    const centroid = computeGeometryCentroid(feature.geometry);
    if (!centroid) return [];

    return generateProfessionalMarkers(selectedIbgeCode, centroid[0], centroid[1]);
  }, [selectedIbgeCode, munGeo]);

  // Auto-enable CNAE professionals layer when a city is selected
  useEffect(() => {
    if (selectedIbgeCode && professionalMarkers.length > 0) {
      setLayerToggles((p) => ({ ...p, cnaeProfessionals: true }));
    } else {
      setLayerToggles((p) => ({ ...p, cnaeProfessionals: false }));
    }
  }, [selectedIbgeCode, professionalMarkers.length]);

  // Load Brazil states on mount
  useEffect(() => {
    fetchBrazilStatesGeoJSON().then(setStatesGeo);
  }, []);

  // Load municipalities when UF selected
  useEffect(() => {
    if (!selectedUF) {
      setMunGeo(null);
      setCenter([-14.235, -51.925]);
      setZoom(4);
      return;
    }
    geoKeyRef.current++;
    fetchMunicipiosGeoJSON(selectedUF).then((data) => {
      setMunGeo(data);
      // Zoom into state
      const UF_CENTERS: Record<string, [number, number]> = {
        SP: [-22.0, -49.5], RJ: [-22.5, -43.2], MG: [-18.5, -44.0], PR: [-24.5, -51.5],
        SC: [-27.5, -50.5], RS: [-29.5, -53.5], BA: [-12.5, -41.5], PE: [-8.0, -37.8],
        CE: [-5.0, -39.5], DF: [-15.8, -47.9], GO: [-15.9, -49.3], PA: [-3.5, -52.0], AM: [-3.0, -64.0],
      };
      setCenter(UF_CENTERS[selectedUF] ?? [-14.235, -51.925]);
      setZoom(selectedUF ? 7 : 4);
    });
  }, [selectedUF]);

  const stateStyle = () => ({
    color: '#78BE20',
    weight: 1.5,
    fillColor: '#e8f5e9',
    fillOpacity: 0.3,
  });

  const munStyle = (feature?: GeoJSON.Feature) => {
    const code = feature?.properties?.codarea ?? feature?.id;
    const isSelected = selectedIbgeCode && String(code) === String(selectedIbgeCode);

    // MEI density coloring
    if (layerToggles.meiDensity && meiDensityData) {
      const density = meiDensityData[String(code)] ?? 0;
      const fillColor = getDensityColor(density);
      return {
        color: isSelected ? '#78BE20' : '#666',
        weight: isSelected ? 3 : 0.8,
        fillColor: isSelected ? '#78BE20' : fillColor,
        fillOpacity: isSelected ? 0.5 : 0.4,
      };
    }

    return {
      color: isSelected ? '#78BE20' : '#666',
      weight: isSelected ? 3 : 0.8,
      fillColor: isSelected ? '#78BE20' : '#ccc',
      fillOpacity: isSelected ? 0.5 : 0.2,
    };
  };

  const onEachState = (feature: GeoJSON.Feature, layer: Layer) => {
    const name = feature.properties?.nome ?? feature.properties?.name ?? '';
    const code = feature.properties?.codarea ?? feature.id;
    layer.bindTooltip(name, { sticky: true, className: 'text-sm' });
    layer.on('click', () => onStateClick?.(String(code)));
  };

  const onEachMun = (feature: GeoJSON.Feature, layer: Layer) => {
    const name = feature.properties?.nome ?? feature.properties?.name ?? '';
    const code = feature.properties?.codarea ?? feature.id;

    // Enhanced tooltip with MEI density
    let tooltipContent = name;
    if (layerToggles.meiDensity && meiDensityData) {
      const density = meiDensityData[String(code)];
      if (density !== undefined) {
        tooltipContent += ` | MEIs: ${density}`;
      }
    }

    layer.bindTooltip(tooltipContent, { sticky: true, className: 'text-sm' });
    layer.on('click', (e: LeafletMouseEvent) => {
      e.originalEvent?.stopPropagation();
      onCityClick?.(String(code), name);
    });
    layer.on('mouseover', () => {
      (layer as ReturnType<typeof import('leaflet').geoJSON>).setStyle?.({ fillOpacity: 0.5, weight: 2 });
    });
    layer.on('mouseout', () => {
      (layer as ReturnType<typeof import('leaflet').geoJSON>).setStyle?.(munStyle(feature));
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
      {/* Layer controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => setLayerToggles((p) => ({ ...p, leroy: !p.leroy }))}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-md transition-colors ${
            layerToggles.leroy
              ? 'bg-[#78BE20] text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
          title="Lojas Leroy Merlin"
        >
          <Store size={12} />
          Leroy
        </button>
        {munGeo && (
          <button
            onClick={() => setLayerToggles((p) => ({ ...p, meiDensity: !p.meiDensity }))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-md transition-colors ${
              layerToggles.meiDensity
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
            title="Densidade MEI/CNAE"
          >
            <Users size={12} />
            Densidade MEI
          </button>
        )}
        {selectedIbgeCode && professionalMarkers.length > 0 && (
          <button
            onClick={() => setLayerToggles((p) => ({ ...p, cnaeProfessionals: !p.cnaeProfessionals }))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg shadow-md transition-colors ${
              layerToggles.cnaeProfessionals
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
            title="Profissionais CNAE"
          >
            <Briefcase size={12} />
            CNAE
          </button>
        )}
      </div>

      {/* Legends */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2">
        {/* MEI density legend */}
        {layerToggles.meiDensity && munGeo && (
          <div className="bg-white rounded-lg shadow-md p-2 text-xs">
            <p className="font-semibold text-gray-700 mb-1">Densidade MEI</p>
            <div className="flex items-center gap-1">
              <span className="w-4 h-3 rounded" style={{ background: '#fee0d2' }} />
              <span className="text-gray-500">Baixa (&lt;20)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-3 rounded" style={{ background: '#fc9272' }} />
              <span className="text-gray-500">Média (20-99)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-3 rounded" style={{ background: '#de2d26' }} />
              <span className="text-gray-500">Alta (100+)</span>
            </div>
          </div>
        )}

        {/* CNAE professionals legend */}
        {layerToggles.cnaeProfessionals && selectedIbgeCode && (
          <div className="bg-white rounded-lg shadow-md p-2 text-xs">
            <p className="font-semibold text-gray-700 mb-1">Profissionais CNAE</p>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
              <span className="text-gray-500">Empresa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              <span className="text-gray-500">MEI</span>
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: 500, width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

        {/* States layer */}
        {statesGeo && !munGeo && (
          <GeoJSON
            key={`states-${geoKeyRef.current}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={statesGeo as any}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* Municipalities layer */}
        {munGeo && (
          <GeoJSON
            key={`mun-${geoKeyRef.current}-${selectedIbgeCode}-${layerToggles.meiDensity}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={munGeo as any}
            style={munStyle}
            onEachFeature={onEachMun}
          />
        )}

        {/* Leroy Merlin stores layer */}
        {showLeroyStores && layerToggles.leroy && visibleStores.map((store) => (
          <Marker key={store.id} position={[store.lat, store.lon]} icon={leroyIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-[#78BE20]">{store.name}</p>
                <p className="text-gray-600">{store.city} - {store.uf}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* CNAE Professional markers layer */}
        {layerToggles.cnaeProfessionals && professionalMarkers.map((prof) => (
          <Marker
            key={prof.id}
            position={[prof.lat, prof.lon]}
            icon={prof.type === 'mei' ? cnaeMeiIcon : cnaeCompanyIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold" style={{ color: prof.type === 'mei' ? '#f59e0b' : '#3b82f6' }}>
                  {prof.type === 'mei' ? 'MEI' : 'Empresa'}
                </p>
                <p className="text-gray-700 font-medium">{prof.cnaeDescription}</p>
                <p className="text-gray-500 text-xs">CNAE: {prof.cnae}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ----------------------------------------
// Helpers
// ----------------------------------------

function getDensityColor(density: number): string {
  if (density >= 100) return '#de2d26';
  if (density >= 50) return '#fc9272';
  if (density >= 20) return '#fee0d2';
  return '#f7f7f7';
}

/**
 * Compute a simple centroid from a GeoJSON geometry.
 * Handles Polygon and MultiPolygon types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeGeometryCentroid(geometry: any): [number, number] | null {
  try {
    const coords: number[][] = [];

    if (geometry.type === 'Polygon') {
      for (const ring of geometry.coordinates) {
        for (const pt of ring) {
          coords.push(pt);
        }
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          for (const pt of ring) {
            coords.push(pt);
          }
        }
      }
    }

    if (coords.length === 0) return null;

    let sumLat = 0;
    let sumLon = 0;
    for (const [lon, lat] of coords) {
      sumLat += lat;
      sumLon += lon;
    }
    return [sumLat / coords.length, sumLon / coords.length];
  } catch {
    return null;
  }
}
