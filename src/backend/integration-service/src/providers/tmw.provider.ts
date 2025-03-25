# src/backend/integration-service/src/providers/tmw.provider.ts
```typescript
import axios, { AxiosInstance } from 'axios'; // axios@^1.3.4
import { v4 as uuid } from 'uuid'; // uuid@^9.0.0

import {
  TmsConnection,
  TmsApiCredentials,
  TmsIntegrationType,
  TmsSyncRequest,
  TmsSyncResponse,
  TmsProviderInterface,
} from '../models/tms-connection.model';
import {
  Load,
  LoadCreationParams,
  LoadLocation,
  EquipmentType,
  LoadStatus,
} from '../../../common/interfaces/load.interface';
import { createError, logger } from '../../../common/utils/error-handler';
import { tmsConfig } from '../config';

/**
 * Provider implementation for TMW TMS integration that handles authentication,
 * data synchronization, and mapping between TMW's data format and the platform's internal format.
 */
export class TmwProvider implements TmsProviderInterface {
  private baseUrl: string;
  private client: AxiosInstance;
  private connection: TmsConnection;
  private credentials: TmsApiCredentials;

  /**
   * Initializes a new TMW provider instance with the given TMS connection
   * @param connection The TMS connection configuration
   */
  constructor(connection: TmsConnection) {
    // Store the connection configuration
    this.connection = connection;

    // Extract API credentials from the connection
    this.credentials = connection.credentials as TmsApiCredentials;

    // Set the base URL for the TMW API from connection settings
    this.baseUrl = connection.settings.base_url || tmsConfig.tmw.apiUrl;

    // Initialize the axios HTTP client with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: tmsConfig.tmw.timeout,
    });

    // Configure request interceptors for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.credentials.access_token) {
          config.headers.Authorization = `Bearer ${this.credentials.access_token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Configure response interceptors for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Attempt to refresh the token if it's an authentication error
        if (error.response?.status === 401) {
          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry the original request with the new token
              error.config.headers.Authorization = `Bearer ${this.credentials.access_token}`;
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            // If refresh fails, reject with the original error
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticates with the TMW API using the provided credentials
   * @returns True if authentication was successful
   */
  async authenticate(): Promise<boolean> {
    try {
      // Check if credentials are valid
      if (!this.credentials.username || !this.credentials.password) {
        throw createError('Invalid credentials', { code: 'AUTH_INVALID_CREDENTIALS' });
      }

      // Make authentication request to TMW API
      logger.info('Authenticating with TMW API');
      const response = await this.client.post('/oauth/token', {
        grant_type: 'password',
        username: this.credentials.username,
        password: this.credentials.password,
        client_id: tmsConfig.tmw.clientId,
        client_secret: tmsConfig.tmw.clientSecret,
      });

      // Store the received access token
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      this.credentials.token_expires_at = new Date(Date.now() + response.data.expires_in * 1000);

      // Update the connection with the new token information
      this.connection.credentials = this.credentials;

      logger.info('Successfully authenticated with TMW API', {
        expiresAt: this.credentials.token_expires_at,
      });
      return true;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns True if token refresh was successful
   */
  async refreshToken(): Promise<boolean> {
    try {
      // Check if refresh token is available
      if (!this.credentials.refresh_token) {
        throw createError('Refresh token is missing', { code: 'AUTH_MISSING_TOKEN' });
      }

      // Make token refresh request to TMW API
      logger.info('Refreshing access token with TMW API');
      const response = await this.client.post('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refresh_token,
        client_id: tmsConfig.tmw.clientId,
        client_secret: tmsConfig.tmw.clientSecret,
      });

      // Update the stored access token
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      this.credentials.token_expires_at = new Date(Date.now() + response.data.expires_in * 1000);

      // Update the connection with the new token information
      this.connection.credentials = this.credentials;

      logger.info('Successfully refreshed access token with TMW API', {
        expiresAt: this.credentials.token_expires_at,
      });
      return true;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Synchronizes load data between TMW TMS and the platform
   * @param request The synchronization request parameters
   * @returns Synchronization results
   */
  async syncLoads(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Determine date range for synchronization
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
      const endDate = request.end_date || new Date();

      // Fetch loads from TMW API
      logger.info(`Fetching loads from TMW API for date range: ${startDate} - ${endDate}`);
      const response = await this.client.get('/loads', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Transform TMW load data to platform format
      const tmwLoads = response.data;
      const platformLoads: LoadCreationParams[] = tmwLoads.map((tmwLoad: any) => this.mapTmwLoadToPlatform(tmwLoad));

      // Process each load (create/update in platform)
      let createdCount = 0;
      let updatedCount = 0;
      for (const load of platformLoads) {
        // TODO: Implement logic to create/update loads in the platform
        // This is a placeholder for the actual implementation
        logger.debug(`Processing load: ${load.reference_number}`);
        createdCount++; // Placeholder
      }

      // Track synchronization statistics
      const syncId = uuid();
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: syncId,
        status: 'success',
        entity_counts: {
          loads: {
            created: createdCount,
            updated: updatedCount,
            deleted: 0,
            errored: 0,
          },
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Successfully synchronized loads from TMW API', { syncResponse });
      return syncResponse;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return {
        connection_id: request.connection_id,
        sync_id: uuid(),
        status: 'failed',
        started_at: new Date(),
        error_message: error.message,
      };
    }
  }

  /**
   * Synchronizes carrier data between TMW TMS and the platform
   * @param request The synchronization request parameters
   * @returns Synchronization results
   */
  async syncCarriers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Fetch carriers from TMW API
      logger.info('Fetching carriers from TMW API');
      const response = await this.client.get('/carriers');

      // Transform TMW carrier data to platform format
      const tmwCarriers = response.data;
      // TODO: Implement mapping from TMW carrier format to platform carrier format

      // Process each carrier (create/update in platform)
      let createdCount = 0;
      let updatedCount = 0;
      for (const carrier of tmwCarriers) {
        // TODO: Implement logic to create/update carriers in the platform
        // This is a placeholder for the actual implementation
        logger.debug(`Processing carrier: ${carrier.carrierId}`);
        createdCount++; // Placeholder
      }

      // Track synchronization statistics
      const syncId = uuid();
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: syncId,
        status: 'success',
        entity_counts: {
          carriers: {
            created: createdCount,
            updated: updatedCount,
            deleted: 0,
            errored: 0,
          },
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Successfully synchronized carriers from TMW API', { syncResponse });
      return syncResponse;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return {
        connection_id: request.connection_id,
        sync_id: uuid(),
        status: 'failed',
        started_at: new Date(),
        error_message: error.message,
      };
    }
  }

  /**
   * Synchronizes driver data between TMW TMS and the platform
   * @param request The synchronization request parameters
   * @returns Synchronization results
   */
  async syncDrivers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Fetch drivers from TMW API
      logger.info('Fetching drivers from TMW API');
      const response = await this.client.get('/drivers');

      // Transform TMW driver data to platform format
      const tmwDrivers = response.data;
      // TODO: Implement mapping from TMW driver format to platform driver format

      // Process each driver (create/update in platform)
      let createdCount = 0;
      let updatedCount = 0;
      for (const driver of tmwDrivers) {
        // TODO: Implement logic to create/update drivers in the platform
        // This is a placeholder for the actual implementation
        logger.debug(`Processing driver: ${driver.driverId}`);
        createdCount++; // Placeholder
      }

      // Track synchronization statistics
      const syncId = uuid();
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: syncId,
        status: 'success',
        entity_counts: {
          drivers: {
            created: createdCount,
            updated: updatedCount,
            deleted: 0,
            errored: 0,
          },
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Successfully synchronized drivers from TMW API', { syncResponse });
      return syncResponse;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return {
        connection_id: request.connection_id,
        sync_id: uuid(),
        status: 'failed',
        started_at: new Date(),
        error_message: error.message,
      };
    }
  }

  /**
   * Synchronizes vehicle data between TMW TMS and the platform
   * @param request The synchronization request parameters
   * @returns Synchronization results
   */
  async syncVehicles(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Fetch vehicles from TMW API
      logger.info('Fetching vehicles from TMW API');
      const response = await this.client.get('/vehicles');

      // Transform TMW vehicle data to platform format
      const tmwVehicles = response.data;
      // TODO: Implement mapping from TMW vehicle format to platform vehicle format

      // Process each vehicle (create/update in platform)
      let createdCount = 0;
      let updatedCount = 0;
      for (const vehicle of tmwVehicles) {
        // TODO: Implement logic to create/update vehicles in the platform
        // This is a placeholder for the actual implementation
        logger.debug(`Processing vehicle: ${vehicle.vehicleId}`);
        createdCount++; // Placeholder
      }

      // Track synchronization statistics
      const syncId = uuid();
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: syncId,
        status: 'success',
        entity_counts: {
          vehicles: {
            created: createdCount,
            updated: updatedCount,
            deleted: 0,
            errored: 0,
          },
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Successfully synchronized vehicles from TMW API', { syncResponse });
      return syncResponse;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return {
        connection_id: request.connection_id,
        sync_id: uuid(),
        status: 'failed',
        started_at: new Date(),
        error_message: error.message,
      };
    }
  }

  /**
   * Pushes a load from the platform to TMW TMS
   * @param load The load data to push
   * @returns True if the load was successfully pushed
   */
  async pushLoadToTmw(load: Load): Promise<boolean> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Transform platform load to TMW format
      const tmwLoadData = this.mapPlatformLoadToTmw(load);

      // Send load data to TMW API
      logger.info(`Pushing load ${load.load_id} to TMW API`);
      const response = await this.client.post('/loads', tmwLoadData);

      // Handle response and any errors
      if (response.status === 201) {
        logger.info(`Successfully pushed load ${load.load_id} to TMW API`);
        return true;
      } else {
        logger.error(`Failed to push load ${load.load_id} to TMW API`, { status: response.status, data: response.data });
        return false;
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Updates the status of a load in TMW TMS
   * @param loadId The ID of the load to update
   * @param status The new status of the load
   * @returns True if the status was successfully updated
   */
  async updateLoadStatus(loadId: string, status: string): Promise<boolean> {
    try {
      // Authenticate with TMW API if needed
      if (!this.credentials.access_token || this.credentials.token_expires_at && this.credentials.token_expires_at <= new Date()) {
        await this.authenticate();
      }

      // Map platform status to TMW status code
      const tmwStatus = this.mapPlatformStatusToTmw(status as LoadStatus);

      // Send status update to TMW API
      logger.info(`Updating status of load ${loadId} to ${status} in TMW API`);
      const response = await this.client.put(`/loads/${loadId}/status`, { status: tmwStatus });

      // Handle response and any errors
      if (response.status === 200) {
        logger.info(`Successfully updated status of load ${loadId} in TMW API`);
        return true;
      } else {
        logger.error(`Failed to update status of load ${loadId} in TMW API`, { status: response.status, data: response.data });
        return false;
      }
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Maps a load from TMW format to the platform's internal format
   * @param tmwLoad The load data in TMW format
   * @returns Load data in platform format
   */
  mapTmwLoadToPlatform(tmwLoad: any): LoadCreationParams {
    // TODO: Implement mapping logic from TMW load format to platform load format
    // This is a placeholder for the actual implementation
    logger.debug('Mapping TMW load to platform format', { tmwLoad });

    // Extract basic load information
    const referenceNumber = tmwLoad.billNumber || tmwLoad.proNumber;
    const description = tmwLoad.description || 'Freight Load';

    // Map equipment type
    const equipmentType = tmwLoad.equipmentType === 'Dry Van' ? EquipmentType.DRY_VAN : EquipmentType.FLATBED; // Example

    // Map pickup and delivery locations
    const pickupLocation: LoadLocation = {
      location_id: uuid(),
      load_id: '', // Will be set later
      location_type: LoadLocationType.PICKUP,
      facility_name: tmwLoad.pickupFacilityName,
      address: tmwLoad.pickupAddress,
      city: tmwLoad.pickupCity,
      state: tmwLoad.pickupState,
      zip: tmwLoad.pickupZip,
      latitude: tmwLoad.pickupLatitude,
      longitude: tmwLoad.pickupLongitude,
      earliest_time: new Date(tmwLoad.pickupEarliest),
      latest_time: new Date(tmwLoad.pickupLatest),
      contact_name: tmwLoad.pickupContactName,
      contact_phone: tmwLoad.pickupPhone,
      special_instructions: tmwLoad.pickupInstructions,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const deliveryLocation: LoadLocation = {
      location_id: uuid(),
      load_id: '', // Will be set later
      location_type: LoadLocationType.DELIVERY,
      facility_name: tmwLoad.deliveryFacilityName,
      address: tmwLoad.deliveryAddress,
      city: tmwLoad.deliveryCity,
      state: tmwLoad.deliveryState,
      zip: tmwLoad.deliveryZip,
      latitude: tmwLoad.deliveryLatitude,
      longitude: tmwLoad.deliveryLongitude,
      earliest_time: new Date(tmwLoad.deliveryEarliest),
      latest_time: new Date(tmwLoad.deliveryLatest),
      contact_name: tmwLoad.deliveryContactName,
      contact_phone: tmwLoad.deliveryPhone,
      special_instructions: tmwLoad.deliveryInstructions,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Map dimensions and weight
    const weight = tmwLoad.weight || 0;
    const length = tmwLoad.length || 0;
    const width = tmwLoad.width || 0;
    const height = tmwLoad.height || 0;

    // Map rates and special requirements
    const offeredRate = tmwLoad.offeredRate || 0;
    const specialInstructions = tmwLoad.specialInstructions || '';

    // Return the mapped load data
    return {
      shipper_id: this.connection.owner_id,
      reference_number: referenceNumber,
      description: description,
      equipment_type: equipmentType,
      weight: weight,
      dimensions: { length, width, height },
      commodity: tmwLoad.commodity || 'General Freight',
      pickup_earliest: pickupLocation.earliest_time,
      pickup_latest: pickupLocation.latest_time,
      delivery_earliest: deliveryLocation.earliest_time,
      delivery_latest: deliveryLocation.latest_time,
      offered_rate: offeredRate,
      special_instructions: specialInstructions,
      is_hazardous: tmwLoad.isHazardous || false,
      temperature_requirements: {
        min_temp: tmwLoad.minTemp || 0,
        max_temp: tmwLoad.maxTemp || 0,
      },
      locations: [pickupLocation, deliveryLocation],
    } as LoadCreationParams;
  }

  /**
   * Maps a load from the platform's format to TMW format
   * @param load The load data in platform format
   * @returns Load data in TMW format
   */
  mapPlatformLoadToTmw(load: Load): any {
    // TODO: Implement mapping logic from platform load format to TMW load format
    // This is a placeholder for the actual implementation
    logger.debug('Mapping platform load to TMW format', { load });
    return {}; // Placeholder
  }

  /**
   * Maps a load status from TMW format to the platform's status enum
   * @param tmwStatus The load status in TMW format
   * @returns Load status in platform format
   */
  mapTmwStatusToPlatform(tmwStatus: string): LoadStatus {
    // TODO: Implement mapping logic from TMW status codes to platform LoadStatus enum
    // This is a placeholder for the actual implementation
    logger.debug('Mapping TMW status to platform status', { tmwStatus });
    return LoadStatus.CREATED; // Placeholder
  }

  /**
   * Maps a load status from platform format to TMW status code
   * @param status The load status in platform format
   * @returns Status code in TMW format
   */
  mapPlatformStatusToTmw(status: LoadStatus): string {
    // TODO: Implement mapping logic from platform LoadStatus enum to TMW status codes
    // This is a placeholder for the actual implementation
    logger.debug('Mapping platform status to TMW status', { status });
    return 'CREATED'; // Placeholder
  }

  /**
   * Tests the connection to the TMW API
   * @returns True if the connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Attempt to authenticate with the API
      await this.authenticate();

      // Make a simple test request
      logger.info('Testing connection to TMW API');
      await this.client.get('/ping'); // Replace '/ping' with a valid test endpoint

      logger.info('Successfully tested connection to TMW API');
      return true;
    } catch (error: any) {
      // Handle API errors
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Handles errors from the TMW API
   * @param error The error object
   */
  private handleApiError(error: any): never {
    logger.error('Handling TMW API error', { error });

    // Check if error is due to authentication
    if (error.response?.status === 401) {
      throw createError('Authentication failed', { code: 'AUTH_INVALID_CREDENTIALS' });
    }

    // Format error message based on error type
    let errorMessage = 'TMW API error';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Throw a standardized error with appropriate code
    throw createError(errorMessage, { code: 'EXT_TMS_SERVICE_ERROR' });
  }
}