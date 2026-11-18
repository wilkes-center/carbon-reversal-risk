import { generatePaintProperty } from '../colors/colorScales';
import { LAYER_ENTRIES, LAYER_GROUPS, type LayerEntry } from '../../config/mapboxLayers';

export interface ResolvedLayer {
  id: string;
  source:
    | { type: 'vector'; url: string }
    | { type: 'raster-array'; url: string; tileSize: number };
  layer: {
    id: string;
    type: 'fill' | 'raster';
    source: string;
    'source-layer': string;
    minzoom: number;
    maxzoom: number;
    filter?: unknown[];
    paint?: Record<string, unknown>;
  };
}

const buildLayer = (entry: LayerEntry): ResolvedLayer => {
  if (entry.scope === 'global') {
    return {
      id: entry.id,
      source: {
        type: 'raster-array',
        url: `mapbox://${entry.tileset}`,
        tileSize: 256,
      },
      layer: {
        id: entry.id,
        type: 'raster',
        source: entry.id,
        'source-layer': entry.sourceLayer,
        minzoom: 0,
        maxzoom: 22,
      },
    };
  }

  return {
    id: entry.id,
    source: {
      type: 'vector',
      url: `mapbox://${entry.tileset}`,
    },
    layer: {
      id: entry.id,
      type: 'fill',
      source: entry.id,
      'source-layer': entry.sourceLayer,
      minzoom: 0,
      maxzoom: 22,
      filter: entry.filter,
    },
  };
};

export const layers: ResolvedLayer[] = LAYER_ENTRIES.map(buildLayer);

// Mapbox loads raster-array tiles in partial (header-first) mode by default,
// which renders these global grids as coarse, mis-colored blocks. Force full
// tile loads and rebuild any tiles fetched in partial mode.
export const loadFullRasterTiles = (map: any, layerId: string): void => {
  const source = map.getSource(layerId);
  if (!source || source.type !== 'raster-array' || source.partial === false) return;
  source.partial = false;
  const layer = map.getLayer(layerId);
  const cache = layer && map.style.getLayerSourceCache(layer);
  if (cache) {
    cache.clearTiles();
    cache.update(map.transform);
  }
  map.triggerRepaint();
};

export const getLayers = (isDarkMode: boolean): ResolvedLayer[] =>
  layers.map((l) => ({
    ...l,
    layer: {
      ...l.layer,
      paint: generatePaintProperty(l.id, isDarkMode) as Record<string, unknown>,
    },
  }));

export { LAYER_GROUPS as layerGroups };
