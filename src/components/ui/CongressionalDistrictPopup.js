import React from 'react';

const CongressionalDistrictPopup = ({ info, isDarkMode }) => {
  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat().format(value);
  };

  const formatValue = (value, type) => {
    if (type === 'hash') {
      return formatNumber(value);
    }
    return value || '-';
  };

  const fields = [
    { label: 'Land Area', key: 'ALAND20', type: 'hash', suffix: ' sq meters' },
    { label: 'Water Area', key: 'AWATER20', type: 'hash', suffix: ' sq meters' },
    { label: 'Congressional District', key: 'CD118FP', type: 'quotes' },
    { label: 'Session', key: 'CDSESSN', type: 'quotes' },
    { label: 'Committee Assignments', key: 'COMMITTEE_ASSIGNMENTS', type: 'quotes' },
    { label: 'District', key: 'DISTRICT', type: 'quotes' },
    { label: 'Status', key: 'FUNCSTAT20', type: 'quotes' },
    { label: 'Geo ID', key: 'GEOID20', type: 'quotes' },
    { label: 'Latitude', key: 'INTPTLAT20', type: 'quotes' },
    { label: 'Longitude', key: 'INTPTLON20', type: 'quotes' },

  ];

  return (
    <div className={`max-h-[400px] overflow-y-auto p-2 ${
      isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
    }`}>
      <h3 className={`text-sm font-medium mb-2 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-900'
      }`}>
        Congressional District Information
      </h3>
      <div className="space-y-1">
        {fields.map(({ label, key, type, suffix, isUrl }) => (
          <div key={key} className="grid grid-cols-2 gap-2 text-xs">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {label}:
            </span>
            <span>
              {isUrl && info[key] ? (
                <a
                  href={info[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-blue-${isDarkMode ? '400' : '600'} hover:underline`}
                >
                  Link
                </a>
              ) : (
                `${formatValue(info[key], type)}${suffix || ''}`
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CongressionalDistrictPopup;