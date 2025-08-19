import { MapPaintProvider } from './contexts/MapPaintContext';
import MapComponent from './components/map/MapComponent';
import IntroPage from './components/ui/IntroPage';
import HelpButton from './components/ui/HelpButton';
import useMapPerformance from './hooks/map/useMapPerformance';
import './styles/green-borders.css'; 
import React, { useRef, useState, useEffect } from 'react';
import GuidedTour from './components/ui/GuidedTour';

/**
 * Main application component
 */
function App() {
  const mapRef = useRef(null);
  const { getPerformanceMetrics } = useMapPerformance(mapRef.current);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [mapMounted, setMapMounted] = useState(false);

  // Check if intro page has been seen before
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro === 'true') {
      setShowIntro(false);
    }
  }, []);

  // Handle map mounting status
  useEffect(() => {
    if (!showIntro && !mapMounted) {
      setMapMounted(true);
    }
  }, [showIntro, mapMounted]);

  // Handle when user completes intro
  const handleIntroComplete = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setShowIntro(false);
  };

  // Handle reopening the intro page with safe map unmounting
  const handleOpenHelp = () => {
    // First unmount the map safely
    setMapMounted(false);
    
    // Use setTimeout to ensure the map is fully unmounted before showing intro
    setTimeout(() => {
      setShowIntro(true);
    }, 100);
  };

  return (
    <>
      {showIntro ? (
        <IntroPage onComplete={handleIntroComplete} />
      ) : (
        <>
          {mapMounted && (
            <MapPaintProvider map={mapRef.current}>
              <MapComponent 
                mapRef={mapRef}
                onPerformanceCheck={getPerformanceMetrics}
              />
            </MapPaintProvider>
          )}
          <HelpButton onClick={handleOpenHelp} />
        </>
      )}
    </>
  );
}

export default App;