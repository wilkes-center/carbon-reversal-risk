# UI Components

This directory contains general UI components used throughout the application.

## Components

- **AreaStats.js**: Displays statistics for selected map areas
- **CongressionalDistrictPopup.js**: Popup for congressional district information
- **DarkPopup.js**: Styled popup component for dark mode
- **GuidedTour.js**: Interactive tour of application features
- **InfoTooltip.js**: Information tooltip component
- **MapDescription.js**: Descriptive text for map layers
- **UploadNotification.js**: Notification system for file uploads
- **VisitorCounter.js**: Displays visitor count

## Usage

These components provide reusable UI elements across the application:

```jsx
import InfoTooltip from '../ui/InfoTooltip';
import UploadNotification from '../ui/UploadNotification';

// In your component
<div>
  <h3>Layer Title <InfoTooltip title="Layer Title" isDarkMode={isDarkMode} /></h3>
  <UploadNotification 
    uploadStatus={uploadStatus}
    isDarkMode={isDarkMode}
  />
</div>
```

## UI Component Guidelines

When using or creating UI components:

1. Support both light and dark modes via the `isDarkMode` prop
2. Use Tailwind CSS classes for styling
3. Ensure proper accessibility attributes
4. Keep components focused on a single responsibility
5. Use Lucide React icons for consistency

## Popup Components

The popup components (DarkPopup, CongressionalDistrictPopup) are designed to work with react-map-gl's Popup component:

```jsx
import { Popup } from 'react-map-gl';
import DarkPopup from '../ui/DarkPopup';

// In your component
{popupInfo && (
  <Popup
    longitude={popupInfo.lngLat.lng}
    latitude={popupInfo.lngLat.lat}
    closeButton={true}
    closeOnClick={false}
    onClose={() => setPopupInfo(null)}
    className={isDarkMode ? 'dark-popup' : ''}
  >
    <DarkPopup info={popupInfo} isDarkMode={isDarkMode} />
  </Popup>
)}
```
