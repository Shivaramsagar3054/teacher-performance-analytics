/**
 * Application Configuration
 * Modify the API_BASE_URL here to point to your backend.
 * The rest of the app (API requests, images, WebSockets) will automatically adapt.
 */

// Deployed URL
// export const API_BASE_URL = 'https://simats-teacher-performance.onrender.com';

// Local development URL (pointing to your computer's local IP address)
export const API_BASE_URL = 'http://10.210.22.86:8000'; // Wi-Fi local IP (for physical devices/emulators on the same network)
// export const API_BASE_URL = 'http://127.0.0.1:8000'; // Default local loopback


// 2. Calculated constants (do not modify unless necessary)
// Remove trailing slash from base URL if present to avoid double slashes (e.g. //api)
const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, '');

export const API_URL = `${normalizedBaseUrl}/api`;

// WS_HOST is derived from normalizedBaseUrl by removing the protocol (http:// or https://)
export const WS_HOST = normalizedBaseUrl.replace(/^https?:\/\//, '');

// Helper to get WebSocket URL for teacher comment room
export const getWsUrl = (teacherId: string | number) => {
  const isSecure = normalizedBaseUrl.startsWith('https');
  const scheme = isSecure ? 'wss' : 'ws';
  return `${scheme}://${WS_HOST}/ws/comments/teacher/${teacherId}/`;
};

// Global brand configurations
export const APP_NAME = 'Teacher Performance Analytics';
export const APP_SUBTITLE = 'Analyze. Evaluate. Improve.';
export const APP_LOGO = require('../assets/images/logo.png');
