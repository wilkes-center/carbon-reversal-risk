# Map Components

This directory contains core map-related components that form the foundation of the visualization system.

## Components

- **DrawControl.js**: Provides drawing functionality for selecting areas on the map
- **MapComponent.js**: The main map component that integrates all map-related functionality
- **MiniMap.js**: A small overview map for context
- **CoordinateAxes.js**: Displays coordinate grid markers on the map

## Usage

The MapComponent is the primary entry point for the map functionality:

```jsx
import MapComponent from './components/map/MapComponent';

// In your App component
<MapPaintProvider map={mapRef.current}>
  <MapComponent 
    mapRef={mapRef}
    onPerformanceCheck={getPerformanceMetrics}
  />
</MapPaintProvider>
```

## Key Features

These components provide several key features:

- Interactive map rendering with Mapbox GL JS
- Layer management and visualization
- Drawing tools for area selection
- Coordinate visualization
- Context overview (mini-map)

## Map Component Architecture

The MapComponent orchestrates multiple sub-components and manages:

- Map state and viewport
- Active layer selection
- UI controls integration
- Data visualization
- User interactions (click, draw, etc.)
- Map style switching

## Performance Considerations

Map components can be performance-intensive. Consider:

- Using useMemo/useCallback for computationally expensive operations
- Implementing proper cleanup in useEffect hooks
- Limiting the number of rendered features
- Using appropriate Mapbox GL optimizations
