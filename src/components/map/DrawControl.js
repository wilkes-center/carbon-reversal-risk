import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useMap } from 'react-map-gl';
import { Lasso, X } from 'lucide-react';
import * as turf from '@turf/turf';
import { logger } from '../../utils/logger';

const createRadiusMode = () => ({
  onSetup: function() {
    const state = {
      center: null,
      currentRadius: 0,
      currentFeature: null
    };
    this.updateUIClasses({ mouse: 'add' });
    return state;
  },

  onClick: function(state, e) {
    if (!state.center) {
      state.center = [e.lngLat.lng, e.lngLat.lat];
      
      // Create initial circle with minimal radius
      const circle = turf.circle(state.center, 0.001, {
        steps: 64,
        units: 'kilometers'
      });
      
      const feature = this.newFeature({
        type: 'Feature',
        properties: {},
        geometry: circle.geometry
      });
      
      this.addFeature(feature);
      state.currentFeature = feature;
    } else {
      // Calculate final radius and update circle
      const radius = turf.distance(
        turf.point(state.center),
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: 'kilometers' }
      );
      
      const circle = turf.circle(state.center, radius, {
        steps: 64,
        units: 'kilometers'
      });
      
      state.currentFeature.incomingCoords(circle.geometry.coordinates);
      this.changeMode('simple_select', { featureIds: [state.currentFeature.id] });
    }
  },

  onMouseMove: function(state, e) {
    if (state.center && state.currentFeature) {
      const radius = turf.distance(
        turf.point(state.center),
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        { units: 'kilometers' }
      );
      
      const circle = turf.circle(state.center, radius, {
        steps: 64,
        units: 'kilometers'
      });
      
      state.currentFeature.incomingCoords(circle.geometry.coordinates);
    }
  },

  toDisplayFeatures: function(state, geojson, display) {
    const isActiveFeature = state.currentFeature && geojson.properties.id === state.currentFeature.id;
    geojson.properties.active = (isActiveFeature) ? 'true' : 'false';
    display(geojson);
  }
});

const DrawControl = forwardRef(({ 
  isDrawActive, 
  onDrawComplete, 
  onDrawCancel,
  isDarkMode,
  instructions,
  drawMode = 'draw_polygon'
}, ref) => {
  const { current: map } = useMap();
  const drawRef = useRef(null);
  const eventsBound = useRef(false);
  
  // Expose the draw instance via ref
  useImperativeHandle(ref, () => ({
    deleteAll: () => {
      if (drawRef.current) {
        try {
          drawRef.current.deleteAll();
        } catch (err) {
          logger.warn('Error deleting all features:', err);
        }
      }
    },
    getAll: () => {
      if (drawRef.current) {
        try {
          return drawRef.current.getAll();
        } catch (err) {
          logger.warn('Error getting all features:', err);
          return { features: [] };
        }
      }
      return { features: [] };
    }
  }));
  
  // Safely remove control
  const safelyRemoveControl = useCallback(() => {
    if (map && drawRef.current) {
      try {
        // Remove event listeners first
        if (eventsBound.current) {
          map.off('draw.create');
          map.off('draw.update');
          map.off('draw.delete');
          map.off('draw.modechange');
          eventsBound.current = false;
        }
        
        // Then remove the control
        map.removeControl(drawRef.current);
      } catch (err) {
        logger.warn('Error removing draw control:', err);
      }
      drawRef.current = null;
    }
  }, [map]);
  
  // Initialize draw control
  useEffect(() => {
    if (!map) return;

    // Safety check - remove any existing control first
    safelyRemoveControl();

    const drawStyles = [
      {
        'id': 'gl-draw-polygon-fill',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'fill-color': isDarkMode ? '#60A5FA' : '#3B82F6',
          'fill-outline-color': isDarkMode ? '#93C5FD' : '#2563EB',
          'fill-opacity': 0.1
        }
      },
      {
        'id': 'gl-draw-polygon-stroke',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
          'line-color': isDarkMode ? '#60A5FA' : '#3B82F6',
          'line-width': 2
        }
      },
      {
        'id': 'gl-draw-polygon-point',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
        'paint': {
          'circle-radius': 5,
          'circle-color': isDarkMode ? '#60A5FA' : '#3B82F6'
        }
      }
    ];

    // Create draw control with custom radius mode
    try {
      const modes = {
        ...MapboxDraw.modes,
        draw_radius: createRadiusMode()
      };

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        styles: drawStyles,
        defaultMode: 'simple_select',
        modes
      });

      drawRef.current = draw;
      map.addControl(draw);
    } catch (err) {
      logger.error('Error initializing draw control:', err);
    }

    return () => {
      safelyRemoveControl();
    };
  }, [map, isDarkMode, safelyRemoveControl]);

  // Handle draw mode changes
  useEffect(() => {
    if (!map || !drawRef.current) return;

    const handleCreate = (e) => {
      logger.log('Draw created:', e);
      onDrawComplete(e.features);
    };

    const handleUpdate = (e) => {
      logger.log('Draw updated:', e);
      onDrawComplete(e.features);
    };

    const handleDelete = () => {
      logger.log('Draw deleted');
      onDrawComplete([]);
    };

    const handleModeChange = (e) => {
      logger.log('Mode changed:', e.mode);
      if (e.mode === 'simple_select' && drawRef.current.getAll().features.length > 0) {
        onDrawComplete(drawRef.current.getAll().features);
      }
    };

    // Safety check - remove previous listeners
    map.off('draw.create', handleCreate);
    map.off('draw.update', handleUpdate);
    map.off('draw.delete', handleDelete);
    map.off('draw.modechange', handleModeChange);

    // Add new listeners
    map.on('draw.create', handleCreate);
    map.on('draw.update', handleUpdate);
    map.on('draw.delete', handleDelete);
    map.on('draw.modechange', handleModeChange);
    eventsBound.current = true;

    if (isDrawActive && drawRef.current) {
      try {
        drawRef.current.changeMode(drawMode);
      } catch (err) {
        logger.warn('Error changing draw mode:', err);
      }
    } else if (drawRef.current) {
      try {
        drawRef.current.changeMode('simple_select');
        drawRef.current.deleteAll();
      } catch (err) {
        logger.warn('Error resetting draw mode:', err);
      }
    }

    return () => {
      if (map) {
        map.off('draw.create', handleCreate);
        map.off('draw.update', handleUpdate);
        map.off('draw.delete', handleDelete);
        map.off('draw.modechange', handleModeChange);
        eventsBound.current = false;
      }
    };
  }, [map, isDrawActive, drawMode, onDrawComplete]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      safelyRemoveControl();
    };
  }, [safelyRemoveControl]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
      {isDrawActive && (
        <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          isDarkMode 
            ? 'bg-gray-800 text-gray-200 border border-gray-700' 
            : 'bg-white text-gray-700 border border-gray-200'
        }`}>
          <Lasso size={16} />
          <span className="text-sm">
            {instructions || (drawMode === 'draw_radius' 
              ? 'Click to set center, click again to set radius' 
              : 'Click to draw polygon. Double-click to complete.')}
          </span>
          <button
            onClick={onDrawCancel}
            className={`p-1 rounded-md transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700' 
                : 'hover:bg-gray-100'
            }`}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
});

DrawControl.displayName = 'DrawControl';

export default DrawControl;