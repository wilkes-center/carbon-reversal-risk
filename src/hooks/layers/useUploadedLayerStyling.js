import React, { useState, useCallback, useEffect } from 'react';

const DEFAULT_OPACITY = 0.5;


const useUploadedLayerStyling = () => {
  const [layerOpacities, setLayerOpacities] = useState({});
  const [forceUpdate, setForceUpdate] = useState(0);

  const getLayerStyle = useCallback((geometryType, layerId) => {
    const opacity = layerOpacities[layerId] ?? DEFAULT_OPACITY;
  
    switch (geometryType) {
      case 'Point':
        return {
          type: 'circle',
          paint: {
            'circle-color': '#FF0000',
            'circle-radius': 6,
            'circle-opacity': opacity,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-opacity': opacity
          }
        };
      case 'LineString':
        return {
          type: 'line',
          paint: {
            'line-color': '#00FF00',
            'line-width': 4,
            'line-opacity': opacity
          }
        };
      case 'Polygon':
      case 'MultiPolygon':
        return {
          type: 'fill',
          paint: {
            'fill-color': '#0000FF',
            'fill-opacity': opacity,
            'fill-outline-color': '#0000FF'
          }
        };
      default:
        return {
          type: 'fill',
          paint: {
            'fill-color': '#0000FF',
            'fill-opacity': opacity,
            'fill-outline-color': '#0000FF'
          }
        };
    }
  }, [layerOpacities]);
  

  const updateOpacity = useCallback((layerId, newOpacity) => {
    setLayerOpacities(prev => {
      const updated = {
        ...prev,
        [layerId]: newOpacity
      };
      return updated;
    });
    setForceUpdate(prev => prev + 1); 
  }, []);



  const getLayerOpacity = useCallback((layerId) => {
    return layerOpacities[layerId] ?? DEFAULT_OPACITY;
  }, [layerOpacities]);

  return {
    getLayerStyle,
    updateOpacity,
    getLayerOpacity
  };
};

export default useUploadedLayerStyling;