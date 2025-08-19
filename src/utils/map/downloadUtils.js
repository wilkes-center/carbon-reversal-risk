import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

const getFeatureValueKey = (layerId) => {
  if (layerId.includes('DroughtRisk')) return 'drought_risk';
  if (layerId.includes('InsectRisk')) return 'insect_risk';
  if (layerId.includes('FireRisk')) return 'fire_risk';
  return 'raster_value';
};

const calculateCircleProperties = (feature) => {
  try {
    // Get center point using turf's center function
    const center = turf.center(feature);
    // Get first point of the circle (any point on the circumference)
    const edgePoint = turf.point(feature.geometry.coordinates[0][0]);
    // Calculate radius in kilometers
    const radius = turf.distance(center, edgePoint, { units: 'kilometers' });
    // Calculate area
    const area = Math.PI * Math.pow(radius, 2);

    return {
      center: center.geometry.coordinates,
      radius,
      areaKm2: area
    };
  } catch (error) {
    console.error('Error calculating circle properties:', error);
    return null;
  }
};

const generateDownloadFileName = (layerId, downloadInfo) => {
  const timestamp = new Date().toISOString().split('T')[0];
  let areaInfo = '';

  try {
    if (downloadInfo.type === 'circle') {
      const { center, radius, areaKm2 } = downloadInfo;
      areaInfo = `_circle_${center[1].toFixed(4)}N_${center[0].toFixed(4)}E_${radius.toFixed(1)}km_${areaKm2.toFixed(1)}km2`;
    } else if (downloadInfo.type === 'polygon') {
      const [minLon, minLat, maxLon, maxLat] = downloadInfo.bbox;
      areaInfo = `_polygon_${minLat.toFixed(2)}N_${minLon.toFixed(2)}E_${maxLat.toFixed(2)}N_${maxLon.toFixed(2)}E_${downloadInfo.areaKm2.toFixed(1)}km2`;
    } else if (downloadInfo.type === 'viewport') {
      const [west, south, east, north] = downloadInfo.bounds;
      areaInfo = `_viewport_${south.toFixed(2)}N_${west.toFixed(2)}E_${north.toFixed(2)}N_${east.toFixed(2)}E`;
    }
  } catch (error) {
    console.error('Error generating filename:', error);
    areaInfo = '_download';
  }

  return `${layerId}${areaInfo}_${timestamp}.csv`;
};

const isCircularPolygon = (coordinates) => {
  // Check if polygon has approximately 64 points (typical for mapbox-gl-draw circles)
  // We check for 65 because the first point is repeated to close the polygon
  return coordinates[0].length === 65;
};

export const downloadLayerDataAsCSV = (layerId, map, bounds, drawnFeatures = []) => {
  if (!map) {
    console.error('Map instance is not available');
    return;
  }

  try {
    let features = [];
    let filterArea = null;
    let downloadInfo = {
      type: 'viewport',
      bounds: bounds
    };

    // Process drawn features
    if (drawnFeatures && drawnFeatures.length > 0) {
      const drawnFeature = drawnFeatures[0];
      console.log('Processing drawn feature:', drawnFeature);

      // Store the filter area for feature filtering
      filterArea = {
        type: 'Feature',
        properties: {},
        geometry: drawnFeature.geometry
      };

      // Determine if it's a circle or regular polygon
      if (drawnFeature.geometry.type === 'Polygon') {
        if (isCircularPolygon(drawnFeature.geometry.coordinates)) {
          const circleProps = calculateCircleProperties(drawnFeature);
          if (circleProps) {
            downloadInfo = {
              type: 'circle',
              ...circleProps
            };
          }
        } else {
          const area = turf.area(drawnFeature);
          const bbox = turf.bbox(drawnFeature);
          downloadInfo = {
            type: 'polygon',
            bbox: bbox,
            areaKm2: area / 1000000 // Convert m² to km²
          };
        }
      }
    }

    const valueKey = getFeatureValueKey(layerId);

    // Query and collect features
    const queryFeatures = (layerId) => {
      try {
        return map.queryRenderedFeatures(undefined, {
          layers: [layerId],
          filter: ['>', ['get', valueKey], 0]
        });
      } catch (error) {
        console.warn(`Error querying features for layer ${layerId}:`, error);
        return [];
      }
    };

    // Query main layer
    features = features.concat(queryFeatures(layerId));

    // Query composite layers if applicable
    if (layerId.startsWith('composite')) {
      for (let i = 2; i <= 100; i++) {
        const compositeId = `${layerId}_${i}`;
        if (map.getLayer(compositeId)) {
          features = features.concat(queryFeatures(compositeId));
        }
      }
    }

    // Filter features based on drawn area
    if (filterArea) {
      features = features.filter(feature => {
        try {
          let coordinates;
          if (feature.geometry.type === 'Point') {
            coordinates = feature.geometry.coordinates;
          } else {
            const centroid = turf.centroid(feature);
            coordinates = centroid.geometry.coordinates;
          }
          const point = turf.point(coordinates);
          return turf.booleanPointInPolygon(point, filterArea);
        } catch (error) {
          console.warn('Error filtering feature:', error);
          return false;
        }
      });
    }

    if (features.length === 0) {
      alert('No data available for the selected area. Try selecting a different area or zooming out.');
      return;
    }

    // Remove duplicates
    const uniqueFeatures = new Map();
    features.forEach(feature => {
      try {
        let coordinates;
        if (feature.geometry.type === 'Point') {
          coordinates = feature.geometry.coordinates;
        } else {
          const centroid = turf.centroid(feature);
          coordinates = centroid.geometry.coordinates;
        }
        const value = feature.properties[valueKey];
        const key = `${coordinates.join(',')}-${value}`;
        if (!uniqueFeatures.has(key)) {
          uniqueFeatures.set(key, feature);
        }
      } catch (error) {
        console.warn('Error processing feature:', error);
      }
    });

    features = Array.from(uniqueFeatures.values());

    // Generate CSV content
    const headers = ['feature_id', 'latitude', 'longitude', 'value'];
    const rows = features.map((feature, index) => {
      try {
        let coordinates;
        if (feature.geometry.type === 'Point') {
          coordinates = feature.geometry.coordinates;
        } else {
          const centroid = turf.centroid(feature);
          coordinates = centroid.geometry.coordinates;
        }
        const [longitude, latitude] = coordinates;
        const value = feature.properties[valueKey];
        return `${index},${latitude.toFixed(6)},${longitude.toFixed(6)},${value}`;
      } catch (error) {
        console.warn('Error generating CSV row:', error);
        return null;
      }
    }).filter(Boolean);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const fileName = generateDownloadFileName(layerId, downloadInfo);

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error in downloadLayerDataAsCSV:', error);
    alert('An error occurred while downloading the data. Please try again.');
  }
};

export const getCurrentMapBounds = (map) => {
  if (!map) return null;
  const bounds = map.getBounds();
  return bounds.toArray().flat();
};

export const layerExists = (map, layerId) => {
  if (!map) return false;
  return !!map.getLayer(layerId);
};

export const getBoundsFromFeatures = (features) => {
  if (!features || !features.length) return null;
  
  try {
    return turf.bbox(turf.featureCollection(features));
  } catch (error) {
    console.error('Error getting bounds from features:', error);
    return null;
  }
};