class LegendStateManager {
    constructor() {
      this._legendStates = new Map();
      this._defaultStates = new Map();
    }
  
    getLegendState(layerId) {
      return this._legendStates.get(layerId) || this._defaultStates.get(layerId);
    }
  
    updateLegendState(layerId, ranges) {
      // Store the original state if we haven't yet
      if (!this._defaultStates.has(layerId)) {
        this._defaultStates.set(layerId, [...ranges]);
      }
      this._legendStates.set(layerId, ranges);
    }
  
    resetLegendState(layerId) {
      const defaultState = this._defaultStates.get(layerId);
      if (defaultState) {
        this._legendStates.set(layerId, [...defaultState]);
      } else {
        this._legendStates.delete(layerId);
      }
    }
  
    clearAll() {
      this._legendStates.clear();
      this._defaultStates.clear();
    }
  
    // New method to check if a layer has custom state
    hasCustomState(layerId) {
      return this._legendStates.has(layerId);
    }
  }
  
  
  // Create and export a single instance
  const legendStateManager = new LegendStateManager();
  export default legendStateManager;