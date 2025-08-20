import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import * as turf from '@turf/turf';

const AreaStats = ({ 
  uploadedFeatures, 
  activeLayer, 
  isDarkMode, 
  map,
  isCongressionalDistrict = false, 
  positionClass = "left-16",
  onFeaturesDataChange
}) => {
  const [stats, setStats] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dataSource] = useState('');

  const valueKey = useMemo(() => {
    if (!activeLayer) return 'raster_value';
    if (activeLayer.includes('DroughtRisk')) return 'drought_risk';
    if (activeLayer.includes('InsectRisk')) return 'insect_risk';
    if (activeLayer.includes('FireRisk')) return 'fire_risk';
    return 'raster_value';
  }, [activeLayer]);

  const safePolygon = useMemo(() => {
    try {
      if (!uploadedFeatures?.[0]) return null;
      const feature = uploadedFeatures[0];
      if (!feature.geometry?.coordinates) return null;
      const validatedFeature = turf.cleanCoords(feature);
      return turf.simplify(validatedFeature, {
        tolerance: 0.0001,
        highQuality: true
      });
    } catch (error) {
      console.warn('Error creating safe polygon:', error);
      return null;
    }
  }, [uploadedFeatures]);

  const statsTitle = isCongressionalDistrict 
    ? "District Statistics" 
    : "Area Statistics";

  const calculateStats = useCallback(async () => {
    if (!map || !activeLayer || !safePolygon) {
      setStats(null);
      return;
    }
  
    setIsCalculating(true);
    
    try {
      const layerIds = [activeLayer];
      if (activeLayer.startsWith('composite')) {
        for (let i = 2; i <= 100; i++) {
          const compositeId = `${activeLayer}_${i}`;
          if (map.getLayer(compositeId)) {
            layerIds.push(compositeId);
          }
        }
      }
  
      const allFeatures = [];
      const processedCoords = new Set();

      const isCongressionalDistrict = uploadedFeatures?.[0]?.properties?.NAMELSAD20;
      
      for (const layerId of layerIds) {
        let features;

        features = map.queryRenderedFeatures(undefined, {
          layers: [layerId]
        });
  
        features.forEach(feature => {
          try {
            if (!feature.geometry || !feature.properties) return;
            const bounds = turf.bbox(feature);
            const centerLon = (bounds[0] + bounds[2]) / 2;
            const centerLat = (bounds[1] + bounds[3]) / 2;
            const coordKey = `${centerLon.toFixed(4)},${centerLat.toFixed(4)}`;
  
            if (processedCoords.has(coordKey)) return;
  
            const centerPoint = turf.point([centerLon, centerLat]);
  
            if (turf.booleanPointInPolygon(centerPoint, safePolygon)) {
              const value = feature.properties[valueKey];
              if (typeof value === 'number' && !isNaN(value)) {
                allFeatures.push({
                  value,
                  coordKey,
                  longitude: centerLon,
                  latitude: centerLat,
                  properties: feature.properties,
                  region: feature.properties.region
                });
                processedCoords.add(coordKey);
              }
            }
          } catch (error) {
            console.warn('Error processing feature:', error);
          }
        });
      }
  
      console.log(`Found ${allFeatures.length} features in the selected area`);
      
      if (allFeatures.length > 0) {
        const values = allFeatures.map(f => f.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sortedValues = [...values].sort((a, b) => a - b);
        
        setStats({
          mean: mean.toFixed(2),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          median: sortedValues[Math.floor(values.length / 2)].toFixed(2),
          count: values.length
        });
        onFeaturesDataChange?.(allFeatures);
      } else {
        console.log('No features found in the selected area');
        setStats(null);
        onFeaturesDataChange?.([]);
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats(null);
    } finally {
      setIsCalculating(false);
    }
  }, [map, activeLayer, safePolygon, valueKey, uploadedFeatures]);

  useEffect(() => {
    const timer = setTimeout(calculateStats, 100);
    return () => clearTimeout(timer);
  }, [calculateStats]);

  if (!activeLayer || !uploadedFeatures?.length) return null;

  return (
    <div className={`
      absolute bottom-8 ${positionClass} z-10 w-80
      rounded-lg shadow-lg border
      ${isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'}
    `}>
      <div 
        className={`
          flex items-center justify-between p-3
          cursor-pointer
          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          ${isCollapsed ? '' : 'border-b'}
        `}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className={`text-sm font-medium ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {statsTitle}
        </h3>
        {isCollapsed ? (
          <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        ) : (
          <ChevronUp size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        )}
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-2">
          {isCalculating ? (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Calculating...
            </div>
          ) : stats ? (
            <>
              <div className={`
                grid grid-cols-4 gap-2 
                p-3 rounded-md border-2 
                ${isDarkMode ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-500/20 bg-blue-50/50'}
              `}>
                {[
                  { label: 'Mean', value: stats.mean },
                  { label: 'Min', value: stats.min },
                  { label: 'Max', value: stats.max },
                  { label: 'Med', value: stats.median }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className={`text-xs ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {label}
                    </div>
                    <div className={`text-sm font-bold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {dataSource} • {stats.count.toLocaleString()} features
              </div>
            </>
          ) : (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No features found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaStats;