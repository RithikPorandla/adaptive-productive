/**
 * API base URL - use your machine's IP for physical device, localhost for web/emulator
 */
export const API_BASE = typeof window !== 'undefined' && window.location?.hostname
  ? `http://${window.location.hostname}:3000`
  : 'http://localhost:3000';
