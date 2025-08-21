// components/controls/LayerSections.jsx
import React from 'react';
import { Download, X, Lasso, Circle } from 'lucide-react';
import FileUploadControl from './FileUploadControl';
import { LayerButton, truncateFilename } from './PanelUIComponents';
import InfoTooltip from '../ui/InfoTooltip';
import { logger } from '../../utils/logger';

// Layer Group Component
export const LayerGroup = ({ title, variants, groupId, activeLayer, onToggle, isDarkMode }) => {
  // Find the key in the layerGroups object for this group
  // For string groupId values, use them directly
  // For object groupId values without an id, look at properties to determine what it is
  const getGroupKey = () => {
    if (typeof groupId === 'string') return groupId;
    
    // For objects like layerGroups.globalBufferPool
    if (groupId.name === 'Global Buffer Pool') return 'globalBufferPool';
    if (groupId.name === 'Global Reversal') return 'globalReversal';
    if (groupId.name === 'Buffer Pool') return 'bufferPool';
    if (groupId.name === 'Reversal Risk SSP585') return 'reversalRiskSSP585';
    if (groupId.name === 'Reversal Risk SSP370') return 'reversalRiskSSP370';
    if (groupId.name === 'Reversal Risk SSP245') return 'reversalRiskSSP245';
    if (groupId.name === 'Combined Risk Absolute Reversal') return 'combinedRisk';
    
    logger.error('Unknown layer group:', groupId);
    return null;
  };
  
  const groupKey = getGroupKey();
  
  return (
    <div className="space-y-2" role="group" aria-labelledby={`${title}-heading`}>
      <div className="flex items-center gap-2 mb-2">
        <h3 id={`${title}-heading`} className={`text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {title}
        </h3>
        <InfoTooltip 
          title={title}
          isDarkMode={isDarkMode}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {variants.map(variant => {
          // Determine if this is an intensity-based variant
          const isIntensity = ['low', 'moderate', 'high'].includes(variant.toLowerCase());
          
          return (
            <LayerButton
              key={variant}
              variant={variant}
              intensity={isIntensity ? variant.toLowerCase() : null}
              isActive={activeLayer === groupId.layers[variant]}
              onClick={() => onToggle(groupKey, variant)}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </div>
    </div>
  );
};

// Reference Layers Component
export const ReferenceLayers = ({ isCongressionalDistrictsVisible, toggleCongressionalDistricts }) => {
  return (
    <div className="p-3 space-y-2">
      <button
        onClick={() => toggleCongressionalDistricts()}
        aria-pressed={isCongressionalDistrictsVisible}
        className={`
          w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors
          ${isCongressionalDistrictsVisible
            ? 'bg-slate-700 text-white'
            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }
          focus:outline-none focus:ring-1 focus:ring-slate-400
        `}
      >
        Congressional Districts
      </button>
    </div>
  );
};

// Upload Section Component
export const UploadSection = ({
  uploadedLayers,
  activeUploadedLayers,
  onFileUpload,
  toggleUploadedLayer,
  handleDeleteLayer,
  getUploadedLayerOpacity,
  handleUploadedOpacityChange,
  setUploadStatus,
  isDarkMode
}) => {
  return (
    <div className="p-4">
      <FileUploadControl 
        onFileUpload={onFileUpload} 
        setUploadStatus={setUploadStatus}
        isDarkMode={isDarkMode}
      />

      {/* Uploaded Layers */}
      {uploadedLayers.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Uploaded Layers
          </h3>
          
          {uploadedLayers.map(layer => (
            <div key={layer.id} className="space-y-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleUploadedLayer(layer.id)}
                  aria-pressed={activeUploadedLayers.includes(layer.id)}
                  className={`
                    flex-1 px-3 py-2 text-sm font-medium rounded-l truncate
                    transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400
                    ${activeUploadedLayers.includes(layer.id)
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }
                  `}
                  aria-label={`Toggle ${layer.name} layer`}
                >
                  {truncateFilename(layer.name)}
                </button>
                <button
                  onClick={(e) => handleDeleteLayer(layer.id, e)}
                  aria-label={`Delete ${layer.name} layer`}
                  className="p-2 rounded-r bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 px-2" role="group" aria-label={`${layer.name} opacity controls`}>
                <label 
                  htmlFor={`opacity-${layer.id}`}
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Opacity
                </label>
                <input
                  id={`opacity-${layer.id}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={getUploadedLayerOpacity(layer.id)}
                  onChange={(e) => handleUploadedOpacityChange(layer.id, e.target.value)}
                  className="flex-1"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(getUploadedLayerOpacity(layer.id) * 100)}
                />
                <output 
                  htmlFor={`opacity-${layer.id}`}
                  className={`text-sm font-medium min-w-[3rem] text-right ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {Math.round(getUploadedLayerOpacity(layer.id) * 100)}%
                </output>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Draw Controls Component
export const DrawControls = ({
  activeLayer,
  drawnFeatures,
  isDrawActive,
  drawingInstructions,
  onDownloadData,
  clearDrawings,
  showDrawOptions,
  setShowDrawOptions,
  onDrawButtonClick,
  isDarkMode
}) => {
  if (!activeLayer) return null;

  return (
    <section className={`border-t p-4 ${
      isDarkMode ? 'border-gray-800' : 'border-gray-100'
    }`}>
      <h3 className={`text-sm font-medium mb-3 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        Download Controls
      </h3>
      
      <div className="space-y-3">
        {drawnFeatures?.length > 0 ? (
          <>
            <button
              onClick={() => {
                onDownloadData(activeLayer);
                clearDrawings();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-800
                transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <Download aria-hidden="true" size={16} />
              <span>Download Selected Area</span>
            </button>
            <button
              onClick={clearDrawings}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                text-sm font-medium rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300
                transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <X aria-hidden="true" size={16} />
              <span>Clear Selection</span>
            </button>
          </>
        ) : isDrawActive ? (
          <button
            onClick={clearDrawings}
            className="w-full flex items-center justify-center gap-2 px-4 py-3
              text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-800
              transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <X aria-hidden="true" size={16} />
            <span>Cancel Drawing</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onDownloadData(activeLayer)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                text-sm font-medium rounded-lg bg-slate-700 text-white hover:bg-slate-800
                transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <Download aria-hidden="true" size={16} />
              <span>Download Viewport</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDrawOptions(!showDrawOptions)}
                aria-expanded={showDrawOptions}
                aria-haspopup="true"
                className="w-full flex items-center justify-center gap-2 px-4 py-3
                  text-sm font-medium rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300
                  transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <Lasso aria-hidden="true" size={16} />
                <span>Draw Area for Download</span>
              </button>

              {showDrawOptions && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                  }`}
                  role="menu"
                >
                  {[
                    { id: 'draw_polygon', icon: Lasso, label: 'Draw Custom Area' },
                    { id: 'draw_radius', icon: Circle, label: 'Draw Radius' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        onDrawButtonClick(id);
                        setShowDrawOptions(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors focus:outline-none ${
                        isDarkMode 
                          ? 'text-slate-200 hover:bg-slate-700' 
                          : 'text-slate-800 hover:bg-slate-100'
                      }`}
                      role="menuitem"
                    >
                      <Icon aria-hidden="true" size={16} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {drawingInstructions && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-800 text-slate-200' 
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
            role="status"
            aria-live="polite"
          >
            {drawingInstructions}
          </div>
        )}
      </div>
    </section>
  );
};