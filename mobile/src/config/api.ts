import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AppConfig } from './environment';

const AUTH_TOKEN_KEY = 'packleader_auth_token';

/**
 * Axios API client configured with base URL, auth interceptors, and error handling.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: AppConfig.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: attach auth token if available.
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore may not be available (e.g. web), skip silently
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: handle common error patterns.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Token expired or invalid — Stage 2 will handle logout
        console.warn('[API] Unauthorized — token may be expired');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.warn('[API] Request timeout');
    } else if (!error.response) {
      console.warn('[API] Network error — server may be unreachable');
    }
    return Promise.reject(error);
  }
);

export { apiClient, AUTH_TOKEN_KEY };
