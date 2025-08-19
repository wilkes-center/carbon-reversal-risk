# Map Hooks

This directory contains custom React hooks specifically related to map functionality.

## Hooks

- **mapHooks.js**: Collection of hooks including `useViewport`, `useMapLayers`, and `useStyle`
- **useMapPerformance.js**: Hook for monitoring map rendering performance

## Usage

```jsx
import { useViewport } from './hooks/map/mapHooks';
import useMapPerformance from './hooks/map/useMapPerformance';

// In your component
const [viewport, handleViewportChange] = useViewport(initialViewport);
const { getPerformanceMetrics } = useMapPerformance(mapRef.current);
```

## Hook Descriptions

### mapHooks.js

Contains several hooks:

- **useViewport**: Manages the map viewport state (latitude, longitude, zoom, etc.)
- **useMapLayers**: Manages the lifecycle of map layers
- **useStyle**: Provides theme-aware styling utilities

### useMapPerformance.js

Monitors map rendering performance metrics:

- Frame times
- Frames per second (FPS)
- Paint counts
- Last update timestamp

This hook is useful for diagnosing performance issues during development.

## Implementation Details

These hooks integrate with Mapbox GL JS and react-map-gl to provide efficient map interactions. They handle:

- Viewport state management
- Layer creation and updates
- Style changes
- Performance monitoring

When using these hooks, consider the map's current state and loading status to prevent errors.
