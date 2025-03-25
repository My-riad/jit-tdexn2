import axios, { AxiosInstance, AxiosError } from 'axios'; // axios@^1.3.4
import querystring from 'querystring'; // querystring@^0.2.1
import {
  EldProviderInterface,
  EldTokenResponse,
  EldAuthorizationRequest,
  EldTokenExchangeRequest
} from '../models/eld-connection.model';
import {
  DriverHOS,
  HOSStatus,
  Position,
  PositionSource
} from '../../../common/interfaces/driver.interface';
import { eldConfig } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Provider implementation for integrating with the Samsara ELD API
 */
export class SamsaraProvider implements EldProviderInterface {
  private clientId: string;
  private clientSecret: string;
  private apiBaseUrl: string;
  private authBaseUrl: string;
  private apiVersion: string;
  private axiosInstance: AxiosInstance;

  /**
   * Initializes the Samsara provider with configuration settings
   */
  constructor() {
    // Load configuration from eldConfig.samsara
    const config = eldConfig.samsara;

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
    logger.info('Samsara provider initialized');
  }

  /**
   * Generates the OAuth authorization URL for Samsara
   * @param redirectUri 
   * @param state 
   * @param scope 
   * @returns The authorization URL to redirect the driver to
   */
  getAuthorizationUrl(redirectUri: string, state: string, scope: string): string {
    // Construct query parameters including client_id, redirect_uri, response_type, state, and scope
    const queryParams = querystring.stringify({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
      scope: scope,
    });

    // Build the authorization URL using authBaseUrl and query parameters
    const authorizationUrl = `${this.authBaseUrl}?${queryParams}`;

    // Log the generated authorization URL
    logger.info('Generated Samsara authorization URL', { authorizationUrl });

    // Return the complete authorization URL
    return authorizationUrl;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens
   * @param code 
   * @param redirectUri 
   * @returns The token response containing access_token, refresh_token, and expires_in
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<EldTokenResponse> {
    try {
      // Construct the request body with grant_type, code, redirect_uri, client_id, and client_secret
      const requestBody = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      // Make a POST request to the token endpoint
      const response = await axios.post<EldTokenResponse>(
        `${this.apiBaseUrl}/oauth/token`,
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
      logger.info('Successfully exchanged code for tokens', {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
      });

      return tokenResponse;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'exchangeCodeForTokens');
      throw error; // To satisfy the linter, though handleApiError always throws
    }
  }

  /**
   * Refreshes an expired access token using a refresh token
   * @param refreshToken 
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
        `${this.apiBaseUrl}/oauth/token`,
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
      logger.info('Successfully refreshed access token', {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
      });

      return tokenResponse;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'refreshAccessToken');
      throw error; // To satisfy the linter, though handleApiError always throws
    }
  }

  /**
   * Retrieves the current Hours of Service data for a driver
   * @param driverId 
   * @param accessToken 
   * @returns The driver's current HOS data
   */
  async getDriverHOS(driverId: string, accessToken: string): Promise<DriverHOS> {
    try {
      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver HOS endpoint
      const response = await this.axiosInstance.get(
        `/fleet/drivers/${driverId}/hos_status`,
        { headers }
      );

      // Map the Samsara HOS data to the platform's DriverHOS interface
      const samsaraData = response.data;

      // Convert duty status values to the platform's HOSStatus enum
      const status = this.mapSamsaraStatusToHOSStatus(samsaraData.dutyStatus);

      // Calculate remaining driving, duty, and cycle minutes
      const drivingMinutesRemaining = samsaraData.timeUntilBreak;
      const dutyMinutesRemaining = samsaraData.timeUntilEndOfShift;
      const cycleMinutesRemaining = samsaraData.timeUntilEndOfCycle;

      // Return the standardized DriverHOS object
      const driverHOS: DriverHOS = {
        hos_id: '', // Samsara does not provide a unique HOS ID
        driver_id: driverId,
        status: status,
        status_since: new Date(samsaraData.time),
        driving_minutes_remaining: drivingMinutesRemaining,
        duty_minutes_remaining: dutyMinutesRemaining,
        cycle_minutes_remaining: cycleMinutesRemaining,
        location: { latitude: 0, longitude: 0 }, // Samsara does not provide location in HOS
        vehicle_id: '', // Samsara does not provide vehicle ID in HOS
        eld_log_id: '', // Samsara does not provide ELD log ID in HOS
        recorded_at: new Date(), // Use current time as recorded time
      };

      // Log successful HOS data retrieval
      logger.info('Successfully retrieved Samsara HOS data', { driverId, status });

      return driverHOS;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverHOS');
      throw error; // To satisfy the linter, though handleApiError always throws
    }
  }

  /**
   * Retrieves the HOS logs for a driver within a specified time range
   * @param driverId 
   * @param accessToken 
   * @param startDate 
   * @param endDate 
   * @returns Array of driver HOS log entries
   */
  async getDriverHOSLogs(driverId: string, accessToken: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
    try {
      // Format start and end dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver HOS logs endpoint with date range parameters
      const response = await this.axiosInstance.get(
        `/fleet/drivers/${driverId}/hos_logs?from=${formattedStartDate}&to=${formattedEndDate}`,
        { headers }
      );

      // Map each log entry to the platform's DriverHOS interface
      const samsaraLogs = response.data.data;

      // Convert duty status values to the platform's HOSStatus enum
      const driverHOSLogs: DriverHOS[] = samsaraLogs.map((samsaraLog: any) => {
        const status = this.mapSamsaraStatusToHOSStatus(samsaraLog.dutyStatus);

        return {
          hos_id: '', // Samsara does not provide a unique HOS ID
          driver_id: driverId,
          status: status,
          status_since: new Date(samsaraLog.time),
          driving_minutes_remaining: 0, // Samsara does not provide remaining minutes in logs
          duty_minutes_remaining: 0, // Samsara does not provide remaining minutes in logs
          cycle_minutes_remaining: 0, // Samsara does not provide remaining minutes in logs
          location: { latitude: 0, longitude: 0 }, // Samsara does not provide location in logs
          vehicle_id: '', // Samsara does not provide vehicle ID in logs
          eld_log_id: '', // Samsara does not provide ELD log ID in logs
          recorded_at: new Date(samsaraLog.time),
        };
      });

      // Log successful HOS logs retrieval
      logger.info('Successfully retrieved Samsara HOS logs', { driverId, startDate, endDate, logCount: driverHOSLogs.length });

      return driverHOSLogs;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverHOSLogs');
      throw error; // To satisfy the linter, though handleApiError always throws
    }
  }

  /**
   * Retrieves the current location of a driver
   * @param driverId 
   * @param accessToken 
   * @returns The driver's current location data
   */
  async getDriverLocation(driverId: string, accessToken: string): Promise<{ latitude: number; longitude: number; timestamp: Date; speed: number; heading: number; }> {
    try {
      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver location endpoint
      const response = await this.axiosInstance.get(
        `/fleet/drivers/${driverId}/locations`,
        { headers }
      );

      // Extract location data from the response
      const locationData = response.data.data[0];

      // Map the Samsara location data to the platform's Position interface format
      const location: Position = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        heading: locationData.heading,
        speed: locationData.speed,
        timestamp: new Date(locationData.time),
        accuracy: 0, // Samsara does not provide accuracy
        source: PositionSource.ELD,
      };

      // Log successful location data retrieval
      logger.info('Successfully retrieved Samsara location data', { driverId, latitude: location.latitude, longitude: location.longitude });

      return location;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverLocation');
      throw error; // To satisfy the linter, though handleApiError always throws
    }
  }

  /**
   * Validates an ELD connection by making a test API call
   * @param accessToken 
   * @returns True if the connection is valid
   */
  async validateConnection(accessToken: string): Promise<boolean> {
    try {
      // Set up request headers with the access token
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Make a GET request to a simple API endpoint (e.g., user profile)
      await this.axiosInstance.get('/users/me', { headers });

      // Log the validation result
      logger.info('Samsara connection validated successfully');

      return true;
    } catch (error: any) {
      // Handle any errors from the API request
      logger.error('Samsara connection validation failed', { error });
      return false;
    }
  }

  /**
   * Maps Samsara duty status values to the platform's HOSStatus enum
   * @param samsaraStatus 
   * @returns The mapped HOSStatus enum value
   */
  private mapSamsaraStatusToHOSStatus(samsaraStatus: string): HOSStatus {
    switch (samsaraStatus) {
      case 'driving':
        return HOSStatus.DRIVING;
      case 'on_duty':
        return HOSStatus.ON_DUTY;
      case 'off_duty':
        return HOSStatus.OFF_DUTY;
      case 'sleeper_berth':
        return HOSStatus.SLEEPER_BERTH;
      default:
        logger.warn(`Unknown Samsara duty status: ${samsaraStatus}, defaulting to OFF_DUTY`);
        return HOSStatus.OFF_DUTY;
    }
  }

  /**
   * Handles errors from the Samsara API
   * @param error 
   * @param operation 
   * @returns Always throws an AppError
   */
  private handleApiError(error: any, operation: string): never {
    // Log the error details
    logger.error(`Samsara API error during ${operation}`, { error });

    // Check if the error is an Axios error with response data
    if (error instanceof AxiosError && error.response) {
      // Extract error message and status code from the response if available
      const errorMessage = error.response.data?.errors?.[0]?.message || error.message;
      const statusCode = error.response.status;

      // Create an appropriate AppError with the error details
      throw new AppError(`Samsara API Error: ${errorMessage}`, {
        code: `EXT_SAMSARA_SERVICE_ERROR`,
        statusCode: statusCode,
        isRetryable: true,
        details: {
          operation: operation,
          status: statusCode,
          message: errorMessage,
          response: error.response.data,
        },
      });
    } else {
      // For non-Axios errors, create a generic AppError
      throw new AppError(`Samsara API Error: ${error.message}`, {
        code: `EXT_SAMSARA_SERVICE_ERROR`,
        statusCode: 500,
        isRetryable: true,
        details: {
          operation: operation,
          message: error.message,
        },
      });
    }
  }
}