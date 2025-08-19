# Hooks Directory

This directory contains custom React hooks used throughout the application.

## Structure

- **map/**: Hooks related to map functionality
- **layers/**: Hooks specific to layer management and styling

## Usage

Custom hooks encapsulate reusable stateful logic:

```jsx
import { useViewport } from './hooks/map/mapHooks';
import useLayerStyleManager from './hooks/layers/useLayerStyleManager';

// In your component
const [viewport, handleViewportChange] = useViewport(initialViewport);
const { updateLayerStyle } = useLayerStyleManager(map, activeLayer, isDarkMode);
```

## Hook Guidelines

When creating or using hooks:

1. Use the `use` prefix for all hook names
2. Make hooks focused on a specific concern
3. Handle cleanup in useEffect to prevent memory leaks
4. Use proper dependency arrays in useEffect/useCallback/useMemo
5. Document the purpose and usage of each hook
6. Implement error handling for robust behavior

## Benefits of Custom Hooks

Custom hooks in this application:

- Abstract complex map interaction logic
- Provide consistent behavior across components
- Centralize style and state management
- Improve code reusability
- Separate concerns for better maintainability
