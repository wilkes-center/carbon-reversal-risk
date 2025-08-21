import proj4 from 'proj4';
import { logger } from '../logger';

// Define common coordinate reference systems
const CRS_DEFINITIONS = {
  WGS84: '+proj=longlat +datum=WGS84 +no_defs',
  EPSG3857: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  EPSG4326: '+proj=longlat +datum=WGS84 +no_defs'
};

// Helper to determine if coordinates are likely in Web Mercator
const isLikelyWebMercator = (coords) => {
  const [x, y] = Array.isArray(coords[0]) ? coords[0] : coords;
  return Math.abs(x) > 180 || Math.abs(y) > 90;
};

// Helper to transform coordinates from various systems to WGS84
const transformToWGS84 = (coords, sourceProj) => {
  try {
    return proj4(sourceProj, CRS_DEFINITIONS.WGS84, coords);
  } catch (error) {
    logger.warn('Error transforming coordinates:', error);
    return null;
  }
};

// Validate WGS84 coordinates
const isValidWGS84 = ([lng, lat]) => {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// Analyze coordinate bounds to detect projection
const detectProjection = (coords) => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  const updateBounds = (coord) => {
    if (Array.isArray(coord[0])) {
      coord.forEach(c => updateBounds(c));
    } else if (coord.length >= 2) {
      minX = Math.min(minX, coord[0]);
      maxX = Math.max(maxX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    }
  };
  
  updateBounds(coords);
  
  // Check for Web Mercator
  if (Math.abs(maxX) > 180 || Math.abs(maxY) > 90) {
    return CRS_DEFINITIONS.EPSG3857;
  }
  
  return null;
};

// Process coordinates recursively with automatic projection detection
const processCoordinates = (coords, detectedProjection = null) => {
  if (!Array.isArray(coords)) return null;
  
  // Handle different geometry types
  if (typeof coords[0] === 'number') {
    if (coords.length < 2) return null;
    
    let processedCoords = [...coords];
    
    // First, check if coordinates need transformation based on detected projection
    if (detectedProjection) {
      const transformed = transformToWGS84(processedCoords, detectedProjection);
      if (transformed && isValidWGS84(transformed)) {
        processedCoords = transformed;
      }
    } else {
      // Check if coordinates are swapped (lat, lng instead of lng, lat)
      const [first, second] = processedCoords;
      
      // Check general validity - if swapping makes them valid, do it
      if (Math.abs(first) <= 90 && Math.abs(second) > 90 && Math.abs(second) <= 180) {
        processedCoords = [second, first];
      }
      // Or if current order is clearly invalid but swapped would be valid
      else if (!isValidWGS84([first, second]) && isValidWGS84([second, first])) {
        processedCoords = [second, first];
      }
      
      // Check if still needs transformation
      if (isLikelyWebMercator(processedCoords)) {
        const transformed = transformToWGS84(processedCoords, CRS_DEFINITIONS.EPSG3857);
        if (transformed && isValidWGS84(transformed)) {
          processedCoords = transformed;
        }
      }
    }
    
    return isValidWGS84(processedCoords) ? processedCoords : null;
  }
  
  // Recurse for nested coordinates
  const processed = coords.map(coord => processCoordinates(coord, detectedProjection));
  return processed.every(coord => coord !== null) ? processed : null;
};

// Process a single feature
export const processFeature = (feature) => {
  if (!feature.geometry || !feature.geometry.coordinates) {
    return null;
  }

  // First try to detect the projection from the coordinates
  const detectedProjection = detectProjection(feature.geometry.coordinates);
  
  const processedCoords = processCoordinates(feature.geometry.coordinates, detectedProjection);
  if (!processedCoords) {
    return null;
  }

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: processedCoords
    }
  };
};

// Helper to check if feature bounds are reasonable
const hasReasonableBounds = (feature) => {
  if (!feature.geometry || !feature.geometry.coordinates) return false;
  
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  const updateBounds = (coord) => {
    if (Array.isArray(coord[0])) {
      coord.forEach(c => updateBounds(c));
    } else if (coord.length >= 2) {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  };
  
  updateBounds(feature.geometry.coordinates);
  
  // Check if bounds are valid WGS84
  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
    logger.warn('Feature has invalid WGS84 bounds:', { minLng, maxLng, minLat, maxLat });
    return false;
  }
  
  // Check if feature is unrealistically large (e.g., spans more than half the globe)
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  
  if (lngSpan > 180 || latSpan > 90) {
    logger.warn('Feature spans unrealistic area:', { lngSpan, latSpan });
    return false;
  }
  
  return true;
};

// Process entire GeoJSON ensuring proper coordinate system
export const processGeoJSON = (geojson) => {
  if (!geojson) return null;

  // Ensure FeatureCollection structure
  let featureCollection = geojson;
  if (geojson.type === 'Feature') {
    featureCollection = {
      type: 'FeatureCollection',
      features: [geojson]
    };
  } else if (!geojson.type) {
    featureCollection = {
      type: 'FeatureCollection',
      features: Array.isArray(geojson) ? geojson : [geojson]
    };
  }

  if (!featureCollection.features || !Array.isArray(featureCollection.features)) {
    return null;
  }

  logger.log('Processing GeoJSON with', featureCollection.features.length, 'input features');
  
  // First pass: identify which features might be valid
  const featureBounds = featureCollection.features.map(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) return null;
    
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    const updateBounds = (coord) => {
      if (Array.isArray(coord[0])) {
        coord.forEach(c => updateBounds(c));
      } else if (coord.length >= 2) {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    };
    
    updateBounds(feature.geometry.coordinates);
    
    return { minLng, maxLng, minLat, maxLat, feature };
  });
  
  // Log bounds of all features for debugging
  featureBounds.forEach((bounds, idx) => {
    if (bounds) {
      logger.log(`Feature ${idx} bounds:`, {
        lng: [bounds.minLng, bounds.maxLng],
        lat: [bounds.minLat, bounds.maxLat]
      });
    }
  });
  
  // Process all features but filter out invalid ones
  const validFeatures = [];
  const invalidFeatures = [];
  
  for (let i = 0; i < featureCollection.features.length; i++) {
    const feature = featureCollection.features[i];
    const processed = processFeature(feature);
    
    if (processed && hasReasonableBounds(processed)) {
      validFeatures.push(processed);
      
      const bounds = featureBounds[i];
      if (bounds) {
        logger.log(`Feature ${i} accepted with bounds:`, {
          lng: [bounds.minLng, bounds.maxLng],
          lat: [bounds.minLat, bounds.maxLat]
        });
      }
    } else {
      const bounds = featureBounds[i];
      invalidFeatures.push({ 
        index: i, 
        reason: 'Invalid coordinates or unreasonable bounds',
        bounds: bounds ? {
          lng: [bounds.minLng, bounds.maxLng],
          lat: [bounds.minLat, bounds.maxLat]
        } : null
      });
    }
  }
  
  if (invalidFeatures.length > 0) {
    logger.warn(`Filtered out ${invalidFeatures.length} invalid features:`, invalidFeatures);
  }

  if (validFeatures.length === 0) {
    logger.warn('No valid features after processing');
    return null;
  }

  logger.log('Successfully processed', validFeatures.length, 'valid features out of', featureCollection.features.length);
  return {
    type: 'FeatureCollection',
    features: validFeatures
  };
};

// Utility to extract bounds from processed GeoJSON
export const extractBounds = (geojson) => {
  const bounds = {
    minLng: 180,
    maxLng: -180,
    minLat: 90,
    maxLat: -90
  };

  const updateBounds = (coords) => {
    if (Array.isArray(coords[0])) {
      coords.forEach(coord => updateBounds(coord));
    } else {
      const [lng, lat] = coords;
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
    }
  };

  geojson.features.forEach(feature => {
    if (feature.geometry?.coordinates) {
      updateBounds(feature.geometry.coordinates);
    }
  });

  return [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]];
};