# Format Utilities

This directory contains utilities for formatting and transforming text and data.

## Files

- **formatUtils.js**: General formatting utilities

## Usage

```jsx
import { formatLayerName } from './utils/format/formatUtils';

// Format a layer name for display
const displayName = formatLayerName('DroughtRiskSSP245');
// Returns "Drought Risk SSP 245"
```

## formatUtils.js

This utility provides:

- **formatLayerName**: Transforms layer IDs into human-readable names
  - Splits camelCase into separate words
  - Capitalizes first letter of each word
  - Applies special formatting for acronyms (e.g., "SSP" instead of "Ssp")

## Formatting Guidelines

When adding new formatting utilities:

1. Make functions pure (same input always gives same output)
2. Include appropriate error handling
3. Follow consistent naming conventions
4. Document the transformation logic
5. Consider internationalization requirements

## Adding New Formatters

To add a new formatter:

1. Add the function to formatUtils.js
2. Export it properly
3. Include JSDoc comments explaining its purpose and parameters
4. Add unit tests if applicable
