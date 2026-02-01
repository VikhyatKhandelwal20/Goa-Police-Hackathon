// API Configuration
// This file handles API endpoint configuration for different environments

const getApiBaseUrl = () => {
  // Check if we're running on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // For network access, use the same host but different port
  // Backend runs on port 3000, frontend on port 8080
  return `http://${window.location.hostname}:3000`;
};

export const API_BASE_URL = getApiBaseUrl();

// Socket.IO configuration
export const SOCKET_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Socket URL:', SOCKET_URL);
