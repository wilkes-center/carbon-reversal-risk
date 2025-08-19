import React, { useState, useCallback, useEffect } from 'react';
import { useMapPaint } from './MapPaintContext';

const OpacityControl = ({ 
  layerId, 
  isDarkMode, 
  mapRef,
  isComposite = false,
  onChange = () => {},
  className = '' 
}) => {
  const { updateOpacity, getLayerOpacity } = useMapPaint();
  const [localOpacity, setLocalOpacity] = useState(0.7);

  // Initialize opacity from context
  useEffect(() => {
    const currentOpacity = getLayerOpacity(layerId);
    setLocalOpacity(currentOpacity);
  }, [layerId, getLayerOpacity]);

  const handleOpacityChange = useCallback((event) => {
    const map = mapRef?.current?.getMap();
    if (!map) return;

    const newOpacity = parseFloat(event.target.value);
    if (isNaN(newOpacity)) return;

    setLocalOpacity(newOpacity);
    updateOpacity(layerId, newOpacity);

    // Handle composite layers
    if (isComposite) {
      for (let i = 2; i <= 100; i++) {
        const compositeId = `${layerId}_${i}`;
        if (map.getLayer(compositeId)) {
          updateOpacity(compositeId, newOpacity);
        }
      }
    }

    // Force map repaint
    requestAnimationFrame(() => {
      map.triggerRepaint();
    });

    // Call onChange callback
    onChange(newOpacity);
  }, [mapRef, layerId, isComposite, updateOpacity, onChange]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-xs ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Opacity
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={localOpacity}
        onChange={handleOpacityChange}
        className="flex-1"
        aria-label={`Opacity control for ${layerId}`}
      />
      <span className={`text-xs min-w-[30px] text-right ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {Math.round(localOpacity * 100)}%
      </span>
    </div>
  );
};

export default OpacityControl;