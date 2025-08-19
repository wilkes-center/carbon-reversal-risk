import React, { useCallback } from 'react';
import { Source, Layer, useMap } from 'react-map-gl';

const CongressionalDistrictsLayer = ({
  isDarkMode,
  visible = false,
  selectedFeatureId = null,
  beforeId = null  // Add beforeId prop
}) => {
  const { current: map } = useMap();

  const onMouseEnter = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
    }
  }, [map]);

  const onMouseLeave = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  }, [map]);

  return (
    <Source
      id="congressional-districts"
      type="vector"
      url="mapbox://pkulandh.415y1ktz"
    >
      <Layer
        id="congressional-districts-fill"
        type="fill"
        source-layer="NTAD_Congressional_Districts_-03ffpi"
        paint={{
          'fill-color': isDarkMode ? '#4B5563' : '#E5E7EB',
          'fill-opacity': [
            'case',
            ['==', ['get', 'OBJECTID'], selectedFeatureId],
            0.8,
            0.3
          ],
          'fill-outline-color': isDarkMode ? '#9CA3AF' : '#6B7280'
        }}
        layout={{
          visibility: visible ? 'visible' : 'none'
        }}
        beforeId={beforeId}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      <Layer
        id="congressional-districts-outline"
        type="line"
        source-layer="NTAD_Congressional_Districts_-03ffpi"
        paint={{
          'line-color': [
            'case',
            ['==', ['get', 'OBJECTID'], selectedFeatureId],
            isDarkMode ? '#60A5FA' : '#2563EB',
            isDarkMode ? '#9CA3AF' : '#6B7280'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'OBJECTID'], selectedFeatureId],
            2,
            1
          ],
          'line-opacity': 0.8
        }}
        layout={{
          visibility: visible ? 'visible' : 'none'
        }}
        beforeId={beforeId}  // Use beforeId for layer ordering
      />
    </Source>
  );
};

export default CongressionalDistrictsLayer;