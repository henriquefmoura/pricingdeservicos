// ========================================
// Territorial Map — Interactive Leaflet
// ========================================

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchBrazilStatesGeoJSON, fetchMunicipiosGeoJSON } from '../../services/ibgeMapService';
import type { GeoJSONFeatureCollection } from '../../services/ibgeMapService';

interface Props {
  selectedUF?: string;
  selectedIbgeCode?: string;
  onCityClick?: (ibgeCode: string, name: string) => void;
  onStateClick?: (ufCode: string) => void;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [map, center, zoom]);
  return null;
}

export function TerritorialMap({ selectedUF, selectedIbgeCode, onCityClick, onStateClick }: Props) {
  const [statesGeo, setStatesGeo] = useState<GeoJSONFeatureCollection | null>(null);
  const [munGeo, setMunGeo] = useState<GeoJSONFeatureCollection | null>(null);
  const [center, setCenter] = useState<[number, number]>([-14.235, -51.925]);
  const [zoom, setZoom] = useState(4);
  const geoKeyRef = useRef(0);

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
    layer.bindTooltip(name, { sticky: true, className: 'text-sm' });
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 500 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        {statesGeo && !munGeo && (
          <GeoJSON
            key={`states-${geoKeyRef.current}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={statesGeo as any}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}
        {munGeo && (
          <GeoJSON
            key={`mun-${geoKeyRef.current}-${selectedIbgeCode}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={munGeo as any}
            style={munStyle}
            onEachFeature={onEachMun}
          />
        )}
      </MapContainer>
    </div>
  );
}
