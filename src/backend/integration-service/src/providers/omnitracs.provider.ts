import axios from 'axios'; // axios@^1.3.4
import querystring from 'querystring'; // querystring@^0.2.1
import {
  EldProviderInterface,
  EldTokenResponse,
  EldConnection,
  EldTokenExchangeRequest,
  EldAuthorizationRequest
} from '../models/eld-connection.model';
import { DriverHOS, HOSStatus, Position, PositionSource } from '../../../common/interfaces/driver.interface';
import { eldConfig } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Checks if an access token is expired or about to expire
 * @param expiresAt The expiration date of the token
 * @returns True if the token is expired or will expire within 5 minutes
 */
const isTokenExpired = (expiresAt: Date): boolean => {
  // Get the current time
  const now = new Date();

  // Add a 5-minute buffer to the current time
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  const expiresSoon = new Date(now.getTime() + buffer);

  // Compare the expiration time with the buffered current time
  return expiresAt <= expiresSoon;
};

/**
 * Handles and logs API errors from Omnitracs
 * @param error The error object
 * @param operation The name of the operation being performed
 * @returns never - This function always throws an error
 */
const handleApiError = (error: any, operation: string): never => {
  // Log the error details with operation context
  logger.error(`Omnitracs API Error during ${operation}`, { error });

  // Extract error response data if available
  let errorMessage = 'Unknown error occurred';
  if (axios.isAxiosError(error) && error.response && error.response.data) {
    errorMessage = JSON.stringify(error.response.data);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Format a detailed error message
  const detailedMessage = `Omnitracs API ${operation} failed: ${errorMessage}`;

  // Throw a new AppError with the formatted message
  throw new AppError(detailedMessage, {
    code: 'EXT_OMNITRACS_SERVICE_ERROR',
    details: { operation, errorMessage }
  });
};

/**
 * Maps Omnitracs duty status codes to our HOSStatus enum
 * @param omnitracsStatus The Omnitracs duty status code
 * @returns The mapped HOSStatus enum value
 */
const mapOmnitracsStatusToHOSStatus = (omnitracsStatus: string): HOSStatus => {
  // Map Omnitracs status codes to corresponding HOSStatus enum values
  switch (omnitracsStatus) {
    case 'D': // Driving
    case 'DRIVING':
      return HOSStatus.DRIVING;
    case 'ON': // On Duty
    case 'ON_DUTY':
      return HOSStatus.ON_DUTY;
    case 'OFF': // Off Duty
    case 'OFF_DUTY':
      return HOSStatus.OFF_DUTY;
    case 'SB': // Sleeper Berth
    case 'SLEEPER_BERTH':
      return HOSStatus.SLEEPER_BERTH;
    default:
      // Default to HOSStatus.OFF_DUTY for unknown status codes
      return HOSStatus.OFF_DUTY;
  }
};

/**
 * Provider implementation for integrating with the Omnitracs ELD API
 */
export class OmnitracsProvider implements EldProviderInterface {
  private clientId: string;
  private clientSecret: string;
  private apiBaseUrl: string;
  private authBaseUrl: string;
  private apiVersion: string;
  private axiosInstance: axios.AxiosInstance;

  /**
   * Initializes the Omnitracs provider with configuration settings
   */
  constructor() {
    // Load configuration from eldConfig.omnitracs
    const config = eldConfig.omnitracs;

    // Set clientId from configuration
    this.clientId = config.clientId;

    // Set clientSecret from configuration
    this.clientSecret = config.clientSecret;

    // Set apiBaseUrl from configuration
    this.apiBaseUrl = config.apiUrl;

    // Set authBaseUrl from configuration
    this.authBaseUrl = config.authUrl;

    // Set apiVersion from configuration
    this.apiVersion = config.apiVersion;

    // Initialize axios instance with base URL and default headers
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Log provider initialization
    logger.info('OmnitracsProvider initialized');
  }

  /**
   * Generates the OAuth authorization URL for Omnitracs
   * @param redirectUri The URI to redirect to after authorization
   * @param state The state parameter for OAuth security
   * @param scope The scope of the authorization request
   * @returns The authorization URL to redirect the driver to
   */
  getAuthorizationUrl(request: EldAuthorizationRequest): string {
    // Construct query parameters including client_id, redirect_uri, response_type, state, and scope
    const queryParams = querystring.stringify({
      client_id: this.clientId,
      redirect_uri: request.redirect_uri,
      response_type: 'code',
      state: request.state,
      scope: 'read' // Omnitracs requires a scope, even if it's just 'read'
    });

    // Build the authorization URL using authBaseUrl and query parameters
    const authorizationUrl = `${this.authBaseUrl}?${queryParams}`;

    // Log the generated authorization URL
    logger.info('Generated Omnitracs authorization URL', { authorizationUrl });

    // Return the complete authorization URL
    return authorizationUrl;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens
   * @param code The authorization code received from Omnitracs
   * @param redirectUri The URI to redirect to after authorization
   * @returns The token response containing access_token, refresh_token, and expires_in
   */
  async exchangeCodeForTokens(request: EldTokenExchangeRequest): Promise<EldTokenResponse> {
    try {
      // Construct the request body with grant_type, code, redirect_uri, client_id, and client_secret
      const requestBody = querystring.stringify({
        grant_type: 'authorization_code',
        code: request.code,
        redirect_uri: request.redirect_uri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      // Make a POST request to the token endpoint
      const response = await axios.post<EldTokenResponse>(
        eldConfig.omnitracs.tokenUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse and return the token response
      const tokenResponse: EldTokenResponse = response.data;

      // Log successful token exchange
      logger.info('Successfully exchanged code for tokens with Omnitracs', {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
      });

      return tokenResponse;
    } catch (error: any) {
      // Handle any errors from the API request
      handleApiError(error, 'exchangeCodeForTokens');
      throw error; // To satisfy the linter, even though handleApiError always throws
    }
  }

  /**
   * Refreshes an expired access token using a refresh token
   * @param refreshToken The refresh token to use
   * @returns The new token response with updated access_token and expires_in
   */
  async refreshAccessToken(refreshToken: string): Promise<EldTokenResponse> {
    try {
      // Construct the request body with grant_type, refresh_token, client_id, and client_secret
      const requestBody = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      // Make a POST request to the token endpoint
      const response = await axios.post<EldTokenResponse>(
        eldConfig.omnitracs.tokenUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Parse and return the token response
      const tokenResponse: EldTokenResponse = response.data;

      // Log successful token refresh
      logger.info('Successfully refreshed access token with Omnitracs', {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
      });

      return tokenResponse;
    } catch (error: any) {
      // Handle any errors from the API request
      handleApiError(error, 'refreshAccessToken');
      throw error; // To satisfy the linter, even though handleApiError always throws
    }
  }

  /**
   * Retrieves the current Hours of Service data for a driver
   * @param connection The ELD connection object containing access token and driver ID
   * @returns The driver's current HOS data
   */
  async getDriverHOS(connection: EldConnection): Promise<DriverHOS> {
    try {
      // Check if the access token is expired and refresh if needed
      if (isTokenExpired(connection.token_expires_at)) {
        logger.info('Access token expired, refreshing token', { driverId: connection.driver_id });
        const newToken = await this.refreshAccessToken(connection.refresh_token);
        connection.access_token = newToken.access_token;
        connection.token_expires_at = new Date(Date.now() + newToken.expires_in * 1000);
        // Note: The updated token needs to be saved to the database
        // This is handled by the calling service
      }

      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${connection.access_token}`,
      };

      // Make a GET request to the driver HOS endpoint
      const response = await this.axiosInstance.get(
        `/hos/driver/${connection.driver_id}/current`,
        { headers }
      );

      // Extract HOS data from the response
      const hosData = response.data;

      // Map the Omnitracs HOS data to the platform's DriverHOS interface
      const driverHOS: DriverHOS = {
        hos_id: hosData.id, // Assuming Omnitracs provides a unique ID
        driver_id: connection.driver_id,
        status: mapOmnitracsStatusToHOSStatus(hosData.dutyStatus),
        status_since: new Date(hosData.lastStatusChange),
        driving_minutes_remaining: hosData.drivingTimeRemaining,
        duty_minutes_remaining: hosData.onDutyTimeRemaining,
        cycle_minutes_remaining: hosData.cycleTimeRemaining,
        location: { latitude: 0, longitude: 0 }, // Location data not directly available in this endpoint
        vehicle_id: hosData.vehicleId,
        eld_log_id: hosData.logId,
        recorded_at: new Date(hosData.lastStatusChange),
      };

      // Log successful HOS data retrieval
      logger.info('Successfully retrieved Omnitracs HOS data', { driverId: connection.driver_id });

      return driverHOS;
    } catch (error: any) {
      // Handle any errors from the API request
      handleApiError(error, 'getDriverHOS');
      throw error; // To satisfy the linter, even though handleApiError always throws
    }
  }

  /**
   * Retrieves the HOS logs for a driver within a specified time range
   * @param connection The ELD connection object containing access token and driver ID
   * @param startDate The start date for the logs
   * @param endDate The end date for the logs
   * @returns Array of driver HOS log entries
   */
  async getDriverHOSLogs(connection: EldConnection, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
    try {
      // Check if the access token is expired and refresh if needed
      if (isTokenExpired(connection.token_expires_at)) {
        logger.info('Access token expired, refreshing token', { driverId: connection.driver_id });
        const newToken = await this.refreshAccessToken(connection.refresh_token);
        connection.access_token = newToken.access_token;
        connection.token_expires_at = new Date(Date.now() + newToken.expires_in * 1000);
        // Note: The updated token needs to be saved to the database
        // This is handled by the calling service
      }

      // Format start and end dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${connection.access_token}`,
      };

      // Make a GET request to the driver HOS logs endpoint with date range parameters
      const response = await this.axiosInstance.get(
        `/hos/driver/${connection.driver_id}/logs?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        { headers }
      );

      // Extract HOS logs from the response
      const hosLogs = response.data;

      // Map each log entry to the platform's DriverHOS interface
      const driverHOSLogs: DriverHOS[] = hosLogs.map((log: any) => ({
        hos_id: log.id, // Assuming Omnitracs provides a unique ID
        driver_id: connection.driver_id,
        status: mapOmnitracsStatusToHOSStatus(log.dutyStatus),
        status_since: new Date(log.lastStatusChange),
        driving_minutes_remaining: log.drivingTimeRemaining,
        duty_minutes_remaining: log.onDutyTimeRemaining,
        cycle_minutes_remaining: log.cycleTimeRemaining,
        location: { latitude: 0, longitude: 0 }, // Location data not directly available in this endpoint
        vehicle_id: log.vehicleId,
        eld_log_id: log.logId,
        recorded_at: new Date(log.lastStatusChange),
      }));

      // Log successful HOS logs retrieval
      logger.info('Successfully retrieved Omnitracs HOS logs', { driverId: connection.driver_id, logCount: driverHOSLogs.length });

      return driverHOSLogs;
    } catch (error: any) {
      // Handle any errors from the API request
      handleApiError(error, 'getDriverHOSLogs');
      throw error; // To satisfy the linter, even though handleApiError always throws
    }
  }

  /**
   * Retrieves the current location of a driver
   * @param connection The ELD connection object containing access token and driver ID
   * @returns The driver's current location data
   */
  async getDriverLocation(connection: EldConnection): Promise<{ latitude: number; longitude: number; timestamp: Date; speed: number; heading: number; }> {
    try {
      // Check if the access token is expired and refresh if needed
      if (isTokenExpired(connection.token_expires_at)) {
        logger.info('Access token expired, refreshing token', { driverId: connection.driver_id });
        const newToken = await this.refreshAccessToken(connection.refresh_token);
        connection.access_token = newToken.access_token;
        connection.token_expires_at = new Date(Date.now() + newToken.expires_in * 1000);
        // Note: The updated token needs to be saved to the database
        // This is handled by the calling service
      }

      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${connection.access_token}`,
      };

      // Make a GET request to the driver location endpoint
      const response = await this.axiosInstance.get(
        `/location/driver/${connection.driver_id}/current`,
        { headers }
      );

      // Extract location data from the response
      const locationData = response.data;

      // Map the Omnitracs location data to the platform's Position interface format
      const location = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date(locationData.timestamp),
        speed: locationData.speed,
        heading: locationData.heading,
      };

      // Log successful location data retrieval
      logger.info('Successfully retrieved Omnitracs location data', { driverId: connection.driver_id, location });

      return location;
    } catch (error: any) {
      // Handle any errors from the API request
      handleApiError(error, 'getDriverLocation');
      throw error; // To satisfy the linter, even though handleApiError always throws
    }
  }

  /**
   * Validates if a connection is still valid
   * @param connection The ELD connection object containing access token
   * @returns True if the connection is valid
   */
  async validateConnection(connection: EldConnection): Promise<boolean> {
    try {
      // Check if the access token is expired and refresh if needed
      if (isTokenExpired(connection.token_expires_at)) {
        logger.info('Access token expired, refreshing token for validation');
        const newToken = await this.refreshAccessToken(connection.refresh_token);
        connection.access_token = newToken.access_token;
        connection.token_expires_at = new Date(Date.now() + newToken.expires_in * 1000);
        // Note: The updated token needs to be saved to the database
        // This is handled by the calling service
      }

      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${connection.access_token}`,
      };

      // Make a GET request to a simple API endpoint (e.g., user profile)
      await this.axiosInstance.get('/user/profile', { headers });

      // Log successful validation
      logger.info('Omnitracs connection validated successfully');
      return true;
    } catch (error: any) {
      // Log the validation result
      logger.warn('Omnitracs connection validation failed', { error });
      return false;
    }
  }
}