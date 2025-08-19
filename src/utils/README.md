# Utils Directory

This directory contains utility functions and data used throughout the application.

## Structure

- **colors/**: Color-related utilities and management
- **map/**: Map-related utilities and data
- **format/**: Formatting and text utilities

## Usage

Utility functions can be imported and used in components:

```jsx
import { formatLayerName } from './utils/format/formatUtils';
import { generatePaintProperty } from './utils/colors/colorScales';
import { downloadLayerDataAsCSV } from './utils/map/downloadUtils';

// In your component
const layerName = formatLayerName(rawName);
const paint = generatePaintProperty(layerId, isDarkMode);
downloadLayerDataAsCSV(activeLayer, map, bounds);
```

## Utility Categories

### Color Utilities

The `colors/` directory includes:
- Color scale generation
- Theme-aware color mapping
- Legend state management

### Map Utilities

The `map/` directory includes:
- Layer definitions
- Basemap configurations
- Download utilities
- Map data processing functions

### Format Utilities

The `format/` directory includes:
- Text formatting helpers
- Data transformation utilities

## Best Practices

When creating or using utilities:

1. Keep functions focused on a single responsibility
2. Use descriptive function names
3. Include appropriate error handling
4. Document function parameters and return values
5. Consider performance for frequently called utilities
