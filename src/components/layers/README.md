# Layer Components

This directory contains components related to map layers and their visualization.

## Components

- **CongressionalDistrictsLayer.js**: Renders the congressional districts overlay on the map

## Usage

Layer components are used within the MapComponent to render specific data layers:

```jsx
import CongressionalDistrictsLayer from '../layers/CongressionalDistrictsLayer';

// In your component
<Map>
  <CongressionalDistrictsLayer 
    isDarkMode={isDarkMode}
    visible={isCongressionalDistrictsVisible}
    selectedFeatureId={selectedDistrict}
  />
</Map>
```

## Adding New Layer Components

When creating new layer components:

1. Each layer component should encapsulate the specific rendering logic for that layer
2. Handle visibility toggling via props
3. Support both light and dark modes
4. Consider performance implications for complex layers
5. Use appropriate Mapbox GL JS or react-map-gl APIs

## Layer Management

Layers typically include:

- Vector or raster source definitions
- Layer style specifications
- Interactive features (hover/click handling)
- Visibility controls
