import { useState, useCallback, useRef, useEffect } from 'react';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import { layers } from '../../utils/map/layers';

const COMPOSITE_CONFIG = {
  compositeGbfLowSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_low_part${i}`,
    sourceLayerPattern: (i) => `gbf_low_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for faster tile propagation
  },
  compositeGbfModerateSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_mod_part${i}`,
    sourceLayerPattern: (i) => `gbf_mod_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for faster tile propagation
  },
  compositeGbfHighSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gbf_high_part${i}`,
    sourceLayerPattern: (i) => `gbf_high_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for faster tile propagation
  },
  compositeGrLowSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_low_part${i}`,
    sourceLayerPattern: (i) => `gr_low_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for GR layers having issues
  },
  compositeGrModerateSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_mod_part${i}`,
    sourceLayerPattern: (i) => `gr_mod_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for GR layers having issues
  },
  compositeGrHighSsp245: {
    urlPattern: (i) => `mapbox://pkulandh.gr_high_part${i}`,
    sourceLayerPattern: (i) => `gr_high_part${i}_processed`,
    maxParts: 65,
    forceFresh: true // Enable for GR layers having issues
  },
};

export const useEnhancedMapLayer = (map, activeLayer, isDarkMode) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const cleanupRef = useRef({});

  // Force refresh function to trigger tile reload
  const forceRefreshTiles = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
    console.log('Forcing tile refresh...');
  }, []);

  const cleanupLayer = useCallback((layerId) => {
    if (!map) return;
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);

      if (layerId.startsWith('composite')) {
        const maxParts = COMPOSITE_CONFIG[layerId]?.maxParts || 21;
        for (let i = 2; i <= maxParts; i++) {
          const compositeId = `${layerId}_${i}`;
          if (map.getLayer(compositeId)) map.removeLayer(compositeId);
          if (map.getSource(compositeId)) map.removeSource(compositeId);
        }
      }
    } catch (error) {
      console.warn(`Error cleaning up layer ${layerId}:`, error);
    }
  }, [map]);

  const setupCompositeLayer = useCallback(async (baseLayerId, layerConfig) => {
    if (!map || !COMPOSITE_CONFIG[baseLayerId]) return;
    
    setIsLoading(true);
    const paint = generatePaintProperty(baseLayerId, isDarkMode);
    const config = COMPOSITE_CONFIG[baseLayerId];
    
    // Define maximum parts to try
    const maxParts = config.maxParts || 21;
    let loadedCount = 0;

    try {
      // First add the base layer (part 1)
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

      // Add remaining parts with retry mechanism
      const addLayerWithRetry = async (partNum) => {
        const id = `${baseLayerId}_${partNum}`;
        const url = config.urlPattern(partNum);
        const sourceLayer = config.sourceLayerPattern(partNum);
        let retries = 2;
        
        while (retries > 0) {
          try {
            // Add source if it doesn't exist
            if (!map.getSource(id)) {
              const sourceConfig = { 
                type: 'vector', 
                url
              };
              
              // Add cache busting for fresh tiles if needed
              if (config.forceFresh) {
                sourceConfig.tileSize = 512;
                sourceConfig.maxzoom = 18;
                sourceConfig.minzoom = 0;
                // Add timestamp to force cache refresh
                sourceConfig.metadata = { 
                  'cache-bust': Date.now() + refreshCounter,
                  'refresh-time': new Date().toISOString()
                };
                // Force tile reload with unique identifier
                sourceConfig.volatile = true;
                // Add URL parameters to force fresh fetch
                if (url.includes('mapbox://')) {
                  sourceConfig.url = `${url}?v=${Date.now()}&r=${refreshCounter}`;
                } else {
                  sourceConfig.url = url;
                }
              }
              
              map.addSource(id, sourceConfig);
              
              // Wait a bit for source to be added
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Add layer if it doesn't exist
            if (!map.getLayer(id)) {
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
                  ? ['>=', ['get', 'raster_value'], 0]  // Include 0 for buffer pools and global layers
                  : ['>', ['get', 'raster_value'], 0]   // Exclude 0 for other layers
              });
              
              if (map.getLayer(id)) {
                loadedCount++;
                console.log(`✓ Hook: Added part ${partNum} for ${baseLayerId}`);
                return true;
              }
            }
            return true;
          } catch (error) {
            retries--;
            if (retries > 0) {
              console.warn(`Retrying part ${partNum} for ${baseLayerId} (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, 200));
            } else {
              console.error(`✗ Hook: Failed part ${partNum} for ${baseLayerId} after retries:`, error.message);
              return false;
            }
          }
        }
        return false;
      };
      
      // Process parts in smaller batches to avoid overwhelming Mapbox
      const batchSize = 5;
      for (let i = 2; i <= maxParts; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, maxParts + 1); j++) {
          batch.push(addLayerWithRetry(j));
        }
        
        // Wait for current batch to complete
        await Promise.all(batch);
        
        // Small delay between batches
        if (i + batchSize <= maxParts) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Loaded ${loadedCount} parts for composite layer ${baseLayerId}`);
      
      // Pre-warm tiles by triggering a map repaint
      if (map && typeof map.triggerRepaint === 'function') {
        setTimeout(() => {
          map.triggerRepaint();
          console.log('Triggered map repaint for tile pre-warming');
        }, 500);
      }
      setIsLoading(false);
    } catch (error) {
      console.warn('Error setting up composite layer:', error);
      setIsLoading(false);
    }
  }, [map, isDarkMode, refreshCounter]);

  useEffect(() => {
    if (!map || !activeLayer) return;
    
    setIsLoading(true);

    // Add null checks for layers
    if (!layers) {
      console.error('Layers array is undefined');
      setIsLoading(false);
      return;
    }

    const layerConfig = layers.find(l => l.id === activeLayer);
    if (!layerConfig) {
      console.warn(`Layer config not found for layer ID: ${activeLayer}`);
      setIsLoading(false);
      return;
    }

    // Clean up previous layers
    Object.values(cleanupRef.current).forEach(cleanup => {
      if (typeof cleanup === 'function') cleanup();
    });
    cleanupRef.current = {};

    // Setup layer
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
  }, [map, activeLayer, isDarkMode, cleanupLayer, setupCompositeLayer, refreshCounter]);

  return { 
    isLoading, 
    forceRefreshTiles,
    refreshCounter 
  };
};