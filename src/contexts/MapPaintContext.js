import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { debounce } from 'lodash';
import { logger } from '../utils/logger';

const initialState = {
  paintProperties: {},
  layerOpacities: {},
  updateQueue: new Set(),
  lastUpdateTime: Date.now()
};

const MapPaintContext = createContext(null);

const paintReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_LAYER_OPACITY':
      return {
        ...state,
        layerOpacities: {
          ...state.layerOpacities,
          [action.layerId]: action.opacity
        },
        updateQueue: new Set([...state.updateQueue, action.layerId]),
        lastUpdateTime: Date.now()
      };

    case 'PROCESS_QUEUE':
      return {
        ...state,
        updateQueue: new Set(),
        lastUpdateTime: Date.now()
      };

    case 'RESET_LAYER':
      const { [action.layerId]: _, ...remainingOpacities } = state.layerOpacities;
      return {
        ...state,
        layerOpacities: remainingOpacities,
        updateQueue: new Set([...state.updateQueue, action.layerId]),
        lastUpdateTime: Date.now()
      };

    case 'CLEAR_ALL':
      return initialState;

    default:
      return state;
  }
};

export function MapPaintProvider({ children, map }) {
  const [state, dispatch] = useReducer(paintReducer, initialState);

  const applyPaintProperties = useCallback(
    debounce((layerId) => {
      if (!map?.getLayer(layerId)) return;

      try {
        const opacity = state.layerOpacities[layerId] ?? 0.8;
        
        map.setPaintProperty(layerId, 'fill-opacity', opacity);

        // Handle composite layers (updated to 65 parts)
        if (layerId.startsWith('composite')) {
          for (let i = 2; i <= 65; i++) {
            const compositeId = `${layerId}_${i}`;
            if (map.getLayer(compositeId)) {
              map.setPaintProperty(compositeId, 'fill-opacity', opacity);
            }
          }
        }
      } catch (error) {
        logger.warn(`Error applying opacity to ${layerId}:`, error);
      }
    }, 100),
    [map, state.layerOpacities]
  );

  const processPaintQueue = useCallback(() => {
    if (!map || state.updateQueue.size === 0) return;

    state.updateQueue.forEach(layerId => {
      applyPaintProperties(layerId);
    });

    dispatch({ type: 'PROCESS_QUEUE' });
  }, [map, state.updateQueue, applyPaintProperties]);

  // Process queue on animation frame
  React.useEffect(() => {
    if (state.updateQueue.size > 0) {
      requestAnimationFrame(processPaintQueue);
    }
  }, [state.updateQueue, processPaintQueue]);

  const value = {
    updateOpacity: useCallback((layerId, opacity) => {
      dispatch({ type: 'UPDATE_LAYER_OPACITY', layerId, opacity });
    }, []),

    getLayerOpacity: useCallback((layerId) => {
      return state.layerOpacities[layerId] ?? 0.8;
    }, [state.layerOpacities]),

    resetLayer: useCallback((layerId) => {
      dispatch({ type: 'RESET_LAYER', layerId });
    }, []),

    clearAll: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL' });
    }, [])
  };

  return (
    <MapPaintContext.Provider value={value}>
      {children}
    </MapPaintContext.Provider>
  );
}

export const useMapPaint = () => {
  const context = useContext(MapPaintContext);
  if (!context) {
    throw new Error('useMapPaint must be used within MapPaintProvider');
  }
  return context;
};