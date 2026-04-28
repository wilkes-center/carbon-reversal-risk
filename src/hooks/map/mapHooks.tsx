// @ts-nocheck
import { useState, useCallback } from 'react';

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
