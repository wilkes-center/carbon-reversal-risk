export interface ColorRamp {
  id: string;
  name: string;
  stops: string[];
}

const BUFFER_LIGHT = [
  '#FFFFFF', '#FEF6D1', '#FEE6A3', '#FECF66', '#FEB23E',
  '#FD8D3C', '#F85E36', '#E93226', '#D31021', '#A50F1B',
];

const RISK_LIGHT = [
  '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
  '#cc4c02', '#993404', '#662506', '#331303',
];

const GLOBALBP_LIGHT = [
  '#ffffd4', '#fee391', '#fec44f', '#fe9929', '#ec7014',
  '#cc4c02', '#993404', '#662506', '#331303', '#000000',
];

const VIRIDIS = [
  '#440154', '#482878', '#3e4989', '#31688e', '#26828e',
  '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725',
];

const PLASMA = [
  '#0d0887', '#41049d', '#6a00a8', '#8f0da4', '#b12a90',
  '#cb4679', '#e16462', '#f1844b', '#fca636', '#fcce25',
];

const REDS = [
  '#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
  '#ef3b2c', '#cb181d', '#a50f15', '#67000d',
];

const BLUES = [
  '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
  '#4292c6', '#2171b5', '#08519c', '#08306b',
];

const GREENS = [
  '#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476',
  '#41ab5d', '#238b45', '#006d2c', '#00441b',
];

const SPECTRAL = [
  '#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b',
  '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2',
];

const RDYLBU = [
  '#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090',
  '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695',
];

const GREYS = [
  '#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696',
  '#737373', '#525252', '#252525', '#000000',
];

export const RAMPS: ColorRamp[] = [
  { id: 'viridis', name: 'Viridis', stops: VIRIDIS },
  { id: 'plasma', name: 'Plasma', stops: PLASMA },
  { id: 'reds', name: 'Reds', stops: REDS },
  { id: 'blues', name: 'Blues', stops: BLUES },
  { id: 'greens', name: 'Greens', stops: GREENS },
  { id: 'spectral', name: 'Spectral', stops: SPECTRAL },
  { id: 'rdylbu', name: 'Red-Yellow-Blue', stops: RDYLBU },
  { id: 'greys', name: 'Greys', stops: GREYS },
  { id: 'buffer', name: 'Buffer (project)', stops: BUFFER_LIGHT },
  { id: 'risk', name: 'Risk (project)', stops: RISK_LIGHT },
  { id: 'globalbp', name: 'Global BP (project)', stops: GLOBALBP_LIGHT },
];

export const DEFAULT_RAMP_ID = 'viridis';

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
};

const sampleRamp = (stops: string[], n: number): string[] => {
  if (n <= 0) return [];
  if (n === 1) return [stops[Math.floor(stops.length / 2)]];
  if (stops.length === n) return [...stops];

  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (stops.length - 1);
    const lo = Math.floor(t);
    const hi = Math.ceil(t);
    if (lo === hi) {
      out.push(stops[lo]);
      continue;
    }
    const frac = t - lo;
    const [r1, g1, b1] = hexToRgb(stops[lo]);
    const [r2, g2, b2] = hexToRgb(stops[hi]);
    out.push(
      rgbToHex(
        r1 + (r2 - r1) * frac,
        g1 + (g2 - g1) * frac,
        b1 + (b2 - b1) * frac,
      ),
    );
  }
  return out;
};

export const getRampById = (rampId: string): ColorRamp =>
  RAMPS.find((r) => r.id === rampId) ?? RAMPS[0];

export const getRamp = (
  rampId: string,
  classCount: number,
  invert: boolean = false,
): string[] => {
  const ramp = getRampById(rampId);
  const sampled = sampleRamp(ramp.stops, classCount);
  return invert ? [...sampled].reverse() : sampled;
};
