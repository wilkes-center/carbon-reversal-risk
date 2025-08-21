import React, { useCallback } from 'react';
import { Download } from 'lucide-react';
import { logger } from '../../utils/logger';

const DownloadButton = ({ 
  featuresData = [], 
  activeLayer, 
  uploadedFeatures, 
  isDarkMode,
  positionClass = "left-[26rem]"
}) => {
  const downloadData = useCallback(() => {
    if (!featuresData.length || !activeLayer) {
      alert('No data available to download');
      return;
    }

    try {
      // Check if this is a reversal risk layer
      const isReversalRiskLayer = activeLayer && activeLayer.includes('RiskSSP');
      
      // Generate CSV content with conditional region column
      const headers = isReversalRiskLayer 
        ? ['feature_id', 'latitude', 'longitude', 'value', 'region']
        : ['feature_id', 'latitude', 'longitude', 'value'];
      
      const rows = featuresData.map((feature, index) => {
        const baseRow = `${index + 1},${feature.latitude.toFixed(6)},${feature.longitude.toFixed(6)},${feature.value}`;
        return isReversalRiskLayer 
          ? `${baseRow},${feature.region || 'N/A'}`
          : baseRow;
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const areaName = uploadedFeatures?.[0]?.properties?.name || 
                       uploadedFeatures?.[0]?.properties?.NAMELSAD20 || 
                       'uploaded_area';
      const fileName = `${activeLayer}_${areaName}_${timestamp}.csv`;

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error downloading data:', error);
      alert('An error occurred while downloading the data. Please try again.');
    }
  }, [featuresData, activeLayer, uploadedFeatures]);

  // Don't render if no data available
  if (!featuresData.length || !activeLayer) {
    return null;
  }

  return (
    <div className={`
      absolute bottom-8 ${positionClass} z-10
      rounded-lg shadow-lg border
      ${isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'}
    `}>
      <button
        onClick={downloadData}
        className={`
          flex items-center gap-2 p-3
          text-sm font-medium transition-colors
          ${isDarkMode 
            ? 'text-slate-200 hover:bg-slate-700' 
            : 'text-slate-700 hover:bg-slate-50'}
        `}
        title={`Download ${featuresData.length.toLocaleString()} data points as CSV`}
      >
        <Download size={16} />
        <span>Download Data</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-600'
        }`}>
          {featuresData.length.toLocaleString()}
        </span>
      </button>
    </div>
  );
};

export default DownloadButton;