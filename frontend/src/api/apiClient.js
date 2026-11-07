import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Centralized Axios instance configured for HireNex API
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Needed for cookie-based auth tokens
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout accommodates deep AI reasoning & PDF rendering
});

// Request Interceptor: useful for injecting headers or debugging in development
apiClient.interceptors.request.use(
  (config) => {
    // Custom logic before request is sent (e.g. tracking, telemetry)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: centralized error extraction
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Extract standardized backend error message
    const formattedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred. Please try again.',
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
