import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { logger } from '../../utils/logger';

// Red color palette
const RED_COLORS = {
  primary: '#E63946', // Primary red
  light: '#F94759',   // Lighter red
  dark: '#C81D2A',    // Darker red
  accent: '#FF6B6B',  // Accent red
};

// Tour configuration with improved selectors and positions
const TOUR_STEPS = [
  {
    target: 'body', // Start with body as a safe fallback
    title: 'Welcome to Carbon Mapping',
    content: 'This application helps you visualize and analyze carbon data across different regions. Let\'s take a quick tour of the main features.',
    position: 'center'
  },
  {
    // Better selector for left panel
    target: '.SlidingPanel, .w-\\[300px\\]', 
    title: 'Layer Selection',
    content: 'Here you can choose from different data layers to visualize on the map. Try clicking on the different categories to explore available layers.',
    position: 'right'
  },
  {
    // Selector for map view toggle buttons
    target: '.absolute.top-12.right-4 button:first-child',
    title: 'Map View Selector',
    content: 'Toggle between US and Global views to focus on different geographical regions using these toggle buttons.',
    position: 'left'
  },
  {
    // Selector for basemap toggle
    target: '.absolute.top-12.right-4 > div:nth-child(2)',
    title: 'Basemap Options',
    content: 'Change the map background style to suit your preferences or analysis needs using these layer controls.',
    position: 'left'
  },
  {
    // Target for dark mode toggle (more specific)
    target: '.absolute.top-12.right-4 > div:last-child button',
    title: 'Dark Mode Toggle',
    content: 'Switch between light and dark themes with this toggle button.',
    position: 'left'
  },
  {
    // More specific target for download controls
    target: '.absolute.bottom-6.left-1\\/2 button:first-child',
    title: 'Data Download',
    content: 'Download data from the current view or draw a custom area to download specific regions using these controls.',
    position: 'top'
  },
  {
    // Fixed target for upload section
    target: '.space-y-2:has(input[accept*=".json,.geojson,.kml,.kmz,.zip"]), [aria-labelledby="upload-heading"]',
    title: 'Upload Custom Data',
    content: 'Upload your own GeoJSON, KML, or Shapefile data to overlay on the map using the file upload section in the left panel.',
    position: 'right'
  },
  {
    // Better selector for search bar
    target: '.flex-none.p-3.border-b input[placeholder*="Search"]',
    title: 'Location Search',
    content: 'Search for specific locations to quickly navigate the map using the search bar at the top of the left panel.',
    position: 'bottom'
  },
  {
    target: 'body',
    title: 'Ready to Explore!',
    content: 'You\'re all set to explore carbon data. Click on different layers, zoom in on areas of interest, and analyze the data. You can restart this tour anytime using the help button.',
    position: 'center'
  }
];

// Storage key for tour completion status
const TOUR_STORAGE_KEY = 'carbon-map-tour-completed';

// Inject CSS animations into document head
const injectCSS = () => {
  if (document.getElementById('guided-tour-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'guided-tour-styles';
  styleElement.textContent = `
    @keyframes pulse {
      0% { 
        box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.9),
                   0 0 0 8px rgba(230, 57, 70, 0.4);
      }
      50% { 
        box-shadow: 0 0 0 8px rgba(230, 57, 70, 0.6),
                   0 0 0 16px rgba(230, 57, 70, 0.2);
      }
      100% { 
        box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.9),
                   0 0 0 8px rgba(230, 57, 70, 0.4);
      }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes floating {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(5px, 0); }
    }
    @keyframes glow {
      0% { filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.7)); }
      50% { filter: drop-shadow(0 0 15px rgba(230, 57, 70, 0.9)); }
      100% { filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.7)); }
    }
    .tour-help-button {
      animation: bounce 2s infinite;
    }
    .tour-arrow {
      animation: floating 1s ease-in-out infinite;
      filter: drop-shadow(0 0 3px rgba(0,0,0,0.3));
    }
    .tour-highlight-overlay {
      box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.9), 
                 0 0 0 8px rgba(230, 57, 70, 0.4);
      outline: 2px solid rgba(230, 57, 70, 0.9);
      border-radius: 4px;
      animation: pulse 1.5s infinite;
      z-index: 9999;
      pointer-events: none;
    }
    .tour-highlight-inner {
      position: absolute;
      inset: 0;
      border: 2px solid #FFF5E6;
      border-radius: 2px;
      animation: glow 1.5s infinite;
    }
    .tour-tooltip {
      font-family: 'Arial', sans-serif;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    .tour-tooltip-content {
      font-size: 1rem !important;
      line-height: 1.6 !important;
    }
    .tour-tooltip-title {
      font-size: 1.3rem !important;
      font-weight: 600 !important;
    }
    .tour-button {
      font-weight: 600 !important;
      font-size: 1rem !important;
      padding: 0.75rem 1.25rem !important;
      border-radius: 0.5rem !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    .tour-button:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
    }
    .tour-close-button {
      font-size: 1.25rem !important;
      padding: 0.5rem !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
    }
    .tour-close-button:hover {
      transform: rotate(90deg) !important;
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
    .tour-progress {
      font-weight: 600 !important;
      font-size: 0.875rem !important;
    }
  `;
  document.head.appendChild(styleElement);
};

// Improved element finder with multiple selector fallbacks
const getTargetElement = (targetSelector) => {
  try {
    // Handle comma-separated multiple selectors
    if (targetSelector.includes(',')) {
      const selectors = targetSelector.split(',').map(s => s.trim());
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
    }

    // Try as an ID first
    let element = document.getElementById(targetSelector);
    if (element) return element;
    
    // Try as a CSS selector
    element = document.querySelector(targetSelector);
    if (element) return element;
    
    // Try with :contains pseudo selector for text matching (custom implementation)
    if (targetSelector.includes(':contains')) {
      // Extract the text to search for
      const match = targetSelector.match(/:contains\("([^"]+)"\)/);
      if (match && match[1]) {
        const searchText = match[1];
        const baseSelector = targetSelector.split(':contains')[0];
        const elements = document.querySelectorAll(baseSelector);
        
        // Find the first element containing the text
        for (const el of elements) {
          if (el.textContent.includes(searchText)) {
            return el;
          }
        }
      }
    }
    
    // Fallback: return body if nothing else works
    logger.warn(`Could not find element with selector: ${targetSelector}, falling back to body`);
    return document.querySelector('body');
  } catch (error) {
    logger.error('Error finding target element:', error);
    return document.querySelector('body');
  }
};

const GuidedTour = ({ isDarkMode }) => {
  // State for tour management
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, transform: 'none' });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0, direction: 'down', visible: false });
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const highlightOverlayRef = useRef(null);
  const highlightInnerRef = useRef(null);
  const tooltipWidth = 360; // Width of the tooltip in pixels
  const tooltipHeight = 250; // Approximate height of the tooltip in pixels

  // Check if this is the user's first visit
  useEffect(() => {
    // Inject CSS animations
    injectCSS();

    // Check tour completion status
    try {
      const tourData = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!tourData) {
        setIsFirstVisit(true);
        // Small delay to ensure the DOM is fully loaded
        setTimeout(() => {
          setIsVisible(true);
        }, 1500);
      } else {
        setIsFirstVisit(false);
      }
    } catch (error) {
      logger.error('Error checking tour status:', error);
    }
  }, []);

  // Clean up highlight overlay when component unmounts
  useEffect(() => {
    return () => {
      if (highlightOverlayRef.current) {
        document.body.removeChild(highlightOverlayRef.current);
        highlightOverlayRef.current = null;
      }
      if (highlightInnerRef.current) {
        document.body.removeChild(highlightInnerRef.current);
        highlightInnerRef.current = null;
      }
    };
  }, []);

  // Position the tooltip and arrow based on target element, ensuring it stays in viewport
  const positionTooltip = useCallback((stepIndex) => {
    const step = TOUR_STEPS[stepIndex];
    
    if (!step) return;
    
    // Clean up any existing overlay
    if (highlightOverlayRef.current) {
      document.body.removeChild(highlightOverlayRef.current);
      highlightOverlayRef.current = null;
    }
    if (highlightInnerRef.current) {
      document.body.removeChild(highlightInnerRef.current);
      highlightInnerRef.current = null;
    }
    
    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (step.position === 'center') {
      setTooltipPosition({
        top: Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, viewportHeight / 2 - tooltipHeight / 2)),
        left: Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, viewportWidth / 2 - tooltipWidth / 2)),
        transform: 'none'
      });
      setArrowPosition({ visible: false });
      return;
    }
    
    const targetElement = getTargetElement(step.target);
    if (!targetElement) {
      logger.warn(`Target element "${step.target}" not found for tour step ${stepIndex}`);
      setArrowPosition({ visible: false });
      return;
    }
    
    // Create highlight overlay for non-center positions
    const rect = targetElement.getBoundingClientRect();
    
    // Add padding to highlight small elements
    const minSize = 30; // Minimum size in pixels
    let width = rect.width;
    let height = rect.height;
    let left = rect.left;
    let top = rect.top;
    
    // Add padding for small elements
    if (width < minSize || height < minSize) {
      const paddingNeeded = Math.max(0, minSize - Math.min(width, height));
      width += paddingNeeded;
      height += paddingNeeded;
      left -= paddingNeeded / 2;
      top -= paddingNeeded / 2;
    }
    
    // Main highlight overlay
    const overlay = document.createElement('div');
    overlay.className = 'tour-highlight-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = `${left - 4}px`;  // Account for the shadow width
    overlay.style.top = `${top - 4}px`;    // Account for the shadow width
    overlay.style.width = `${width + 8}px`; // Add 8px for the shadow (4px on each side)
    overlay.style.height = `${height + 8}px`; // Add 8px for the shadow (4px on each side)
    document.body.appendChild(overlay);
    highlightOverlayRef.current = overlay;
    
    // Inner highlight element for additional glow effect
    const innerHighlight = document.createElement('div');
    innerHighlight.className = 'tour-highlight-inner';
    innerHighlight.style.position = 'fixed';
    innerHighlight.style.left = `${left}px`;
    innerHighlight.style.top = `${top}px`;
    innerHighlight.style.width = `${width}px`;
    innerHighlight.style.height = `${height}px`;
    document.body.appendChild(innerHighlight);
    highlightInnerRef.current = innerHighlight;
    
    // Calculate initial position based on desired placement
    let position = {};
    let arrow = { visible: true, direction: 'left', size: 14 }; // Larger arrow
    const padding = 20; // Padding from target element
    const arrowOffset = 16; // Distance of arrow from element
    
    // Initial position calculation
    switch(step.position) {
      case 'right':
        position = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + padding,
          transform: 'none'
        };
        arrow = {
          visible: true,
          direction: 'left',
          top: rect.top + rect.height / 2,
          left: rect.right + arrowOffset,
          size: 14
        };
        break;
      case 'left':
        position = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - padding,
          transform: 'none'
        };
        arrow = {
          visible: true,
          direction: 'right',
          top: rect.top + rect.height / 2,
          left: rect.left - arrowOffset,
          size: 14
        };
        break;
      case 'top':
        position = {
          top: rect.top - tooltipHeight - padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
        arrow = {
          visible: true,
          direction: 'bottom',
          top: rect.top - arrowOffset,
          left: rect.left + rect.width / 2,
          size: 14
        };
        break;
      case 'bottom':
        position = {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
        arrow = {
          visible: true,
          direction: 'top',
          top: rect.bottom + arrowOffset,
          left: rect.left + rect.width / 2,
          size: 14
        };
        break;
      default:
        position = {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          transform: 'none'
        };
        arrow = {
          visible: true,
          direction: 'top',
          top: rect.bottom + arrowOffset,
          left: rect.left + rect.width / 2,
          size: 14
        };
    }
    
    // Fixed positions ensure tooltip stays in viewport
    let fixedTop = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, position.top));
    let fixedLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, position.left));
    
    // If we had to adjust the position significantly, determine if we need to change arrow direction
    const significantHorizontalShift = Math.abs(fixedLeft - position.left) > tooltipWidth / 4;
    const significantVerticalShift = Math.abs(fixedTop - position.top) > tooltipHeight / 4;
    
    // If the position has shifted significantly, we may need to move the arrow or hide it
    if (significantHorizontalShift || significantVerticalShift) {
      // Determine optimal position for tooltip
      if (step.position === 'left' && significantHorizontalShift) {
        // If pushing left tooltip to the right edge, try top or bottom instead
        if (rect.top > tooltipHeight + padding) {
          // Try positioning above
          fixedTop = rect.top - tooltipHeight - padding;
          fixedLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, 
            rect.left + rect.width / 2 - tooltipWidth / 2));
          arrow = {
            visible: true,
            direction: 'bottom',
            top: rect.top - arrowOffset,
            left: rect.left + rect.width / 2,
            size: 14
          };
        } else if (viewportHeight - rect.bottom > tooltipHeight + padding) {
          // Try positioning below
          fixedTop = rect.bottom + padding;
          fixedLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, 
            rect.left + rect.width / 2 - tooltipWidth / 2));
          arrow = {
            visible: true,
            direction: 'top',
            top: rect.bottom + arrowOffset,
            left: rect.left + rect.width / 2,
            size: 14
          };
        } else {
          // If no good position, hide arrow
          arrow.visible = false;
        }
      } else if (step.position === 'right' && significantHorizontalShift) {
        // If pushing right tooltip to the left edge, try top or bottom instead
        if (rect.top > tooltipHeight + padding) {
          // Try positioning above
          fixedTop = rect.top - tooltipHeight - padding;
          fixedLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, 
            rect.left + rect.width / 2 - tooltipWidth / 2));
          arrow = {
            visible: true,
            direction: 'bottom',
            top: rect.top - arrowOffset,
            left: rect.left + rect.width / 2,
            size: 14
          };
        } else if (viewportHeight - rect.bottom > tooltipHeight + padding) {
          // Try positioning below
          fixedTop = rect.bottom + padding;
          fixedLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, 
            rect.left + rect.width / 2 - tooltipWidth / 2));
          arrow = {
            visible: true,
            direction: 'top',
            top: rect.bottom + arrowOffset,
            left: rect.left + rect.width / 2,
            size: 14
          };
        } else {
          // If no good position, hide arrow
          arrow.visible = false;
        }
      } else if ((step.position === 'top' || step.position === 'bottom') && significantVerticalShift) {
        // If pushing top/bottom tooltip to the edge, try left or right instead
        if (rect.left > tooltipWidth + padding) {
          // Try positioning left
          fixedTop = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, 
            rect.top + rect.height / 2 - tooltipHeight / 2));
          fixedLeft = rect.left - tooltipWidth - padding;
          arrow = {
            visible: true,
            direction: 'right',
            top: rect.top + rect.height / 2,
            left: rect.left - arrowOffset,
            size: 14
          };
        } else if (viewportWidth - rect.right > tooltipWidth + padding) {
          // Try positioning right
          fixedTop = Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, 
            rect.top + rect.height / 2 - tooltipHeight / 2));
          fixedLeft = rect.right + padding;
          arrow = {
            visible: true,
            direction: 'left',
            top: rect.top + rect.height / 2,
            left: rect.right + arrowOffset,
            size: 14
          };
        } else {
          // If no good position, hide arrow
          arrow.visible = false;
        }
      }
    }
    
    // If arrow position is now off-screen or significantly displaced, hide it
    if (arrow.visible) {
      if (arrow.top < 0 || arrow.top > viewportHeight || 
          arrow.left < 0 || arrow.left > viewportWidth) {
        arrow.visible = false;
      }
    }
    
    // Set the fixed positions
    position.top = fixedTop;
    position.left = fixedLeft;
    
    setTooltipPosition(position);
    setArrowPosition(arrow);
  }, [tooltipWidth, tooltipHeight]);

  // Update position when step changes
  useEffect(() => {
    if (isVisible) {
      positionTooltip(currentStep);
    }
    
    return () => {
      // Clean up overlay when step changes
      if (highlightOverlayRef.current) {
        document.body.removeChild(highlightOverlayRef.current);
        highlightOverlayRef.current = null;
      }
      if (highlightInnerRef.current) {
        document.body.removeChild(highlightInnerRef.current);
        highlightInnerRef.current = null;
      }
    };
  }, [currentStep, isVisible, positionTooltip]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        positionTooltip(currentStep);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, currentStep, positionTooltip]);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const startTour = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  const completeTour = () => {
    setIsVisible(false);
    
    // Clean up overlay when tour completes
    if (highlightOverlayRef.current) {
      document.body.removeChild(highlightOverlayRef.current);
      highlightOverlayRef.current = null;
    }
    if (highlightInnerRef.current) {
      document.body.removeChild(highlightInnerRef.current);
      highlightInnerRef.current = null;
    }
    
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ 
        completed: true, 
        completedAt: new Date().toISOString() 
      }));
    } catch (error) {
      logger.error('Error saving tour completion:', error);
    }
  };

  // Get current step data
  const currentStepData = TOUR_STEPS[currentStep] || TOUR_STEPS[0];

  // Theme colors based on red palette, adjusted for dark mode
  const colors = isDarkMode ? {
    background: '#2D2D2D',         // Dark background
    border: '#4D4D4D',             // Dark border
    text: '#FFF5E6',               // Light cream text
    textSecondary: '#FFCCCB',      // Light pink text
    primary: RED_COLORS.light,     // Lighter red for dark mode
    primaryHover: RED_COLORS.accent,
    controlBg: '#3D3D3D',          // Dark control background
    controlHover: '#505050',       // Darker control hover
    arrow: RED_COLORS.light        // Arrow color
  } : {
    background: '#FFFFFF',         // White background
    border: '#FFE0E0',             // Light pink border
    text: '#7D0000',               // Dark red text
    textSecondary: '#C81D2A',      // Medium red
    primary: RED_COLORS.primary,   // Main red
    primaryHover: RED_COLORS.dark,
    controlBg: '#FFF5F5',          // Light pink control background
    controlHover: '#FFE0E0',       // Lighter pink control hover
    arrow: RED_COLORS.primary      // Arrow color
  };

  return (
    <>
      {/* Tour Help Button (Only when tour is not visible) */}
      {!isVisible && (
        <button
          onClick={startTour}
          className="tour-help-button fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50"
          style={{
            backgroundColor: colors.primary,
            color: '#FFFFFF',
            fontSize: '1.2rem',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Start guided tour"
        >
          <HelpCircle size={28} />
        </button>
      )}

      {/* Tour Overlay and Tooltip */}
      {isVisible && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[999] transition-opacity duration-300"
            style={{
              opacity: isVisible ? 1 : 0,
              pointerEvents: isVisible ? 'auto' : 'none',
            }}
            onClick={completeTour}
          />

          {/* Arrow pointing to target element */}
          {arrowPosition.visible && (
            <div
              className="tour-arrow fixed z-[1001]"
              style={{
                top: arrowPosition.top,
                left: arrowPosition.left,
                transform: arrowPosition.direction === 'left' ? 'translateY(-50%)' : 
                          arrowPosition.direction === 'right' ? 'translateY(-50%)' :
                          arrowPosition.direction === 'top' ? 'translateX(-50%)' :
                          arrowPosition.direction === 'bottom' ? 'translateX(-50%)' : '',
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: arrowPosition.direction === 'left' ? `${arrowPosition.size}px 0 ${arrowPosition.size}px ${arrowPosition.size}px` :
                            arrowPosition.direction === 'right' ? `${arrowPosition.size}px ${arrowPosition.size}px ${arrowPosition.size}px 0` :
                            arrowPosition.direction === 'top' ? `0 ${arrowPosition.size}px ${arrowPosition.size}px ${arrowPosition.size}px` :
                            arrowPosition.direction === 'bottom' ? `${arrowPosition.size}px ${arrowPosition.size}px 0 ${arrowPosition.size}px` : '',
                borderColor: arrowPosition.direction === 'left' ? `transparent transparent transparent ${colors.arrow}` :
                            arrowPosition.direction === 'right' ? `transparent ${colors.arrow} transparent transparent` :
                            arrowPosition.direction === 'top' ? `transparent ${colors.arrow} ${colors.arrow} transparent` :
                            arrowPosition.direction === 'bottom' ? `${colors.arrow} transparent transparent transparent` : '',
                opacity: isVisible ? 1 : 0,
              }}
            />
          )}

          {/* Tooltip */}
          <div
            className="tour-tooltip fixed z-[1000] rounded-xl shadow-xl border transition-opacity duration-300"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: tooltipPosition.transform,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: '2px',
              opacity: isVisible ? 1 : 0,
              width: `${tooltipWidth}px`,
              maxHeight: `${tooltipHeight * 1.5}px`,
              overflow: 'auto'
            }}
          >
            {/* Close button */}
            <button
              onClick={completeTour}
              className="tour-close-button absolute top-3 right-3 p-2 rounded-full transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.controlHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close tour"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            {/* Content */}
            <div className="p-6">
              <h3 className="tour-tooltip-title text-xl font-bold mb-3 pr-8" style={{ color: colors.text }}>
                {currentStepData.title}
              </h3>
              <p className="tour-tooltip-content text-base mb-6 leading-relaxed" style={{ color: colors.textSecondary }}>
                {currentStepData.content}
              </p>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="tour-button p-3 rounded-lg flex items-center transition-colors"
                      style={{ 
                        color: colors.textSecondary,
                        borderWidth: '1px', 
                        borderStyle: 'solid',
                        borderColor: colors.textSecondary
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = colors.controlHover;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ChevronLeft size={20} className="mr-2" />
                      <span>Previous</span>
                    </button>
                  )}
                </div>

                <div className="tour-progress text-sm font-medium" style={{ color: colors.textSecondary }}>
                  {currentStep + 1} / {TOUR_STEPS.length}
                </div>

                <button
                  onClick={handleNext}
                  className="tour-button p-3 rounded-lg flex items-center transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    color: '#FFFFFF',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  }}
                >
                  <span>
                    {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  </span>
                  {currentStep < TOUR_STEPS.length - 1 && (
                    <ChevronRight size={20} className="ml-2" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GuidedTour;