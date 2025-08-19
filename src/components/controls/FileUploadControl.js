import React, { useRef, useState, useCallback } from 'react';
import toGeoJSON from '@mapbox/togeojson';
import { Upload, Loader } from 'lucide-react';
import JSZip from 'jszip';
import { handleShapefile } from '../../utils/map/shapefileHandler';;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_FORMATS = {
  '.geojson': 'GeoJSON',
  '.kml': 'KML',
  '.kmz': 'KMZ',
  '.zip': 'Shapefile',
};

const FileUploadControl = ({ onFileUpload, setUploadStatus }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFile = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!Object.keys(ACCEPTED_FORMATS).includes(extension)) {
      setUploadStatus(`Unsupported file format. Accepted formats: ${Object.values(ACCEPTED_FORMATS).join(', ')}`);
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return null;
    }

    return extension;
  };

  const handleGeoJSON = async (file) => {
    try {
      setUploadStatus('Reading GeoJSON content...');
      const text = await file.text();
      
      setUploadStatus('Parsing GeoJSON structure...');
      const geoJSON = JSON.parse(text);
      
      if (!geoJSON.type || !geoJSON.features) {
        setUploadStatus('Invalid GeoJSON structure');
        return null;
      }
      
      setUploadStatus('Validating GeoJSON features...');
      return geoJSON;
    } catch (error) {
      setUploadStatus(`Invalid GeoJSON file: ${error.message}`);
      return null;
    }
  };
  
  const handleKML = async (file) => {
    try {
      setUploadStatus('Reading KML content...');
      const text = await file.text();
      
      setUploadStatus('Parsing KML structure...');
      const parser = new DOMParser();
      const kml = parser.parseFromString(text, 'text/xml');
      
      if (kml.getElementsByTagName('parsererror').length > 0) {
        setUploadStatus('Invalid KML file structure');
        return null;
      }
      
      setUploadStatus('Converting KML to GeoJSON...');
      const geoJSON = toGeoJSON.kml(kml);
      
      if (!geoJSON || !geoJSON.features) {
        setUploadStatus('Could not convert KML to GeoJSON');
        return null;
      }
      
      setUploadStatus('Validating converted features...');
      return geoJSON;
    } catch (error) {
      setUploadStatus(`KML processing failed: ${error.message}`);
      return null;
    }
  };

  const handleKMZ = async (file) => {
    try {
      setUploadStatus('Reading KMZ file...');
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // Find the first KML file in the archive
      const kmlFile = Object.values(zipContent.files).find(file => 
        file.name.toLowerCase().endsWith('.kml')
      );
      
      if (!kmlFile) {
        setUploadStatus('No KML file found in KMZ archive');
        return null;
      }
      
      setUploadStatus('Extracting KML from KMZ...');
      const kmlContent = await kmlFile.async('text');
      
      setUploadStatus('Parsing KML structure...');
      const parser = new DOMParser();
      const kml = parser.parseFromString(kmlContent, 'text/xml');
      
      if (kml.getElementsByTagName('parsererror').length > 0) {
        setUploadStatus('Invalid KML structure in KMZ file');
        return null;
      }
      
      setUploadStatus('Converting KML to GeoJSON...');
      const geoJSON = toGeoJSON.kml(kml);
      
      if (!geoJSON || !geoJSON.features) {
        setUploadStatus('Could not convert KMZ to GeoJSON');
        return null;
      }
      
      setUploadStatus('Validating converted features...');
      return geoJSON;
    } catch (error) {
      setUploadStatus(`KMZ processing failed: ${error.message}`);
      return null;
    }
  };

  const processFile = async (file) => {
    try {
      const extension = validateFile(file);
      if (!extension) {
        setIsLoading(false);
        return;
      }

      let geoJSON;
      setIsLoading(true);
  
      switch (extension) {
        case '.json':
        case '.geojson':
          setUploadStatus('Processing GeoJSON file...');
          geoJSON = await handleGeoJSON(file);
          break;
        case '.kml':
          setUploadStatus('Processing KML file...');
          geoJSON = await handleKML(file);
          break;
        case '.kmz':
          setUploadStatus('Processing KMZ file...');
          geoJSON = await handleKMZ(file);
          break;
        case '.zip':
          setUploadStatus('Extracting Shapefile...');
          geoJSON = await handleShapefile(file, (status) => {
            setUploadStatus(status);
          });
          break;
        default:
          setUploadStatus('Unsupported file format');
          return;
      }
  
      if (!geoJSON || !geoJSON.features || !geoJSON.features.length) {
        setUploadStatus('No valid features found in file');
        return;
      }
  
      setUploadStatus(`Successfully processed ${file.name} (${geoJSON.features.length} features)`);
      onFileUpload(geoJSON, file.name);
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      console.error('File processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded transition-colors
          ${isDragging 
            ? 'bg-blue-100 border-blue-400' 
            : 'bg-blue-50 hover:bg-blue-100'} 
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          border border-blue-200`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          accept=".json,.geojson,.kml,.kmz,.zip"
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-center gap-2 py-3">
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Processing...
                </span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Drop file or click to upload
                </span>
              </>
            )}
          </div>

          <div className="text-sm text-blue-700 text-center pb-2">
            Supported: {Object.values(ACCEPTED_FORMATS).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadControl;