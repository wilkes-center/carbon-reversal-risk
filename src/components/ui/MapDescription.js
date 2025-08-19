import React from 'react';
import { Info } from 'lucide-react';

const layerDescriptions = {
  // Buffer Pool Descriptions
  InsectBufferPool: {
    title: "Insect Buffer Pool",
    description:
      "Buffer pool contribution required to offset insect-driven carbon losses in US forests.",
    metric: "Carbon storage capacity (tons/hectare)"
  },
  DroughtBufferPool: {
    title: "Drought Buffer Pool",
    description:
      "Buffer pool contribution required to offset drought-driven carbon losses in US forests",
    metric: "Carbon storage capacity (tons/hectare)"
  },
  FireBufferPool: {
    title: "Fire Buffer Pool",
    description:
      "Buffer pool contribution required to offset fire-driven carbon losses in US forests.",
    metric: "Carbon storage capacity (tons/hectare)"
  },

  // Risk Scenarios SSP245
  CombinedRisk_ssp245: {
    title: "Combined Risk (SSP2-4.5)",
    description:
      "Moderate emissions scenario combining drought, fire, and insect risks. Shows overall vulnerability of carbon stocks under sustainable socioeconomic development.",
    metric: "Risk index (0-100)"
  },
  DroughtRiskSSP245: {
    title: "Drought Risk (SSP2-4.5)",
    description:
      "Projects drought vulnerability under moderate emissions scenario. Higher values indicate greater risk of carbon loss due to drought events.",
    metric: "Risk index (0-100)"
  },
  InsectRiskSSP245: {
    title: "Insect Risk (SSP2-4.5)",
    description:
      "Assesses potential insect-related carbon loss under moderate emissions. Higher values show increased vulnerability to insect disturbances.",
    metric: "Risk index (0-100)"
  },
  FireRiskSSP245: {
    title: "Fire Risk (SSP2-4.5)",
    description:
      "Evaluates wildfire risk under moderate emissions scenario. Higher values indicate greater vulnerability to fire-related carbon loss.",
    metric: "Risk index (0-100)"
  },

  // Risk Scenarios SSP585
  CombinedRisk_ssp585: {
    title: "Combined Risk (SSP5-8.5)",
    description:
      "High emissions scenario combining multiple risks. Represents worst-case vulnerability assessment for carbon stock maintenance.",
    metric: "Risk index (0-100)"
  },
  DroughtRiskSSP585: {
    title: "Drought Risk (SSP5-8.5)",
    description:
      "High emissions drought risk projection. Shows potential carbon loss in extreme climate scenarios due to drought.",
    metric: "Risk index (0-100)"
  },
  InsectRiskSSP585: {
    title: "Insect Risk (SSP5-8.5)",
    description:
      "High emissions insect vulnerability assessment. Indicates regions at risk of insect-related carbon loss in extreme scenarios.",
    metric: "Risk index (0-100)"
  },
  FireRiskSSP585: {
    title: "Fire Risk (SSP5-8.5)",
    description:
      "High emissions fire risk evaluation. Shows areas most vulnerable to fire-related carbon loss under extreme conditions.",
    metric: "Risk index (0-100)"
  },

  // Global Composite Layers
  compositeGbfLowSsp245: {
    title: "Global Buffer Pool (Low SSP2-4.5)",
    description:
      "Global assessment of carbon storage resilience under low-impact moderate emissions scenario. Shows worldwide buffer capacity.",
    metric: "Buffer capacity (tons/hectare)"
  },
  compositeGbfModerateSsp245: {
    title: "Global Buffer Pool (Moderate SSP2-4.5)",
    description:
      "Moderate-impact assessment of global carbon storage resilience. Represents middle-range projections for buffer capacity.",
    metric: "Buffer capacity (tons/hectare)"
  },
  compositeGbfHighSsp245: {
    title: "Global Buffer Pool (High SSP2-4.5)",
    description:
      "High-impact evaluation of global carbon storage resilience. Shows more conservative estimates of buffer capacity.",
    metric: "Buffer capacity (tons/hectare)"
  },
  compositeGrLowSsp245: {
    title: "Global Reversal Risk (Low SSP2-4.5)",
    description:
      "Low-impact assessment of worldwide carbon reversal risk. Indicates potential for carbon stock loss globally.",
    metric: "Risk index (0-100)"
  },
  compositeGrModerateSsp245: {
    title: "Global Reversal Risk (Moderate SSP2-4.5)",
    description:
      "Moderate-impact global carbon reversal risk assessment. Shows medium-range projections for potential carbon loss.",
    metric: "Risk index (0-100)"
  },
  compositeGrHighSsp245: {
    title: "Global Reversal Risk (High SSP2-4.5)",
    description:
      "High-impact global carbon reversal risk evaluation. Represents more severe projections of potential carbon stock loss.",
    metric: "Risk index (0-100)"
  }
};


const MapDescription = ({ activeLayer, isDarkMode }) => {
  if (!activeLayer || !layerDescriptions[activeLayer]) {
    return (
      <div className={`w-full p-3 ${
        isDarkMode 
          ? 'bg-gray-800 text-gray-300 border-t border-gray-700' 
          : 'bg-white text-gray-600 border-t border-gray-200'
      }`}>
        <p className="text-sm italic">Select a layer to view its description</p>
      </div>
    );
  }

  const { title, description, metric } = layerDescriptions[activeLayer];

  return (
    <div className={`w-full p-3 border-t ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Info className={`mt-1 flex-shrink-0 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-500'
          }`} size={16} />
          <div>
            <h3 className={`text-sm font-semibold ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              {title}
            </h3>
            <p className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {description}
            </p>
            <p className={`text-xs mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span className="font-medium">Metric:</span> {metric}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDescription;