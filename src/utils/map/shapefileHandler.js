import * as shp from 'shpjs';
import JSZip from 'jszip';
import proj4 from 'proj4';

// Define common coordinate reference systems with more precise definitions
const CRS_DEFINITIONS = {
  WGS84: '+proj=longlat +datum=WGS84 +no_defs',
  EPSG3857: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
  EPSG4326: '+proj=longlat +datum=WGS84 +no_defs'
};

// Mercator bounds
const MERCATOR_BOUNDS = {
  min: -20037508.342789244,
  max: 20037508.342789244
};

// Helper to determine if coordinates are likely in Web Mercator
const isLikelyWebMercator = (coords) => {
  const [x, y] = Array.isArray(coords[0]) ? coords[0] : coords;
  return Math.abs(x) > 180 || Math.abs(y) > 90;
};

// Helper to transform Web Mercator to WGS84
const mercatorToWGS84 = (coords) => {
  try {
    return proj4(CRS_DEFINITIONS.EPSG3857, CRS_DEFINITIONS.WGS84, coords);
  } catch (error) {
    console.warn('Error transforming coordinates:', error);
    return null;
  }
};

// Validate WGS84 coordinates
const isValidWGS84 = ([lng, lat]) => {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// Process coordinates recursively
const processCoordinates = (coords) => {
  if (!Array.isArray(coords)) return null;
  
  // Handle different geometry types
  if (typeof coords[0] === 'number') {
    if (isLikelyWebMercator(coords)) {
      const transformed = mercatorToWGS84(coords);
      return transformed && isValidWGS84(transformed) ? transformed : null;
    }
    return isValidWGS84(coords) ? coords : null;
  }
  
  // Recurse for nested coordinates
  const processed = coords.map(coord => processCoordinates(coord));
  return processed.every(coord => coord !== null) ? processed : null;
};

// Process a single feature
const processFeature = (feature) => {
  if (!feature.geometry || !feature.geometry.coordinates) {
    return null;
  }

  const processedCoords = processCoordinates(feature.geometry.coordinates);
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

export const handleShapefile = async (file, onStatusUpdate = () => {}) => {
  try {
    onStatusUpdate('Reading zip file...');
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Find relevant files
    const files = {};
    for (const [name, entry] of Object.entries(zip.files)) {
      const ext = name.split('.').pop().toLowerCase();
      if (['shp', 'dbf', 'prj'].includes(ext)) {
        files[ext] = entry;
      }
    }

    if (!files.shp) {
      throw new Error('No .shp file found in the zip archive');
    }

    // Read shapefile content
    onStatusUpdate('Processing shapefile...');
    const shpContent = await files.shp.async('arraybuffer');
    let geojson;

    if (files.dbf) {
      const dbfContent = await files.dbf.async('arraybuffer');
      geojson = await shp.combine([
        await shp.parseShp(shpContent),
        await shp.parseDbf(dbfContent)
      ]);
    } else {
      geojson = await shp.parseShp(shpContent);
    }

    // Ensure FeatureCollection structure
    if (!geojson.type) {
      geojson = {
        type: 'FeatureCollection',
        features: Array.isArray(geojson) ? geojson : [geojson]
      };
    }

    onStatusUpdate('Processing features...');
    const validFeatures = [];
    let processedCount = 0;
    const totalFeatures = geojson.features.length;

    for (const feature of geojson.features) {
      const processed = processFeature(feature);
      if (processed) {
        validFeatures.push(processed);
      }
      
      processedCount++;
      if (processedCount % 100 === 0 || processedCount === totalFeatures) {
        onStatusUpdate(`Processed ${processedCount} of ${totalFeatures} features...`);
      }
    }

    if (validFeatures.length === 0) {
      throw new Error('No valid features found after processing');
    }

    onStatusUpdate(`Successfully processed ${validFeatures.length} features`);
    return {
      type: 'FeatureCollection',
      features: validFeatures
    };

  } catch (error) {
    console.error('Shapefile processing error:', error);
    throw new Error(`Failed to process shapefile: ${error.message}`);
  }
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

export default handleShapefile;