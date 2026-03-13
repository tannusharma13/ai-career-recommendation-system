import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      const message = data?.error || `Request failed with status ${status}`;
      console.error(`API Error (${status}):`, message);
      throw new Error(message);
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      console.error('API error:', error.message);
      throw new Error('An unexpected error occurred.');
    }
  }
);

export default API;
