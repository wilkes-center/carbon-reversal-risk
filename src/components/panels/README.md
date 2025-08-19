# Panel Components

This directory contains panel components that provide UI containers and controls for the application.

## Components

- **LayerControl.js**: Panel for selecting and controlling map layers
- **SlidingPanel.js**: A collapsible side panel component

## Usage

Panel components are used to organize the application UI:

```jsx
import SlidingPanel from '../panels/SlidingPanel';
import LayerControl from '../panels/LayerControl';

// In your component
<SlidingPanel isDarkMode={isDarkMode}>
  <LayerControl
    activeLayer={activeLayer}
    toggleLayer={toggleLayer}
    isDarkMode={isDarkMode}
    // ... other props
  />
</SlidingPanel>
```

## Key Features

- **SlidingPanel**: Provides a collapsible UI container that can be toggled open/closed
- **LayerControl**: Offers a comprehensive interface for:
  - Selecting data layers
  - Toggling layer visibility
  - Controlling layer opacity
  - Managing uploaded custom layers
  - Downloading data

## Panel Design Principles

The panel components follow these design principles:

1. Responsive layout that adapts to different screen sizes
2. Support for both light and dark modes
3. Collapsible sections to manage UI complexity
4. Clear organization of controls by function
5. Consistent styling across the application
