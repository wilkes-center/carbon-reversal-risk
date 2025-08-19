# Color Utilities

This directory contains utilities for managing colors and color scales in the application.

## Files

- **colorScales.js**: Functions for generating color scales and paint properties
- **LegendStateManager.js**: Manager for storing and retrieving custom legend color configurations

## Usage

```jsx
import { generatePaintProperty, getLegendConfig } from './utils/colors/colorScales';
import legendStateManager from './utils/colors/LegendStateManager';

// Generate paint properties for a layer
const paint = generatePaintProperty('LayerId', isDarkMode);

// Get legend configuration
const legendConfig = getLegendConfig('LayerId', isDarkMode);

// Save custom legend configuration
legendStateManager.updateLegendState('LayerId', customRanges);
```

## colorScales.js

This utility provides:

- **generatePaintProperty**: Creates Mapbox GL paint properties based on layer type and theme
- **getLegendConfig**: Retrieves color scale configuration for legend visualization
- **createColorScales**: Creates color scales for different layer types
- **Layer type helpers**: Functions to identify layer types (buffer, risk, etc.)

The color scales support different data types:
- Buffer pool layers
- Risk layers
- Global buffer pool layers

Each scale has light and dark mode variants.

## LegendStateManager

A singleton class that manages legend state:

- **getLegendState**: Retrieves saved legend configuration
- **updateLegendState**: Saves custom legend configuration
- **resetLegendState**: Resets to default legend configuration
- **clearAll**: Clears all saved configurations

This allows users to customize color scales and have those customizations persist during their session.
