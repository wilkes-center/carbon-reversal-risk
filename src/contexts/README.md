# Contexts Directory

This directory contains React Context providers used for state management throughout the application.

## Context Providers

- **MapPaintContext.js**: Manages map layer paint properties and opacity

## Usage

Context providers are used to manage state that needs to be accessible across multiple components:

```jsx
import { MapPaintProvider, useMapPaint } from './contexts/MapPaintContext';

// Providing context
<MapPaintProvider map={mapRef.current}>
  <MapComponent />
</MapPaintProvider>

// Consuming context in a component
const MyComponent = () => {
  const { updateOpacity, getLayerOpacity } = useMapPaint();
  
  // Use context methods
  return (
    <div>
      <input 
        type="range" 
        value={getLayerOpacity('layerId')} 
        onChange={(e) => updateOpacity('layerId', e.target.value)}
      />
    </div>
  );
};
```

## Context Design Principles

When creating or using contexts:

1. **Minimize Context Usage**: Only use context for state that truly needs to be shared across multiple components
2. **Optimize Performance**: Implement memoization to prevent unnecessary re-renders
3. **Keep API Simple**: Design context APIs to be intuitive and focused
4. **Provide Helper Hooks**: Create custom hooks for consuming context to abstract away the context API

## MapPaintContext

The MapPaintContext provides:

- **updateOpacity**: Update a layer's opacity
- **getLayerOpacity**: Get the current opacity of a layer
- **resetLayer**: Reset a layer's paint properties to default
- **clearAll**: Clear all customizations

This context helps manage layer styling efficiently without passing props through multiple component levels.
