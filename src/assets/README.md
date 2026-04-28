# Assets Directory

This directory contains static assets used throughout the application.

## Contents

- Image files (e.g., `usa.png` used in the map view toggle)
- Icons (if any)
- Other static media files

## Usage

Assets can be imported directly in components. In Next.js, image imports return a `StaticImageData` object `{ src, width, height, blurDataURL }`, so use `.src` with a plain `<img>` tag, or pass the whole object to `next/image`:

```jsx
import usaIcon from '../../assets/usa.png';

// Plain <img> tag:
<img src={usaIcon.src} alt="USA" />

// Or with next/image:
import Image from 'next/image';
<Image src={usaIcon} alt="USA" />
```

## Best Practices

- Keep image files optimized for the web
- Use SVG files when possible for better scalability
- Include appropriate alt text when using images in components
