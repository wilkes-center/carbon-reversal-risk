// components/controls/LayerControl.jsx
import React, { useState, useEffect } from 'react';
import { useMapPaint } from '../../contexts/MapPaintContext';

import { SectionHeader, LoadingOverlay } from '../controls/PanelUIComponents';
import { LayerGroup, ReferenceLayers, UploadSection, DrawControls } from '../controls/LayerSections';

const LayerControl = ({ 
  activeLayer,
  toggleLayer,
  isDarkMode,
  onLegendRangeChange,
  onDownloadData,
  toggleDrawMode,
  isDrawActive,
  drawnFeatures,
  onFileUpload,
  uploadedLayers,
  activeUploadedLayers,
  toggleUploadedLayer,
  setUploadedLayers,
  isLoading,
  onDrawButtonClick,
  clearDrawings,
  layers,
  layerGroups,
  drawingInstructions,
  legendStateManager,
  updateUploadedLayerOpacity,
  getUploadedLayerOpacity,
  mapRef,
  isCongressionalDistrictsVisible,
  toggleCongressionalDistricts,
  setUploadStatus
}) => {
  const [expandedSections, setExpandedSections] = useState({
    global: true,
    us: true,
    reference: true,
    uploaded: true
  });
  const { updateOpacity, getLayerOpacity } = useMapPaint();
  const [showDrawOptions, setShowDrawOptions] = useState(false);
  const [layerOpacities, setLayerOpacities] = useState({});

  useEffect(() => {
    if (uploadedLayers.length > 0) {
      const newOpacities = {};
      uploadedLayers.forEach(layer => {
        newOpacities[layer.id] = getLayerOpacity(layer.id);
      });
      setLayerOpacities(newOpacities);
    }
  }, [uploadedLayers, getLayerOpacity]);

  const handleUploadedOpacityChange = (layerId, value) => {
    if (!mapRef?.current) return;
    
    const map = mapRef.current.getMap();
    const newOpacity = parseFloat(value);
    
    if (!isNaN(newOpacity)) {
      updateUploadedLayerOpacity(layerId, newOpacity);
      map.triggerRepaint();
    }
  };

  const handleDeleteLayer = (layerId, e) => {
    e.stopPropagation();
    setUploadedLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId));
    if (activeUploadedLayers.includes(layerId)) {
      toggleUploadedLayer(layerId);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`h-full flex flex-col shadow-lg ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>


      {/* Main content with scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className={`divide-y ${
          isDarkMode ? 'divide-gray-800' : 'divide-gray-100'
        }`}>
          {/* Global Section */}
          <section>
            <SectionHeader
              title="Global Layers"
              isExpanded={expandedSections.global}
              onClick={() => toggleSection('global')}
              isDarkMode={isDarkMode}
            />

            {expandedSections.global && (
              <div className="p-4 space-y-4">
                <LayerGroup
                  title="Global Buffer Pool"
                  variants={layerGroups.globalBufferPool.variants}
                  groupId={layerGroups.globalBufferPool}
                  activeLayer={activeLayer}
                  onToggle={toggleLayer}
                  isDarkMode={isDarkMode}
                />

                <LayerGroup
                  title="Global Reversal"
                  variants={layerGroups.globalReversal.variants}
                  groupId={layerGroups.globalReversal}
                  activeLayer={activeLayer}
                  onToggle={toggleLayer}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </section>

          {/* US Section */}
          <section>
            <SectionHeader
              title="US Layers"
              isExpanded={expandedSections.us}
              onClick={() => toggleSection('us')}
              isDarkMode={isDarkMode}
            />

            {expandedSections.us && (
              <div className="p-4 space-y-4">
                {['bufferPool', 'reversalRiskSSP245', 'reversalRiskSSP370', 'reversalRiskSSP585'].map((groupId, index) => (
                  <div key={groupId}>
                    <LayerGroup
                      title={layerGroups[groupId].name}
                      variants={layerGroups[groupId].variants}
                      groupId={layerGroups[groupId]}
                      activeLayer={activeLayer}
                      onToggle={toggleLayer}
                      isDarkMode={isDarkMode}
                    />
                    {index === 0 && (
                      <div className={`my-4 h-0.5 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reference Layers Section */}
          <section>
            <SectionHeader
              title="Reference Layers"
              isExpanded={expandedSections.reference}
              onClick={() => toggleSection('reference')}
              isDarkMode={isDarkMode}
            />

            {expandedSections.reference && (
              <ReferenceLayers 
                isCongressionalDistrictsVisible={isCongressionalDistrictsVisible}
                toggleCongressionalDistricts={toggleCongressionalDistricts}
              />
            )}
          </section>

          {/* Upload Section */}
          <section>
            <SectionHeader
              title="Upload New Layer"
              isExpanded={expandedSections.uploaded}
              onClick={() => toggleSection('uploaded')}
              isDarkMode={isDarkMode}
            />

            {expandedSections.uploaded && (
              <UploadSection
                uploadedLayers={uploadedLayers}
                activeUploadedLayers={activeUploadedLayers}
                onFileUpload={onFileUpload}
                toggleUploadedLayer={toggleUploadedLayer}
                handleDeleteLayer={handleDeleteLayer}
                getUploadedLayerOpacity={getUploadedLayerOpacity}
                handleUploadedOpacityChange={handleUploadedOpacityChange}
                setUploadStatus={setUploadStatus}
                isDarkMode={isDarkMode}
              />
            )}
          </section>

          {/* Draw Controls */}
          <DrawControls
            activeLayer={activeLayer}
            drawnFeatures={drawnFeatures}
            isDrawActive={isDrawActive}
            drawingInstructions={drawingInstructions}
            onDownloadData={onDownloadData}
            clearDrawings={clearDrawings}
            showDrawOptions={showDrawOptions}
            setShowDrawOptions={setShowDrawOptions}
            onDrawButtonClick={onDrawButtonClick}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} isDarkMode={isDarkMode} />
    </div>
  );
};

export default LayerControl;