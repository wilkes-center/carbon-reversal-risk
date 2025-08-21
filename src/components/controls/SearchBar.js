import React, { useState } from 'react';
import { Search, Loader, X } from 'lucide-react';
import { logger } from '../../utils/logger';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  fitBounds, 
  handleViewportChange, 
  viewport,
  isDarkMode 
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${
          encodeURIComponent(searchQuery.trim())
        }.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
      );

      if (!response.ok) throw new Error('Search request failed');

      const data = await response.json();
      if (data.features?.[0]) {
        const feature = data.features[0];
        if (feature.bbox) {
          const padding = 0.5;
          fitBounds([
            feature.bbox[0] - padding,
            feature.bbox[1] - padding,
            feature.bbox[2] + padding,
            feature.bbox[3] + padding
          ]);
        } else if (feature.center) {
          handleViewportChange({
            ...viewport,
            longitude: feature.center[0],
            latitude: feature.center[1],
            zoom: 10,
            transitionDuration: 2000
          });
        }
      } else {
        setError('No results found');
      }
    } catch (error) {
      logger.error('Search error:', error);
      setError('Error searching location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setError(null);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className={`
          relative flex items-center transition-all duration-200
          ${isFocused ? 'scale-[1.01]' : 'scale-100'}
        `}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setError(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search for a location"
            disabled={isSearching}
            className={`
              w-full px-4 py-2.5 pr-20
              rounded-lg border transition-colors
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }
              ${error ? 'border-red-500' : isFocused 
                ? (isDarkMode ? 'border-blue-500' : 'border-blue-500') 
                : ''
              }
              ${isSearching ? 'opacity-75' : ''}
              outline-none
              focus:ring-2 
              ${isDarkMode 
                ? 'focus:ring-blue-500/50' 
                : 'focus:ring-blue-500/50'
              }
            `}
            aria-label="Search location"
          />

          {/* Action Buttons */}
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className={`
                  p-1.5 rounded-md transition-colors
                  ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                  }
                `}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className={`
                p-1.5 rounded-md transition-colors
                ${isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }
                ${(isSearching || !searchQuery.trim()) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
              `}
              aria-label="Search"
            >
              {isSearching ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Search size={16} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className={`
          absolute left-0 right-0 mt-2
          px-3 py-2 text-sm rounded-md
          flex items-center gap-2
          ${isDarkMode
            ? 'bg-red-900/50 text-red-200'
            : 'bg-red-50 text-red-600'
          }
        `}>
          <div className="flex-shrink-0">
            <X size={14} />
          </div>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;