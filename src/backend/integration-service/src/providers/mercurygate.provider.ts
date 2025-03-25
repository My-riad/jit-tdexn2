import { TmsConnection, TmsApiCredentials, TmsIntegrationType, TmsSyncRequest, TmsSyncResponse, TmsProviderInterface } from '../models/tms-connection.model';
import { Load, LoadCreationParams, LoadLocation, EquipmentType, LoadStatus } from '../../../common/interfaces/load.interface';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import axios, { AxiosInstance } from 'axios';

/**
 * Provider implementation for MercuryGate TMS integration that handles authentication,
 * data synchronization, and mapping between MercuryGate's data format and the platform's
 * internal format.
 */
export class MercuryGateProvider implements TmsProviderInterface {
  private baseUrl: string;
  private client: AxiosInstance;
  private connection: TmsConnection;
  private credentials: TmsApiCredentials;

  /**
   * Initializes a new MercuryGate provider instance with the given TMS connection
   * @param connection TMS connection configuration
   */
  constructor(connection: TmsConnection) {
    this.connection = connection;
    
    // Ensure the connection is for MercuryGate and using API
    if (connection.integration_type !== TmsIntegrationType.API) {
      throw createError('Connection type must be API for MercuryGate integration', {
        code: 'VAL_INVALID_INPUT'
      });
    }
    
    // Extract API credentials
    this.credentials = connection.credentials as TmsApiCredentials;
    
    // Set the base URL from connection settings
    this.baseUrl = connection.settings.base_url || 'https://api.mercurygate.net/api/v1';
    
    // Initialize the axios client
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Set up request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        // Check if we need to get a new token
        if (this.shouldRefreshToken()) {
          await this.refreshToken();
        }
        
        // Add the access token to the request
        if (this.credentials.access_token) {
          config.headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
        }
        
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', { error });
        return Promise.reject(error);
      }
    );
    
    // Set up response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle errors, including authentication errors
        if (error.response && error.response.status === 401) {
          // Attempt to refresh the token
          const tokenRefreshed = await this.refreshToken();
          
          if (tokenRefreshed && error.config) {
            // Retry the original request
            const retryConfig = { ...error.config };
            if (this.credentials.access_token) {
              retryConfig.headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
            }
            return this.client(retryConfig);
          }
        }
        
        // Pass other errors through
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Determines if the access token needs to be refreshed
   * @returns True if token needs refreshing
   */
  private shouldRefreshToken(): boolean {
    if (!this.credentials.access_token) {
      return true;
    }
    
    if (!this.credentials.token_expires_at) {
      return false;
    }
    
    // Refresh if token expires in less than 5 minutes
    const expiresAt = new Date(this.credentials.token_expires_at);
    const now = new Date();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    return expiresAt.getTime() - now.getTime() < fiveMinutesInMs;
  }
  
  /**
   * Authenticates with the MercuryGate API using the provided credentials
   * @returns True if authentication was successful
   */
  public async authenticate(): Promise<boolean> {
    try {
      logger.info('Authenticating with MercuryGate API');
      
      // Check if we have the necessary credentials
      if (!this.credentials.username || !this.credentials.password) {
        logger.error('Missing username or password for MercuryGate authentication');
        throw createError('Missing username or password for authentication', {
          code: 'AUTH_INVALID_CREDENTIALS'
        });
      }
      
      // Make the authentication request
      const response = await this.client.post('/auth/token', {
        username: this.credentials.username,
        password: this.credentials.password,
        grant_type: 'password'
      });
      
      // Store the received tokens
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      
      // Calculate token expiration (typically in seconds from now)
      const expiresInMs = response.data.expires_in * 1000;
      this.credentials.token_expires_at = new Date(Date.now() + expiresInMs);
      
      // Update the connection with the new token
      this.connection.credentials = this.credentials;
      this.connection.status = 'active';
      
      logger.info('Successfully authenticated with MercuryGate API');
      return true;
    } catch (error) {
      this.handleApiError(error);
      return false;
    }
  }
  
  /**
   * Refreshes the access token using the refresh token
   * @returns True if token refresh was successful
   */
  public async refreshToken(): Promise<boolean> {
    try {
      logger.info('Refreshing MercuryGate access token');
      
      // Check if we have a refresh token
      if (!this.credentials.refresh_token) {
        logger.error('No refresh token available');
        // Need to perform a full authentication
        return await this.authenticate();
      }
      
      // Make the token refresh request
      const response = await this.client.post('/auth/token', {
        refresh_token: this.credentials.refresh_token,
        grant_type: 'refresh_token'
      });
      
      // Store the received tokens
      this.credentials.access_token = response.data.access_token;
      this.credentials.refresh_token = response.data.refresh_token;
      
      // Calculate token expiration
      const expiresInMs = response.data.expires_in * 1000;
      this.credentials.token_expires_at = new Date(Date.now() + expiresInMs);
      
      // Update the connection with the new token
      this.connection.credentials = this.credentials;
      
      logger.info('Successfully refreshed MercuryGate access token');
      return true;
    } catch (error) {
      // If refresh fails, we'll need to reauthenticate
      logger.warn('Failed to refresh token, attempting full authentication', { error });
      return await this.authenticate();
    }
  }
  
  /**
   * Synchronizes load data between MercuryGate TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  public async syncLoads(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Synchronizing loads from MercuryGate', { request });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Prepare the response object
      const response: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'in_progress',
        started_at: new Date(),
        entity_counts: { loads: 0 }
      };
      
      // Determine date range for the sync
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      const endDate = request.end_date || new Date();
      
      // Format dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Request loads from MercuryGate API
      const apiResponse = await this.client.get('/loads', {
        params: {
          updatedAfter: formattedStartDate,
          updatedBefore: formattedEndDate,
          limit: 100 // Adjust as needed
        }
      });
      
      const loadsData = apiResponse.data.loads || [];
      logger.info(`Retrieved ${loadsData.length} loads from MercuryGate`);
      
      // Process each load
      for (const mercuryGateLoad of loadsData) {
        try {
          // Map to platform format
          const platformLoad = this.mapMercuryGateLoadToPlatform(mercuryGateLoad);
          
          // TODO: Save the load to the platform database
          // This would typically involve calling a service or repository
          
          // Increment the counter
          response.entity_counts.loads++;
          
        } catch (loadError) {
          logger.error('Error processing load from MercuryGate', { 
            loadId: mercuryGateLoad.id, 
            error: loadError 
          });
        }
      }
      
      // Update response status
      response.status = 'success';
      response.completed_at = new Date();
      
      logger.info('Load synchronization completed', { 
        syncId: response.sync_id,
        loadsProcessed: response.entity_counts.loads
      });
      
      return response;
    } catch (error) {
      logger.error('Load synchronization failed', { error });
      
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during load synchronization'
      };
    }
  }
  
  /**
   * Synchronizes carrier data between MercuryGate TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  public async syncCarriers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Synchronizing carriers from MercuryGate', { request });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Prepare the response object
      const response: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'in_progress',
        started_at: new Date(),
        entity_counts: { carriers: 0 }
      };
      
      // Determine date range for the sync
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date || new Date();
      
      // Format dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Request carriers from MercuryGate API
      const apiResponse = await this.client.get('/carriers', {
        params: {
          updatedAfter: formattedStartDate,
          updatedBefore: formattedEndDate,
          limit: 100
        }
      });
      
      const carriersData = apiResponse.data.carriers || [];
      logger.info(`Retrieved ${carriersData.length} carriers from MercuryGate`);
      
      // Process each carrier
      for (const mercuryGateCarrier of carriersData) {
        try {
          // TODO: Map and save the carrier to the platform database
          
          // Increment the counter
          response.entity_counts.carriers++;
          
        } catch (carrierError) {
          logger.error('Error processing carrier from MercuryGate', { 
            carrierId: mercuryGateCarrier.id, 
            error: carrierError 
          });
        }
      }
      
      // Update response status
      response.status = 'success';
      response.completed_at = new Date();
      
      logger.info('Carrier synchronization completed', { 
        syncId: response.sync_id,
        carriersProcessed: response.entity_counts.carriers
      });
      
      return response;
    } catch (error) {
      logger.error('Carrier synchronization failed', { error });
      
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during carrier synchronization'
      };
    }
  }
  
  /**
   * Synchronizes driver data between MercuryGate TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  public async syncDrivers(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Synchronizing drivers from MercuryGate', { request });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Prepare the response object
      const response: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'in_progress',
        started_at: new Date(),
        entity_counts: { drivers: 0 }
      };
      
      // Determine date range for the sync
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date || new Date();
      
      // Format dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Request drivers from MercuryGate API
      const apiResponse = await this.client.get('/drivers', {
        params: {
          updatedAfter: formattedStartDate,
          updatedBefore: formattedEndDate,
          limit: 100
        }
      });
      
      const driversData = apiResponse.data.drivers || [];
      logger.info(`Retrieved ${driversData.length} drivers from MercuryGate`);
      
      // Process each driver
      for (const mercuryGateDriver of driversData) {
        try {
          // TODO: Map and save the driver to the platform database
          
          // Increment the counter
          response.entity_counts.drivers++;
          
        } catch (driverError) {
          logger.error('Error processing driver from MercuryGate', { 
            driverId: mercuryGateDriver.id, 
            error: driverError 
          });
        }
      }
      
      // Update response status
      response.status = 'success';
      response.completed_at = new Date();
      
      logger.info('Driver synchronization completed', { 
        syncId: response.sync_id,
        driversProcessed: response.entity_counts.drivers
      });
      
      return response;
    } catch (error) {
      logger.error('Driver synchronization failed', { error });
      
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during driver synchronization'
      };
    }
  }
  
  /**
   * Synchronizes vehicle data between MercuryGate TMS and the platform
   * @param request Synchronization request parameters
   * @returns Synchronization results
   */
  public async syncVehicles(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    try {
      logger.info('Synchronizing vehicles from MercuryGate', { request });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Prepare the response object
      const response: TmsSyncResponse = {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'in_progress',
        started_at: new Date(),
        entity_counts: { vehicles: 0 }
      };
      
      // Determine date range for the sync
      const startDate = request.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = request.end_date || new Date();
      
      // Format dates for the API request
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Request vehicles from MercuryGate API
      const apiResponse = await this.client.get('/vehicles', {
        params: {
          updatedAfter: formattedStartDate,
          updatedBefore: formattedEndDate,
          limit: 100
        }
      });
      
      const vehiclesData = apiResponse.data.vehicles || [];
      logger.info(`Retrieved ${vehiclesData.length} vehicles from MercuryGate`);
      
      // Process each vehicle
      for (const mercuryGateVehicle of vehiclesData) {
        try {
          // TODO: Map and save the vehicle to the platform database
          
          // Increment the counter
          response.entity_counts.vehicles++;
          
        } catch (vehicleError) {
          logger.error('Error processing vehicle from MercuryGate', { 
            vehicleId: mercuryGateVehicle.id, 
            error: vehicleError 
          });
        }
      }
      
      // Update response status
      response.status = 'success';
      response.completed_at = new Date();
      
      logger.info('Vehicle synchronization completed', { 
        syncId: response.sync_id,
        vehiclesProcessed: response.entity_counts.vehicles
      });
      
      return response;
    } catch (error) {
      logger.error('Vehicle synchronization failed', { error });
      
      return {
        connection_id: request.connection_id,
        sync_id: `sync-${Date.now()}`,
        status: 'failed',
        started_at: new Date(),
        completed_at: new Date(),
        error_message: error.message || 'Unknown error during vehicle synchronization'
      };
    }
  }
  
  /**
   * Pushes a load from the platform to MercuryGate TMS
   * @param load Load data to push
   * @returns True if the load was successfully pushed
   */
  public async pushLoadToMercuryGate(load: Load): Promise<boolean> {
    try {
      logger.info('Pushing load to MercuryGate', { loadId: load.load_id });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Map the platform load to MercuryGate format
      const mercuryGateLoad = this.mapPlatformLoadToMercuryGate(load);
      
      // Send to MercuryGate API
      const response = await this.client.post('/loads', mercuryGateLoad);
      
      logger.info('Successfully pushed load to MercuryGate', {
        loadId: load.load_id,
        mercuryGateId: response.data.id
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to push load to MercuryGate', { 
        loadId: load.load_id, 
        error 
      });
      
      this.handleApiError(error);
      return false;
    }
  }
  
  /**
   * Updates the status of a load in MercuryGate TMS
   * @param loadId ID of the load to update
   * @param status New status
   * @returns True if the status was successfully updated
   */
  public async updateLoadStatus(loadId: string, status: string): Promise<boolean> {
    try {
      logger.info('Updating load status in MercuryGate', { loadId, status });
      
      // Ensure we're authenticated
      await this.authenticate();
      
      // Map the platform status to MercuryGate status
      const mercuryGateStatus = this.mapPlatformStatusToMercuryGate(status as LoadStatus);
      
      // Send status update to MercuryGate API
      await this.client.patch(`/loads/${loadId}`, {
        status: mercuryGateStatus
      });
      
      logger.info('Successfully updated load status in MercuryGate', { loadId, status });
      return true;
    } catch (error) {
      logger.error('Failed to update load status in MercuryGate', { 
        loadId, 
        status, 
        error 
      });
      
      this.handleApiError(error);
      return false;
    }
  }
  
  /**
   * Maps a load from MercuryGate format to the platform's internal format
   * @param mercuryGateLoad Load data in MercuryGate format
   * @returns Load data in platform format
   */
  private mapMercuryGateLoadToPlatform(mercuryGateLoad: any): LoadCreationParams {
    logger.debug('Mapping MercuryGate load to platform format', { loadId: mercuryGateLoad.id });
    
    // Map equipment type
    let equipmentType = EquipmentType.DRY_VAN; // Default
    if (mercuryGateLoad.equipment && mercuryGateLoad.equipment.type) {
      switch (mercuryGateLoad.equipment.type.toUpperCase()) {
        case 'REEFER':
          equipmentType = EquipmentType.REFRIGERATED;
          break;
        case 'FLATBED':
          equipmentType = EquipmentType.FLATBED;
          break;
        default:
          equipmentType = EquipmentType.DRY_VAN;
      }
    }
    
    // Create locations array
    const locations: Omit<LoadLocation, 'location_id' | 'load_id'>[] = [];
    
    // Add pickup location
    if (mercuryGateLoad.origin) {
      locations.push({
        location_type: 'PICKUP',
        facility_name: mercuryGateLoad.origin.name || 'Origin',
        address: mercuryGateLoad.origin.address || '',
        city: mercuryGateLoad.origin.city || '',
        state: mercuryGateLoad.origin.state || '',
        zip: mercuryGateLoad.origin.zip || '',
        latitude: mercuryGateLoad.origin.latitude || 0,
        longitude: mercuryGateLoad.origin.longitude || 0,
        earliest_time: new Date(mercuryGateLoad.origin.earliestTime || Date.now()),
        latest_time: new Date(mercuryGateLoad.origin.latestTime || Date.now() + 4 * 60 * 60 * 1000), // Default to 4 hours later
        contact_name: mercuryGateLoad.origin.contact || '',
        contact_phone: mercuryGateLoad.origin.phone || '',
        special_instructions: mercuryGateLoad.origin.instructions || '',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Add delivery location
    if (mercuryGateLoad.destination) {
      locations.push({
        location_type: 'DELIVERY',
        facility_name: mercuryGateLoad.destination.name || 'Destination',
        address: mercuryGateLoad.destination.address || '',
        city: mercuryGateLoad.destination.city || '',
        state: mercuryGateLoad.destination.state || '',
        zip: mercuryGateLoad.destination.zip || '',
        latitude: mercuryGateLoad.destination.latitude || 0,
        longitude: mercuryGateLoad.destination.longitude || 0,
        earliest_time: new Date(mercuryGateLoad.destination.earliestTime || Date.now()),
        latest_time: new Date(mercuryGateLoad.destination.latestTime || Date.now() + 4 * 60 * 60 * 1000), // Default to 4 hours later
        contact_name: mercuryGateLoad.destination.contact || '',
        contact_phone: mercuryGateLoad.destination.phone || '',
        special_instructions: mercuryGateLoad.destination.instructions || '',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Map temperature requirements if applicable
    let temperatureRequirements = undefined;
    if (equipmentType === EquipmentType.REFRIGERATED && mercuryGateLoad.temperatureSettings) {
      temperatureRequirements = {
        min_temp: mercuryGateLoad.temperatureSettings.minTemp || 0,
        max_temp: mercuryGateLoad.temperatureSettings.maxTemp || 0
      };
    }
    
    // Create the platform load object
    const platformLoad: LoadCreationParams = {
      shipper_id: mercuryGateLoad.customer?.id || '',
      reference_number: mercuryGateLoad.referenceNumber || mercuryGateLoad.id || '',
      description: mercuryGateLoad.description || 'Load from MercuryGate',
      equipment_type: equipmentType,
      weight: mercuryGateLoad.weight || 0,
      dimensions: {
        length: mercuryGateLoad.dimensions?.length || 0,
        width: mercuryGateLoad.dimensions?.width || 0,
        height: mercuryGateLoad.dimensions?.height || 0
      },
      volume: mercuryGateLoad.volume || 0,
      pallets: mercuryGateLoad.pallets || 0,
      commodity: mercuryGateLoad.commodity || '',
      pickup_earliest: new Date(mercuryGateLoad.origin?.earliestTime || Date.now()),
      pickup_latest: new Date(mercuryGateLoad.origin?.latestTime || Date.now() + 4 * 60 * 60 * 1000),
      delivery_earliest: new Date(mercuryGateLoad.destination?.earliestTime || Date.now()),
      delivery_latest: new Date(mercuryGateLoad.destination?.latestTime || Date.now() + 4 * 60 * 60 * 1000),
      offered_rate: mercuryGateLoad.rate || 0,
      special_instructions: mercuryGateLoad.specialInstructions || '',
      is_hazardous: mercuryGateLoad.hazardous || false,
      temperature_requirements: temperatureRequirements,
      locations: locations
    };
    
    return platformLoad;
  }
  
  /**
   * Maps a load from the platform's format to MercuryGate format
   * @param load Load data in platform format
   * @returns Load data in MercuryGate format
   */
  private mapPlatformLoadToMercuryGate(load: Load): any {
    logger.debug('Mapping platform load to MercuryGate format', { loadId: load.load_id });
    
    // Map equipment type
    let mercuryGateEquipmentType = 'DRY_VAN'; // Default
    switch (load.equipment_type) {
      case EquipmentType.REFRIGERATED:
        mercuryGateEquipmentType = 'REEFER';
        break;
      case EquipmentType.FLATBED:
        mercuryGateEquipmentType = 'FLATBED';
        break;
      default:
        mercuryGateEquipmentType = 'DRY_VAN';
    }
    
    // Find pickup and delivery locations
    // Note: In a real implementation, we'd fetch these from the database
    // For now, we'll create placeholder objects
    const pickupLocation = {
      facility_name: 'Origin',
      address: '',
      city: '',
      state: '',
      zip: '',
      latitude: 0,
      longitude: 0,
      contact_name: '',
      contact_phone: '',
      special_instructions: ''
    };
    
    const deliveryLocation = {
      facility_name: 'Destination',
      address: '',
      city: '',
      state: '',
      zip: '',
      latitude: 0,
      longitude: 0,
      contact_name: '',
      contact_phone: '',
      special_instructions: ''
    };
    
    // Create the MercuryGate load object
    const mercuryGateLoad = {
      referenceNumber: load.reference_number,
      description: load.description,
      customer: {
        id: load.shipper_id
      },
      equipment: {
        type: mercuryGateEquipmentType
      },
      weight: load.weight,
      dimensions: {
        length: load.dimensions.length,
        width: load.dimensions.width,
        height: load.dimensions.height
      },
      volume: load.volume,
      pallets: load.pallets,
      commodity: load.commodity,
      hazardous: load.is_hazardous,
      rate: load.offered_rate,
      specialInstructions: load.special_instructions,
      origin: {
        name: pickupLocation.facility_name,
        address: pickupLocation.address,
        city: pickupLocation.city,
        state: pickupLocation.state,
        zip: pickupLocation.zip,
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        earliestTime: load.pickup_earliest.toISOString(),
        latestTime: load.pickup_latest.toISOString(),
        contact: pickupLocation.contact_name,
        phone: pickupLocation.contact_phone,
        instructions: pickupLocation.special_instructions
      },
      destination: {
        name: deliveryLocation.facility_name,
        address: deliveryLocation.address,
        city: deliveryLocation.city,
        state: deliveryLocation.state,
        zip: deliveryLocation.zip,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        earliestTime: load.delivery_earliest.toISOString(),
        latestTime: load.delivery_latest.toISOString(),
        contact: deliveryLocation.contact_name,
        phone: deliveryLocation.contact_phone,
        instructions: deliveryLocation.special_instructions
      }
    };
    
    // Add temperature settings if applicable
    if (load.temperature_requirements) {
      mercuryGateLoad['temperatureSettings'] = {
        minTemp: load.temperature_requirements.min_temp,
        maxTemp: load.temperature_requirements.max_temp
      };
    }
    
    return mercuryGateLoad;
  }
  
  /**
   * Maps a load status from MercuryGate format to the platform's status enum
   * @param mercuryGateStatus Status in MercuryGate format
   * @returns Status in platform format
   */
  private mapMercuryGateStatusToPlatform(mercuryGateStatus: string): LoadStatus {
    switch (mercuryGateStatus.toUpperCase()) {
      case 'NEW':
        return LoadStatus.CREATED;
      case 'PENDING':
        return LoadStatus.PENDING;
      case 'AVAILABLE':
        return LoadStatus.AVAILABLE;
      case 'ACCEPTED':
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
      case 'EXCEPTION':
        return LoadStatus.EXCEPTION;
      default:
        return LoadStatus.CREATED;
    }
  }
  
  /**
   * Maps a load status from platform format to MercuryGate status code
   * @param status Status in platform format
   * @returns Status code in MercuryGate format
   */
  private mapPlatformStatusToMercuryGate(status: LoadStatus): string {
    switch (status) {
      case LoadStatus.CREATED:
        return 'NEW';
      case LoadStatus.PENDING:
        return 'PENDING';
      case LoadStatus.AVAILABLE:
        return 'AVAILABLE';
      case LoadStatus.ASSIGNED:
        return 'ACCEPTED';
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
      case LoadStatus.EXCEPTION:
        return 'EXCEPTION';
      default:
        return 'NEW';
    }
  }
  
  /**
   * Tests the connection to the MercuryGate API
   * @returns True if the connection is successful
   */
  public async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing connection to MercuryGate API');
      
      // Attempt to authenticate
      const authenticated = await this.authenticate();
      
      if (!authenticated) {
        logger.error('Authentication failed during connection test');
        return false;
      }
      
      // Make a simple API request to verify connectivity
      await this.client.get('/ping');
      
      logger.info('Successfully tested connection to MercuryGate API');
      return true;
    } catch (error) {
      logger.error('Connection test to MercuryGate failed', { error });
      return false;
    }
  }
  
  /**
   * Handles errors from the MercuryGate API
   * @param error Error object from the API
   * @throws Standardized error with appropriate code
   */
  private handleApiError(error: any): never {
    logger.error('MercuryGate API error', { error });
    
    // Check if the error has a response
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle specific error cases based on status code
      switch (status) {
        case 400:
          throw createError(`MercuryGate API bad request: ${data.message || 'Invalid request'}`, {
            code: 'VAL_INVALID_INPUT',
            details: data
          });
        case 401:
          throw createError('MercuryGate API authentication failed', {
            code: 'AUTH_INVALID_CREDENTIALS',
            details: data
          });
        case 403:
          throw createError('MercuryGate API access forbidden', {
            code: 'AUTHZ_INSUFFICIENT_PERMISSIONS',
            details: data
          });
        case 404:
          throw createError('MercuryGate API resource not found', {
            code: 'RES_LOAD_NOT_FOUND',
            details: data
          });
        case 429:
          throw createError('MercuryGate API rate limit exceeded', {
            code: 'RATE_TOO_MANY_REQUESTS',
            details: data
          });
        case 500:
        case 502:
        case 503:
        case 504:
          throw createError(`MercuryGate API server error: ${data.message || 'Service unavailable'}`, {
            code: 'EXT_TMS_SERVICE_ERROR',
            details: data
          });
        default:
          throw createError(`MercuryGate API error: ${data.message || 'Unknown error'}`, {
            code: 'EXT_TMS_SERVICE_ERROR',
            details: data
          });
      }
    }
    
    // Handle network or connection errors
    if (error.request) {
      throw createError('Unable to connect to MercuryGate API', {
        code: 'NET_CONNECTION_ERROR'
      });
    }
    
    // Handle other types of errors
    throw createError(`MercuryGate API error: ${error.message || 'Unknown error'}`, {
      code: 'EXT_TMS_SERVICE_ERROR'
    });
  }
}