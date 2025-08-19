# Legend Components

This directory contains components related to the map legend visualization and controls.

## Components

- **CollapsibleLegend.js**: Displays a collapsible legend for the active map layer with customization controls

## Usage

Legend components provide visual context for the data displayed on the map:

```jsx
import CollapsibleLegend from '../legend/CollapsibleLegend';

// In your component
<CollapsibleLegend 
  layer={layers.find(l => l.id === activeLayer)}
  onRangeChange={handleLegendRangeChange}
  isDarkMode={isDarkMode}
/>
```

## Features

The legend components offer several key features:

- Collapsible UI to save screen space
- Color range visualization for data layers
- Customization of color scales
- Value range display
- Support for both light and dark modes

## Legend State Management

Legend state (including custom color configurations) is managed through the LegendStateManager utility, which allows for:

- Saving custom color scales
- Resetting to default colors
- Persisting legend configurations across layer switches
