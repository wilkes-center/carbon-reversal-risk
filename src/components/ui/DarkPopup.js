// src/components/DarkPopup.js
import React from 'react';

const DarkPopup = ({ info, isDarkMode }) => (
  <div className={`p-2 ${
    isDarkMode 
      ? 'bg-obsidian text-white font-sans' 
      : 'bg-white text-obsidian font-sans'
  }`}>
    <h3 className="text-sm font-semibold mb-1 font-sora">{info.layerName}</h3>
    <p className="text-xs">{info.value}</p>
    {info.region && (
      <p className="text-xs mt-1">
        <span className="font-semibold">Region: </span>
        {info.region}
      </p>
    )}
  </div>
);

export default DarkPopup;