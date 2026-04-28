// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import { layers, MAX_COMPOSITE_PARTS } from '../../utils/map/layers';
import { logger } from '../../utils/logger';

const COMPOSITE_CONFIG = {
  compositeGbfLowSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_low_part${i}`,
    sourceLayerPattern: (i) => `gbf_low_part${i}_processed`,
  },
  compositeGbfModerateSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_mod_part${i}`,
    sourceLayerPattern: (i) => `gbf_mod_part${i}_processed`,
  },
  compositeGbfHighSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_high_part${i}`,
    sourceLayerPattern: (i) => `gbf_high_part${i}_processed`,
  },
  compositeGrLowSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_low_part${i}`,
    sourceLayerPattern: (i) => `gr_low_part${i}_processed`,
  },
  compositeGrModerateSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_mod_part${i}`,
    sourceLayerPattern: (i) => `gr_mod_part${i}_processed`,
  },
  compositeGrHighSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_high_part${i}`,
    sourceLayerPattern: (i) => `gr_high_part${i}_processed`,
  },
};

export const useEnhancedMapLayer = (map, activeLayer, isDarkMode) => {
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef({});

  const cleanupLayer = useCallback((layerId) => {
    if (!map) return;
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);

      if (layerId.startsWith('composite')) {
        for (let i = 2; i <= MAX_COMPOSITE_PARTS; i++) {
          const compositeId = `${layerId}_${i}`;
          if (map.getLayer(compositeId)) map.removeLayer(compositeId);
          if (map.getSource(compositeId)) map.removeSource(compositeId);
        }
      }
    } catch (error) {
      logger.warn(`Error cleaning up layer ${layerId}:`, error);
    }
  }, [map]);

  const setupCompositeLayer = useCallback(async (baseLayerId, layerConfig) => {
    if (!map || !COMPOSITE_CONFIG[baseLayerId]) return;

    setIsLoading(true);
    const paint = generatePaintProperty(baseLayerId, isDarkMode);
    const config = COMPOSITE_CONFIG[baseLayerId];
    let loadedCount = 0;

    try {
      if (!map.getSource(baseLayerId)) {
        map.addSource(baseLayerId, layerConfig.source);
      }

      if (!map.getLayer(baseLayerId)) {
        map.addLayer({
          id: baseLayerId,
          type: 'fill',
          source: baseLayerId,
          'source-layer': layerConfig.layer['source-layer'],
          paint: {
            'fill-color': paint['fill-color'],
            'fill-opacity': 0.8,
            'fill-antialias': true
          }
        });
        loadedCount++;
      }

      const addLayerWithRetry = async (partNum) => {
        const id = `${baseLayerId}_${partNum}`;
        const url = config.urlPattern(partNum);
        const sourceLayer = config.sourceLayerPattern(partNum);
        let retries = 2;

        while (retries > 0) {
          try {
            if (!map.getSource(id)) {
              map.addSource(id, { type: 'vector', url });
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (!map.getLayer(id)) {
              if (!map.getSource(id)) {
                return false;
              }

              map.addLayer({
                id,
                type: 'fill',
                source: id,
                'source-layer': sourceLayer,
                paint: {
                  'fill-color': paint['fill-color'],
                  'fill-opacity': 0.8,
                  'fill-antialias': true
                },
                layout: {
                  visibility: 'visible'
                },
                filter: baseLayerId.includes('BufferPool') || baseLayerId.includes('Gbf') || baseLayerId.includes('Gr')
                  ? ['>=', ['get', 'raster_value'], 0]
                  : ['>', ['get', 'raster_value'], 0]
              });

              if (map.getLayer(id)) {
                loadedCount++;
                logger.log(`✓ Hook: Added part ${partNum} for ${baseLayerId}`);
                return true;
              }
            }
            return true;
          } catch (error) {
            retries--;
            if (retries > 0) {
              logger.warn(`Retrying part ${partNum} for ${baseLayerId} (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              logger.error(`✗ Hook: Failed part ${partNum} for ${baseLayerId} after retries:`, error.message);
              return false;
            }
          }
        }
        return false;
      };

      const batchSize = 5;
      for (let i = 2; i <= MAX_COMPOSITE_PARTS; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, MAX_COMPOSITE_PARTS + 1); j++) {
          batch.push(addLayerWithRetry(j));
        }
        await Promise.all(batch);
        if (i + batchSize <= MAX_COMPOSITE_PARTS) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.log(`Loaded ${loadedCount} parts for composite layer ${baseLayerId}`);

      if (map && typeof map.triggerRepaint === 'function') {
        setTimeout(() => {
          map.triggerRepaint();
        }, 500);
      }
      setIsLoading(false);
    } catch (error) {
      logger.warn('Error setting up composite layer:', error);
      setIsLoading(false);
    }
  }, [map, isDarkMode]);

  useEffect(() => {
    if (!map || !activeLayer) return;

    setIsLoading(true);

    if (!layers) {
      logger.error('Layers array is undefined');
      setIsLoading(false);
      return;
    }

    const layerConfig = layers.find(l => l.id === activeLayer);
    if (!layerConfig) {
      logger.warn(`Layer config not found for layer ID: ${activeLayer}`);
      setIsLoading(false);
      return;
    }

    Object.values(cleanupRef.current).forEach(cleanup => {
      if (typeof cleanup === 'function') cleanup();
    });
    cleanupRef.current = {};

    if (activeLayer.startsWith('composite')) {
      setupCompositeLayer(activeLayer, layerConfig);
    } else {
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
          'fill-outline-color': 'rgba(0,0,0,0)'
        },
        layout: { visibility: 'visible' }
      });
      setIsLoading(false);
    }

    const handleStyleData = () => {
      if (!map.isStyleLoaded()) return;
      const paint = generatePaintProperty(activeLayer, isDarkMode);
      if (map.getLayer(activeLayer)) {
        Object.entries(paint).forEach(([property, value]) => {
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
      Object.values(cleanupRef.current).forEach(cleanup => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [map, activeLayer, isDarkMode, cleanupLayer, setupCompositeLayer]);

  return { isLoading };
};
