import { useEffect, useRef, useCallback } from 'react';

// Changed to a default export
const useMapPerformance = (map) => {
  const frameTimeRef = useRef([]);
  const paintCountRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  const measureFrameTime = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      frameTimeRef.current.push(duration);
      
      // Keep only last 60 frames
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift();
      }
    };
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
    const maxFrameTime = Math.max(...frameTimeRef.current);
    const fps = 1000 / avgFrameTime;

    return {
      averageFrameTime: avgFrameTime.toFixed(2),
      maxFrameTime: maxFrameTime.toFixed(2),
      fps: fps.toFixed(1),
      paintCount: paintCountRef.current,
      lastUpdate: new Date(lastUpdateRef.current).toISOString()
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    let frameId;
    const measureFrame = measureFrameTime();

    const handleRender = () => {
      paintCountRef.current++;
      lastUpdateRef.current = Date.now();
      measureFrame();
      frameId = requestAnimationFrame(handleRender);
    };

    handleRender();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [map, measureFrameTime]);

  return { getPerformanceMetrics };
};

export default useMapPerformance;