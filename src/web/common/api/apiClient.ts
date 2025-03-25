/**
 * A centralized API client for the AI-driven Freight Optimization Platform.
 * Provides a configured Axios instance with interceptors for authentication,
 * error handling, and request/response processing. This client is used by all
 * API service modules to communicate with the backend services.
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios'; // ^1.4.0

import { handleApiError, retryWithBackoff, shouldRetryRequest } from '../utils/errorHandlers';
import logger from '../utils/logger';
import { API_BASE_URL } from '../constants/endpoints';
import { StatusCodes } from '../constants/statusCodes';

// Global constants
const AUTH_TOKEN_KEY = 'auth_token';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Creates and configures an Axios instance with default settings and interceptors
 * @param config - Optional Axios configuration overrides
 * @returns Configured Axios instance
 */
export function createApiClient(config?: AxiosRequestConfig): AxiosInstance {
  // Create base axios instance with default configuration
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: DEFAULT_HEADERS,
    ...config
  });

  // Add request interceptor for authentication
  apiClient.interceptors.request.use(requestInterceptor);

  // Add request interceptor for logging
  apiClient.interceptors.request.use(requestLogInterceptor);

  // Add response interceptor for logging
  apiClient.interceptors.response.use(responseLogInterceptor);

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    response => response, // Pass through successful responses
    errorInterceptor
  );

  return apiClient;
}

/**
 * Retrieves the authentication token from storage
 * @returns Authentication token or null if not found
 */
export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    logger.error('Failed to retrieve auth token from storage', { error });
    return null;
  }
}

/**
 * Stores the authentication token in localStorage
 * @param token - The authentication token to store
 */
export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    logger.info('Auth token stored in localStorage');
  } catch (error) {
    logger.error('Failed to store auth token in localStorage', { error });
  }
}

/**
 * Removes the authentication token from storage
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    logger.info('Auth token removed from localStorage');
  } catch (error) {
    logger.error('Failed to remove auth token from localStorage', { error });
  }
}

/**
 * Adds authentication token to request headers if available
 * @param config - The request configuration
 * @returns Modified request configuration
 */
function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getAuthToken();
  
  if (token) {
    // Use spread operator to avoid modifying the original headers object
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
}

/**
 * Logs outgoing API requests
 * @param config - The request configuration
 * @returns Unmodified request configuration
 */
function requestLogInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const { method, url, data } = config;
  
  // Sanitize request data to remove sensitive information
  const sanitizedData = data ? sanitizeRequestData(data) : undefined;
  
  logger.debug(`API Request: ${method?.toUpperCase()} ${url}`, {
    component: 'API',
    data: sanitizedData
  });
  
  return config;
}

/**
 * Logs API responses
 * @param response - The response object
 * @returns Unmodified response
 */
function responseLogInterceptor(response: AxiosResponse): AxiosResponse {
  const { status, config, data } = response;
  const { method, url } = config;
  
  // Sanitize response data to remove sensitive information
  const sanitizedData = data ? sanitizeResponseData(data) : undefined;
  
  logger.debug(`API Response: ${method?.toUpperCase()} ${url} ${status}`, {
    component: 'API',
    status,
    data: sanitizedData
  });
  
  return response;
}

/**
 * Handles API errors and implements retry logic for transient failures
 * @param error - The error object from Axios
 * @returns Promise that resolves with the response or rejects with the error
 */
function errorInterceptor(error: AxiosError): Promise<any> {
  // Check if we should retry this request
  if (shouldRetryRequest(error, 0)) {
    return retryWithBackoff(
      () => {
        // Create a new request using the same config
        const retryConfig = { ...error.config };
        logger.info('Retrying failed request', {
          method: retryConfig.method,
          url: retryConfig.url
        });
        return axios(retryConfig);
      },
      {
        retryCondition: (err: Error, retryCount: number) => {
          if (axios.isAxiosError(err)) {
            return shouldRetryRequest(err, retryCount);
          }
          return false;
        },
        onRetry: (err: Error, retryCount: number) => {
          logger.info(`Retry attempt ${retryCount} for failed request`, {
            error: err,
            method: error.config?.method,
            url: error.config?.url
          });
        }
      }
    );
  }

  // Process the error with our error handler
  const processedError = handleApiError(error);
  
  // Return a rejected promise with the processed error
  return Promise.reject(processedError);
}

/**
 * Removes sensitive information from request data for logging
 * @param data - Request data to sanitize
 * @returns Sanitized data safe for logging
 */
function sanitizeRequestData(data: any): any {
  try {
    // Create a deep copy of the data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Mask sensitive fields
    if (sanitized.password) sanitized.password = '******';
    if (sanitized.token) sanitized.token = '******';
    if (sanitized.accessToken) sanitized.accessToken = '******';
    if (sanitized.refreshToken) sanitized.refreshToken = '******';
    if (sanitized.creditCard) sanitized.creditCard = '******';
    if (sanitized.ssn) sanitized.ssn = '******';
    if (sanitized.driverLicense) sanitized.driverLicense = '******';
    
    return sanitized;
  } catch (error) {
    // In case of circular references or other JSON stringification errors
    logger.debug('Could not sanitize request data for logging', { error });
    return { sanitizeError: 'Could not sanitize data for logging' };
  }
}

/**
 * Removes sensitive information from response data for logging
 * @param data - Response data to sanitize
 * @returns Sanitized data safe for logging
 */
function sanitizeResponseData(data: any): any {
  try {
    // Create a deep copy of the data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Mask sensitive fields
    if (sanitized.token) sanitized.token = '******';
    if (sanitized.accessToken) sanitized.accessToken = '******';
    if (sanitized.refreshToken) sanitized.refreshToken = '******';
    if (sanitized.jwt) sanitized.jwt = '******';
    if (sanitized.authToken) sanitized.authToken = '******';
    
    // If data contains user object with sensitive information
    if (sanitized.user) {
      if (sanitized.user.password) sanitized.user.password = '******';
      if (sanitized.user.token) sanitized.user.token = '******';
      if (sanitized.user.ssn) sanitized.user.ssn = '******';
      if (sanitized.user.driverLicense) sanitized.user.driverLicense = '******';
    }
    
    return sanitized;
  } catch (error) {
    // In case of circular references or other JSON stringification errors
    logger.debug('Could not sanitize response data for logging', { error });
    return { sanitizeError: 'Could not sanitize data for logging' };
  }
}

// Create the default API client instance
const apiClient = createApiClient();

// Export the default client and auth token functions
export default apiClient;