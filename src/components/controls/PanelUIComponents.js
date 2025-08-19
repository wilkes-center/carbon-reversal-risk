// components/controls/UIComponents.jsx
import React from 'react';
import { ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import InfoTooltip from '../ui/InfoTooltip';

// Basic Button Component
export const LayerButton = ({ isActive, onClick, variant, intensity = null, isDarkMode = false }) => {
  // Get color based on intensity if provided
  const getColorClass = () => {
    if (isActive) return 'bg-blue text-white hover:bg-blue/90';
    
    const baseClasses = isDarkMode 
      ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
      : 'bg-white text-obsidian hover:bg-gray-100';
    
    if (intensity) {
      switch(intensity) {
        case 'low': return `${baseClasses} border border-sage`;
        case 'moderate': return `${baseClasses} border border-tan`;
        case 'high': return `${baseClasses} border border-rust`;
        default: return `${baseClasses} border border-sage`;
      }
    }
    
    return `${baseClasses} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`;
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${getColorClass()}
        focus:outline-none focus:ring-1 focus:ring-green
      `}
    >
      {typeof variant === 'string' ? variant.charAt(0).toUpperCase() + variant.slice(1) : variant}
    </button>
  );
};

// Section Header Component
export const SectionHeader = ({ title, isExpanded, onClick, isDarkMode }) => (
  <div
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      border-b border-green 
      cursor-pointer font-sora text-section-header`}
  >
    <div className="flex items-center gap-2">
      <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-obsidian'}`}>{title}</span>
      <InfoTooltip title={title} isDarkMode={isDarkMode} />
    </div>
    {isExpanded ? (
      <ChevronUp className="h-5 w-5 text-green" />
    ) : (
      <ChevronDown className="h-5 w-5 text-green" />
    )}
  </div>
);



// Loading Overlay Component
export const LoadingOverlay = ({ isLoading, isDarkMode }) => {
  if (!isLoading) return null;
  
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-50 ${
      isDarkMode ? 'bg-gray-900/80' : 'bg-white/50'
    }`}>
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-green" />
        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-obsidian'}`}>
          Loading...
        </span>
      </div>
    </div>
  );
};

// Helper for truncating file names
export const truncateFilename = (filename, maxLength = 35) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.slice(filename.lastIndexOf('.'));
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
  return nameWithoutExt.slice(0, maxLength - extension.length - 3) + '...' + extension;
};