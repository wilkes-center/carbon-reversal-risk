import { generatePaintProperty } from '../colors/colorScales';
import { LAYER_ENTRIES, LAYER_GROUPS, type LayerEntry } from '../../config/mapboxLayers';

export interface ResolvedLayer {
  id: string;
  source: {
    type: 'vector';
    url: string;
  };
  layer: {
    id: string;
    type: 'fill';
    source: string;
    'source-layer': string;
    minzoom: number;
    maxzoom: number;
    filter: unknown[];
    paint?: Record<string, unknown>;
  };
}

const buildLayer = (entry: LayerEntry): ResolvedLayer => ({
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
});

export const layers: ResolvedLayer[] = LAYER_ENTRIES.map(buildLayer);

export const getLayers = (isDarkMode: boolean): ResolvedLayer[] =>
  layers.map((l) => ({
    ...l,
    layer: {
      ...l.layer,
      paint: generatePaintProperty(l.id, isDarkMode) as Record<string, unknown>,
    },
  }));

export { LAYER_GROUPS as layerGroups };
