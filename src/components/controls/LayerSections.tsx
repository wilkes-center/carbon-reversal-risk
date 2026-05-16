// @ts-nocheck
// components/controls/LayerSections.jsx
import React, { useState } from 'react';
import { Download, X, Lasso, Circle, ChevronDown, ChevronRight, Palette, RotateCcw } from 'lucide-react';
import FileUploadControl from './FileUploadControl';
import { LayerButton, truncateFilename } from './PanelUIComponents';
import InfoTooltip from '../ui/InfoTooltip';
import { RAMPS, getRamp } from '../../utils/colors/uploadedRamps';

// Layer Group Component
export const LayerGroup = ({ title, group, activeLayer, onToggle, isDarkMode }) => {
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
        {group.variants.map(variant => {
          const isIntensity = ['low', 'moderate', 'high'].includes(variant.toLowerCase());

          return (
            <LayerButton
              key={variant}
              variant={variant}
              intensity={isIntensity ? variant.toLowerCase() : null}
              isActive={activeLayer === group.layers[variant]}
              onClick={() => onToggle(group.key, variant)}
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

// Format break value for legend label
const fmtBreak = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1000 || abs === 0) return Math.round(v).toLocaleString();
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(3);
};

// Tiny gradient swatch for ramp preview in dropdown
const RampSwatch = ({ rampId, invert, width = 64, height = 12 }) => {
  const colors = getRamp(rampId, 8, invert);
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
  return (
    <span
      style={{
        display: 'inline-block',
        width,
        height,
        background: gradient,
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.1)',
        verticalAlign: 'middle',
      }}
    />
  );
};

// Per-layer styling panel: attribute, method, classes, ramp, invert + mini-legend
const LayerStylePanel = ({
  layer,
  config,
  onChange,
  onReset,
  buildPaint,
  isDarkMode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const schema = layer.schema ?? {};
  const numericAttrs = Object.keys(schema);
  const geomType = layer.geometryType
    ?? layer.data?.features?.[0]?.geometry?.type
    ?? 'Polygon';

  const built = buildPaint(layer.id, geomType, layer.data?.features);
  const showLegend = config.attribute && built.breaks?.length >= 2;

  const labelClass = `text-xs font-medium ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;
  const inputClass = `w-full text-xs rounded border px-2 py-1 ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-200'
      : 'bg-white border-slate-300 text-slate-800'
  } focus:outline-none focus:ring-1 focus:ring-slate-400`;

  return (
    <div className={`mt-2 rounded border ${
      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-slate-50'
    }`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium ${
          isDarkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-slate-700 hover:bg-slate-100'
        } focus:outline-none focus:ring-1 focus:ring-slate-400 rounded`}
      >
        <span className="inline-flex items-center gap-2">
          <Palette size={14} aria-hidden="true" />
          Style {config.attribute ? `(by ${config.attribute})` : ''}
        </span>
        {expanded ? (
          <ChevronDown size={14} aria-hidden="true" />
        ) : (
          <ChevronRight size={14} aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {numericAttrs.length === 0 ? (
            <div className={`text-xs italic ${
              isDarkMode ? 'text-gray-400' : 'text-slate-500'
            }`}>
              No numeric attributes detected for graduated coloring.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className={labelClass} htmlFor={`attr-${layer.id}`}>
                  Color by attribute
                </label>
                <select
                  id={`attr-${layer.id}`}
                  className={inputClass}
                  value={config.attribute ?? ''}
                  onChange={(e) =>
                    onChange(layer.id, { attribute: e.target.value || null })
                  }
                >
                  <option value="">Single color (none)</option>
                  {numericAttrs.map((k) => {
                    const s = schema[k];
                    return (
                      <option key={k} value={k}>
                        {k} ({fmtBreak(s.min)} – {fmtBreak(s.max)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelClass} htmlFor={`method-${layer.id}`}>
                    Method
                  </label>
                  <select
                    id={`method-${layer.id}`}
                    className={inputClass}
                    value={config.method}
                    disabled={!config.attribute}
                    onChange={(e) =>
                      onChange(layer.id, { method: e.target.value })
                    }
                  >
                    <option value="equalInterval">Equal Interval</option>
                    <option value="quantile">Quantile</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass} htmlFor={`classes-${layer.id}`}>
                    Classes
                  </label>
                  <input
                    id={`classes-${layer.id}`}
                    type="number"
                    min={3}
                    max={9}
                    step={1}
                    disabled={!config.attribute}
                    value={config.classCount}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n)) {
                        onChange(layer.id, {
                          classCount: Math.max(3, Math.min(9, n)),
                        });
                      }
                    }}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass} htmlFor={`ramp-${layer.id}`}>
                  Color ramp
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id={`ramp-${layer.id}`}
                    className={inputClass}
                    value={config.rampId}
                    onChange={(e) =>
                      onChange(layer.id, { rampId: e.target.value })
                    }
                  >
                    {RAMPS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <RampSwatch rampId={config.rampId} invert={config.invert} />
                </div>
              </div>

              <label className={`inline-flex items-center gap-2 ${labelClass} cursor-pointer`}>
                <input
                  type="checkbox"
                  checked={config.invert}
                  onChange={(e) =>
                    onChange(layer.id, { invert: e.target.checked })
                  }
                  className="rounded"
                />
                Invert ramp
              </label>

              {showLegend && (
                <div className="space-y-1">
                  <div className={labelClass}>Legend</div>
                  <div className="space-y-0.5">
                    {built.colors.map((color, i) => {
                      const lo = built.breaks[i];
                      const hi = built.breaks[i + 1];
                      const isLast = i === built.colors.length - 1;
                      const label = isLast
                        ? `>= ${fmtBreak(lo)}`
                        : `${fmtBreak(lo)} – ${fmtBreak(hi)}`;
                      return (
                        <div
                          key={`${color}-${i}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: 14,
                              height: 14,
                              background: color,
                              border: '1px solid rgba(0,0,0,0.15)',
                              borderRadius: 2,
                            }}
                          />
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-300' : 'text-slate-700'
                          }`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => onReset(layer.id)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-slate-700 hover:bg-slate-200'
                } focus:outline-none focus:ring-1 focus:ring-slate-400`}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset style
              </button>
            </>
          )}
        </div>
      )}
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
  getUploadedLayerStyleConfig,
  setUploadedLayerStyleConfig,
  resetUploadedLayerStyleConfig,
  buildUploadedLayerPaint,
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

              <LayerStylePanel
                layer={layer}
                config={getUploadedLayerStyleConfig(layer.id)}
                onChange={setUploadedLayerStyleConfig}
                onReset={resetUploadedLayerStyleConfig}
                buildPaint={buildUploadedLayerPaint}
                isDarkMode={isDarkMode}
              />
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