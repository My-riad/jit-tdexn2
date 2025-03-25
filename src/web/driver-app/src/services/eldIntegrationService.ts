/**
 * Service that provides Electronic Logging Device (ELD) integration functionality for the driver mobile application.
 * It handles connecting to various ELD providers, retrieving Hours of Service (HOS) data, and
 * managing offline capabilities for drivers in areas with poor connectivity.
 */

import axios from 'axios'; // ^1.4.0
import NetInfo from '@react-native-community/netinfo'; // ^9.3.10

import integrationApi, { eld } from '../../../common/api/integrationApi';
import driverApi, { getDriverHOS } from '../../../common/api/driverApi';
import { DriverHOS } from '../../../common/interfaces/driver.interface';
import logger from '../../../common/utils/logger';
import { getItem, setItem } from '../../../common/utils/localStorage';
import { cacheData, getCachedData } from './offlineStorageService';

// Cache keys and constants
const ELD_CONNECTION_CACHE_KEY = 'eld_connection';
const HOS_CACHE_KEY = 'driver_hos_data';
const HOS_CACHE_EXPIRATION = 3600000; // 1 hour in milliseconds

/**
 * Parameters for connecting to an ELD provider
 */
export interface EldConnectionParams {
  driverId: string;
  providerId: string;
  authType: string;
  apiKey?: string;
  username?: string;
  password?: string;
  redirectUri?: string;
}

/**
 * Response data from ELD connection operation
 */
export interface EldConnectionResponse {
  id: string;
  driverId: string;
  providerId: string;
  providerName: string;
  authType: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enumeration of supported ELD providers
 */
export enum EldProviderType {
  KEEP_TRUCKIN = 'keep_truckin',
  OMNITRACS = 'omnitracs',
  SAMSARA = 'samsara',
  GEOTAB = 'geotab',
  CUSTOM = 'custom'
}

/**
 * Enumeration of ELD authentication types
 */
export enum EldAuthType {
  OAUTH = 'oauth',
  API_KEY = 'api_key',
  USERNAME_PASSWORD = 'username_password'
}

/**
 * Connects to an ELD provider using OAuth or API key authentication
 * @param params Connection parameters including provider ID and authentication details
 * @returns Promise resolving to the ELD connection details
 */
async function connectToEldProvider(params: EldConnectionParams): Promise<EldConnectionResponse> {
  // Check network connectivity first
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);
  if (!isConnected) {
    logger.error('Cannot connect to ELD provider while offline', { params });
    throw new Error('Network connection is required to connect to an ELD provider');
  }

  try {
    logger.info('Initiating ELD provider connection', { 
      providerId: params.providerId,
      authType: params.authType,
      driverId: params.driverId
    });

    let connectionResponse;

    // Handle different authentication flows
    if (params.authType === EldAuthType.OAUTH) {
      // Get authorization URL for OAuth flow
      const authUrlResponse = await eld.getAuthorizationUrl({
        providerId: params.providerId,
        redirectUri: params.redirectUri
      });

      // In a real implementation, we would redirect to this URL
      // and handle the callback, but for this service we'll simulate
      // receiving the authorization code and exchanging it for tokens
      logger.debug('OAuth flow initiated, obtained authorization URL');

      // Exchange authorization code for tokens (in a real app, this would happen after user auth)
      // For simplicity, we're combining this in a single function
      // In production, this would be separated into initiateOauth and handleOauthCallback
      const mockCode = 'simulated_oauth_code';
      connectionResponse = await eld.exchangeToken({
        providerId: params.providerId,
        code: mockCode,
        redirectUri: params.redirectUri,
        driverId: params.driverId
      });
    } else if (params.authType === EldAuthType.API_KEY) {
      // Directly create connection with API key
      connectionResponse = await eld.createConnection({
        driverId: params.driverId,
        providerId: params.providerId,
        authType: params.authType,
        apiKey: params.apiKey
      });
    } else if (params.authType === EldAuthType.USERNAME_PASSWORD) {
      // Create connection with username/password
      connectionResponse = await eld.createConnection({
        driverId: params.driverId,
        providerId: params.providerId,
        authType: params.authType,
        username: params.username,
        password: params.password
      });
    } else {
      throw new Error(`Unsupported auth type: ${params.authType}`);
    }

    const connection = connectionResponse.data;
    
    // Cache the connection details for offline use
    await setItem(`${ELD_CONNECTION_CACHE_KEY}_${params.driverId}`, connection);
    
    logger.info('Successfully connected to ELD provider', { 
      providerId: params.providerId,
      connectionId: connection.id
    });
    
    return connection;
  } catch (error) {
    logger.error('Failed to connect to ELD provider', { 
      error,
      params
    });
    throw error;
  }
}

/**
 * Disconnects from an ELD provider by revoking tokens and removing stored connection
 * @param connectionId ID of the ELD connection to disconnect
 * @returns Promise resolving to true if disconnection was successful
 */
async function disconnectFromEldProvider(connectionId: string): Promise<boolean> {
  // Check network connectivity first
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);
  if (!isConnected) {
    logger.error('Cannot disconnect from ELD provider while offline', { connectionId });
    throw new Error('Network connection is required to disconnect from an ELD provider');
  }

  try {
    logger.info('Disconnecting from ELD provider', { connectionId });
    
    // Call the API to delete the connection
    await eld.deleteConnection(connectionId);
    
    // Find the driver ID from cached connection to remove local storage
    const allConnections = await getItem<Record<string, EldConnectionResponse>>(ELD_CONNECTION_CACHE_KEY) || {};
    
    // Find the driver ID for this connection
    let driverId = '';
    for (const key in allConnections) {
      if (allConnections[key].id === connectionId) {
        driverId = allConnections[key].driverId;
        break;
      }
    }
    
    if (driverId) {
      // Remove from local storage
      await setItem(`${ELD_CONNECTION_CACHE_KEY}_${driverId}`, null);
      logger.debug('Removed ELD connection from local storage', { driverId, connectionId });
    }
    
    logger.info('Successfully disconnected from ELD provider', { connectionId });
    return true;
  } catch (error) {
    logger.error('Failed to disconnect from ELD provider', { 
      error,
      connectionId
    });
    throw error;
  }
}

/**
 * Retrieves the current Hours of Service data for a driver from their ELD
 * @param driverId ID of the driver
 * @returns Promise resolving to the driver's HOS data
 */
async function getDriverHOS(driverId: string): Promise<DriverHOS> {
  try {
    logger.info('Retrieving driver HOS data', { driverId });
    
    // Try to get cached HOS data first
    const cacheKey = `${HOS_CACHE_KEY}_${driverId}`;
    const cachedData = await getCachedData<{data: DriverHOS, timestamp: number}>(cacheKey);
    
    // Check if cached data exists and is not expired
    if (cachedData && (Date.now() - cachedData.timestamp < HOS_CACHE_EXPIRATION)) {
      logger.debug('Retrieved HOS data from cache', { driverId });
      return cachedData.data;
    }
    
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Fetch fresh data from the server
      const response = await driverApi.getDriverHOS(driverId);
      
      // Cache the new data
      await cacheData(cacheKey, {
        data: response,
        timestamp: Date.now()
      }, { expiration: HOS_CACHE_EXPIRATION });
      
      logger.info('Successfully retrieved fresh HOS data from server', { driverId });
      return response;
    } else {
      // If offline and we have cached data (even if expired), use it
      if (cachedData) {
        logger.warn('Using expired HOS data while offline', { 
          driverId,
          dataAge: Date.now() - cachedData.timestamp
        });
        return cachedData.data;
      }
      
      // If offline and no cached data, throw error
      logger.error('Cannot retrieve HOS data: offline and no cached data available', { driverId });
      throw new Error('Cannot retrieve HOS data while offline. No cached data available.');
    }
  } catch (error) {
    logger.error('Failed to retrieve driver HOS data', { 
      error,
      driverId
    });
    throw error;
  }
}

/**
 * Retrieves the HOS logs for a driver within a specified time range
 * @param driverId ID of the driver
 * @param startDate Start date for logs
 * @param endDate End date for logs
 * @returns Promise resolving to the driver's HOS logs
 */
async function getDriverHOSLogs(driverId: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
  try {
    logger.info('Retrieving driver HOS logs', { driverId, startDate, endDate });
    
    // Format dates for API
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Create cache key with date range
    const cacheKey = `${HOS_CACHE_KEY}_logs_${driverId}_${startDateStr.slice(0, 10)}_${endDateStr.slice(0, 10)}`;
    
    // Try to get cached logs first
    const cachedLogs = await getCachedData<{data: DriverHOS[], timestamp: number}>(cacheKey);
    
    // Check if cached data exists and is not expired
    if (cachedLogs && (Date.now() - cachedLogs.timestamp < HOS_CACHE_EXPIRATION)) {
      logger.debug('Retrieved HOS logs from cache', { driverId, startDate, endDate });
      return cachedLogs.data;
    }
    
    // Check network connectivity
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (isConnected) {
      // Fetch fresh logs from the server
      const response = await eld.getDriverHOSLogs(driverId, startDateStr, endDateStr);
      const logs = response.data;
      
      // Cache the new logs
      await cacheData(cacheKey, {
        data: logs,
        timestamp: Date.now()
      }, { expiration: HOS_CACHE_EXPIRATION });
      
      logger.info('Successfully retrieved fresh HOS logs from server', { 
        driverId, 
        logCount: logs.length
      });
      
      return logs;
    } else {
      // If offline and we have cached logs (even if expired), use them
      if (cachedLogs) {
        logger.warn('Using expired HOS logs while offline', { 
          driverId,
          dataAge: Date.now() - cachedLogs.timestamp
        });
        return cachedLogs.data;
      }
      
      // If offline and no cached logs, throw error
      logger.error('Cannot retrieve HOS logs: offline and no cached data available', { 
        driverId,
        dateRange: `${startDateStr} to ${endDateStr}`
      });
      
      throw new Error('Cannot retrieve HOS logs while offline. No cached data available.');
    }
  } catch (error) {
    logger.error('Failed to retrieve driver HOS logs', { 
      error,
      driverId,
      startDate,
      endDate
    });
    throw error;
  }
}

/**
 * Retrieves the stored ELD connection details for a driver
 * @param driverId ID of the driver
 * @returns Promise resolving to the connection details or null if not found
 */
async function getEldConnection(driverId: string): Promise<EldConnectionResponse | null> {
  try {
    logger.debug('Retrieving ELD connection for driver', { driverId });
    
    // Get connection from local storage
    const connection = await getItem<EldConnectionResponse>(`${ELD_CONNECTION_CACHE_KEY}_${driverId}`);
    
    if (!connection) {
      logger.debug('No ELD connection found for driver', { driverId });
      return null;
    }
    
    // Check if tokens are expired
    if (connection.expiresAt && isTokenExpired(connection.expiresAt)) {
      logger.debug('ELD connection token is expired', { driverId });
      
      // Check network connectivity
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isConnected && connection.refreshToken) {
        // Refresh tokens
        logger.debug('Refreshing expired ELD tokens', { driverId });
        const refreshedConnection = await refreshEldTokens(connection);
        return refreshedConnection;
      } else {
        // If offline, still return the expired connection
        // The caller will need to handle expired tokens appropriately
        logger.warn('Returning expired ELD connection while offline', { driverId });
        return connection;
      }
    }
    
    logger.debug('Successfully retrieved valid ELD connection', { driverId });
    return connection;
  } catch (error) {
    logger.error('Failed to retrieve ELD connection', { 
      error,
      driverId
    });
    return null;
  }
}

/**
 * Validates an ELD connection by making a test API call
 * @param connectionId ID of the ELD connection to validate
 * @returns Promise resolving to true if the connection is valid
 */
async function validateEldConnection(connectionId: string): Promise<boolean> {
  // Check network connectivity first
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);
  if (!isConnected) {
    logger.error('Cannot validate ELD connection while offline', { connectionId });
    throw new Error('Network connection is required to validate an ELD connection');
  }

  try {
    logger.info('Validating ELD connection', { connectionId });
    
    // Call the API to validate the connection
    const response = await eld.validateConnection(connectionId);
    const isValid = response.data.valid === true;
    
    logger.info('ELD connection validation result', { 
      connectionId,
      isValid
    });
    
    return isValid;
  } catch (error) {
    logger.error('Failed to validate ELD connection', { 
      error,
      connectionId
    });
    return false;
  }
}

/**
 * Refreshes the access tokens for an ELD connection using the refresh token
 * @param connection ELD connection object containing refresh token
 * @returns Promise resolving to the updated connection details
 */
async function refreshEldTokens(connection: EldConnectionResponse): Promise<EldConnectionResponse> {
  if (!connection.refreshToken) {
    logger.error('Cannot refresh tokens: no refresh token available', { connectionId: connection.id });
    throw new Error('No refresh token available');
  }

  try {
    logger.info('Refreshing ELD access tokens', { connectionId: connection.id });
    
    // Call the API to refresh tokens
    const response = await eld.exchangeToken({
      providerId: connection.providerId,
      refreshToken: connection.refreshToken,
      driverId: connection.driverId,
      connectionId: connection.id,
      grantType: 'refresh_token'
    });
    
    const updatedConnection = response.data;
    
    // Update local storage with new tokens
    await setItem(`${ELD_CONNECTION_CACHE_KEY}_${connection.driverId}`, updatedConnection);
    
    logger.info('Successfully refreshed ELD tokens', { connectionId: connection.id });
    return updatedConnection;
  } catch (error) {
    logger.error('Failed to refresh ELD tokens', { 
      error,
      connectionId: connection.id
    });
    throw error;
  }
}

/**
 * Checks if a driver has sufficient hours available for a planned trip
 * @param driverId ID of the driver
 * @param estimatedDrivingMinutes Estimated trip duration in minutes
 * @returns Promise resolving to true if the driver has sufficient hours
 */
async function hasSufficientHoursForTrip(driverId: string, estimatedDrivingMinutes: number): Promise<boolean> {
  try {
    logger.info('Checking if driver has sufficient hours for trip', { 
      driverId,
      estimatedDrivingMinutes
    });
    
    // Get current HOS data
    const hosData = await getDriverHOS(driverId);
    
    // Compare available driving time with estimated trip duration
    const hasSufficientHours = hosData.drivingMinutesRemaining >= estimatedDrivingMinutes;
    
    logger.info('Driver hours sufficiency check result', { 
      driverId,
      hasSufficientHours,
      availableMinutes: hosData.drivingMinutesRemaining,
      requiredMinutes: estimatedDrivingMinutes
    });
    
    return hasSufficientHours;
  } catch (error) {
    logger.error('Failed to check driver hours sufficiency', { 
      error,
      driverId,
      estimatedDrivingMinutes
    });
    
    // Default to false if we can't determine hours
    return false;
  }
}

/**
 * Synchronizes cached HOS data with the server when coming back online
 * @param driverId ID of the driver
 * @returns Promise resolving to true if synchronization was successful
 */
async function syncHosData(driverId: string): Promise<boolean> {
  // Check network connectivity
  const isConnected = await NetInfo.fetch().then(state => state.isConnected);
  if (!isConnected) {
    logger.warn('Cannot sync HOS data while offline', { driverId });
    return false;
  }

  try {
    logger.info('Synchronizing HOS data with server', { driverId });
    
    // Get the latest data from the server
    const response = await driverApi.getDriverHOS(driverId);
    
    // Update the cache with fresh data
    const cacheKey = `${HOS_CACHE_KEY}_${driverId}`;
    await cacheData(cacheKey, {
      data: response,
      timestamp: Date.now()
    }, { expiration: HOS_CACHE_EXPIRATION });
    
    logger.info('Successfully synchronized HOS data with server', { driverId });
    return true;
  } catch (error) {
    logger.error('Failed to synchronize HOS data with server', { 
      error,
      driverId
    });
    return false;
  }
}

/**
 * Checks if an access token is expired based on its expiration timestamp
 * @param expiresAt Expiration timestamp (milliseconds since epoch)
 * @returns True if the token is expired, false otherwise
 */
function isTokenExpired(expiresAt: number): boolean {
  // Add a 5-minute buffer to prevent edge cases
  const bufferMs = 5 * 60 * 1000;
  const currentTime = Date.now();
  
  return currentTime >= (expiresAt - bufferMs);
}

export default {
  connectToEldProvider,
  disconnectFromEldProvider,
  getDriverHOS,
  getDriverHOSLogs,
  getEldConnection,
  validateEldConnection,
  hasSufficientHoursForTrip,
  syncHosData
};