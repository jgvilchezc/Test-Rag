// Centralized configuration for API URLs
// In development, this falls back to localhost.
// In production, you MUST set VITE_API_URL in your Vercel Environment Variables.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
