import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Source, Layer, Popup, ScaleControl, Map } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { layers } from '../../utils/map/layers';
import { basemaps } from '../../utils/map/basemaps';
import { formatLayerName } from '../../utils/format/formatUtils';
import { MAPBOX_TOKEN } from '../../constants';
import SearchBar from '../controls/SearchBar';
import LayerControl from '../panels/LayerControl';
import { useViewport } from '../../hooks/map/mapHooks';
import MiniMap from './MiniMap';
import { downloadLayerDataAsCSV, getCurrentMapBounds } from '../../utils/map/downloadUtils';
import useUploadedLayerStyling from '../../hooks/layers/useUploadedLayerStyling';
import MapControls from '../controls/MapControls';
import DarkPopup from '../ui/DarkPopup';
import { generatePaintProperty } from '../../utils/colors/colorScales';
import useLayerStyleManager from '../../hooks/layers/useLayerStyleManager';
import DrawControl from './DrawControl';
import SlidingPanel from '../panels/SlidingPanel';
import { useMapPaint } from '../../contexts/MapPaintContext';
import legendStateManager from '../../utils/colors/LegendStateManager';
import CongressionalDistrictsLayer from '../layers/CongressionalDistrictsLayer';
import CongressionalDistrictPopup from '../ui/CongressionalDistrictPopup';
import CollapsibleLegend from '../legend/CollapsibleLegend';
import UploadNotification from '../ui/UploadNotification';
import AreaStats from '../ui/AreaStats';
import DownloadButton from '../ui/DownloadButton';
import { useEnhancedMapLayer } from '../../hooks/layers/useEnhancedMapLayer';
import GuidedTour from '../ui/GuidedTour';
import { logger } from '../../utils/logger';

const MapComponent = () => {
  const initialViewport = useMemo(() => ({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
    minZoom: 0,
    maxZoom: 20
  }), []);
  const { 
    updateOpacity: updateUploadedLayerOpacity,
    getLayerOpacity: getUploadedLayerOpacity 
  } = useUploadedLayerStyling();
  const [viewport, handleViewportChange] = useViewport(initialViewport);
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeBasemap, setActiveBasemap] = useState(basemaps[3].id);
  const [popupInfo, setPopupInfo] = useState(null);
  const [clickedFeature, setClickedFeature] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('US');
  const mapRef = useRef(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [uploadedLayers, setUploadedLayers] = useState([]);
  const [activeUploadedLayers, setActiveUploadedLayers] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDrawActive, setIsDrawActive] = useState(false);
  const [drawMode, setDrawMode] = useState('draw_polygon');
  const [drawnFeatures, setDrawnFeatures] = useState([]);
  const [drawingInstructions, setDrawingInstructions] = useState('');
  const drawRef = useRef(null);
  const { updateOpacity: updateMapOpacity, getLayerOpacity: getMapLayerOpacity } = useMapPaint();
  const eventHandlerRef = useRef(null);
  const [customLegendColors, setCustomLegendColors] = useState({});
  const [isCongressionalDistrictsVisible, setIsCongressionalDistrictsVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtPopupInfo, setDistrictPopupInfo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedDistrictGeometry, setSelectedDistrictGeometry] = useState(null);
  const [uploadedAreaFeaturesData, setUploadedAreaFeaturesData] = useState([]);
  const [districtFeaturesData, setDistrictFeaturesData] = useState([]);

  const updateTimeoutRef = useRef(null);

  const LAYER_COLORS = [
    '#1E88E5',  // Blue
    '#28A745',  // Green
    '#DC3545',  // Red
    '#FFC107',  // Yellow
    '#6F42C1',  // Purple
    '#FD7E14'   // Orange
  ];
  



  const { updateLayerStyle } = useLayerStyleManager(
    mapRef.current?.getMap(),
    activeLayer,
    isDarkMode,
    legendStateManager 
  );

  const toggleCongressionalDistricts = useCallback(() => {
    setIsCongressionalDistrictsVisible(prev => {
      // If we're turning off the layer, clear the popup and selection
      if (prev) {
        setDistrictPopupInfo(null);
        setSelectedDistrict(null);
      }
      return !prev;
    });
  }, []);

  const handleDistrictClick = useCallback((event) => {
    if (!isCongressionalDistrictsVisible) return;
    
    const features = event.features?.filter(f => 
      f.source === 'congressional-districts' &&
      f.layer.id === 'congressional-districts-fill'
    );
    
    if (features?.length > 0) {
      const feature = features[0];
      setSelectedDistrict(feature.properties.OBJECTID);
      setDistrictPopupInfo({
        lngLat: event.lngLat,
        ...feature.properties
      });
      
      // Use the feature's geometry directly
      setSelectedDistrictGeometry(feature.geometry);
      
      logger.log('Selected district with geometry:', feature.geometry);
    } else {
      setSelectedDistrict(null);
      setDistrictPopupInfo(null);
      setSelectedDistrictGeometry(null);
    }
  }, [isCongressionalDistrictsVisible]);
  
  const debouncedLayerUpdate = useCallback((map, layerId, paint) => {
    if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
        if (map.getLayer(layerId)) {
            // Define the updates array here from the paint object
            const updates = Object.entries(paint);
            requestAnimationFrame(() => {
                updates.forEach(([property, value]) => {
                    map.setPaintProperty(layerId, property, value);
                });
            });
        }

        // Handle composite layers
        if (layerId.startsWith('composite')) {
            for (let i = 2; i <= 100; i++) {
                const compositeId = `${layerId}_${i}`;
                if (map.getLayer(compositeId)) {
                    const updates = Object.entries(paint); // Define updates again for composite layers
                    requestAnimationFrame(() => {
                        updates.forEach(([property, value]) => {
                            map.setPaintProperty(compositeId, property, value);
                        });
                    });
                }
            }
        }
    }, 50);
}, []);

  const clearDrawings = useCallback(() => {
    setDrawnFeatures([]);
    setIsDrawActive(false);
    setDrawingInstructions('');
    if (drawRef.current) {
      try {
        drawRef.current.deleteAll();
      } catch (err) {
        logger.warn('Error while clearing drawings:', err);
      }
    }
  }, []);

  const cursor = useMemo(() => {
    if (isDrawActive) return 'crosshair';
    if (activeLayer && !isDrawActive) return 'pointer';
    return 'default';
  }, [isDrawActive, activeLayer]);

  const toggleDrawMode = useCallback((mode) => {
    if (!mode) {
      // Turning off draw mode
      setIsDrawActive(false);
      clearDrawings();
    } else {
      // Turning on draw mode
      setIsDrawActive(true);
      setDrawingInstructions(
        mode === 'draw_polygon' 
          ? 'Click to draw polygon. Double-click to complete.' 
          : 'Click to set center point.'
      );
    }
  }, [clearDrawings]);
  

  useEffect(() => {
    if (mapRef.current) {
      logger.log('Map instance available:', !!mapRef.current.getMap());
      logger.log('Map style loaded:', mapRef.current.getMap()?.isStyleLoaded());
    }
  }, [mapRef.current]);

  useEnhancedMapLayer(mapRef.current?.getMap(), activeLayer, isDarkMode);
  




  const toggleDarkMode = useCallback(() => {
    // Clear all layers first
    if (mapRef.current) {
        const map = mapRef.current.getMap();
        
        // Clear active layer and its composite parts if they exist
        if (activeLayer) {
            if (map.getLayer(activeLayer)) {
                map.removeLayer(activeLayer);
            }
            if (map.getSource(activeLayer)) {
                map.removeSource(activeLayer);
            }
            
            // Clear composite layers
            if (activeLayer.startsWith('composite')) {
                for (let i = 2; i <= 100; i++) {
                    const compositeId = `${activeLayer}_${i}`;
                    if (map.getLayer(compositeId)) {
                        map.removeLayer(compositeId);
                    }
                    if (map.getSource(compositeId)) {
                        map.removeSource(compositeId);
                    }
                }
            }
        }
    }
    
    // Clear active layer state and custom legend colors
    setActiveLayer(null);
    setCustomLegendColors({});  // Clear all custom colors
    legendStateManager.clearAll();  // Clear saved legend states
    
    // Toggle dark mode
    setIsDarkMode(prev => !prev);
    
    // Change basemap
    setActiveBasemap(isDarkMode ? 'light' : 'dark');
    
    // Force map repaint after a short delay
    setTimeout(() => {
        if (mapRef.current) {
            const map = mapRef.current.getMap();
            if (map) {
                map.triggerRepaint();
            }
        }
    }, 100);
}, [activeLayer, isDarkMode]);

  const handleDrawButtonClick = useCallback((mode) => {
    logger.log('Starting draw mode:', mode);
    setDrawMode(mode === 'draw_radius' ? 'draw_radius' : 'draw_polygon');
    setIsDrawActive(true);
    setDrawingInstructions(
      mode === 'draw_radius' 
        ? 'Click to set center, click again to set radius' 
        : 'Click to draw polygon. Double-click to complete.'
    );
  }, []);


  
  const layerGroups = useMemo(() => ({
    combinedRisk: {
      name: 'Combined Risk Absolute Reversal',
      variants: ['ssp245', 'ssp585'],
      layers: {
        ssp245: 'CombinedRisk_ssp245',
        ssp585: 'CombinedRisk_ssp585'
      }
    },
    bufferPool: {
      name: 'Buffer Pool',
      variants: ['Insect', 'Drought', 'Fire'],
      layers: {
        Insect: 'InsectBufferPool',
        Drought: 'DroughtBufferPool',
        Fire: 'FireBufferPool'
      }
    },
    globalBufferPool: {
      name: 'Global Buffer Pool',
      variants: ['low','moderate','high'],
      layers: {
        low: 'compositeGbfLowSsp245',
        moderate: 'compositeGbfModerateSsp245',
        high: 'compositeGbfHighSsp245'
      }
    },
    globalReversal: {
      name: 'Global Reversal',
      variants: ['low', 'moderate', 'high'],
      layers: {
        low: 'compositeGrLowSsp245',
        moderate: 'compositeGrModerateSsp245',
        high: 'compositeGrHighSsp245'
      }
    },
    reversalRiskSSP585: {
      name: 'Reversal Risk SSP585',
      variants: ['Insect', 'Drought', 'Fire'],
      layers: {
        Insect: 'InsectRiskSSP585',
        Drought: 'DroughtRiskSSP585',
        Fire: 'FireRiskSSP585'
      }
    },
    reversalRiskSSP245: {
      name: 'Reversal Risk SSP245',
      variants: ['Insect', 'Drought', 'Fire'],
      layers: {
        Insect: 'InsectRiskSSP245',
        Drought: 'DroughtRiskSSP245',
        Fire: 'FireRiskSSP245'
      }
    },
    reversalRiskSSP370: {
      name: 'Reversal Risk SSP370',
      variants: ['Insect', 'Drought', 'Fire'],
      layers: {
        Insect: 'InsectRiskSSP370',
        Drought: 'DroughtRiskSSP370',
        Fire: 'FireRiskSSP370'
      }
    },
  }), []);


  const handleLayerUpdate = useCallback((layerId) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    // Add a guard to prevent unnecessary updates
    if (!map.getLayer(layerId)) return;
    
    // Check if the custom colors were set in the current theme
    const storedTheme = customLegendColors[`${layerId}_theme`];
    const currentTheme = isDarkMode ? 'dark' : 'light';
    
    const paint = (customLegendColors[layerId] && storedTheme === currentTheme)
        ? { 
            'fill-color': customLegendColors[layerId],
            'fill-opacity': 0.7,
            'fill-outline-color': 'rgba(0,0,0,0)'
          }
        : generatePaintProperty(layerId, isDarkMode);
    
    debouncedLayerUpdate(map, layerId, paint);
}, [isDarkMode, customLegendColors, debouncedLayerUpdate]);

  useEffect(() => {
    return () => {
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
    };
  }, []);


  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    eventHandlerRef.current = () => {
      if (activeLayer) {
        handleLayerUpdate(activeLayer);
      }
    };

    // Add event listeners
    map.on('styledata', eventHandlerRef.current);
    map.on('sourcedata', eventHandlerRef.current);

    return () => {
      // Remove event listeners
      map.off('styledata', eventHandlerRef.current);
      map.off('sourcedata', eventHandlerRef.current);
    };
  }, [activeLayer, handleLayerUpdate]);

  const handleLegendRangeChange = useCallback((layerId, newRanges) => {
    logger.log('Legend range change for:', layerId);
    logger.log('New ranges:', newRanges);
    
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Get the correct value key based on layer type
    const getValueKey = (id) => {
        if (id.includes('DroughtRisk')) return 'drought_risk';
        if (id.includes('InsectRisk')) return 'insect_risk';
        if (id.includes('FireRisk')) return 'fire_risk';
        return 'raster_value';
    };
    
    const valueKey = getValueKey(layerId);
    logger.log('Using value key:', valueKey);

    const newColorScale = [
        'interpolate',
        ['linear'],
        ['get', valueKey],
        ...newRanges.flatMap(range => [range.value, range.color])
    ];
    logger.log('New color scale:', newColorScale);

    // Store the colors with the theme information
    setCustomLegendColors(prev => ({
        ...prev,
        [layerId]: newColorScale,
        [`${layerId}_theme`]: isDarkMode ? 'dark' : 'light'  // Store theme information
    }));

    const paint = {
        'fill-color': newColorScale,
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0,0,0,0)'
    };

    debouncedLayerUpdate(map, layerId, paint);
}, [debouncedLayerUpdate, isDarkMode]);


const handleMapClick = useCallback((event) => {
  if (isDrawActive) return;

  if (!mapRef.current || !activeLayer) return; 
  const map = mapRef.current.getMap();

  if (isCongressionalDistrictsVisible) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['congressional-districts-fill']
    });

    if (features.length > 0) {
      const feature = features[0];
      setSelectedDistrict(feature.properties.OBJECTID);
      setDistrictPopupInfo({
        lngLat: event.lngLat,
        ...feature.properties
      });
      return; // Stop here if we clicked a district
    } else {
      setSelectedDistrict(null);
      setDistrictPopupInfo(null);
    }
  }

  // Clear any existing highlight layers first
  const highlightLayerId = 'highlight-selected-feature';
  if (map.getLayer(highlightLayerId)) {
    map.removeLayer(highlightLayerId);
  }
  if (map.getSource(highlightLayerId)) {
    map.removeSource(highlightLayerId);
  }

  const features = map.queryRenderedFeatures(event.point);
  
  const activeFeatures = features.filter(feature => {
    const layerId = feature.layer.id;
    if (!(layerId === activeLayer || layerId.startsWith(`${activeLayer}_`))) {
      return false;
    }

    // Get the appropriate value key based on layer type
    let value;
    if (layerId.includes('DroughtRisk')) {
      value = feature.properties.drought_risk;
    } else if (layerId.includes('InsectRisk')) {
      value = feature.properties.insect_risk;
    } else if (layerId.includes('FireRisk')) {
      value = feature.properties.fire_risk;
    } else {
      value = feature.properties.raster_value;
    }

    // Include 0 values for buffer pool layers and reversal risk layers
    return (layerId.includes('BufferPool') || layerId.includes('RiskSSP'))
      ? value >= 0 
      : value > 0;
  });
  
  if (activeFeatures.length > 0) {
    const feature = activeFeatures[0];
    let value;
    if (feature.layer.id.includes('DroughtRisk')) {
      value = feature.properties.drought_risk;
    } else if (feature.layer.id.includes('InsectRisk')) {
      value = feature.properties.insect_risk;
    } else if (feature.layer.id.includes('FireRisk')) {
      value = feature.properties.fire_risk;
    } else {
      value = feature.properties.raster_value;
    }

    // Get region information for reversal risk layers
    const isReversalRiskLayer = feature.layer.id.includes('RiskSSP');
    const region = isReversalRiskLayer ? feature.properties.region : null;

    // Get user-friendly layer name from layerGroups
    const getUserFriendlyLayerName = (layerId) => {
      for (const group of Object.values(layerGroups)) {
        for (const [variantKey, variantLayerId] of Object.entries(group.layers)) {
          if (variantLayerId === layerId) {
            return `${group.name} - ${variantKey.charAt(0).toUpperCase() + variantKey.slice(1)}`;
          }
        }
      }
      return formatLayerName(layerId);
    };

    setPopupInfo({
      lngLat: event.lngLat,
      layerName: getUserFriendlyLayerName(activeLayer),
      value: value,
      region: region
    });
    setClickedFeature(feature);
    
    // Create a highlight for the clicked feature regardless of ID
    try {
      // Create a GeoJSON representation of the feature
      const featureGeoJSON = {
        type: 'Feature',
        geometry: feature.geometry,
        properties: {}
      };
      
      // Add the highlight source and layer
      map.addSource(highlightLayerId, {
        type: 'geojson',
        data: featureGeoJSON
      });
      
      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: highlightLayerId,
        paint: {
          'line-color': '#06402B',
          'line-width': 3,
          'line-opacity': 1
        }
      });
      
      logger.log('Added highlight for feature:', feature.geometry.type);
    } catch (error) {
      logger.error('Error highlighting feature:', error);
    }
  } else {
    setPopupInfo(null);
    setClickedFeature(null);
  }
}, [activeLayer, isDrawActive, isCongressionalDistrictsVisible, layerGroups]);


  const removeOutlines = useCallback((layerId) => {
    if (!mapRef.current || !layerId) return;
    const map = mapRef.current.getMap();
    
    try {
      if (!map.getLayer(layerId)) return;
  
      const defaultPaint = {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'raster_value'], 0],
          0, 'rgba(0,0,0,0)',
          100, 'rgba(0,0,0,0)'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'rgba(0,0,0,0)'
      };
  
      // Add layer if it doesn't exist
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: layerId,
          paint: defaultPaint
        });
      }
  
      // Apply paint properties without reading existing values
      Object.entries(defaultPaint).forEach(([property, value]) => {
        map.setPaintProperty(layerId, property, value);
      });
  
    } catch (error) {
      logger.warn(`Error removing outlines for layer ${layerId}:`, error);
    }
  }, [mapRef]);
  

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
  
    const setupLayer = (layerId) => {
      return new Promise((resolve) => {
        if (!map.isStyleLoaded()) {
          map.once('style.load', () => setupLayer(layerId).then(resolve));
          return;
        }
  
        // Remove existing layer
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
  
        // Add null checks for layers
        if (!layers) {
          logger.error('Layers array is undefined');
          resolve();
          return;
        }

        const layerConfig = layers.find(l => l.id === layerId);
        if (!layerConfig) {
          logger.warn(`Layer config not found for layer ID: ${layerId}`);
          resolve();
          return;
        }
  
        // Ensure source exists
        if (!map.getSource(layerId)) {
          map.addSource(layerId, layerConfig.source);
        }
  
        // Add main layer with delay
        setTimeout(() => {
          const paint = generatePaintProperty(layerId, isDarkMode);
          if (paint) {
            map.addLayer({
              id: layerId,
              type: 'fill',
              source: layerId,
              'source-layer': layerConfig.layer['source-layer'],
              paint: {
                'fill-color': paint['fill-color'],
                'fill-opacity': 0.7,  // Changed from 0 to 0.7
                'fill-outline-color': 'rgba(0,0,0,0)',
                'fill-outline-opacity': 0
              },
              layout: {
                visibility: 'visible'
              },
              filter: layerId.includes('BufferPool') 
          ? ['>=', ['get', 'raster_value'], 0]  // Include 0 for buffer pools
          : layerId.includes('DroughtRisk')
          ? ['>=', ['get', 'drought_risk'], 0]  // Include 0 for drought risk
          : layerId.includes('InsectRisk')
          ? ['>=', ['get', 'insect_risk'], 0]   // Include 0 for insect risk
          : layerId.includes('FireRisk')
          ? ['>=', ['get', 'fire_risk'], 0]     // Include 0 for fire risk
          : ['>', ['get', 'raster_value'], 0]   // Exclude 0 for other layers
        });
            
  
            // Remove fade in since we're setting initial opacity to 0.7
            if (layerId.startsWith('composite')) {
              for (let i = 2; i <= 100; i++) {
                const compositeId = `${layerId}_${i}`;
                const sourceLayer = layerConfig.layer['source-layer'].replace('_1_', `_${i}_`);
                
                if (map.getLayer(compositeId)) {
                  map.removeLayer(compositeId);
                }
  
                const compositeSourceId = `${layerId}_${i}`;
                if (!map.getSource(compositeSourceId)) {
                  map.addSource(compositeSourceId, {
                    type: 'vector',
                    url: `mapbox://pkulandh.${layerId.toLowerCase()}_part_${i}`
                  });
                }
  
                map.addLayer({
                  id: compositeId,
                  type: 'fill',
                  source: compositeSourceId,
                  'source-layer': sourceLayer,
                  paint: {
                    'fill-color': paint['fill-color'],
                    'fill-opacity': 0.7,  // Changed from 0 to 0.7
                    'fill-outline-color': 'rgba(0,0,0,0)',
                    'fill-outline-opacity': 0
                  },
                  layout: {
                    visibility: 'visible'
                  }
                });
              }
            }
            resolve();
          }
        }, 100);
      });
    };
  
    // Only keep the style load handler
    const handleStyleLoad = () => {
      if (activeLayer) {
        setupLayer(activeLayer);
      }
    };
  
    // Add only style.load event listener
    map.on('style.load', handleStyleLoad);
  
    // Initial setup with a small delay
    if (map.isStyleLoaded() && activeLayer) {
      setTimeout(() => {
        setupLayer(activeLayer);
      }, 100);
    }
  
    // Cleanup
    return () => {
      map.off('style.load', handleStyleLoad);
      
      if (map && map.isStyleLoaded() && activeLayer) {
        if (map.getLayer(activeLayer)) {
          map.removeLayer(activeLayer);
        }
        if (activeLayer.startsWith('composite')) {
          for (let i = 2; i <= 100; i++) {
            const compositeId = `${activeLayer}_${i}`;
            if (map.getLayer(compositeId)) {
              map.removeLayer(compositeId);
            }
          }
        }
      }
    };
}, [activeLayer, isDarkMode, updateLayerStyle]);

  const handleBoundsChange = useCallback((bounds) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    try {
      // Store current layer visibility states
      const layerStates = {};
      if (activeLayer) {
        layerStates[activeLayer] = map.getLayoutProperty(activeLayer, 'visibility');
        if (activeLayer.startsWith('composite')) {
          for (let i = 2; i <= 100; i++) {
            const compositeId = `${activeLayer}_${i}`;
            if (map.getLayer(compositeId)) {
              layerStates[compositeId] = map.getLayoutProperty(compositeId, 'visibility');
            }
          }
        }
      }

      // Fit to bounds
      map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]]
        ],
        {
          padding: 50,
          duration: 2000
        }
      );

      // Restore layer visibility states after a short delay
      setTimeout(() => {
        Object.entries(layerStates).forEach(([layerId, visibility]) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          }
        });
        
        // Reapply styles
        if (activeLayer) {
          removeOutlines(activeLayer);
        }
      }, 100);

    } catch (error) {
      logger.error('Error handling bounds change:', error);
    }
  }, [mapRef, activeLayer, removeOutlines]);

  
  // Function to clear highlight layers from map
  const clearHighlight = useCallback(() => {
    if (!mapRef.current) return;
    
    try {
      const map = mapRef.current.getMap();
      const highlightLayerId = 'highlight-selected-feature';
      
      // Remove highlight layer if it exists
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      
      // Remove highlight source if it exists
      if (map.getSource(highlightLayerId)) {
        map.removeSource(highlightLayerId);
      }
    } catch (error) {
      logger.error('Error clearing highlight:', error);
    }
  }, []);

  const toggleLayer = useCallback((groupId, variantId) => {
    try {
      // Check if the group and variant exist
      if (!layerGroups[groupId] || !layerGroups[groupId].layers || !layerGroups[groupId].layers[variantId]) {
        logger.error(`Layer not found for group: ${groupId}, variant: ${variantId}`);
        return;
      }
      
      const layerId = layerGroups[groupId].layers[variantId];
      
      // Define US-specific layer groups
      const usLayerGroups = ['bufferPool', 'reversalRiskSSP245', 'reversalRiskSSP370', 'reversalRiskSSP585'];
      
      setActiveLayer(prevActiveLayer => {
        // Clear district popup when switching layers
        if (layerId !== prevActiveLayer) {
          setPopupInfo(null);
          setClickedFeature(null);
          setDistrictPopupInfo(null);
          setSelectedDistrict(null);
          setSelectedDistrictGeometry(null); // Clear the geometry
          clearHighlight(); // Clear the feature highlight
          
          // If this is a US layer and we're switching to it, zoom to US
          if (usLayerGroups.includes(groupId) && mapRef.current) {
            const map = mapRef.current.getMap();
            map.fitBounds([
              [-125.0, 20.0], // Southwest coordinates (longitude, latitude)
              [-66.0, 50.0]   // Northeast coordinates (longitude, latitude)
            ], {
              padding: 50,
              duration: 1500
            });
          }
        }
        return prevActiveLayer === layerId ? null : layerId;
      });
    } catch (error) {
      logger.error('Error toggling layer:', error);
    }
  }, [layerGroups, clearHighlight]);

  useEffect(() => {
    // Clear any existing popup when active layer changes
    setPopupInfo(null);
    setClickedFeature(null);
    clearHighlight();
  }, [activeLayer, clearHighlight]);



  
  const handleBasemapChange = useCallback((newBasemap) => {
    setActiveLayer(null);
    setActiveBasemap(newBasemap);
    setPopupInfo(null);
    setClickedFeature(null);
    clearHighlight();
  }, [clearHighlight]);






  const handleDownloadData = useCallback((layerId) => {
    if (!mapRef.current) return;

    try {
      const map = mapRef.current.getMap();
      const bounds = drawnFeatures.length > 0 
        ? getBoundsFromFeatures(drawnFeatures)
        : getCurrentMapBounds(map);

      downloadLayerDataAsCSV(layerId, map, bounds, drawnFeatures);
      
      // Clear drawings after download
      clearDrawings();

    } catch (error) {
      logger.error('Error in handleDownloadData:', error);
      alert('An error occurred while preparing the download. Please try again.');
    }
  }, [drawnFeatures, mapRef, clearDrawings]);

// Helper function to add
const getBoundsFromFeatures = (features) => {
  if (!features.length) return null;
  
  const bounds = new mapboxgl.LngLatBounds();
  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach(coord => {
        bounds.extend(coord);
      });
    }
  });
  
  return bounds.toArray().flat();
};

  const isValidGeoJSON = (geoJSON) => {
    logger.log('Validating GeoJSON:', JSON.stringify(geoJSON, null, 2));
    if (!geoJSON || typeof geoJSON !== 'object') {
      logger.log('GeoJSON is not an object');
      return false;
    }
    if (geoJSON.type !== 'FeatureCollection') {
      logger.log('GeoJSON type is not FeatureCollection, it is:', geoJSON.type);
      return false;
    }
    if (!Array.isArray(geoJSON.features)) {
      logger.log('GeoJSON does not have a features array');
      return false;
    }
    if (geoJSON.features.length === 0) {
      logger.log('GeoJSON features array is empty');
      return false;
    }
    logger.log('GeoJSON is valid');
    return true;
  };

  const handleFileUpload = useCallback((geoJSON, fileName) => {
    try {
        if (!isValidGeoJSON(geoJSON)) {
            throw new Error('Invalid GeoJSON structure');
        }

        // Ensure we have a FeatureCollection
        const featureCollection = geoJSON.type === 'Feature'
            ? { type: 'FeatureCollection', features: [geoJSON] }
            : geoJSON;

        // Handle GeometryCollection by expanding its geometries into individual features
        const expandedFeatures = featureCollection.features.flatMap(feature => {
            if (feature.geometry && feature.geometry.type === 'GeometryCollection') {
                // Expand each geometry within the GeometryCollection into a separate feature
                return feature.geometry.geometries.map(geometry => ({
                    type: 'Feature',
                    geometry,
                    properties: feature.properties || {}
                }));
            } else {
                return feature; // Include the feature as is if it's not a GeometryCollection
            }
        });

        // Filter out any invalid geometries
        const validFeatures = expandedFeatures.filter(feature => 
            feature && feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0
        );

        if (validFeatures.length === 0) {
            throw new Error('GeoJSON has no valid features');
        }

        const newLayer = {
            id: `uploaded-${Date.now()}`,
            name: fileName,
            data: { type: 'FeatureCollection', features: validFeatures },
        };
        setUploadedLayers(prevLayers => [...prevLayers, newLayer]);
        setActiveUploadedLayers(prevActive => [...prevActive, newLayer.id]);
        setUploadError(null);

        // Fit the map to the bounds of the uploaded GeoJSON
        if (mapRef.current && validFeatures.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            validFeatures.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    if (feature.geometry.type === 'Point') {
                        bounds.extend(feature.geometry.coordinates);
                    } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(polygon => {
                            polygon.forEach(coord => bounds.extend(coord));
                        });
                    } else if (feature.geometry.type === 'LineString') {
                        feature.geometry.coordinates.forEach(coord => bounds.extend(coord));
                    }
                }
            });
            mapRef.current.fitBounds(bounds, { padding: 40, duration: 1000 });
        }
    } catch (error) {
        logger.error('Error processing uploaded file:', error);
        setUploadError(error.message);
    }
}, []);


  const toggleUploadedLayer = useCallback((layerId) => {
    setActiveUploadedLayers(prevActive => 
      prevActive.includes(layerId)
        ? prevActive.filter(id => id !== layerId)
        : [...prevActive, layerId]
    );
  }, []);



  const mapStyle = useMemo(() => basemaps.find(b => b.id === activeBasemap).style, [activeBasemap]);


  // Final cleanup effect for when the component unmounts completely
  useEffect(() => {
    // Return cleanup function
    return () => {
      // Clear any timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Clean up map if it exists
      if (mapRef.current) {
        try {
          const map = mapRef.current.getMap();
          if (map) {
            // Remove event listeners
            if (eventHandlerRef.current) {
              map.off('styledata', eventHandlerRef.current);
              map.off('sourcedata', eventHandlerRef.current);
            }
            
            // Clean up draw tools
            if (drawRef.current && typeof drawRef.current.onRemove === 'function') {
              try {
                map.removeControl(drawRef.current);
                drawRef.current = null;
              } catch (err) {
                logger.warn('Error cleaning up draw tools:', err);
              }
            }

            // Clean up active layers
            if (activeLayer) {
              try {
                if (map.getLayer(activeLayer)) {
                  map.removeLayer(activeLayer);
                }
                if (map.getSource(activeLayer)) {
                  map.removeSource(activeLayer);
                }
              } catch (err) {
                logger.warn('Error cleaning up active layer:', err);
              }
            }
          }
        } catch (err) {
          logger.warn('Error during map cleanup:', err);
        }
      }
    };
  }, [activeLayer]);

  return (
    <div className="flex h-screen w-full relative">
      {/* Left Panel with SlidingPanel */}
          <SlidingPanel 
          isDarkMode={isDarkMode}
          onCollapsedChange={() => {
            // Force map resize after panel animation
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.getMap().resize();
              }
            }, 300);
          }}
        >
        <div className={`w-[300px] h-full flex flex-col ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`flex-none p-3 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              fitBounds={handleBoundsChange}
              handleViewportChange={handleViewportChange}
              viewport={viewport}
              isDarkMode={isDarkMode}
            />
          </div>
          
          
          {/* LayerControl*/}
          <div className="flex-1 overflow-hidden">
          <LayerControl
            activeLayer={activeLayer}
            toggleLayer={toggleLayer}
            isDarkMode={isDarkMode}
            onLegendRangeChange={handleLegendRangeChange}
            onDownloadData={handleDownloadData}
            toggleDrawMode={toggleDrawMode}
            isDrawActive={isDrawActive}
            drawnFeatures={drawnFeatures}
            onFileUpload={handleFileUpload}
            uploadedLayers={uploadedLayers}
            activeUploadedLayers={activeUploadedLayers}
            toggleUploadedLayer={toggleUploadedLayer}
            setUploadedLayers={setUploadedLayers}
            onDrawButtonClick={handleDrawButtonClick}
            clearDrawings={clearDrawings}
            layers={layers}
            drawingInstructions={drawingInstructions}
            layerGroups={layerGroups}
            mapRef={mapRef}
            updateMapOpacity={updateMapOpacity}
            getMapLayerOpacity={getMapLayerOpacity}
            updateUploadedLayerOpacity={updateUploadedLayerOpacity}
            getUploadedLayerOpacity={getUploadedLayerOpacity}
            isCongressionalDistrictsVisible={isCongressionalDistrictsVisible}
            toggleCongressionalDistricts={toggleCongressionalDistricts}
            setUploadStatus={setUploadStatus}

          />
          </div>
        </div>
      </SlidingPanel>
  

      <UploadNotification 
        uploadStatus={uploadStatus}
        isDarkMode={isDarkMode}
      />
  
      {/* Map Container */}
      <div 
        id="map-content" 
        className="fixed top-0 right-0 h-full transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: '300px',  // Initial margin to match panel width
          width: 'calc(100% - 300px)'  // Initial width accounting for panel
        }}
      >



        
        <Map
          {...viewport}
          ref={mapRef}
          style={{width: '100%', height: '100%'}}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={(evt) => handleViewportChange(evt.viewState)}
          onClick={handleMapClick}
          mapLib={mapboxgl}
          renderWorldCopies={false}
          cursor={cursor}
        >


          
        <CongressionalDistrictsLayer 
          isDarkMode={isDarkMode}
          visible={isCongressionalDistrictsVisible}
          selectedFeatureId={selectedDistrict}
        />
          {districtPopupInfo && (
            <Popup
              longitude={districtPopupInfo.lngLat.lng}
              latitude={districtPopupInfo.lngLat.lat}
              closeButton={true}
              closeOnClick={false}
              onClose={() => {
                setDistrictPopupInfo(null);
                setSelectedDistrict(null);
                setSelectedDistrictGeometry(null); // Clear the geometry
              }}
              className={isDarkMode ? 'dark-popup' : ''}
            >
              <CongressionalDistrictPopup 
                info={districtPopupInfo}
                isDarkMode={isDarkMode}
              />
            </Popup>
          )}
        <DrawControl 
          ref={drawRef} 
          isDrawActive={isDrawActive}
          drawMode={drawMode}
          onDrawComplete={(features) => {
            setDrawnFeatures(features);
          }}
          onDrawCancel={() => {
            setIsDrawActive(false);
            clearDrawings();
          }}
          isDarkMode={isDarkMode}
          instructions={drawingInstructions}  
        />
        {activeLayer && layers && layers.find(l => l.id === activeLayer) && (
          <Source 
            key={activeLayer} 
            id={activeLayer} 
            {...layers.find(l => l.id === activeLayer).source}
          >
            <Layer 
              {...layers.find(l => l.id === activeLayer).layer}
              style={{ pointerEvents: isDrawActive ? 'none' : 'auto' }}
            />
          </Source>
        )}
          {uploadedLayers.map((layer, index) => (  // Added index parameter here
              activeUploadedLayers.includes(layer.id) && (
        <Source 
            key={layer.id}
            type="geojson" 
            data={layer.data}
        >
            <Layer
                key={layer.id}
                id={`${layer.id}`}
                type="fill"
                paint={{
                    'fill-color': LAYER_COLORS[index % LAYER_COLORS.length],
                    'fill-opacity': getUploadedLayerOpacity(layer.id),
                    'fill-outline-color': LAYER_COLORS[index % LAYER_COLORS.length]
                }}
            />
            <Layer
                key={`${layer.id}-outline`}
                id={`${layer.id}-outline`}
                type="line"
                paint={{
                    'line-color': LAYER_COLORS[index % LAYER_COLORS.length],
                    'line-opacity': getUploadedLayerOpacity(layer.id),
                    'line-width': 1
                }}
            />
        </Source>
          )
        ))}
      {isDrawMode && (
          <button
            onClick={() => toggleDrawMode(null)}
            className="absolute top-20 right-4 px-3 py-2 bg-red-600 text-white rounded"
          >
            Cancel Drawing
          </button>
        )}

      {popupInfo && !isDrawActive && activeLayer && (
        <Popup
          longitude={popupInfo.lngLat.lng}
          latitude={popupInfo.lngLat.lat}
          closeButton={true}
          closeOnClick={false}
          onClose={() => {
            setPopupInfo(null);
            setClickedFeature(null);
          }}
          className={isDarkMode ? 'dark-popup' : ''}
        >
          <DarkPopup info={popupInfo} isDarkMode={isDarkMode} />
        </Popup>
      )}

      <ScaleControl 
        maxWidth={100} 
        unit="imperial"  
        position='top-right'
        style={{ 
          top: 10, 
          right: 70,
          backgroundColor: isDarkMode ? '#1f2937' : 'white',
          color: isDarkMode ? '#e5e7eb' : 'inherit'
        }} 
      />
      {/* Moved the Dark Mode Toggle from left upper corner of the map to the right section below the trash icon since the map is chnaged for absolute position */}
      <MapControls 
        view={view}
        setView={setView}
        isBasemapOpen={isBasemapOpen}
        setIsBasemapOpen={setIsBasemapOpen}
        activeBasemap={activeBasemap}
        setActiveBasemap={handleBasemapChange}
        basemaps={basemaps}
        isDarkMode={isDarkMode}
        mapRef={mapRef}
        activeLayer={activeLayer}
        onDarkModeToggle={toggleDarkMode}
      />

      {activeLayer && layers && layers.find(l => l.id === activeLayer) && (
        <CollapsibleLegend 
          layer={layers.find(l => l.id === activeLayer)}
          onRangeChange={handleLegendRangeChange}
          isDarkMode={isDarkMode}
        />
      )}


      {uploadedLayers.length > 0 && activeLayer && (
        <>
          <AreaStats
            uploadedFeatures={uploadedLayers[0]?.data?.features}
            activeLayer={activeLayer}
            isDarkMode={isDarkMode}
            map={mapRef.current?.getMap()}
            positionClass="left-16"
            onFeaturesDataChange={setUploadedAreaFeaturesData}
          />
          <DownloadButton
            featuresData={uploadedAreaFeaturesData}
            activeLayer={activeLayer}
            uploadedFeatures={uploadedLayers[0]?.data?.features}
            isDarkMode={isDarkMode}
            positionClass="left-[26rem]"
          />
        </>
      )}

      {selectedDistrict && activeLayer && selectedDistrictGeometry && (
        <>
          <AreaStats
            uploadedFeatures={[{
              type: 'Feature',
              properties: {
                name: districtPopupInfo?.NAMELSAD20 || 'Congressional District'
              },
              geometry: selectedDistrictGeometry
            }]}
            activeLayer={activeLayer}
            isDarkMode={isDarkMode}
            map={mapRef.current?.getMap()}
            isCongressionalDistrict={true}
            positionClass="right-16"
            onFeaturesDataChange={setDistrictFeaturesData}
          />
          <DownloadButton
            featuresData={districtFeaturesData}
            activeLayer={activeLayer}
            uploadedFeatures={[{
              type: 'Feature',
              properties: {
                name: districtPopupInfo?.NAMELSAD20 || 'Congressional District'
              },
              geometry: selectedDistrictGeometry
            }]}
            isDarkMode={isDarkMode}
            positionClass="right-[26rem]"
          />
        </>
      )}

=
      </Map>

      {viewport.zoom > 5 && <MiniMap mainViewport={viewport} />}
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            background: 'white',
            padding: '5px',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            
        </div>
      </div>

    </div>
    );
    };

export default React.memo(MapComponent);