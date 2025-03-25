# src/backend/integration-service/src/providers/keeptruckin.provider.ts
```typescript
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
  HOSStatus
} from '../../../common/interfaces/driver.interface';
import {
  Position,
  PositionSource
} from '../../../common/interfaces/position.interface';
import { eldConfig } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Provider implementation for integrating with the KeepTruckin (Motive) ELD API
 */
export class KeepTruckinProvider implements EldProviderInterface {
  private clientId: string;
  private clientSecret: string;
  private apiBaseUrl: string;
  private authBaseUrl: string;
  private apiVersion: string;
  private axiosInstance: AxiosInstance;

  /**
   * Initializes the KeepTruckin provider with configuration settings
   */
  constructor() {
    // Load configuration from eldConfig.keeptruckin
    const config = eldConfig.keeptruckin;

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
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Version': this.apiVersion,
      },
      timeout: config.timeout,
    });

    // Log provider initialization
    logger.info('KeepTruckinProvider initialized');
  }

  /**
   * Generates the OAuth authorization URL for KeepTruckin
   * @param redirectUri The URI to redirect to after authorization
   * @param state A random string to prevent request forgery
   * @param scope The requested OAuth scopes
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
    logger.info('Generated KeepTruckin authorization URL', { authorizationUrl });

    // Return the complete authorization URL
    return authorizationUrl;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens
   * @param code The authorization code received from KeepTruckin
   * @param redirectUri The URI used during the authorization request
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
      throw error; // The handleApiError function always throws an error
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
      throw error; // The handleApiError function always throws an error
    }
  }

  /**
   * Retrieves the current Hours of Service data for a driver
   * @param driverId The KeepTruckin driver ID
   * @param accessToken The access token for authentication
   * @returns The driver's current HOS data
   */
  async getDriverHOS(driverId: string, accessToken: string): Promise<DriverHOS> {
    try {
      // Set up request headers with the access token
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver HOS endpoint
      const response = await this.axiosInstance.get(`/v1/hos/drivers/${driverId}`, { headers });

      // Extract HOS data from the response
      const ktHosData = response.data.data;

      // Map the KeepTruckin HOS data to the platform's DriverHOS interface
      const driverHos: DriverHOS = {
        hos_id: ktHosData.id,
        driver_id: driverId,
        status: this.mapKeepTruckinStatusToHOSStatus(ktHosData.duty_status),
        status_since: new Date(ktHosData.since),
        driving_minutes_remaining: ktHosData.driving_minutes_remaining,
        duty_minutes_remaining: ktHosData.on_duty_minutes_remaining,
        cycle_minutes_remaining: ktHosData.cycle_minutes_remaining,
        location: {
          latitude: ktHosData.latitude,
          longitude: ktHosData.longitude,
        },
        vehicle_id: ktHosData.vehicle_id,
        eld_log_id: ktHosData.log_id,
        recorded_at: new Date(ktHosData.recorded_at),
      };

      // Log successful HOS data retrieval
      logger.info('Successfully retrieved driver HOS data from KeepTruckin', { driverId, hosStatus: driverHos.status });

      return driverHos;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverHOS');
      throw error; // The handleApiError function always throws an error
    }
  }

  /**
   * Retrieves the HOS logs for a driver within a specified time range
   * @param driverId The KeepTruckin driver ID
   * @param accessToken The access token for authentication
   * @param startDate The start date for the logs
   * @param endDate The end date for the logs
   * @returns Array of driver HOS log entries
   */
  async getDriverHOSLogs(driverId: string, accessToken: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
    try {
      // Format start and end dates for the API request
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      // Set up request headers with the access token
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver HOS logs endpoint with date range parameters
      const response = await this.axiosInstance.get(`/v1/hos/drivers/${driverId}/logs?start_date=${formattedStartDate}&end_date=${formattedEndDate}`, { headers });

      // Extract log data from the response
      const ktHosLogs = response.data.data;

      // Map each log entry to the platform's DriverHOS interface
      const driverHosLogs: DriverHOS[] = ktHosLogs.map((ktHosData: any) => ({
        hos_id: ktHosData.id,
        driver_id: driverId,
        status: this.mapKeepTruckinStatusToHOSStatus(ktHosData.duty_status),
        status_since: new Date(ktHosData.since),
        driving_minutes_remaining: ktHosData.driving_minutes_remaining,
        duty_minutes_remaining: ktHosData.on_duty_minutes_remaining,
        cycle_minutes_remaining: ktHosData.cycle_minutes_remaining,
        location: {
          latitude: ktHosData.latitude,
          longitude: ktHosData.longitude,
        },
        vehicle_id: ktHosData.vehicle_id,
        eld_log_id: ktHosData.log_id,
        recorded_at: new Date(ktHosData.recorded_at),
      }));

      // Log successful HOS logs retrieval
      logger.info('Successfully retrieved driver HOS logs from KeepTruckin', { driverId, logCount: driverHosLogs.length });

      return driverHosLogs;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverHOSLogs');
      throw error; // The handleApiError function always throws an error
    }
  }

  /**
   * Retrieves the current location of a driver
   * @param driverId The KeepTruckin driver ID
   * @param accessToken The access token for authentication
   * @returns The driver's current location data
   */
  async getDriverLocation(driverId: string, accessToken: string): Promise<Position> {
    try {
      // Set up request headers with the access token
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Make a GET request to the driver location endpoint
      const response = await this.axiosInstance.get(`/v1/drivers/${driverId}/location`, { headers });

      // Extract location data from the response
      const ktLocationData = response.data.data;

      // Map the KeepTruckin location data to the platform's Position interface format
      const location: Position = {
        latitude: ktLocationData.latitude,
        longitude: ktLocationData.longitude,
        heading: ktLocationData.heading,
        speed: ktLocationData.speed,
        accuracy: ktLocationData.accuracy,
        source: PositionSource.ELD,
        timestamp: new Date(ktLocationData.recorded_at),
      };

      // Log successful location data retrieval
      logger.info('Successfully retrieved driver location from KeepTruckin', { driverId, latitude: location.latitude, longitude: location.longitude });

      return location;
    } catch (error: any) {
      // Handle any errors from the API request
      this.handleApiError(error, 'getDriverLocation');
      throw error; // The handleApiError function always throws an error
    }
  }

  /**
   * Validates an ELD connection by making a test API call
   * @param accessToken The access token to validate
   * @returns True if the connection is valid
   */
  async validateConnection(accessToken: string): Promise<boolean> {
    try {
      // Set up request headers with the access token
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Make a GET request to a simple API endpoint (e.g., user profile)
      await this.axiosInstance.get('/v1/users/me', { headers });

      // Log the validation result
      logger.info('KeepTruckin connection validated successfully');

      return true;
    } catch (error: any) {
      // Handle any errors from the API request
      logger.error('KeepTruckin connection validation failed', { error });
      return false;
    }
  }

  /**
   * Maps KeepTruckin duty status values to the platform's HOSStatus enum
   * @param ktStatus The KeepTruckin duty status value
   * @returns The mapped HOSStatus enum value
   */
  private mapKeepTruckinStatusToHOSStatus(ktStatus: string): HOSStatus {
    switch (ktStatus) {
      case 'driving':
        return HOSStatus.DRIVING;
      case 'on_duty':
        return HOSStatus.ON_DUTY;
      case 'off_duty':
        return HOSStatus.OFF_DUTY;
      case 'sleeper_berth':
        return HOSStatus.SLEEPER_BERTH;
      default:
        logger.warn(`Unknown KeepTruckin duty status: ${ktStatus}, defaulting to OFF_DUTY`);
        return HOSStatus.OFF_DUTY;
    }
  }

  /**
   * Handles errors from the KeepTruckin API
   * @param error The error object
   * @param operation The name of the operation where the error occurred
   * @returns never (always throws an AppError)
   */
  private handleApiError(error: any, operation: string): never {
    // Log the error details
    logger.error(`KeepTruckin API error during ${operation}`, { error });

    let errorMessage = 'KeepTruckin API error';
    let statusCode = 500;

    // Check if the error is an Axios error with response data
    if (error instanceof AxiosError && error.response) {
      // Extract error message and status code from the response if available
      errorMessage = error.response.data?.error || errorMessage;
      statusCode = error.response.status || statusCode;
    }

    // Create an appropriate AppError with the error details
    const appError = new AppError(errorMessage, {
      code: 'EXT_ELD_SERVICE_ERROR',
      statusCode: statusCode,
      isOperational: false,
      details: {
        operation: operation,
        originalError: error,
      },
    });

    // Throw the AppError
    throw appError;
  }
}