# Styles Directory

This directory contains CSS and style-related files for the application.

## Files

- **green-borders.css**: Custom styling for the application's green border elements

## Usage

Import these styles directly in components or in the main App.js:

```jsx
import './styles/green-borders.css';
```

## Style Guidelines

This application uses a combination of:

1. **Tailwind CSS**: For most component styling
2. **Custom CSS files**: For specific styles that are difficult to implement with Tailwind
3. **Inline styles**: For dynamic styles that depend on component state

### Tailwind Classes

Most styles in the application use Tailwind CSS classes like:
- `flex`, `items-center`, `justify-between` for layout
- `bg-white`, `text-gray-700` for colors
- `p-4`, `m-2` for spacing
- `rounded-lg`, `shadow-md` for common UI elements

### Custom CSS

Custom CSS files like `green-borders.css` are used for specific styling needs:
- Custom color schemes
- Complex selectors
- Overrides for third-party components
- Global styles

## Theme Support

The application supports both light and dark themes. When adding styles:

1. Use Tailwind's dark mode variants when possible
2. For custom CSS, use CSS variables or class-based theming
3. Pass the `isDarkMode` prop to components and adjust styling accordingly
