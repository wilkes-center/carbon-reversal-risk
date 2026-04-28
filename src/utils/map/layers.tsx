// @ts-nocheck
import { generatePaintProperty } from '../colors/colorScales';

export const MAX_COMPOSITE_PARTS = 65;

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
      filter: ['>=', ['get', 'drought_risk'], 0]
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
      filter: ['>=', ['get', 'insect_risk'], 0]
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
      filter: ['>=', ['get', 'fire_risk'], 0]
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
      filter: ['>=', ['get', 'drought_risk'], 0]
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
      filter: ['>=', ['get', 'insect_risk'], 0]
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
      filter: ['>=', ['get', 'fire_risk'], 0]
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
      filter: ['>=', ['get', 'drought_risk'], 0]
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
      filter: ['>=', ['get', 'insect_risk'], 0]
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
      filter: ['>=', ['get', 'fire_risk'], 0]
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

export const getLayers = (isDarkMode) =>
  baseLayerConfigs.map(config => createLayer(config, isDarkMode));

export const layers = baseLayerConfigs;