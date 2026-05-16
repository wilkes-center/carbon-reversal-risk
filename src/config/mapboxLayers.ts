/**
 * Single source of truth for every Mapbox layer the app renders.
 *
 * MUST stay in sync with `scripts/mapbox/manifest.py`. When you add or rename
 * a tileset there, mirror the change here so the React app knows about it.
 *
 * Each `LayerEntry` describes ONE button in the panel. Multiple entries can
 * share a tileset (e.g. all five supersection-backed buttons per SSP point at
 * the same tileset and just switch which numeric column drives the fill
 * color).
 */

export type LayerScope = 'us' | 'global';
export type ColorScale = 'buffer' | 'risk' | 'globalbp';

export interface LayerEntry {
  /** Unique button id. */
  id: string;
  /** Group id, used as the panel section key. */
  group: string;
  /** Human-readable group label shown in the panel header. */
  groupLabel: string;
  /** Whether this layer belongs to the US or Global section. */
  scope: LayerScope;
  /** Variant key used inside the group (e.g. `ssp245`, `Drought`, `low`). */
  variant: string;
  /** Mapbox tileset full id, including the username prefix. */
  tileset: string;
  /** Source-layer name inside the tileset (matches the recipe). */
  sourceLayer: string;
  /** Property used to drive the fill color. */
  valueProperty: string;
  /** Which color ramp to use. */
  colorScale: ColorScale;
  /** Mapbox GL filter expression. */
  filter: unknown[];
}

const RASTER_PROP = 'value';
const SUPERSECTION_FILTER = (prop: string) => ['>=', ['get', prop], 0];

const SSPS = ['ssp245', 'ssp370', 'ssp585'] as const;

const supersectionTileset = (ssp: (typeof SSPS)[number]): string =>
  `pkulandh.allrisk_supersection_${ssp}`;
const supersectionSourceLayer = (ssp: (typeof SSPS)[number]): string =>
  `allrisk_supersection_${ssp}`;

const supersectionEntry = (
  ssp: (typeof SSPS)[number],
  group: string,
  groupLabel: string,
  variant: string,
  valueProperty: string,
  colorScale: ColorScale,
  idSuffix?: string
): LayerEntry => ({
  id: `${group}__${ssp}__${idSuffix ?? variant}`,
  group,
  groupLabel,
  scope: 'us',
  variant,
  tileset: supersectionTileset(ssp),
  sourceLayer: supersectionSourceLayer(ssp),
  valueProperty,
  colorScale,
  filter: SUPERSECTION_FILTER(valueProperty),
});

const rasterEntry = (config: {
  group: string;
  groupLabel: string;
  scope: LayerScope;
  variant: string;
  tileset: string;
  colorScale: ColorScale;
}): LayerEntry => ({
  id: `${config.group}__${config.variant}`,
  group: config.group,
  groupLabel: config.groupLabel,
  scope: config.scope,
  variant: config.variant,
  tileset: `pkulandh.${config.tileset}`,
  sourceLayer: config.tileset,
  valueProperty: RASTER_PROP,
  colorScale: config.colorScale,
  filter: ['>=', ['get', RASTER_PROP], 0],
});

export const LAYER_ENTRIES: LayerEntry[] = [
  // ---------- US: Combined Risk Absolute Reversal (cmbrs__) ----------
  supersectionEntry(
    'ssp245',
    'combinedRisk',
    'Combined Risk Absolute Reversal',
    'ssp245',
    'cmbrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp585',
    'combinedRisk',
    'Combined Risk Absolute Reversal',
    'ssp585',
    'cmbrs__',
    'risk'
  ),

  // ---------- US: Buffer Pool (per-driver, ssp245 only) ----------
  rasterEntry({
    group: 'bufferPool',
    groupLabel: 'Buffer Pool SSP245',
    scope: 'us',
    variant: 'Insect',
    tileset: 'bufferpool_insect_ssp245',
    colorScale: 'buffer',
  }),
  rasterEntry({
    group: 'bufferPool',
    groupLabel: 'Buffer Pool SSP245',
    scope: 'us',
    variant: 'Drought',
    tileset: 'bufferpool_drought_ssp245',
    colorScale: 'buffer',
  }),
  rasterEntry({
    group: 'bufferPool',
    groupLabel: 'Buffer Pool SSP245',
    scope: 'us',
    variant: 'Fire',
    tileset: 'bufferpool_fire_ssp245',
    colorScale: 'buffer',
  }),

  // ---------- US: Reversal Probability per SSP ----------
  // SSP245
  supersectionEntry(
    'ssp245',
    'reversalRiskSSP245',
    'Reversal Probability SSP245',
    'Insect',
    'insrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp245',
    'reversalRiskSSP245',
    'Reversal Probability SSP245',
    'Drought',
    'drtrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp245',
    'reversalRiskSSP245',
    'Reversal Probability SSP245',
    'Fire',
    'frtrs__',
    'risk'
  ),
  // SSP370
  supersectionEntry(
    'ssp370',
    'reversalRiskSSP370',
    'Reversal Probability SSP370',
    'Insect',
    'insrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp370',
    'reversalRiskSSP370',
    'Reversal Probability SSP370',
    'Drought',
    'drtrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp370',
    'reversalRiskSSP370',
    'Reversal Probability SSP370',
    'Fire',
    'frtrs__',
    'risk'
  ),
  // SSP585
  supersectionEntry(
    'ssp585',
    'reversalRiskSSP585',
    'Reversal Probability SSP585',
    'Insect',
    'insrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp585',
    'reversalRiskSSP585',
    'Reversal Probability SSP585',
    'Drought',
    'drtrs__',
    'risk'
  ),
  supersectionEntry(
    'ssp585',
    'reversalRiskSSP585',
    'Reversal Probability SSP585',
    'Fire',
    'frtrs__',
    'risk'
  ),

  // ---------- Global: Buffer Pool (low/moderate/high, ssp245 only) ----------
  rasterEntry({
    group: 'globalBufferPool',
    groupLabel: 'Global Buffer Pool',
    scope: 'global',
    variant: 'low',
    tileset: 'globalbufferpool_low_ssp245',
    colorScale: 'globalbp',
  }),
  rasterEntry({
    group: 'globalBufferPool',
    groupLabel: 'Global Buffer Pool',
    scope: 'global',
    variant: 'moderate',
    tileset: 'globalbufferpool_moderate_ssp245',
    colorScale: 'globalbp',
  }),
  rasterEntry({
    group: 'globalBufferPool',
    groupLabel: 'Global Buffer Pool',
    scope: 'global',
    variant: 'high',
    tileset: 'globalbufferpool_high_ssp245',
    colorScale: 'globalbp',
  }),

  // ---------- Global: Reversal Probability (low/moderate/high, ssp245 only) ----------
  rasterEntry({
    group: 'globalReversal',
    groupLabel: 'Global Reversal Probability',
    scope: 'global',
    variant: 'low',
    tileset: 'globalreversal_low_ssp245',
    colorScale: 'risk',
  }),
  rasterEntry({
    group: 'globalReversal',
    groupLabel: 'Global Reversal Probability',
    scope: 'global',
    variant: 'moderate',
    tileset: 'globalreversal_moderate_ssp245',
    colorScale: 'risk',
  }),
  rasterEntry({
    group: 'globalReversal',
    groupLabel: 'Global Reversal Probability',
    scope: 'global',
    variant: 'high',
    tileset: 'globalreversal_high_ssp245',
    colorScale: 'risk',
  }),
];

export interface LayerGroupDefinition {
  /** Group key (e.g. `combinedRisk`). */
  key: string;
  /** Human-readable group label. */
  name: string;
  /** Variant labels in declaration order, matches button order. */
  variants: string[];
  /** Maps variant -> button id (= LAYER_ENTRIES[i].id). */
  layers: Record<string, string>;
  /** Where the group lives. */
  scope: LayerScope;
}

const buildGroups = (entries: LayerEntry[]): Record<string, LayerGroupDefinition> => {
  const groups: Record<string, LayerGroupDefinition> = {};
  for (const entry of entries) {
    const existing = groups[entry.group];
    if (existing) {
      if (!existing.variants.includes(entry.variant)) {
        existing.variants.push(entry.variant);
      }
      existing.layers[entry.variant] = entry.id;
    } else {
      groups[entry.group] = {
        key: entry.group,
        name: entry.groupLabel,
        variants: [entry.variant],
        layers: { [entry.variant]: entry.id },
        scope: entry.scope,
      };
    }
  }
  return groups;
};

export const LAYER_GROUPS: Record<string, LayerGroupDefinition> = buildGroups(LAYER_ENTRIES);

const ENTRY_BY_ID: Map<string, LayerEntry> = new Map(
  LAYER_ENTRIES.map((entry) => [entry.id, entry])
);

export const getLayerEntry = (id: string | null | undefined): LayerEntry | undefined => {
  if (!id) return undefined;
  return ENTRY_BY_ID.get(id);
};

export const getValueProperty = (id: string | null | undefined): string => {
  const entry = getLayerEntry(id);
  return entry ? entry.valueProperty : 'value';
};

export const getColorScale = (id: string | null | undefined): ColorScale | null => {
  const entry = getLayerEntry(id);
  return entry ? entry.colorScale : null;
};

export const hasGlobalLayers = (): boolean =>
  LAYER_ENTRIES.some((entry) => entry.scope === 'global');

const FALSY = new Set(['false', '0', 'no', 'off', '']);

export const showGlobalLayers = (): boolean => {
  if (!hasGlobalLayers()) return false;
  const flag = process.env.NEXT_PUBLIC_HIDE_GLOBAL_LAYERS;
  if (!flag) return true;
  return FALSY.has(flag.trim().toLowerCase());
};

export const userFriendlyLayerName = (id: string | null | undefined): string => {
  const entry = getLayerEntry(id);
  if (!entry) return id ?? '';
  return `${entry.groupLabel} - ${entry.variant.charAt(0).toUpperCase()}${entry.variant.slice(1)}`;
};
