const MAPBOX_TOKEN_VALUE = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (!MAPBOX_TOKEN_VALUE) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_MAPBOX_TOKEN');
}

export const MAPBOX_TOKEN: string = MAPBOX_TOKEN_VALUE;
