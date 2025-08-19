import React, { useState } from 'react';
import { Info, X } from 'lucide-react';


  const getLayerDescription = (title) => {
    const descriptions = {
      "Global Buffer Pool": "Global assessment of the buffer pool needed to secure forest carbon offsets. Displays worldwide estimates of the carbon storage capacity required to counteract disturbances.",
      "Global Reversal": "Global evaluation of carbon reversal risk, indicating the potential loss of forest carbon stocks due to climate-sensitive disturbances. Measured on a risk index (0-100).",
      "Buffer Pool": "Provides the estimated buffer pool contribution required to offset carbon losses in forests, based on aggregated disturbance risks.",
      "Reversal Risk SSP585": "Displays carbon reversal risk under a high-emissions scenario (SSP5-8.5). Highlights regions most vulnerable to extreme climate impacts using a risk index (0-100).",
      "Reversal Risk SSP245": "Shows carbon reversal risk under a moderate-emissions scenario (SSP2-4.5), indicating areas with varying vulnerability to carbon loss due to climate disturbances, measured on a risk index (0-100)."
    };
  
    return descriptions[title] || "Detailed information about this layer's characteristics and metrics. Click the layer buttons to visualize different aspects of the data.";
  };
  


const InfoTooltip = ({ title, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`p-1 rounded-full transition-colors ${
          isDarkMode
            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        aria-label={`Information about ${title}`}
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Modal */}
          <div 
            className={`relative w-full max-w-md rounded-lg shadow-lg ${
              isDarkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {getLayerDescription(title)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoTooltip;