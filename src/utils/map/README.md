# Map Utilities

This directory contains utilities related to map functionality, data, and configuration.

## Files

- **basemaps.js**: Configuration for map styles/basemaps
- **downloadUtils.js**: Functions for downloading map data
- **layers.js**: Layer definitions and configuration

## Usage

```jsx
import { basemaps } from './utils/map/basemaps';
import { layers } from './utils/map/layers';
import { downloadLayerDataAsCSV, getCurrentMapBounds } from './utils/map/downloadUtils';

// Select a basemap
const mapStyle = basemaps.find(b => b.id === 'dark').style;

// Find layer configuration
const layerConfig = layers.find(l => l.id === activeLayerId);

// Download data
downloadLayerDataAsCSV(layerId, map, bounds);
```

## basemaps.js

Contains an array of available basemaps, each with:
- **id**: Unique identifier
- **name**: Display name
- **style**: URL or style object for Mapbox GL

## downloadUtils.js

Provides utilities for data download:
- **downloadLayerDataAsCSV**: Extracts and downloads layer data as CSV
- **getCurrentMapBounds**: Gets the current visible map bounds
- **layerExists**: Checks if a layer exists in the map
- **getBoundsFromFeatures**: Calculates bounds from GeoJSON features

## layers.js

Contains layer definitions and helper functions:
- **layers**: Array of layer configurations
- **createLayer**: Creates layer objects with proper styling
- **handleCompositeLayers**: Manages composite layer setup
- **Additional configuration**: URLs and patterns for composite layers

Each layer configuration includes:
- **id**: Unique identifier
- **source**: Map source configuration
- **layer**: Layer styling and rendering configuration
