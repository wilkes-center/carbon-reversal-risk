# Layer Hooks

This directory contains custom React hooks specifically related to layer management and styling.

## Hooks

- **useLayerStyleManager.js**: Manages map layer styles with optimized updates
- **useUploadedLayerStyling.js**: Manages styling for user-uploaded layers
- **useEnhancedMapLayer.js**: Handles enhanced layer functionality with optimized rendering

## Usage

```jsx
import useLayerStyleManager from './hooks/layers/useLayerStyleManager';
import useUploadedLayerStyling from './hooks/layers/useUploadedLayerStyling';

// In your component
const { updateLayerStyle } = useLayerStyleManager(map, activeLayer, isDarkMode);
const { updateOpacity, getLayerOpacity } = useUploadedLayerStyling();
```

## Hook Descriptions

### useLayerStyleManager.js

Manages map layer styles with efficient updates:

- Batches style changes to reduce re-renders
- Handles composite layer updates
- Supports theme-aware styling
- Integrates with LegendStateManager for custom colors

### useUploadedLayerStyling.js

Manages the styling of user-uploaded GeoJSON layers:

- Provides appropriate styles based on geometry type
- Manages opacity settings
- Returns consistent styling objects for different layer types

### useEnhancedMapLayer.js

Handles enhanced map layer functionality:

- Manages layer lifecycle (creation, updates, cleanup)
- Optimizes rendering performance
- Handles composite layer parts
- Supports theme switching

## Implementation Details

These hooks provide optimized ways to interact with Mapbox GL layers, focusing on:

- Performance optimization
- Consistent styling
- Proper cleanup
- Simplified API for complex layer operations
