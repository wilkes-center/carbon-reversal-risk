# Components Directory

This directory contains all React components used in the Carbon Map application, organized by function.

## Structure

- **controls/**: UI elements that control the map and application behavior
- **layers/**: Components related to map layers
- **legend/**: Components for the map legend
- **map/**: Core map components
- **panels/**: Panel components for the application UI
- **ui/**: General UI components

## Component Guidelines

- Each component should be self-contained with its own imports
- Prefer functional components with hooks
- Use consistent prop naming conventions
- Include appropriate PropTypes for component documentation

## Creating New Components

When creating a new component:

1. Place it in the appropriate subdirectory based on its function
2. Use PascalCase for component filenames (e.g., `MyComponent.js`)
3. Follow the existing patterns for imports and exports
4. Consider performance implications, especially for map components
