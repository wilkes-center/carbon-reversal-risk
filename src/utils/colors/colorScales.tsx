import { logger } from '../logger';
import { getColorScale, getValueProperty, type ColorScale } from '../../config/mapboxLayers';

const SCALE_RANGES: Record<ColorScale, number[]> = {
  buffer: [0, 3, 5, 10, 20, 30, 60, 80, 100, 300],
  risk: [0, 10, 20, 30, 40, 50, 60, 80, 100],
  globalbp: [0, 15, 25, 50, 75, 100, 200, 300, 500, 800],
};

const LIGHT_COLORS: Record<ColorScale, string[]> = {
  buffer: [
    '#FFFFFF', '#FEF6D1', '#FEE6A3', '#FECF66', '#FEB23E',
    '#FD8D3C', '#F85E36', '#E93226', '#D31021', '#A50F1B',
  ],
  risk: [
    '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
    '#cc4c02', '#993404', '#662506', '#331303',
  ],
  globalbp: [
    '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
    '#cc4c02', '#993404', '#662506', '#331303', '#000000',
  ],
};

const DARK_COLORS: Record<ColorScale, string[]> = {
  buffer: [
    '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
    '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8',
  ],
  risk: [
    '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
    '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8',
  ],
  globalbp: [
    '#023047', '#0466c8', '#0077b6', '#0096c7', '#00b4d8',
    '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e5f6f8',
  ],
};

interface ScaleStop {
  value: number;
  color: string;
}

const buildScale = (kind: ColorScale, isDarkMode: boolean): ScaleStop[] => {
  const colors = isDarkMode ? DARK_COLORS[kind] : LIGHT_COLORS[kind];
  const values = SCALE_RANGES[kind];
  return values.map((value, index) => ({ value, color: colors[index] }));
};

export const generatePaintProperty = (
  layerId: string | null | undefined,
  isDarkMode: boolean,
): Record<string, unknown> => {
  try {
    const kind = getColorScale(layerId);
    if (!kind) {
      return {
        'fill-color': isDarkMode ? '#1f2937' : '#ffffff',
        'fill-opacity': 0.7,
      };
    }

    const scale = buildScale(kind, isDarkMode);
    const valueKey = getValueProperty(layerId);

    return {
      'fill-color': [
        'case',
        ['has', valueKey],
        [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', valueKey], 0],
          ...scale.flatMap((stop) => [stop.value, stop.color]),
        ],
        isDarkMode ? '#1f2937' : '#ffffff',
      ],
      'fill-opacity': 0.7,
    };
  } catch (error) {
    logger.error(`Error generating paint property for layer ${layerId}:`, error);
    return {
      'fill-color': isDarkMode ? '#023047' : '#ffffd4',
      'fill-opacity': 0.7,
    };
  }
};

export const getLegendConfig = (
  layerId: string | null | undefined,
  isDarkMode: boolean,
): { color: string; value: number; label: string }[] => {
  if (!layerId) return [];

  const kind = getColorScale(layerId);
  if (!kind) {
    logger.warn(`No color scale found for ${layerId}`);
    return [];
  }

  const scale = buildScale(kind, isDarkMode);
  return scale.map((stop, index) => ({
    color: stop.color,
    value: stop.value,
    label:
      index === scale.length - 1
        ? `${stop.value}+`
        : `${stop.value} - ${scale[index + 1]?.value ?? ''}`,
  }));
};

