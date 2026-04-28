// @ts-nocheck
/**
 * Trailing-edge debounce (lodash-compatible enough for our use).
 * @param {(...args: any[]) => void} fn
 * @param {number} waitMs
 */
export function debounce(fn, waitMs) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}
