// @ts-nocheck
'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { MapPaintProvider } from './contexts/MapPaintContext';
import IntroPage from './components/ui/IntroPage';
import HelpButton from './components/ui/HelpButton';

const MapComponent = dynamic(() => import('./components/map/MapComponent'), {
  ssr: false,
});

/**
 * Main application component
 */
function App() {
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
            <MapPaintProvider map={null}>
              <MapComponent />
            </MapPaintProvider>
          )}
          <HelpButton onClick={handleOpenHelp} />
        </>
      )}
    </>
  );
}

export default App;
