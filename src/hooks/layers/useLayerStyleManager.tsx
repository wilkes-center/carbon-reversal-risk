// @ts-nocheck
import { useCallback, useEffect, useRef } from 'react';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import { getValueProperty } from '../../config/mapboxLayers';
import { debounce } from '../../utils/debounce';
import { logger } from '../../utils/logger';

const useLayerStyleManager = (map, activeLayer, isDarkMode, legendStateManager) => {
  const isUpdatingRef = useRef(false);
  const pendingUpdatesRef = useRef(new Map());
  const frameRequestRef = useRef(null);

  const batchUpdateStyles = useCallback(
    debounce(() => {
      if (!map || isUpdatingRef.current) return;

      try {
        isUpdatingRef.current = true;
        const updates = Array.from(pendingUpdatesRef.current.entries());
        pendingUpdatesRef.current.clear();

        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = requestAnimationFrame(() => {
          updates.forEach(([layerId, paint]) => {
            if (map.getLayer(layerId)) {
              Object.entries(paint).forEach(([property, value]) => {
                map.setPaintProperty(layerId, property, value);
              });
            }
          });

          map.triggerRepaint();
          isUpdatingRef.current = false;
        });
      } catch (error) {
        logger.warn('Error in batch update:', error);
        isUpdatingRef.current = false;
      }
    }, 50),
    [map],
  );

  const updateLayerStyle = useCallback(
    (layerId) => {
      if (!map?.getLayer(layerId)) return;

      try {
        const savedLegendState = legendStateManager?.getLegendState(activeLayer);
        const valueKey = getValueProperty(layerId);

        const paint = savedLegendState
          ? {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', valueKey], 0],
                ...savedLegendState.flatMap((range) => [range.value, range.color]),
              ],
              'fill-opacity': 0.7,
              'fill-outline-color': 'rgba(0,0,0,0)',
            }
          : generatePaintProperty(layerId, isDarkMode);

        pendingUpdatesRef.current.set(layerId, paint);
        batchUpdateStyles();
      } catch (error) {
        logger.warn(`Error queueing style update for ${layerId}:`, error);
      }
    },
    [map, activeLayer, isDarkMode, legendStateManager, batchUpdateStyles],
  );

  useEffect(
    () => () => {
      batchUpdateStyles.cancel?.();
      cancelAnimationFrame(frameRequestRef.current);
      pendingUpdatesRef.current.clear();
      isUpdatingRef.current = false;
    },
    [batchUpdateStyles],
  );

  return { updateLayerStyle };
};

export default useLayerStyleManager;
