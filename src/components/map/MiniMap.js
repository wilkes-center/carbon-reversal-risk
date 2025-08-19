import React, { useEffect, useRef } from 'react';
import { Map } from 'react-map-gl';
import { MAPBOX_TOKEN } from '../../constants';
import { basemaps } from '../../utils/map/basemaps';
const MiniMap = ({ mainViewport }) => {
  const mapRef = useRef();
  
  const dark = basemaps.find(b => b.id === 'carto-positron').style;

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [mainViewport.longitude, mainViewport.latitude],
        zoom: mainViewport.zoom - 6, // Zoom out to show more context
        duration: 0 // Instant update
      });
    }
  }, [mainViewport]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      right: '10px',
      width: '200px',
      height: '150px',
      border: '2px solid white',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 0 10px rgba(0,0,0,0.3)'
    }}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: mainViewport.latitude,
          longitude: mainViewport.longitude,
          zoom: mainViewport.zoom - 12,
        }}
        style={{width: '100%', height: '100%'}}
        mapStyle={dark}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false}
      >
        <div style={{
          position: 'absolute',
          border: '2px solid red',
          width: '40px',
          height: '30px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
      </Map>
    </div>
  );
};

export default MiniMap;