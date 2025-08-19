# Assets Directory

This directory contains static assets used throughout the application.

## Contents

- Image files (e.g., `usa.png` used in the map view toggle)
- Icons (if any)
- Other static media files

## Usage

Assets can be imported directly in components:

```jsx
import usaIcon from '../../assets/usa.png';

// Using in a component
<img src={usaIcon} alt="USA" />
```

## Best Practices

- Keep image files optimized for the web
- Use SVG files when possible for better scalability
- Include appropriate alt text when using images in components
