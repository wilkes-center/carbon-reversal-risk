// @ts-nocheck
import React from 'react';

const formatMetric = (value) =>
  value == null || Number.isNaN(value) ? '—' : `${Number(value).toFixed(2)}%`;

const DarkPopup = ({ info, isDarkMode }) => (
  <div
    className={`p-2 ${
      isDarkMode
        ? 'bg-obsidian text-white font-sans'
        : 'bg-white text-obsidian font-sans'
    }`}
  >
    <h3 className="text-sm font-semibold mb-1 font-sora">{info.layerName}</h3>
    {info.region && (
      <p className="text-xs mb-1">
        <span className="font-semibold">Region: </span>
        {info.region}
      </p>
    )}
    {info.metrics ? (
      <ul className="text-xs space-y-0.5">
        {info.metrics.map((m) => (
          <li
            key={m.label}
            className={m.active ? 'font-semibold' : ''}
          >
            {m.label}: {formatMetric(m.value)}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs">{info.value}</p>
    )}
  </div>
);

export default DarkPopup;
