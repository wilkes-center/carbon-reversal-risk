# Controls Components

This directory contains UI control components that manage user interactions with the map and application.

## Components

- **FileUploadControl.js**: Handles file uploads for custom map layers
- **MapControls.js**: Primary map controls including zoom, rotation, and theme toggling
- **MapFileControls.js**: Controls for map-related file operations (download/upload)
- **MapViewToggle.js**: Toggles between US and global map views
- **SearchBar.js**: Location search functionality

## Usage

These components are primarily used within the main MapComponent to provide user controls for interacting with the map.

Example:

```jsx
import SearchBar from '../controls/SearchBar';
import MapControls from '../controls/MapControls';

// In your component
<div className="map-container">
  <SearchBar 
    searchQuery={searchQuery} 
    setSearchQuery={setSearchQuery} 
  />
  <MapControls 
    view={view}
    setView={setView}
    mapRef={mapRef}
    isDarkMode={isDarkMode}
  />
</div>
```

## Adding New Controls

When adding new control components:

1. Follow the established pattern of accepting props for state and callbacks
2. Use Lucide React icons for consistency with existing controls
3. Implement appropriate accessibility attributes
4. Include dark mode support via the `isDarkMode` prop
