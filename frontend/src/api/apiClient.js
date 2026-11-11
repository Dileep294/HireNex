import axios from 'axios';

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

const cleanApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

/**
 * Standard AI generation and intensive processing timeout (120 seconds)
 */
export const AI_REQUEST_TIMEOUT = 120000;

/**
 * Centralized Axios instance configured for HireNex API
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Needed for cookie-based auth tokens
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: AI_REQUEST_TIMEOUT, // 120s timeout accommodates deep AI reasoning & PDF rendering
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

// Response Interceptor: centralized error extraction & timeout handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      Boolean(error.message && error.message.toLowerCase().includes('timeout'));

    let message;
    if (isTimeout) {
      message =
        'AI interview strategy generation is taking longer than expected. Please check your network or try again.';
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred. Please try again.';
    }

    // Extract standardized backend error message
    const formattedError = {
      message,
      isTimeout,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      response: error.response,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
