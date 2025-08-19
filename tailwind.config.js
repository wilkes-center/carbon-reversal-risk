/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colors from the style guide
        'obsidian': '#1a1a1a', // Olympic Park Obsidian
        'tan': '#cea25d',      // Canyonlands Tan
        'sage': '#99aa88',     // Spiral Jetty Sage
        'green': '#2d5354',    // Great Salt Lake Green
        'white': '#f9f6ef',    // Snowbird White
        'mahogany': '#751d0c', // Moab Mahogany
        'blue': '#789ba8',     // Bonneville Salt Flats Blue
        'rust': '#dd3b00',     // Rocky Mountain Rust
        
        // Legacy colors - keeping for backward compatibility
        'primary': '#1a1a1a', // Updated to match Obsidian
        'primary-hover': '#000000',
        
        // Action colors
        'action': {
          'blue': '#789ba8',  // Updated to match Bonneville Salt Flats Blue
          'blue-hover': '#5d7d8a',
        },
        
        // Status colors
        'status': {
          'success': '#99aa88', // Updated to Sage
          'error': '#dd3b00',   // Updated to Rust
          'warning': '#cea25d', // Updated to Tan
          'info': '#789ba8',    // Updated to Blue
        },
      },
      fontFamily: {
        'sans': ['Red Hat Display', 'sans-serif'],
        'sora': ['Sora', 'sans-serif'],
        'display': ['Sora', 'sans-serif'],
      },
      fontSize: {
        'section-header': ['20pt', '1.2'],
        'display': ['36pt', '1.2'],
        'body': ['9pt', '1.5'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      spacing: {
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
      },
    },
  },
  plugins: [],
}