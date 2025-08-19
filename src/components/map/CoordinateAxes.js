import React, { useEffect, useState } from 'react';

const CoordinateAxes = ({ viewport, isDarkMode }) => {
  const [coordinates, setCoordinates] = useState({
    latitudes: [],
    longitudes: []
  });

  useEffect(() => {
    // Calculate viewport bounds
    const latRange = 180 / Math.pow(2, viewport.zoom);
    const lonRange = 360 / Math.pow(2, viewport.zoom);
    
    const minLat = Math.max(-90, viewport.latitude - latRange/2);
    const maxLat = Math.min(90, viewport.latitude + latRange/2);
    const minLon = viewport.longitude - lonRange/2;
    const maxLon = viewport.longitude + lonRange/2;

    // Generate latitude values at 2-degree intervals
    const latitudes = [];
    const startLat = Math.floor(minLat / 2) * 2;
    const endLat = Math.ceil(maxLat / 2) * 2;
    for (let lat = startLat; lat <= endLat; lat += 2) {
      if (lat >= -90 && lat <= 90) {
        latitudes.push(lat);
      }
    }

    // Generate longitude values at 2-degree intervals
    const longitudes = [];
    const startLon = Math.floor(minLon / 2) * 2;
    const endLon = Math.ceil(maxLon / 2) * 2;
    for (let lon = startLon; lon <= endLon; lon += 2) {
      // Normalize longitude to -180 to 180 range
      let normalizedLon = lon;
      while (normalizedLon > 180) normalizedLon -= 360;
      while (normalizedLon < -180) normalizedLon += 360;
      longitudes.push(normalizedLon);
    }

    setCoordinates({
      latitudes: [...new Set(latitudes)].sort((a, b) => b - a),
      longitudes: [...new Set(longitudes)].sort((a, b) => a - b)
    });
  }, [viewport]);

  const formatNumber = (value) => {
    return value.toFixed(1) + '°';
  };

  return (
    <>
      {/* Latitude labels */}
      <div className="absolute left-0 top-0 h-full">
        {coordinates.latitudes.map(lat => (
          <div
            key={lat}
            className={`absolute left-2 text-xs font-mono whitespace-nowrap ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
            style={{
              top: `${(1 - (lat + 90) / 180) * 100}%`,
              transform: 'translateY(-50%)'
            }}
          >
            {formatNumber(lat)}
          </div>
        ))}
      </div>

      {/* Longitude labels */}
      <div className="absolute top-0 left-0 w-full">
        {coordinates.longitudes.map(lon => (
          <div
            key={lon}
            className={`absolute top-2 text-xs font-mono ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
            style={{
              left: `${((lon + 180) / 360) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {formatNumber(lon)}
          </div>
        ))}
      </div>
    </>
  );
};

export default CoordinateAxes;