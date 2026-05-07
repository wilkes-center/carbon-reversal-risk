// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import { layers } from '../../utils/map/layers';
import { logger } from '../../utils/logger';

export const useEnhancedMapLayer = (map, activeLayer, isDarkMode) => {
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef({});

  const cleanupLayer = useCallback((layerId) => {
    if (!map) return;
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);
    } catch (error) {
      logger.warn(`Error cleaning up layer ${layerId}:`, error);
    }
  }, [map]);

  useEffect(() => {
    if (!map || !activeLayer) return;

    setIsLoading(true);

    const layerConfig = layers.find((l) => l.id === activeLayer);
    if (!layerConfig) {
      logger.warn(`Layer config not found for layer ID: ${activeLayer}`);
      setIsLoading(false);
      return;
    }

    Object.values(cleanupRef.current).forEach((cleanup) => {
      if (typeof cleanup === 'function') cleanup();
    });
    cleanupRef.current = {};

    cleanupLayer(activeLayer);
    const paint = generatePaintProperty(activeLayer, isDarkMode);

    if (!map.getSource(activeLayer)) {
      map.addSource(activeLayer, layerConfig.source);
    }

    map.addLayer({
      id: activeLayer,
      type: 'fill',
      source: activeLayer,
      'source-layer': layerConfig.layer['source-layer'],
      paint: {
        'fill-color': paint['fill-color'],
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0,0,0,0)',
      },
      layout: { visibility: 'visible' },
      filter: layerConfig.layer.filter,
    });
    setIsLoading(false);

    const handleStyleData = () => {
      if (!map.isStyleLoaded()) return;
      const nextPaint = generatePaintProperty(activeLayer, isDarkMode);
      if (map.getLayer(activeLayer)) {
        Object.entries(nextPaint).forEach(([property, value]) => {
          map.setPaintProperty(activeLayer, property, value);
        });
      }
    };

    map.on('styledata', handleStyleData);

    cleanupRef.current[activeLayer] = () => {
      map.off('styledata', handleStyleData);
      cleanupLayer(activeLayer);
    };

    return () => {
      Object.values(cleanupRef.current).forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [map, activeLayer, isDarkMode, cleanupLayer]);

  return { isLoading };
};
