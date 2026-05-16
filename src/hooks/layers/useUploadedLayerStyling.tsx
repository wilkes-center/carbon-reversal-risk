import { useCallback, useState } from 'react';
import { computeBreaks, getNumericValues } from '../../utils/colors/classify';
import type { ClassificationMethod } from '../../utils/colors/classify';
import { DEFAULT_RAMP_ID, getRamp } from '../../utils/colors/uploadedRamps';

const DEFAULT_OPACITY = 0.7;
const DEFAULT_CLASS_COUNT = 5;
const DEFAULT_FALLBACK_COLOR = '#94a3b8';

export interface UploadedLayerStyleConfig {
  opacity: number;
  attribute: string | null;
  method: ClassificationMethod;
  classCount: number;
  rampId: string;
  invert: boolean;
  fallbackColor: string;
}

const DEFAULT_CONFIG: UploadedLayerStyleConfig = {
  opacity: DEFAULT_OPACITY,
  attribute: null,
  method: 'equalInterval',
  classCount: DEFAULT_CLASS_COUNT,
  rampId: DEFAULT_RAMP_ID,
  invert: false,
  fallbackColor: DEFAULT_FALLBACK_COLOR,
};

export type GeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export interface BuiltPaint {
  type: 'fill' | 'line' | 'circle';
  paint: Record<string, unknown>;
  outlinePaint?: Record<string, unknown>;
  breaks: number[];
  colors: string[];
}

const buildColorExpression = (
  config: UploadedLayerStyleConfig,
  features: any[] | undefined,
): { expression: unknown; breaks: number[]; colors: string[] } => {
  if (!config.attribute || !features || features.length === 0) {
    const colors = getRamp(config.rampId, 1, config.invert);
    return {
      expression: colors[0] ?? config.fallbackColor,
      breaks: [],
      colors,
    };
  }

  const values = getNumericValues(features, config.attribute);
  if (values.length === 0) {
    return {
      expression: config.fallbackColor,
      breaks: [],
      colors: [config.fallbackColor],
    };
  }

  const n = Math.max(2, Math.min(9, config.classCount));
  const breaks = computeBreaks(values, config.method, n);
  const colors = getRamp(config.rampId, n, config.invert);

  if (breaks.length < 2 || breaks[0] === breaks[breaks.length - 1]) {
    return { expression: colors[0], breaks, colors };
  }

  const stepArgs: unknown[] = [colors[0]];
  for (let i = 1; i < n; i++) {
    stepArgs.push(breaks[i], colors[i]);
  }

  const stepExpr: unknown[] = [
    'step',
    ['to-number', ['get', config.attribute]],
    ...stepArgs,
  ];

  const expression: unknown[] = [
    'case',
    ['==', ['typeof', ['get', config.attribute]], 'number'],
    stepExpr,
    config.fallbackColor,
  ];

  return { expression, breaks, colors };
};

const useUploadedLayerStyling = () => {
  const [styles, setStyles] = useState<Record<string, UploadedLayerStyleConfig>>({});

  const getStyleConfig = useCallback(
    (layerId: string): UploadedLayerStyleConfig =>
      styles[layerId] ?? DEFAULT_CONFIG,
    [styles],
  );

  const setStyleConfig = useCallback(
    (layerId: string, patch: Partial<UploadedLayerStyleConfig>) => {
      setStyles((prev) => ({
        ...prev,
        [layerId]: { ...DEFAULT_CONFIG, ...prev[layerId], ...patch },
      }));
    },
    [],
  );

  const resetStyleConfig = useCallback((layerId: string) => {
    setStyles((prev) => {
      const next = { ...prev };
      delete next[layerId];
      return next;
    });
  }, []);

  const getLayerOpacity = useCallback(
    (layerId: string): number =>
      styles[layerId]?.opacity ?? DEFAULT_OPACITY,
    [styles],
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      setStyles((prev) => ({
        ...prev,
        [layerId]: { ...DEFAULT_CONFIG, ...prev[layerId], opacity },
      }));
    },
    [],
  );

  const buildPaint = useCallback(
    (
      layerId: string,
      geometryType: GeometryType,
      features: any[] | undefined,
    ): BuiltPaint => {
      const config = styles[layerId] ?? DEFAULT_CONFIG;
      const { expression, breaks, colors } = buildColorExpression(
        config,
        features,
      );
      const opacity = config.opacity;

      const isPoint = geometryType === 'Point' || geometryType === 'MultiPoint';
      const isLine =
        geometryType === 'LineString' || geometryType === 'MultiLineString';

      if (isPoint) {
        return {
          type: 'circle',
          paint: {
            'circle-color': expression,
            'circle-radius': 6,
            'circle-opacity': opacity,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': opacity,
          },
          breaks,
          colors,
        };
      }

      if (isLine) {
        return {
          type: 'line',
          paint: {
            'line-color': expression,
            'line-width': 2,
            'line-opacity': opacity,
          },
          breaks,
          colors,
        };
      }

      return {
        type: 'fill',
        paint: {
          'fill-color': expression,
          'fill-opacity': opacity,
          'fill-outline-color': 'rgba(0,0,0,0)',
        },
        outlinePaint: {
          'line-color': '#1f2937',
          'line-opacity': Math.min(1, opacity + 0.2),
          'line-width': 0.5,
        },
        breaks,
        colors,
      };
    },
    [styles],
  );

  return {
    getStyleConfig,
    setStyleConfig,
    resetStyleConfig,
    getLayerOpacity,
    setLayerOpacity,
    buildPaint,
  };
};

export default useUploadedLayerStyling;
