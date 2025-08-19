// Value ranges for different layer types
const scaleRanges = {
  buffer: [0, 3, 5, 10, 20, 30, 60, 80, 100, 300],
  risk: [0, 10, 20, 30, 40, 50, 60, 80, 100],
  globalbp: [0, 15, 25, 50, 75, 100, 200, 300, 500, 800]
};

// Light mode color schemes
const lightModeColors = {
  buffer: [
    '#FFFFFF', '#FEF6D1', '#FEE6A3', '#FECF66', '#FEB23E',
    '#FD8D3C', '#F85E36', '#E93226', '#D31021', '#A50F1B'
  ],
  risk: [
    '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
    '#cc4c02', '#993404', '#662506', '#331303'
  ],
  globalbp: [
    '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
    '#cc4c02', '#993404', '#662506', '#331303', '#000000'
  ]
};

// Dark mode color schemes
const darkModeColors = {
  buffer: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
  ],
  risk: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
  ],
  globalbp: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
  ]
};

// Layer type mappings
const layerTypes = {
  // Buffer pool layers
  InsectBufferPool: 'buffer',
  DroughtBufferPool: 'buffer',
  FireBufferPool: 'buffer',
  
  // Risk layers
  CombinedRisk_ssp245: 'risk',
  CombinedRisk_ssp585: 'risk',
  DroughtRiskSSP585: 'risk',
  InsectRiskSSP585: 'risk',
  FireRiskSSP585: 'risk',
  DroughtRiskSSP245: 'risk',
  InsectRiskSSP245: 'risk',
  FireRiskSSP245: 'risk',
  DroughtRiskSSP370: 'risk',
  InsectRiskSSP370: 'risk',
  FireRiskSSP370: 'risk',
  
  // Composite layers
  compositeGbfLowSsp245: 'globalbp',
  compositeGbfModerateSsp245: 'globalbp',
  compositeGbfHighSsp245: 'globalbp',
  compositeGrLowSsp245: 'risk',
  compositeGrModerateSsp245: 'risk',
  compositeGrHighSsp245: 'risk'
};

// Helper function to create scale entries
const createScale = (colors, values) => {
  return values.map((value, index) => ({
    value,
    color: colors[index]
  }));
};

// Helper to get base layer ID for composite layers
const getBaseLayerId = (layerId) => {
  if (!layerId) return null;
  if (typeof layerId !== 'string') return String(layerId);
  
  const match = layerId.match(/^(.+?)(?:_\d+)?$/);
  return match ? match[1] : layerId;
};

// Main function to create color scales
export const createColorScales = (isDarkMode) => {
  const colors = isDarkMode ? darkModeColors : lightModeColors;
  
  return Object.entries(layerTypes).reduce((scales, [layerId, type]) => {
    scales[layerId] = createScale(colors[type], scaleRanges[type]);
    return scales;
  }, {});
};

export const generatePaintProperty = (layerId, isDarkMode) => {
  try {
    // Debug logging for SSP370 layers
    if (layerId && layerId.includes('SSP370')) {
      console.log('🔍 Generating paint property for SSP370 layer:', layerId);
    }
    
    const scaleRanges = {
      buffer: [0, 3, 5, 10, 20, 30, 60, 80, 100, 300],
      risk: [0, 10, 20, 30, 40, 50, 60, 80, 100],
      globalbp: [0, 15, 25, 50, 75, 100, 200, 300, 500, 800]
    };

    const lightModeColors = {
      buffer: [
        '#FFFFFF', '#FEF6D1', '#FEE6A3', '#FECF66', '#FEB23E',
        '#FD8D3C', '#F85E36', '#E93226', '#D31021', '#A50F1B'
      ],
      risk: [
        '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
        '#cc4c02', '#993404', '#662506', '#331303'
      ],
      globalbp: [
        '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
        '#cc4c02', '#993404', '#662506', '#331303', '#000000'
      ]
    };

    const darkModeColors = {
      buffer: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
      ],
      risk: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
      ],
      globalbp: [
        '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
        '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8'
      ]
    };

    const layerTypes = {
      InsectBufferPool: 'buffer',
      DroughtBufferPool: 'buffer',
      FireBufferPool: 'buffer',
      CombinedRisk_ssp245: 'risk',
      CombinedRisk_ssp585: 'risk',
      DroughtRiskSSP585: 'risk',
      InsectRiskSSP585: 'risk',
      FireRiskSSP585: 'risk',
      DroughtRiskSSP245: 'risk',
      InsectRiskSSP245: 'risk',
      FireRiskSSP245: 'risk',
      DroughtRiskSSP370: 'risk',
      InsectRiskSSP370: 'risk',
      FireRiskSSP370: 'risk',
      compositeGbfLowSsp245: 'globalbp',
      compositeGbfModerateSsp245: 'globalbp',
      compositeGbfHighSsp245: 'globalbp',
      compositeGrLowSsp245: 'risk',
      compositeGrModerateSsp245: 'risk',
      compositeGrHighSsp245: 'risk'
    };

    const createScale = (colors, values) => {
      return values.map((value, index) => ({
        value,
        color: colors[index]
      }));
    };

    const getBaseLayerId = (layerId) => {
      if (!layerId) return null;
      if (typeof layerId !== 'string') return String(layerId);
      
      const match = layerId.match(/^(.+?)(?:_\d+)?$/);
      return match ? match[1] : layerId;
    };

    const colors = isDarkMode ? darkModeColors : lightModeColors;
    const type = layerTypes[getBaseLayerId(layerId)];

    if (!type || !colors[type]) {
      return {
        'fill-color': isDarkMode ? '#1f2937' : '#ffffff',
        'fill-opacity': 0.7
      };
    }

    const scale = createScale(colors[type], scaleRanges[type]);
    
    let valueKey = 'raster_value';
    if (layerId.includes('DroughtRisk')) {
      valueKey = 'drought_risk';
    } else if (layerId.includes('InsectRisk')) {
      valueKey = 'insect_risk';
    } else if (layerId.includes('FireRisk')) {
      valueKey = 'fire_risk';
    }
    

    return {
      'fill-color': [
        'case',
        ['has', valueKey],
        [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', valueKey], 0],
          ...scale.flatMap(stop => [stop.value, stop.color])
        ],
        isDarkMode ? '#1f2937' : '#ffffff'
      ],
      'fill-opacity': 0.7
    };
  } catch (error) {
    console.error(`Error generating paint property for layer ${layerId}:`, error);
    // default paint object as a fallback
    return {
      'fill-color': isDarkMode ? '#023047' : '#ffffd4',
      'fill-opacity': 0.7
    };
  }
};


export const getLegendConfig = (layerId, isDarkMode) => {
  if (!layerId) return [];
  
  const baseLayerId = getBaseLayerId(layerId);
  const scale = createColorScales(isDarkMode)[baseLayerId];
  
  if (!scale) {
    console.warn(`No scale found for ${baseLayerId}`);
    return [];
  }

  return scale.map((stop, index) => ({
    color: stop.color,
    value: stop.value,
    label: index === scale.length - 1 ? `${stop.value}+` : `${stop.value} - ${scale[index + 1]?.value || ''}`
  }));
};

export const isBufferPoolLayer = (layerId) => layerTypes[getBaseLayerId(layerId)] === 'buffer';
export const isRiskLayer = (layerId) => layerTypes[getBaseLayerId(layerId)] === 'risk';
export const isCompositeLayer = (layerId) => layerTypes[getBaseLayerId(layerId)] === 'globalbp';