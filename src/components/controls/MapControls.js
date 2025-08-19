import React, { useCallback } from 'react';
import { Layers, ZoomIn, ZoomOut, Compass, Trash2, Moon, Sun } from 'lucide-react';
import MapViewToggle from './MapViewToggle';

const MapControls = ({ 
  view,
  setView,
  isBasemapOpen,
  setIsBasemapOpen,
  activeBasemap,
  setActiveBasemap,
  basemaps,
  isDarkMode,
  onDarkModeToggle,
  mapRef,
  activeLayer 
}) => {
  // Safe way to handle layer operations
  const safeLayerOperation = useCallback((map, operation) => {
    if (!map || !activeLayer) return;

    const layers = [activeLayer];
    if (activeLayer.startsWith('composite')) {
      for (let i = 2; i <= 100; i++) {
        const compositeId = `${activeLayer}_${i}`;
        if (map.getLayer(compositeId)) {
          layers.push(compositeId);
        }
      }
    }

    // Hide layers before operation
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Perform operation
    operation(map);

    // Show layers after a brief delay
    setTimeout(() => {
      layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      });
    }, 50);
  }, [activeLayer]);

  const handleZoom = useCallback((direction) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    safeLayerOperation(map, (map) => {
      try {
        if (direction === 'in') {
          map.zoomIn({
            duration: 300
          });
        } else {
          map.zoomOut({
            duration: 300
          });
        }
      } catch (error) {
        console.warn(`Error during zoom ${direction}:`, error);
      }
    });
  }, [mapRef, safeLayerOperation]);

  const handleResetNorth = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    safeLayerOperation(map, (map) => {
      try {
        map.resetNorth({
          duration: 300
        });
      } catch (error) {
        console.warn('Error resetting north:', error);
      }
    });
  }, [mapRef, safeLayerOperation]);

  const buttonBaseClasses = `flex items-center justify-center p-2 transition-colors w-full ${
    isDarkMode 
      ? 'text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600' 
      : 'text-gray-700 hover:bg-gray-100 border-gray-200'
  }`;

  const containerClasses = `rounded-lg shadow-lg border ${
    isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`;



  return (
    <div className="absolute top-12 right-4 flex flex-col gap-2">
      <MapViewToggle 
        view={view}
        setView={setView}
        mapRef={mapRef}
        isDarkMode={isDarkMode}
        activeLayer={activeLayer}
      />
      
      {/* Basemap Control */}
      <div className={containerClasses}>
        <div className="relative">
          <button
            onClick={() => setIsBasemapOpen(!isBasemapOpen)}
            className={`${buttonBaseClasses} border-b`}
            title="Change basemap"
          >
            <Layers size={18} />
          </button>

          {isBasemapOpen && (
            <div className={`absolute top-full right-0 mt-2 w-48 py-1 z-50 rounded-lg shadow-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              {basemaps.map((basemap) => (
                <button
                  key={basemap.id}
                  onClick={() => {
                    setActiveBasemap(basemap.id);
                    setIsBasemapOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2
                    ${activeBasemap === basemap.id 
                      ? isDarkMode 
                        ? 'bg-gray-700 text-blue-400' 
                        : 'bg-blue-50 text-blue-600'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <div className={`w-4 h-4 rounded border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`} />
                  {basemap.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className={containerClasses}>

        <button
          onClick={onDarkModeToggle}
          className={buttonBaseClasses}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
};

export default MapControls;