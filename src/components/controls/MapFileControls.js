import React from 'react';
import { Download, Upload } from 'lucide-react';

const MapFileControls = ({ 
  onFileUpload, 
  onDownloadClick,
  isDarkMode  // Add isDarkMode prop
}) => {
  const fileInputRef = React.useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-lg shadow-lg p-1.5 border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="bg-white rounded-lg shadow-lg p-1.5 flex items-center gap-1.5 border border-gray-200">
        <button
          onClick={onDownloadClick}
          className="flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          title="Download layer data"
        >
          <Download size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-200" />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.geojson,.kml,.zip,.shp"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
          title="Upload KML/Shapefile"
        >
          <Upload size={18} />
        </button>
      </div>
    </div>
  );
};

export default MapFileControls;