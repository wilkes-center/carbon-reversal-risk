import { logger } from '../logger';

export const formatLayerName = (name) => {
  if (typeof name !== 'string') {
    logger.error('formatLayerName received a non-string value:', name);
    return String(name); // Convert to string or return a default value
  }
  return name
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Ssp/g, 'SSP')
    .replace(/Km/g, 'km');
};