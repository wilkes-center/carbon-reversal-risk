import { useCallback, useEffect, useRef } from 'react';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import { debounce } from 'lodash';
import { logger } from '../../utils/logger';

const useLayerStyleManager = (map, activeLayer, isDarkMode, legendStateManager) => {
  const isUpdatingRef = useRef(false);
  const pendingUpdatesRef = useRef(new Map());
  const frameRequestRef = useRef(null);

  // Create a debounced function to batch paint updates
  const batchUpdateStyles = useCallback(
    debounce(() => {
      if (!map || isUpdatingRef.current) return;

      try {
        isUpdatingRef.current = true;
        const updates = Array.from(pendingUpdatesRef.current.entries());
        pendingUpdatesRef.current.clear();

        // Process all updates in a single animation frame
        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = requestAnimationFrame(() => {
          updates.forEach(([layerId, paint]) => {
            if (map.getLayer(layerId)) {
              // Apply all paint properties at once
              Object.entries(paint).forEach(([property, value]) => {
                map.setPaintProperty(layerId, property, value);
              });
            }
          });

          // Single repaint after all updates
          map.triggerRepaint();
          isUpdatingRef.current = false;
        });
      } catch (error) {
        logger.warn('Error in batch update:', error);
        isUpdatingRef.current = false;
      }
    }, 50),
    [map]
  );

  const updateLayerStyle = useCallback((layerId) => {
    if (!map?.getLayer(layerId)) return;

    try {
      // Get saved legend state if it exists
      const savedLegendState = legendStateManager?.getLegendState(activeLayer);
      
      // Generate paint properties
      const paint = savedLegendState ? {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'raster_value'], 0],
          ...savedLegendState.flatMap(range => [range.value, range.color])
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0,0,0,0)'
      } : generatePaintProperty(layerId, isDarkMode);

      // Queue the update
      pendingUpdatesRef.current.set(layerId, paint);

      // Handle composite layers
      if (layerId.startsWith('composite')) {
        for (let i = 2; i <= 100; i++) {
          const compositeId = `${layerId}_${i}`;
          if (map.getLayer(compositeId)) {
            pendingUpdatesRef.current.set(compositeId, paint);
          }
        }
      }

      // Trigger batch update
      batchUpdateStyles();

    } catch (error) {
      logger.warn(`Error queueing style update for ${layerId}:`, error);
    }
  }, [map, activeLayer, isDarkMode, legendStateManager, batchUpdateStyles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      batchUpdateStyles.cancel();
      cancelAnimationFrame(frameRequestRef.current);
      pendingUpdatesRef.current.clear();
      isUpdatingRef.current = false;
    };
  }, [batchUpdateStyles]);

  return { updateLayerStyle };
};

export default useLayerStyleManager;