import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

const SlidingPanel = ({ children, isDarkMode, onCollapsedChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const PANEL_WIDTH = 300; // Width of the panel in pixels
  const EDGE_WIDTH = 1; // Width of the green edge

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  // Update main content margin when panel state changes
  useEffect(() => {
    const mainContent = document.getElementById('map-content');
    if (mainContent) {
      mainContent.style.marginLeft = collapsed ? '0px' : `${PANEL_WIDTH}px`;
      mainContent.style.width = collapsed ? '100%' : `calc(100% - ${PANEL_WIDTH}px)`;
      
      // Trigger a resize event after transition
      const timeoutId = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300); // Match transition duration

      return () => clearTimeout(timeoutId);
    }
  }, [collapsed]);

  return (
    <>
      {/* Panel Container */}
      <div 
        className={`fixed top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${
          collapsed ? '-translate-x-[300px]' : 'translate-x-0'
        }`}
        style={{ 
          width: `${PANEL_WIDTH + EDGE_WIDTH}px`
        }}
      >
        {/* Main Panel Content */}
        <div 
          className={`w-[300px] h-full overflow-y-auto ${
            isDarkMode ? 'bg-gray-900 dark-scrollbar' : 'bg-gray-50 light-scrollbar'
          }`}
        >
          {children}
        </div>

        {/* Green Edge */}
        <div 
          className="absolute top-0 right-0 h-full" 
          style={{ 
            width: `${EDGE_WIDTH}px`, 
            backgroundColor: '#06402B', // Green color
          }}
        />

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={`absolute -right-10 top-4 p-2 rounded-r transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-gray-200' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          style={{ right: -30}} // Adjust position to account for edge
        >
          <ChevronLeft 
            size={24} 
            className={`transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>
    </>
  );
};

export default SlidingPanel;