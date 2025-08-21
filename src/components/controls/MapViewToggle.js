import React, { useCallback } from 'react';
import { Globe2 } from 'lucide-react';
import usaIcon from '../../assets/usa.png';
import { logger } from '../../utils/logger';

const US_BOUNDS = {
  center: [-98.5795, 39.8283],
  zoom: 3.5,
  bounds: [[-125, 24], [-66, 49]]
};

const GLOBAL_BOUNDS = {
  center: [0, 20],
  zoom: 1.5
};

const MapViewToggle = ({ 
  view, 
  setView, 
  mapRef,
  isDarkMode,
  activeLayer 
}) => {
  const handleViewChange = useCallback(async (newView) => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    const settings = newView === 'US' ? US_BOUNDS : GLOBAL_BOUNDS;
  
    try {
      const visibilityStates = new Map();
      const layers = map.getStyle().layers;
      
      layers.forEach(layer => {
        if (layer.id === activeLayer || layer.id.startsWith(`${activeLayer}_`)) {
          visibilityStates.set(layer.id, map.getLayoutProperty(layer.id, 'visibility') || 'visible');
        }
      });

      setView(newView);

      return new Promise((resolve) => {
        const onMoveEnd = () => {
          visibilityStates.forEach((visibility, layerId) => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', visibility);
            }
          });

          map.off('moveend', onMoveEnd);
          resolve();
        };

        map.on('moveend', onMoveEnd);

        if (newView === 'US') {
          map.fitBounds(US_BOUNDS.bounds, {
            padding: 20,
            duration: 2000
          });
        } else {
          map.flyTo({
            center: settings.center,
            zoom: settings.zoom,
            duration: 2000
          });
        }
      });
    } catch (error) {
      logger.error('Error during view transition:', error);
      setView(newView);
    }
  }, [mapRef, setView, activeLayer]);

  const buttonBaseClass = "h-10 flex items-center justify-center rounded-lg transition-colors shadow-lg border";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleViewChange('US')}
        className={`${buttonBaseClass} w-10 ${
          view === 'US'
            ? isDarkMode 
              ? 'bg-gray-700 text-white border-gray-700' 
              : 'bg-gray-100 text-gray-900 border-gray-200'
            : isDarkMode
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border-gray-700'
              : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
        }`}
        title="Switch to US view"
      >
        <img 
          src={usaIcon}
          alt="US Map"
          className="w-8 h-8"
          style={{
            filter: isDarkMode 
              ? view === 'US' 
                ? 'brightness(0) invert(1)' 
                : 'brightness(0) invert(0.6)' 
              : view === 'US'
                ? 'brightness(0)' 
                : 'brightness(0) opacity(0.6)'
          }}
        />
      </button>

      <button
        onClick={() => handleViewChange('Global')}
        className={`${buttonBaseClass} w-10 ${
          view === 'Global'
            ? isDarkMode 
              ? 'bg-gray-700 text-white border-gray-700' 
              : 'bg-gray-100 text-gray-900 border-gray-200'
            : isDarkMode
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border-gray-700'
              : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
        }`}
        title="Switch to Global view"
      >
        <Globe2 size={18} />
      </button>
    </div>
  );
};

export default MapViewToggle;