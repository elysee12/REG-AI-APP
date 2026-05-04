// Use environment variable for API URL, fallback to localhost for development
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_BASE = `${BASE_URL}/api`;
