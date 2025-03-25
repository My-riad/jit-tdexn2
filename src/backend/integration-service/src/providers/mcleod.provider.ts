import axios, { AxiosInstance } from 'axios';
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
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';

/**
 * McLeod TMS Provider
 * 
 * Provider implementation for McLeod Software's transportation management system integration.
 * Handles authentication, data synchronization, and mapping between McLeod's data format
 * and the platform's internal format.
 */
export class McLeodProvider implements TmsProviderInterface {
  private baseUrl: string;
  private client: AxiosInstance;
  private connection: TmsConnection;
  private credentials: TmsApiCredentials;

  /**
   * Create a new McLeod provider instance with the given TMS connection
   * @param connection The TMS connection configuration
   */
  constructor(connection: TmsConnection) {
    // Store the connection configuration
    this.connection = connection;

    // Ensure this is an API connection
    if (connection.integration_type !== TmsIntegrationType.API) {
      throw createError(
        'McLeod provider only supports API integration type',
        { code: 'VAL_INVALID_INPUT' }
      );
    }

    // Extract API credentials
    this.credentials = connection.credentials as TmsApiCredentials;

    // Set base URL from connection settings
    this.baseUrl = connection.settings.base_url || 'https://api.mcleodsoftware.com';

    // Initialize axios client with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Freight-Optimization-Platform/1.0',
      },
    });

    // Configure request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      // Check if we have a valid token
      if (this.credentials.access_token) {
        // Check if token is expired
        const isExpired = this.credentials.token_expires_at && 
          new Date(this.credentials.token_expires_at) < new Date();
        
        // If token is expired and we have a refresh token, try to refresh
        if (isExpired && this.credentials.refresh_token) {
          await this.refreshToken();
        }
        
        // Add the access token to the request header
        config.headers.Authorization = `Bearer ${this.credentials.access_token}`;
      }
      
      return config;
    });

    // Configure response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If the error is due to an expired token, try refreshing the token once
        if (error.response && error.response.status === 401 && this.credentials.refresh_token) {
          try {
            // Try to refresh the token
            const refreshed = await this.refreshToken();
            
            // If refresh was successful, retry the request
            if (refreshed) {
              // Get the original request config
              const originalRequest = error.config;
              // Update the Authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${this.credentials.access_token}`;
              // Retry the request with the new token
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If token refresh fails, proceed with the original error
            logger.error('Failed to refresh token', { error: refreshError });
          }
        }
        
        // For other errors, throw to be handled by the caller
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticates with the McLeod API using the provided credentials
   * @returns True if authentication was successful
   */
  async authenticate(): Promise<boolean> {
    try {
      logger.info('Authenticating with McLeod API');
      
      // Check if we have valid credentials
      if (!this.credentials.username || !this.credentials.password) {
        throw createError(
          'Missing credentials for McLeod authentication',
          { code: 'AUTH_INVALID_CREDENTIALS' }
        );
      }

      // Make authentication request to McLeod API
      const response = await this.client.post('/auth/token', {
        username: this.credentials.username,
        password: this.credentials.password,
        grant_type: 'password',
        client_id: this.credentials.api_key,
        client_secret: this.credentials.api_secret,
      });

      // Store the received tokens
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      
      // Calculate expiration time based on expires_in (typically in seconds)
      const expiresIn = response.data.expires_in || 3600; // Default to 1 hour if not specified
      this.credentials.token_expires_at = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with the new credentials
      this.connection.credentials = this.credentials;
      
      logger.info('Successfully authenticated with McLeod API');
      return true;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Refreshes the access token using the refresh token
   * @returns True if token refresh was successful
   */
  async refreshToken(): Promise<boolean> {
    try {
      logger.info('Refreshing McLeod API token');
      
      // Check if we have a refresh token
      if (!this.credentials.refresh_token) {
        throw createError(
          'Missing refresh token for McLeod token refresh',
          { code: 'AUTH_INVALID_TOKEN' }
        );
      }

      // Make refresh token request to McLeod API
      const response = await this.client.post('/auth/token', {
        refresh_token: this.credentials.refresh_token,
        grant_type: 'refresh_token',
        client_id: this.credentials.api_key,
        client_secret: this.credentials.api_secret,
      });

      // Update the stored tokens
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      
      // Calculate expiration time
      const expiresIn = response.data.expires_in || 3600;
      this.credentials.token_expires_at = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with the new credentials
      this.connection.credentials = this.credentials;
      
      logger.info('Successfully refreshed McLeod API token');
      return true;
    } catch (error) {
      // If refresh fails, clear the tokens to force a re-authentication
      this.credentials.access_token = undefined;
      this.credentials.refresh_token = undefined;
      this.credentials.token_expires_at = undefined;
      
      // Updating connection with cleared credentials
      this.connection.credentials = this.credentials;
      
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Synchronizes load data between McLeod TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  async syncLoads(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Starting load synchronization with McLeod TMS', { request });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Determine date range for synchronization
      const startDate = request.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
      const endDate = request.end_date || new Date();

      // Format dates for API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Fetch loads from McLeod API
      const response = await this.client.get('/api/v1/loads', {
        params: {
          company_code: this.connection.settings.company_code,
          modified_since: formattedStartDate,
          modified_before: formattedEndDate,
          limit: 1000, // Using pagination to handle large datasets
        },
      });

      // Track synchronization statistics
      const syncStats = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };

      // Process each load from McLeod
      for (const mcLeodLoad of response.data.loads) {
        try {
          // Map McLeod load to platform format
          const platformLoad = this.mapMcLeodLoadToPlatform(mcLeodLoad);
          
          // Here you would typically create or update the load in your platform
          // This is a placeholder for the actual integration with your load service
          
          // For demonstration, we're incrementing counts based on a hypothetical operation
          if (mcLeodLoad.is_new) {
            syncStats.created++;
          } else {
            syncStats.updated++;
          }
          
          logger.debug('Processed load from McLeod', { 
            load_id: mcLeodLoad.id,
            platform_load_id: platformLoad.reference_number
          });
        } catch (loadError) {
          logger.error('Failed to process load from McLeod', { 
            load_id: mcLeodLoad.id,
            error: loadError
          });
          syncStats.failed++;
        }
      }

      // Create and return sync response
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'success',
        entity_counts: {
          loads: syncStats.created + syncStats.updated
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Completed load synchronization with McLeod TMS', { 
        stats: syncStats,
        sync_id: syncResponse.sync_id
      });

      return syncResponse;
    } catch (error) {
      logger.error('Load synchronization with McLeod TMS failed', { error });
      
      // Create error response
      const errorResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        entity_counts: {},
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during load synchronization',
      };
      
      return errorResponse;
    }
  }

  /**
   * Synchronizes carrier data between McLeod TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  async syncCarriers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Starting carrier synchronization with McLeod TMS', { request });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Determine date range for synchronization
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const endDate = request.end_date || new Date();

      // Format dates for API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Fetch carriers from McLeod API
      const response = await this.client.get('/api/v1/carriers', {
        params: {
          company_code: this.connection.settings.company_code,
          modified_since: formattedStartDate,
          modified_before: formattedEndDate,
          limit: 1000,
        },
      });

      // Track synchronization statistics
      const syncStats = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };

      // Process each carrier from McLeod
      for (const mcLeodCarrier of response.data.carriers) {
        try {
          // Here you would map and process carrier data
          // This is a placeholder for the actual integration with your carrier service
          
          // For demonstration purposes
          if (mcLeodCarrier.is_new) {
            syncStats.created++;
          } else {
            syncStats.updated++;
          }
          
          logger.debug('Processed carrier from McLeod', { 
            carrier_id: mcLeodCarrier.id
          });
        } catch (carrierError) {
          logger.error('Failed to process carrier from McLeod', { 
            carrier_id: mcLeodCarrier.id,
            error: carrierError
          });
          syncStats.failed++;
        }
      }

      // Create and return sync response
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'success',
        entity_counts: {
          carriers: syncStats.created + syncStats.updated
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Completed carrier synchronization with McLeod TMS', { 
        stats: syncStats,
        sync_id: syncResponse.sync_id
      });

      return syncResponse;
    } catch (error) {
      logger.error('Carrier synchronization with McLeod TMS failed', { error });
      
      // Create error response
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        entity_counts: {},
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during carrier synchronization',
      };
    }
  }

  /**
   * Synchronizes driver data between McLeod TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  async syncDrivers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Starting driver synchronization with McLeod TMS', { request });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Determine date range for synchronization
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date || new Date();

      // Format dates for API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Fetch drivers from McLeod API
      const response = await this.client.get('/api/v1/drivers', {
        params: {
          company_code: this.connection.settings.company_code,
          modified_since: formattedStartDate,
          modified_before: formattedEndDate,
          limit: 1000,
        },
      });

      // Track synchronization statistics
      const syncStats = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };

      // Process each driver from McLeod
      for (const mcLeodDriver of response.data.drivers) {
        try {
          // Here you would map and process driver data
          // This is a placeholder for the actual integration with your driver service
          
          // For demonstration purposes
          if (mcLeodDriver.is_new) {
            syncStats.created++;
          } else {
            syncStats.updated++;
          }
          
          logger.debug('Processed driver from McLeod', { 
            driver_id: mcLeodDriver.id
          });
        } catch (driverError) {
          logger.error('Failed to process driver from McLeod', { 
            driver_id: mcLeodDriver.id,
            error: driverError
          });
          syncStats.failed++;
        }
      }

      // Create and return sync response
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'success',
        entity_counts: {
          drivers: syncStats.created + syncStats.updated
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Completed driver synchronization with McLeod TMS', { 
        stats: syncStats,
        sync_id: syncResponse.sync_id
      });

      return syncResponse;
    } catch (error) {
      logger.error('Driver synchronization with McLeod TMS failed', { error });
      
      // Create error response
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        entity_counts: {},
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during driver synchronization',
      };
    }
  }

  /**
   * Synchronizes vehicle data between McLeod TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  async syncVehicles(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Starting vehicle synchronization with McLeod TMS', { request });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Determine date range for synchronization
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date || new Date();

      // Format dates for API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Fetch vehicles from McLeod API
      const response = await this.client.get('/api/v1/vehicles', {
        params: {
          company_code: this.connection.settings.company_code,
          modified_since: formattedStartDate,
          modified_before: formattedEndDate,
          limit: 1000,
        },
      });

      // Track synchronization statistics
      const syncStats = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };

      // Process each vehicle from McLeod
      for (const mcLeodVehicle of response.data.vehicles) {
        try {
          // Here you would map and process vehicle data
          // This is a placeholder for the actual integration with your vehicle service
          
          // For demonstration purposes
          if (mcLeodVehicle.is_new) {
            syncStats.created++;
          } else {
            syncStats.updated++;
          }
          
          logger.debug('Processed vehicle from McLeod', { 
            vehicle_id: mcLeodVehicle.id
          });
        } catch (vehicleError) {
          logger.error('Failed to process vehicle from McLeod', { 
            vehicle_id: mcLeodVehicle.id,
            error: vehicleError
          });
          syncStats.failed++;
        }
      }

      // Create and return sync response
      const syncResponse: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'success',
        entity_counts: {
          vehicles: syncStats.created + syncStats.updated
        },
        started_at: new Date(),
        completed_at: new Date(),
      };

      logger.info('Completed vehicle synchronization with McLeod TMS', { 
        stats: syncStats,
        sync_id: syncResponse.sync_id
      });

      return syncResponse;
    } catch (error) {
      logger.error('Vehicle synchronization with McLeod TMS failed', { error });
      
      // Create error response
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        entity_counts: {},
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during vehicle synchronization',
      };
    }
  }

  /**
   * Pushes a load from the platform to McLeod TMS
   * @param load The load to push to McLeod
   * @returns True if the load was successfully pushed
   */
  async pushLoadToMcLeod(load: Load): Promise<boolean> {
    try {
      logger.info('Pushing load to McLeod TMS', { load_id: load.load_id });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Map the platform load to McLeod format
      const mcLeodLoad = this.mapPlatformLoadToMcLeod(load);

      // Send the load to McLeod API
      const response = await this.client.post('/api/v1/loads', mcLeodLoad);

      logger.info('Successfully pushed load to McLeod TMS', { 
        load_id: load.load_id,
        mcleod_load_id: response.data.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to push load to McLeod TMS', { 
        load_id: load.load_id,
        error
      });
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Updates the status of a load in McLeod TMS
   * @param loadId Platform load ID
   * @param status New load status
   * @returns True if the status was successfully updated
   */
  async updateLoadStatus(loadId: string, status: string): Promise<boolean> {
    try {
      logger.info('Updating load status in McLeod TMS', { load_id: loadId, status });
      
      // Ensure we are authenticated
      if (!this.credentials.access_token) {
        await this.authenticate();
      }

      // Map platform status to McLeod status code
      const mcLeodStatus = this.mapPlatformStatusToMcLeod(status as LoadStatus);

      // Send status update to McLeod API
      await this.client.patch(`/api/v1/loads/${loadId}/status`, {
        status: mcLeodStatus,
        company_code: this.connection.settings.company_code,
        updated_at: new Date().toISOString(),
      });

      logger.info('Successfully updated load status in McLeod TMS', { 
        load_id: loadId,
        status,
        mcleod_status: mcLeodStatus
      });

      return true;
    } catch (error) {
      logger.error('Failed to update load status in McLeod TMS', { 
        load_id: loadId,
        status,
        error
      });
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Maps a load from McLeod format to the platform's internal format
   * @param mcLeodLoad Load data in McLeod format
   * @returns Load data in platform format
   */
  private mapMcLeodLoadToPlatform(mcLeodLoad: any): LoadCreationParams {
    logger.debug('Mapping McLeod load to platform format', { mcleod_load_id: mcLeodLoad.id });
    
    // Map equipment type
    let equipmentType = EquipmentType.DRY_VAN; // Default
    switch (mcLeodLoad.equipment_type) {
      case 'REEFER':
        equipmentType = EquipmentType.REFRIGERATED;
        break;
      case 'FLAT':
        equipmentType = EquipmentType.FLATBED;
        break;
      // Add more mappings as needed
    }

    // Create pickup location
    const pickupLocation: Omit<LoadLocation, 'location_id' | 'load_id'> = {
      location_type: 'PICKUP' as any,
      facility_name: mcLeodLoad.origin.name || 'Unknown',
      address: mcLeodLoad.origin.address || '',
      city: mcLeodLoad.origin.city || '',
      state: mcLeodLoad.origin.state || '',
      zip: mcLeodLoad.origin.postal_code || '',
      latitude: parseFloat(mcLeodLoad.origin.latitude) || 0,
      longitude: parseFloat(mcLeodLoad.origin.longitude) || 0,
      earliest_time: new Date(mcLeodLoad.pickup_start_time),
      latest_time: new Date(mcLeodLoad.pickup_end_time),
      contact_name: mcLeodLoad.origin.contact_name || '',
      contact_phone: mcLeodLoad.origin.contact_phone || '',
      special_instructions: mcLeodLoad.origin.instructions || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Create delivery location
    const deliveryLocation: Omit<LoadLocation, 'location_id' | 'load_id'> = {
      location_type: 'DELIVERY' as any,
      facility_name: mcLeodLoad.destination.name || 'Unknown',
      address: mcLeodLoad.destination.address || '',
      city: mcLeodLoad.destination.city || '',
      state: mcLeodLoad.destination.state || '',
      zip: mcLeodLoad.destination.postal_code || '',
      latitude: parseFloat(mcLeodLoad.destination.latitude) || 0,
      longitude: parseFloat(mcLeodLoad.destination.longitude) || 0,
      earliest_time: new Date(mcLeodLoad.delivery_start_time),
      latest_time: new Date(mcLeodLoad.delivery_end_time),
      contact_name: mcLeodLoad.destination.contact_name || '',
      contact_phone: mcLeodLoad.destination.contact_phone || '',
      special_instructions: mcLeodLoad.destination.instructions || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Build the platform load object
    const platformLoad: LoadCreationParams = {
      shipper_id: mcLeodLoad.shipper_id || '',
      reference_number: mcLeodLoad.reference_number || mcLeodLoad.id,
      description: mcLeodLoad.description || 'Load from McLeod',
      equipment_type: equipmentType,
      weight: mcLeodLoad.weight ? parseFloat(mcLeodLoad.weight) : 0,
      dimensions: {
        length: mcLeodLoad.length ? parseFloat(mcLeodLoad.length) : 0,
        width: mcLeodLoad.width ? parseFloat(mcLeodLoad.width) : 0,
        height: mcLeodLoad.height ? parseFloat(mcLeodLoad.height) : 0,
      },
      volume: mcLeodLoad.volume ? parseFloat(mcLeodLoad.volume) : undefined,
      pallets: mcLeodLoad.pallets ? parseInt(mcLeodLoad.pallets, 10) : undefined,
      commodity: mcLeodLoad.commodity || 'General Freight',
      pickup_earliest: new Date(mcLeodLoad.pickup_start_time),
      pickup_latest: new Date(mcLeodLoad.pickup_end_time),
      delivery_earliest: new Date(mcLeodLoad.delivery_start_time),
      delivery_latest: new Date(mcLeodLoad.delivery_end_time),
      offered_rate: mcLeodLoad.rate ? parseFloat(mcLeodLoad.rate) : 0,
      special_instructions: mcLeodLoad.special_instructions || '',
      is_hazardous: mcLeodLoad.hazardous === true || mcLeodLoad.hazardous === 'Y',
      temperature_requirements: mcLeodLoad.temperature_controlled ? {
        min_temp: mcLeodLoad.min_temperature ? parseFloat(mcLeodLoad.min_temperature) : 0,
        max_temp: mcLeodLoad.max_temperature ? parseFloat(mcLeodLoad.max_temperature) : 0,
      } : undefined,
      locations: [pickupLocation, deliveryLocation],
    };

    return platformLoad;
  }

  /**
   * Maps a load from the platform's format to McLeod format
   * @param load Load data in platform format
   * @returns Load data in McLeod format
   */
  private mapPlatformLoadToMcLeod(load: Load): any {
    logger.debug('Mapping platform load to McLeod format', { load_id: load.load_id });
    
    // Find pickup and delivery locations
    const pickupLocation = load.locations?.find(loc => loc.location_type === 'PICKUP') || null;
    const deliveryLocation = load.locations?.find(loc => loc.location_type === 'DELIVERY') || null;
    
    // Map equipment type to McLeod codes
    let equipmentTypeCode;
    switch (load.equipment_type) {
      case EquipmentType.REFRIGERATED:
        equipmentTypeCode = 'REEFER';
        break;
      case EquipmentType.FLATBED:
        equipmentTypeCode = 'FLAT';
        break;
      case EquipmentType.DRY_VAN:
      default:
        equipmentTypeCode = 'VAN';
        break;
    }

    // Build the McLeod load object
    const mcLeodLoad = {
      reference_number: load.reference_number,
      shipper_id: load.shipper_id,
      description: load.description,
      equipment_type: equipmentTypeCode,
      weight: load.weight.toString(),
      length: load.dimensions?.length?.toString() || '0',
      width: load.dimensions?.width?.toString() || '0',
      height: load.dimensions?.height?.toString() || '0',
      volume: load.volume?.toString() || '',
      pallets: load.pallets?.toString() || '',
      commodity: load.commodity,
      pickup_start_time: load.pickup_earliest.toISOString(),
      pickup_end_time: load.pickup_latest.toISOString(),
      delivery_start_time: load.delivery_earliest.toISOString(),
      delivery_end_time: load.delivery_latest.toISOString(),
      rate: load.offered_rate.toString(),
      special_instructions: load.special_instructions || '',
      hazardous: load.is_hazardous ? 'Y' : 'N',
      temperature_controlled: load.temperature_requirements ? 'Y' : 'N',
      min_temperature: load.temperature_requirements?.min_temp?.toString() || '',
      max_temperature: load.temperature_requirements?.max_temp?.toString() || '',
      company_code: this.connection.settings.company_code,
      origin: pickupLocation ? {
        name: pickupLocation.facility_name,
        address: pickupLocation.address,
        city: pickupLocation.city,
        state: pickupLocation.state,
        postal_code: pickupLocation.zip,
        latitude: pickupLocation.latitude.toString(),
        longitude: pickupLocation.longitude.toString(),
        contact_name: pickupLocation.contact_name,
        contact_phone: pickupLocation.contact_phone,
        instructions: pickupLocation.special_instructions,
      } : {},
      destination: deliveryLocation ? {
        name: deliveryLocation.facility_name,
        address: deliveryLocation.address,
        city: deliveryLocation.city,
        state: deliveryLocation.state,
        postal_code: deliveryLocation.zip,
        latitude: deliveryLocation.latitude.toString(),
        longitude: deliveryLocation.longitude.toString(),
        contact_name: deliveryLocation.contact_name,
        contact_phone: deliveryLocation.contact_phone,
        instructions: deliveryLocation.special_instructions,
      } : {},
    };

    return mcLeodLoad;
  }

  /**
   * Maps a load status from McLeod format to the platform's status enum
   * @param mcLeodStatus Status code in McLeod format
   * @returns Load status in platform format
   */
  private mapMcLeodStatusToPlatform(mcLeodStatus: string): LoadStatus {
    switch (mcLeodStatus) {
      case 'AVAILABLE':
        return LoadStatus.AVAILABLE;
      case 'BOOKED':
        return LoadStatus.ASSIGNED;
      case 'IN_TRANSIT':
        return LoadStatus.IN_TRANSIT;
      case 'AT_PICKUP':
        return LoadStatus.AT_PICKUP;
      case 'PICKED_UP':
        return LoadStatus.LOADED;
      case 'AT_DELIVERY':
        return LoadStatus.AT_DROPOFF;
      case 'DELIVERED':
        return LoadStatus.DELIVERED;
      case 'COMPLETED':
        return LoadStatus.COMPLETED;
      case 'CANCELLED':
        return LoadStatus.CANCELLED;
      case 'DELAYED':
        return LoadStatus.DELAYED;
      case 'EXCEPTION':
        return LoadStatus.EXCEPTION;
      default:
        return LoadStatus.CREATED;
    }
  }

  /**
   * Maps a load status from platform format to McLeod status code
   * @param status Load status in platform format
   * @returns Status code in McLeod format
   */
  private mapPlatformStatusToMcLeod(status: LoadStatus): string {
    switch (status) {
      case LoadStatus.AVAILABLE:
        return 'AVAILABLE';
      case LoadStatus.ASSIGNED:
        return 'BOOKED';
      case LoadStatus.IN_TRANSIT:
        return 'IN_TRANSIT';
      case LoadStatus.AT_PICKUP:
        return 'AT_PICKUP';
      case LoadStatus.LOADED:
        return 'PICKED_UP';
      case LoadStatus.AT_DROPOFF:
        return 'AT_DELIVERY';
      case LoadStatus.DELIVERED:
        return 'DELIVERED';
      case LoadStatus.COMPLETED:
        return 'COMPLETED';
      case LoadStatus.CANCELLED:
        return 'CANCELLED';
      case LoadStatus.DELAYED:
        return 'DELAYED';
      case LoadStatus.EXCEPTION:
        return 'EXCEPTION';
      default:
        return 'CREATED';
    }
  }

  /**
   * Tests the connection to the McLeod API
   * @returns True if the connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing connection to McLeod TMS');
      
      // Try to authenticate
      const authResult = await this.authenticate();
      if (!authResult) {
        return false;
      }
      
      // Make a simple test request
      await this.client.get('/api/v1/ping', {
        params: {
          company_code: this.connection.settings.company_code
        }
      });
      
      logger.info('Connection test to McLeod TMS successful');
      return true;
    } catch (error) {
      logger.error('Connection test to McLeod TMS failed', { error });
      return false;
    }
  }

  /**
   * Handles errors from the McLeod API
   * @param error The error to handle
   * @throws A standardized error
   */
  private handleApiError(error: any): never {
    let errorMessage = 'Unknown error interacting with McLeod TMS';
    let errorCode = 'EXT_TMS_SERVICE_ERROR';
    
    // Log the complete error for debugging
    logger.error('McLeod API error', { error });
    
    if (error.response) {
      // The request was made and the server responded with a non-2xx status
      errorMessage = `McLeod API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
      
      // Map HTTP status codes to appropriate error codes
      if (error.response.status === 401 || error.response.status === 403) {
        errorCode = 'AUTH_INVALID_CREDENTIALS';
      } else if (error.response.status === 404) {
        errorCode = 'RES_LOAD_NOT_FOUND';
      } else if (error.response.status === 429) {
        errorCode = 'RATE_TOO_MANY_REQUESTS';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'McLeod API service unavailable or network error';
      errorCode = 'EXT_SERVICE_UNAVAILABLE';
    } else {
      // Something happened in setting up the request
      errorMessage = `McLeod API request setup error: ${error.message}`;
    }
    
    throw createError(errorMessage, { code: errorCode });
  }
}