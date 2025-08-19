import { useState, useEffect, useCallback } from 'react';
import { layers, additionalCompositeUrls, additionalCompositeHighUrls, additionalCompositeModeUrls, additionalCompositeGrLowUrls, additionalCompositeGrHighUrls, additionalCompositeGrModerateUrls } from '../../utils/map/layers';
import { generatePaintProperty } from '../../utils/colors/colorScales';

const COMPOSITE_URLS = {
  compositeGbfLowSsp245: additionalCompositeUrls,
  compositeGbfModerateSsp245: additionalCompositeModeUrls,
  compositeGbfHighSsp245: additionalCompositeHighUrls,
  compositeGrLowSsp245: additionalCompositeGrLowUrls,
  compositeGrModerateSsp245: additionalCompositeGrModerateUrls,
  compositeGrHighSsp245: additionalCompositeGrHighUrls
};

const SOURCE_LAYER_PATTERNS = {
  compositeGbfLowSsp245: (index) => `gbf_low_part${index}_processed`,
  compositeGbfModerateSsp245: (index) => `gbf_mod_part${index}_processed`,
  compositeGbfHighSsp245: (index) => `gbf_high_part${index}_processed`,
  compositeGrLowSsp245: (index) => `gr_low_part${index}_processed`,
  compositeGrModerateSsp245: (index) => `gr_mod_part${index}_processed`,
  compositeGrHighSsp245: (index) => `gr_high_part${index}_processed`
};
// Helper to chunk array for batch processing
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const useMapLayers = (map, activeLayers, activeBasemap, isDarkMode) => {
  const [initializedLayers, setInitializedLayers] = useState(new Set());
  const [compositeLayers, setCompositeLayers] = useState(new Set());
  const [isLoadingComposites, setIsLoadingComposites] = useState(false);

  // Helper to get the correct value key for different layer types
  const getValueKey = useCallback((layerId) => {
    if (layerId.includes('DroughtRisk')) return 'drought_risk';
    if (layerId.includes('InsectRisk')) return 'insect_risk';
    if (layerId.includes('FireRisk')) return 'fire_risk';
    return 'raster_value';
  }, []);

  // Setup or update a single layer
  const setupLayer = useCallback(async (layerId, sourceConfig, sourceLayer) => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      const paintProperties = generatePaintProperty(layerId, isDarkMode);
      const valueKey = getValueKey(layerId);

      // Add source if it doesn't exist
      if (!map.getSource(layerId)) {
        map.addSource(layerId, sourceConfig);
      }

      // Add or update layer
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: layerId,
          'source-layer': sourceLayer,
          paint: paintProperties,
          filter: ['>', ['get', valueKey], 0],
          minzoom: 0,
          maxzoom: 22
        });
        setInitializedLayers(prev => new Set([...prev, layerId]));
      } else {
        // Update existing layer paint properties
        Object.entries(paintProperties).forEach(([property, value]) => {
          map.setPaintProperty(layerId, property, value);
        });
      }

      return true;
    } catch (error) {
      console.error(`Error setting up layer ${layerId}:`, error);
      return false;
    }
  }, [map, isDarkMode, getValueKey]);

  // Setup composite layers with chunked loading
  const setupCompositeLayers = useCallback(async (baseLayerId) => {
    if (!map || !map.isStyleLoaded() || isLoadingComposites) return;

    try {
      setIsLoadingComposites(true);
      const urls = COMPOSITE_URLS[baseLayerId];
      if (!urls) {
        console.error(`No composite URLs found for ${baseLayerId}`);
        return;
      }

      const getSourceLayer = SOURCE_LAYER_PATTERNS[baseLayerId];
      if (!getSourceLayer) {
        console.error(`No source layer pattern found for ${baseLayerId}`);
        return;
      }

      // Setup base layer first
      const baseLayerConfig = layers.find(l => l.id === baseLayerId);
      if (baseLayerConfig) {
        await setupLayer(
          baseLayerId,
          baseLayerConfig.source,
          baseLayerConfig.layer['source-layer']
        );
      }

      // Process URLs in chunks of 5
      const chunks = chunkArray(urls, 5);
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (url, chunkIndex) => {
          const globalIndex = chunkIndex + chunk.length * chunks.indexOf(chunk);
          const partNumber = globalIndex + 2; // Parts start from 2 (part 1 is the base layer)
          const compositeId = `${baseLayerId}_${partNumber}`;
          const sourceLayer = getSourceLayer(partNumber);

          try {
            const success = await setupLayer(
              compositeId,
              { type: 'vector', url },
              sourceLayer
            );

            if (success) {
              setCompositeLayers(prev => new Set([...prev, compositeId]));
            }
          } catch (error) {
            console.error(`Error setting up composite part ${partNumber} for ${baseLayerId}:`, error);
          }
        }));

        // Small delay between chunks to prevent overwhelming the map
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`Error setting up composite layers for ${baseLayerId}:`, error);
    } finally {
      setIsLoadingComposites(false);
    }
  }, [map, setupLayer, chunkArray, isLoadingComposites]);

  // Remove a layer and its associated resources
  const removeLayer = useCallback((layerId) => {
    if (!map || !map.isStyleLoaded()) return;

    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
      setInitializedLayers(prev => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
      setCompositeLayers(prev => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
    } catch (error) {
      console.error(`Error removing layer ${layerId}:`, error);
    }
  }, [map]);

  // Remove all composite parts for a base layer
  const removeCompositeLayers = useCallback((baseLayerId) => {
    if (COMPOSITE_URLS[baseLayerId]) {
      // Remove base layer
      removeLayer(baseLayerId);
      
      // Remove all composite parts (1-100)
      for (let i = 1; i <= 100; i++) {
        const compositeId = `${baseLayerId}_${i + 1}`;
        removeLayer(compositeId);
      }
    }
  }, [removeLayer]);

  // Main effect to manage layers
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const updateLayers = async () => {
      try {
        // Remove inactive layers
        const allActiveLayers = new Set(activeLayers);
        
        // Remove regular layers that are no longer active
        initializedLayers.forEach(layerId => {
          const baseId = layerId.split('_')[0];
          if (!allActiveLayers.has(baseId)) {
            removeLayer(layerId);
          }
        });

        // Remove composite layers that are no longer active
        compositeLayers.forEach(layerId => {
          const baseId = layerId.split('_')[0];
          if (!allActiveLayers.has(baseId)) {
            removeCompositeLayers(baseId);
          }
        });

        // Setup or update active layers
        for (const layerId of activeLayers) {
          if (COMPOSITE_URLS[layerId]) {
            await setupCompositeLayers(layerId);
          } else {
            // Add null checks for layers
            if (!layers) {
              console.error('Layers array is undefined');
              continue;
            }
            
            const layerConfig = layers.find(l => l.id === layerId);
            if (layerConfig) {
              await setupLayer(
                layerId,
                layerConfig.source,
                layerConfig.layer['source-layer']
              );
            } else {
              console.warn(`Layer config not found for layer ID: ${layerId}`);
            }
          }
        }

        // Force a map repaint to ensure all changes are applied
        map.triggerRepaint();
      } catch (error) {
        console.error('Error updating layers:', error);
      }
    };

    // Only run updates when the map style is fully loaded
    if (map.isStyleLoaded()) {
      updateLayers();
    } else {
      map.once('styledata', updateLayers);
    }

    // Cleanup function
    return () => {
      map.off('styledata', updateLayers);
    };
  }, [
    map,
    activeLayers,
    isDarkMode,
    setupLayer,
    setupCompositeLayers,
    removeLayer,
    removeCompositeLayers,
    initializedLayers,
    compositeLayers
  ]);

  return {
    initializedLayers,
    compositeLayers,
    isLoadingComposites
  };
};

export const useViewport = (initialViewport) => {
  const [viewport, setViewport] = useState(initialViewport);

  const handleViewportChange = useCallback((newViewport) => {
    const zoom = Math.max(Math.min(newViewport.zoom, viewport.maxZoom), viewport.minZoom);
    const latitude = Math.max(Math.min(newViewport.latitude, 85), -85);
    const longitude = ((newViewport.longitude + 180) % 360) - 180;

    setViewport(prevViewport => ({
      ...prevViewport,
      latitude: isNaN(latitude) ? prevViewport.latitude : latitude,
      longitude: isNaN(longitude) ? prevViewport.longitude : longitude,
      zoom: isNaN(zoom) ? prevViewport.zoom : zoom,
    }));
  }, [viewport.maxZoom, viewport.minZoom]);

  return [viewport, handleViewportChange];
};

export const useStyle = (isDarkMode) => {
  return {
    getDarkClass: (baseClass) => `${baseClass} ${isDarkMode ? 'dark' : ''}`,
    getTextColor: () => isDarkMode ? 'text-gray-200' : 'text-gray-800',
    getBgColor: () => isDarkMode ? 'bg-gray-800' : 'bg-white',
    getBorderColor: () => isDarkMode ? 'border-gray-700' : 'border-gray-200',
    getHoverBgColor: () => isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  };
};