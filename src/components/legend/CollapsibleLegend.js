import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, RefreshCw } from 'lucide-react';
import { getLegendConfig } from '../../utils/colors/colorScales';
import legendStateManager from '../../utils/colors/LegendStateManager';

const CollapsibleLegend = ({ layer, onRangeChange, isDarkMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ranges, setRanges] = useState([]);
  const [tempRanges, setTempRanges] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalRanges, setOriginalRanges] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);

  useEffect(() => {
    if (!layer?.id) return;

    const loadState = () => {
      const savedState = legendStateManager.getLegendState(layer.id);
      if (savedState) {
        setOriginalRanges(savedState);
        setRanges(savedState);
        setTempRanges(savedState);
        onRangeChange(layer.id, savedState);
        return;
      }

      const legendConfig = getLegendConfig(layer.id, isDarkMode);
      const formattedRanges = legendConfig.map(item => ({
        value: item.value,
        color: item.color
      }));
      
      setOriginalRanges(formattedRanges);
      setRanges(formattedRanges);
      setTempRanges(formattedRanges);
      setIsEditing(false);
      setSelectedValue(null);
    };

    loadState();
  }, [layer?.id, isDarkMode, onRangeChange]);

  const handleTempRangeChange = (index, field, value) => {
    setTempRanges(prev => {
      const newRanges = [...prev];
      newRanges[index][field] = field === 'value' ? parseFloat(value) : value;
      return newRanges;
    });
  };

  const handleSave = () => {
    if (!layer?.id) return;
    setRanges(tempRanges);
    legendStateManager.updateLegendState(layer.id, JSON.parse(JSON.stringify(tempRanges)));
    onRangeChange(layer.id, JSON.parse(JSON.stringify(tempRanges)));
    setIsEditing(false);
  };

  const handleReset = () => {
    if (!layer?.id) return;
    const legendConfig = getLegendConfig(layer.id, isDarkMode);
    const resetRanges = legendConfig.map(item => ({
      value: item.value,
      color: item.color
    }));
    setTempRanges(resetRanges);
    setRanges(resetRanges);
    setOriginalRanges(resetRanges);
    legendStateManager.resetLegendState(layer.id);
    onRangeChange(layer.id, resetRanges);
    setIsEditing(false);
    setSelectedValue(null);
    applySelectedColorToMap(null);
  };

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedValue(value);
    applySelectedColorToMap(value);
  };

  const applySelectedColorToMap = (selectedValue) => {
    if (!layer?.id || !ranges.length) return;
    
    if (selectedValue === null) {
      // Reset to original colors if no color is selected
      onRangeChange(layer.id, JSON.parse(JSON.stringify(ranges)));
      return;
    }
    
    // Find the range that contains the selected value
    let selectedRangeIndex = -1;
    
    for (let i = 0; i < ranges.length - 1; i++) {
      if (selectedValue >= ranges[i].value && selectedValue < ranges[i + 1].value) {
        selectedRangeIndex = i;
        break;
      }
    }
    
    // If we didn't find it in the ranges, check if it's in the last range
    if (selectedRangeIndex === -1 && selectedValue >= ranges[ranges.length - 1].value) {
      selectedRangeIndex = ranges.length - 1;
    }
    
    // Create a modified copy of ranges with dulled colors for all except the selected one
    const highlightedRanges = ranges.map((range, index) => {
      if (index === selectedRangeIndex) {
        // Make the selected color more vibrant
        const color = range.color;
        
        // Convert hex to RGB for manipulation
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        
        // Increase saturation and brightness for the selected color
        // This uses a simple approach to make colors more vibrant
        const enhanceFactor = 1.5; // Increase vibrance by 50%
        
        // Simple color enhancement - avoids oversaturation
        r = Math.min(255, Math.round(r * enhanceFactor));
        g = Math.min(255, Math.round(g * enhanceFactor));
        b = Math.min(255, Math.round(b * enhanceFactor));
        
        const enhancedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        return {
          ...range,
          color: enhancedColor
        };
      } else {
        // Apply more aggressive dulling to other colors
        const color = range.color;
        // More aggressive dulling factors
        const dullFactor = isDarkMode ? 0.15 : 0.9;
        
        // Convert hex to RGB, apply dulling factor, convert back to hex
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        
        if (isDarkMode) {
          // For dark mode, make non-selected colors much darker
          r = Math.floor(r * dullFactor);
          g = Math.floor(g * dullFactor);
          b = Math.floor(b * dullFactor);
        } else {
          // For light mode, make non-selected colors much lighter
          r = Math.floor(r + (255 - r) * dullFactor);
          g = Math.floor(g + (255 - g) * dullFactor);
          b = Math.floor(b + (255 - b) * dullFactor);
        }
        
        const dulledColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        return {
          ...range,
          color: dulledColor
        };
      }
    });
    
    // Apply the highlighted ranges to the map
    onRangeChange(layer.id, highlightedRanges);
  };

  const getSelectedColorIndicatorStyle = () => {
    if (!selectedValue || ranges.length < 2) return { left: '0%', display: 'none' };
    
    const min = ranges[0].value;
    const max = ranges[ranges.length - 1].value;
    const range = max - min;
    
    const left = ((selectedValue - min) / range) * 100;
    
    return {
      left: `${Math.max(0, Math.min(100, left))}%`,
      transform: 'translateX(-50%)',
      boxShadow: '0 0 0 2px rgba(255, 255, 255, 1), 0 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px 2px rgba(59, 130, 246, 0.6)'
    };
  };

  if (!layer?.id) return null;

  const minValue = ranges.length > 0 ? ranges[0].value : 0;
  const maxValue = ranges.length > 0 ? ranges[ranges.length - 1].value : 100;

  return (
    <div 
      className="absolute top-48 right-4 transition-all duration-300 ease-in-out font-sans"
      role="complementary"
      aria-label="Map legend"
    >
      <div className={`rounded-lg shadow-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div 
          className={`flex items-center justify-between px-3 py-2 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
          role="heading"
          aria-level="2"
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-sm"
            aria-expanded={isExpanded}
            aria-controls="legend-content"
          >
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>Legend</span>
            {isExpanded ? (
              <ChevronUp size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} aria-hidden="true" />
            )}
          </button>
          
          <button
            onClick={handleReset}
            className={`p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Reset legend colors to default"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div id="legend-content" className="p-3 space-y-3">
            {/* Integrated color gradient slider */}
            <div className="relative px-1 pt-1 pb-4">
              {/* Color gradient background for slider */}
              <div 
                className="h-6 rounded-md overflow-hidden flex relative border border-gray-300 dark:border-gray-600"
                role="img"
                aria-label="Color gradient representing data ranges"
              >
                {tempRanges.map((range, index) => (
                  <div
                    key={index}
                    style={{ backgroundColor: range.color, width: `${100 / tempRanges.length}%` }}
                  />
                ))}
                
                {/* Selected color indicator */}
                {selectedValue !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-4 my-auto h-8 bg-white border-2 border-gray-800 rounded-full pointer-events-none shadow-md z-20"
                    style={getSelectedColorIndicatorStyle()}
                    aria-hidden="true"
                  />
                )}
                
                {/* Custom slider overlay */}
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  step={(maxValue - minValue) / 100}
                  value={selectedValue !== null ? selectedValue : minValue}
                  onChange={handleSliderChange}
                  className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10`}
                />
              </div>
              
              <div className="flex justify-between mt-2">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {minValue.toFixed(0)}
                </span>
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedValue !== null ? selectedValue.toFixed(0) : ''}
                </span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {maxValue.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Range list */}
            <div className="space-y-1" role="list">
              {tempRanges.map((range, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 py-1 px-2 rounded-sm ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                  role="listitem"
                >
                  {isEditing ? (
                    <>
                      <label className="sr-only" htmlFor={`color-${index}`}>
                        Color for range {range.value}
                      </label>
                      <input
                        id={`color-${index}`}
                        type="color"
                        value={range.color}
                        onChange={(e) => handleTempRangeChange(index, 'color', e.target.value)}
                        className="w-5 h-5 rounded-sm cursor-pointer"
                      />
                      <label className="sr-only" htmlFor={`value-${index}`}>
                        Value for range {index + 1}
                      </label>
                      <input
                        id={`value-${index}`}
                        type="number"
                        value={range.value}
                        onChange={(e) => handleTempRangeChange(index, 'value', e.target.value)}
                        className={`w-16 px-2 py-1 rounded-sm border text-sm ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      />
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-sm border flex-shrink-0"
                        style={{ 
                          backgroundColor: range.color,
                          borderColor: isDarkMode ? '#4B5563' : '#E5E7EB'
                        }}
                        role="presentation"
                      />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {tempRanges[index + 1]
                          ? `${range.value} - ${tempRanges[index + 1].value}`
                          : `${range.value}+`
                        }
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Edit controls */}
            <div className="pt-1 flex justify-end">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-2.5 py-1 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'text-blue-400 hover:bg-blue-900/30' 
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Edit Colors
                </button>
              ) : (
                <div className="flex gap-2" role="group" aria-label="Edit controls">
                  <button
                    onClick={() => {
                      setTempRanges(ranges);
                      setIsEditing(false);
                    }}
                    className={`px-2.5 py-1 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={`px-2.5 py-1 text-sm rounded-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Save size={12} aria-hidden="true" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleLegend;