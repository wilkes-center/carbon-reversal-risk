import { createColorScales, generatePaintProperty } from '../colors/colorScales';

export const createLayer = (layerConfig, isDarkMode) => {
  const { id, source, layer } = layerConfig;
  return {
    id,
    source,
    layer: {
      ...layer,
      paint: generatePaintProperty(id, isDarkMode)
    }
  };
};

// Source layer patterns for composite layers
const SOURCE_LAYER_PATTERNS = {
  compositeGbfLowSsp245: (index) => `gbf_low_part${index}_processed`,
  compositeGbfModerateSsp245: (index) => `gbf_mod_part${index}_processed`,
  compositeGbfHighSsp245: (index) => `gbf_high_part${index}_processed`,
  compositeGrLowSsp245: (index) => `gr_low_part${index}_processed`,
  compositeGrModerateSsp245: (index) => `gr_mod_part${index}_processed`,
  compositeGrHighSsp245: (index) => `gr_high_part${index}_processed`
};

const baseLayerConfigs = [
  // Combined Risk Layers
  {
    id: 'CombinedRisk_ssp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.comrisk_absreversal_8km_ssp245'
    },
    layer: {
      id: 'CombinedRisk_ssp245',
      type: 'fill',
      source: 'CombinedRisk_ssp245',
      'source-layer': 'combinedRisk_absReversal_8km_ssp245'
    }
  },
  {
    id: 'CombinedRisk_ssp585',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.comrisk_absreversal_8km_ssp585'
    },
    layer: {
      id: 'CombinedRisk_ssp585',
      type: 'fill',
      source: 'CombinedRisk_ssp585',
      'source-layer': 'combinedRisk_absReversal_8km_ssp585'
    }
  },

  // Buffer Pool Layers
  {
    id: 'InsectBufferPool',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.bf_insect_ssp245'
    },
    layer: {
      id: 'InsectBufferPool',
      type: 'fill',
      source: 'InsectBufferPool',
      'source-layer': 'bf_insect_ssp245_processed',
      filter: ['>=', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'DroughtBufferPool',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.bf_drought_ssp245'
    },
    layer: {
      id: 'DroughtBufferPool',
      type: 'fill',
      source: 'DroughtBufferPool',
      'source-layer': 'bf_drought_ssp245_processed',
      filter: ['>=', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'FireBufferPool',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.bf_fire_ssp245'
    },
    layer: {
      id: 'FireBufferPool',
      type: 'fill',
      source: 'FireBufferPool',
      'source-layer': 'bf_fire_ssp245_processed',
      filter: ['>=', ['get', 'raster_value'], 0]
    }
  },

  // SSP585 Risk Layers
  {
    id: 'DroughtRiskSSP585',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-drought-ssp585'
    },
    layer: {
      id: 'DroughtRiskSSP585',
      type: 'fill',
      source: 'DroughtRiskSSP585',
      'source-layer': 'us-rr-drought-ssp585',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'drought_risk'], 0]
    }
  },
  {
    id: 'InsectRiskSSP585',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-insect-ssp585'
    },
    layer: {
      id: 'InsectRiskSSP585',
      type: 'fill',
      source: 'InsectRiskSSP585',
      'source-layer': 'us-rr-insect-ssp585',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'insect_risk'], 0]
    }
  },
  {
    id: 'FireRiskSSP585',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-fire-ssp585'
    },
    layer: {
      id: 'FireRiskSSP585',
      type: 'fill',
      source: 'FireRiskSSP585',
      'source-layer': 'us-rr-fire-ssp585',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'fire_risk'], 0]
    }
  },

  // SSP245 Risk Layers
  {
    id: 'DroughtRiskSSP245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-drought-ssp245'
    },
    layer: {
      id: 'DroughtRiskSSP245',
      type: 'fill',
      source: 'DroughtRiskSSP245',
      'source-layer': 'us-rr-drought-ssp245',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'drought_risk'], 0]
    }
  },
  {
    id: 'InsectRiskSSP245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-insect-ssp245'
    },
    layer: {
      id: 'InsectRiskSSP245',
      type: 'fill',
      source: 'InsectRiskSSP245',
      'source-layer': 'us-rr-insect-ssp245',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'insect_risk'], 0]
    }
  },
  {
    id: 'FireRiskSSP245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-fire-ssp245'
    },
    layer: {
      id: 'FireRiskSSP245',
      type: 'fill',
      source: 'FireRiskSSP245',
      'source-layer': 'us-rr-fire-ssp245',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'fire_risk'], 0]
    }
  },

  // SSP370 Risk Layers
  {
    id: 'DroughtRiskSSP370',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-drought-ssp370'
    },
    layer: {
      id: 'DroughtRiskSSP370',
      type: 'fill',
      source: 'DroughtRiskSSP370',
      'source-layer': 'us-rr-drought-ssp370',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'drought_risk'], 0]
    }
  },
  {
    id: 'InsectRiskSSP370',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-insect-ssp370'
    },
    layer: {
      id: 'InsectRiskSSP370',
      type: 'fill',
      source: 'InsectRiskSSP370',
      'source-layer': 'us-rr-insect-ssp370',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'insect_risk'], 0]
    }
  },
  {
    id: 'FireRiskSSP370',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.us-rr-fire-ssp370'
    },
    layer: {
      id: 'FireRiskSSP370',
      type: 'fill',
      source: 'FireRiskSSP370',
      'source-layer': 'us-rr-fire-ssp370',
      minzoom: 0,
      maxzoom: 22,
      filter: ['>', ['get', 'fire_risk'], 0]
    }
  },

  // Composite GBF Layers
  {
    id: 'compositeGbfLowSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gbf_low_part1'
    },
    layer: {
      id: 'compositeGbfLowSsp245',
      type: 'fill',
      source: 'compositeGbfLowSsp245',
      'source-layer': 'gbf_low_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'compositeGbfModerateSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gbf_mod_part1'
    },
    layer: {
      id: 'compositeGbfModerateSsp245',
      type: 'fill',
      source: 'compositeGbfModerateSsp245',
      'source-layer': 'gbf_mod_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'compositeGbfHighSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gbf_high_part1'
    },
    layer: {
      id: 'compositeGbfHighSsp245',
      type: 'fill',
      source: 'compositeGbfHighSsp245',
      'source-layer': 'gbf_high_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  },

  // Composite GR Layers
  {
    id: 'compositeGrLowSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gr_low_part1'
    },
    layer: {
      id: 'compositeGrLowSsp245',
      type: 'fill',
      source: 'compositeGrLowSsp245',
      'source-layer': 'gr_low_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'compositeGrModerateSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gr_mod_part1'
    },
    layer: {
      id: 'compositeGrModerateSsp245',
      type: 'fill',
      source: 'compositeGrModerateSsp245',
      'source-layer': 'gr_mod_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  },
  {
    id: 'compositeGrHighSsp245',
    source: {
      type: 'vector',
      url: 'mapbox://pkulandh.gr_high_part1'
    },
    layer: {
      id: 'compositeGrHighSsp245',
      type: 'fill',
      source: 'compositeGrHighSsp245',
      'source-layer': 'gr_high_part1_processed',
      filter: ['>', ['get', 'raster_value'], 0]
    }
  }
];

// Generate URLs for additional composite parts (2-65) for all layers
export const additionalCompositeUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gbf_low_part${i + 2}`
);

export const additionalCompositeHighUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gbf_high_part${i + 2}`
);

export const additionalCompositeModeUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gbf_mod_part${i + 2}`
);

export const additionalCompositeGrLowUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gr_low_part${i + 2}`
);

export const additionalCompositeGrHighUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gr_high_part${i + 2}`
);

export const additionalCompositeGrModerateUrls = Array.from({ length: 64 }, (_, i) => 
  `mapbox://pkulandh.gr_mod_part${i + 2}`
);

// Define max parts for each layer type - all use 65 parts
const LAYER_MAX_PARTS = {
  compositeGbfLowSsp245: 65,
  compositeGbfModerateSsp245: 65,
  compositeGbfHighSsp245: 65,
  compositeGrLowSsp245: 65,
  compositeGrModerateSsp245: 65,
  compositeGrHighSsp245: 65
};

// Handler for composite layers
export const handleCompositeLayers = async (map, baseLayerId, additionalUrls, isDarkMode) => {
  if (!map || !map.isStyleLoaded()) return;

  console.log(`Handling composite layers for ${baseLayerId}`);
  const totalParts = LAYER_MAX_PARTS[baseLayerId] || 21;
  console.log(`Loading ${totalParts} parts for ${baseLayerId}`);

  try {
    // Handle base layer
    const baseLayer = baseLayerConfigs.find(config => config.id === baseLayerId);
    if (!baseLayer) {
      console.error(`Base layer config not found for ${baseLayerId}`);
      return;
    }

    // Add base source if it doesn't exist
    if (!map.getSource(baseLayerId)) {
      console.log(`Adding base source for ${baseLayerId} (part 1)`);
      await map.addSource(baseLayerId, baseLayer.source);
    }

    // Add base layer if it doesn't exist
    if (!map.getLayer(baseLayerId)) {
      console.log(`Adding base layer for ${baseLayerId} (part 1)`);
      const paintProperties = generatePaintProperty(baseLayerId, isDarkMode);
      await map.addLayer({
        ...baseLayer.layer,
        paint: paintProperties
      });
    }

    // Handle additional composite layers
    let successCount = 1; // Start at 1 for the base layer
    let failedParts = [];
    
    for (let i = 0; i < totalParts - 1; i++) {
      const partNumber = i + 2;
      const url = additionalUrls[i];
      const layerId = `${baseLayerId}_${partNumber}`;
      const sourceId = `${baseLayerId}_${partNumber}`;
      const sourceLayer = SOURCE_LAYER_PATTERNS[baseLayerId](partNumber);

      try {
        // Add source if it doesn't exist
        if (!map.getSource(sourceId)) {
          console.log(`Adding source for part ${partNumber} of ${baseLayerId}: ${url}`);
          await map.addSource(sourceId, {
            type: 'vector',
            url
          });
          
          // Add error listener for source
          map.on('error', function errorHandler(e) {
            if (e.sourceId === sourceId) {
              console.error(`✗ Source error for part ${partNumber} of ${baseLayerId}:`, e.error);
              map.off('error', errorHandler);
            }
          });
        }

        // Add layer if it doesn't exist
        if (!map.getLayer(layerId)) {
          const paintProperties = generatePaintProperty(baseLayerId, isDarkMode);
          await map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            'source-layer': sourceLayer,
            paint: paintProperties,
            filter: ['>', ['get', 'raster_value'], 0],
            layout: {
              visibility: 'visible'
            }
          });
          
          // Verify the layer was added successfully
          if (map.getLayer(layerId)) {
            successCount++;
            console.log(`✓ Successfully added part ${partNumber} for ${baseLayerId}`);
            
            // Check if source has loaded
            const source = map.getSource(sourceId);
            if (source) {
              map.on('sourcedata', function sourceLoadHandler(e) {
                if (e.sourceId === sourceId && e.isSourceLoaded) {
                  console.log(`✓ Source loaded for part ${partNumber} of ${baseLayerId}`);
                  map.off('sourcedata', sourceLoadHandler);
                }
              });
            }
          } else {
            console.error(`✗ Failed to add layer ${layerId}`);
          }
        } else {
          console.log(`Layer ${layerId} already exists`);
        }

        // Longer delay between adding layers to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`✗ Error adding part ${partNumber} for ${baseLayerId}:`, {
          error: error.message,
          url,
          sourceLayer
        });
        failedParts.push(partNumber);
        
        // Try to clean up any partially created resources
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch (cleanupError) {
          console.warn(`Cleanup error for part ${partNumber}:`, cleanupError.message);
        }
        
        // Add delay after error to prevent rapid retries
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }
    
    console.log(`${baseLayerId}: Successfully loaded ${successCount}/${totalParts} parts`);
    if (failedParts.length > 0) {
      console.warn(`${baseLayerId}: Failed to load parts: ${failedParts.join(', ')}`);
    }

  } catch (error) {
    console.error(`Error handling composite layers for ${baseLayerId}:`, error);
  }
};

// Export getLayers function
export const getLayers = (isDarkMode) => 
  baseLayerConfigs.map(config => createLayer(config, isDarkMode));

// Export layers constant
export const layers = baseLayerConfigs;