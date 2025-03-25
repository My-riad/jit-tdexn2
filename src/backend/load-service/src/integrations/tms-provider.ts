import axios from 'axios'; // axios@^1.3.4
import {
  Load,
  LoadStatus
} from '../../../common/interfaces/load.interface';
import { LoadModel } from '../models/load.model';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import config from '../../../common/config';

/**
 * @class TmsProvider
 * @description Factory and adapter class for TMS integrations that provides a unified interface for working with different TMS systems
 */
export class TmsProvider {
  private providerType: string;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private client: any;
  private connectionConfig: any;

  /**
   * @constructor
   * @description Initializes a new TMS provider instance with the specified provider type and credentials
   * @param {string} providerType - The type of TMS provider (McLeod, MercuryGate, TMW)
   * @param {object} connectionConfig - The connection configuration object
   */
  constructor(providerType: string, connectionConfig: any) {
    // LD1: Store the provider type (McLeod, MercuryGate, TMW)
    this.providerType = providerType;
    // LD1: Store the connection configuration
    this.connectionConfig = connectionConfig;

    // LD1: Extract API credentials from the configuration
    this.apiKey = connectionConfig.apiKey;
    this.apiSecret = connectionConfig.apiSecret;

    // LD1: Set the base URL for the TMS API from configuration
    this.baseUrl = connectionConfig.baseUrl;

    // LD1: Initialize the axios HTTP client with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret,
      },
    });
  }

  /**
   * @static @method create
   * @description Factory method to create a TMS provider instance based on provider type
   * @param {string} providerType - The type of TMS provider (McLeod, MercuryGate, TMW)
   * @param {object} connectionConfig - The connection configuration object
   * @returns {TmsProvider} A configured TMS provider instance
   */
  static create(providerType: string, connectionConfig: any): TmsProvider {
    try {
      // LD1: Validate the provider type is supported
      const supportedProviders = ['McLeod', 'MercuryGate', 'TMW'];
      if (!supportedProviders.includes(providerType)) {
        throw createError(`Unsupported TMS provider type: ${providerType}`, { code: 'VAL_INVALID_INPUT' });
      }

      // LD1: Create and return a new TmsProvider instance with the specified type and config
      const provider = new TmsProvider(providerType, connectionConfig);

      // LD1: Log provider creation
      logger.info(`Created TMS provider: ${providerType}`);
      return provider;
    } catch (error: any) {
      // LD1: Handle any errors during creation
      logger.error(`Failed to create TMS provider: ${providerType}`, { error: error.message });
      throw createError(`Failed to create TMS provider: ${providerType}`, { code: 'SRV_INTERNAL_ERROR', details: { message: error.message } });
    }
  }

  /**
   * @method authenticate
   * @description Authenticates with the TMS provider using the configured credentials
   * @returns {Promise<boolean>} True if authentication was successful
   */
  async authenticate(): Promise<boolean> {
    try {
      // LD1: Check if credentials are valid
      if (!this.apiKey || !this.apiSecret) {
        throw createError('Missing API key or secret', { code: 'AUTH_INVALID_CREDENTIALS' });
      }

      // LD1: Select the appropriate authentication method based on provider type
      let authEndpoint = '/auth/login'; // Default endpoint
      if (this.providerType === 'MercuryGate') {
        authEndpoint = '/auth/token';
      }

      // LD1: Make authentication request to TMS API
      const response = await this.client.post(authEndpoint, {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      });

      // LD1: Store the received access token
      if (response.data && response.data.accessToken) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
        logger.info(`Authenticated with TMS provider: ${this.providerType}`);
        return true; // LD1: Return authentication success status
      } else {
        throw createError('Authentication failed: No access token received', { code: 'AUTH_INVALID_CREDENTIALS' });
      }
    } catch (error: any) {
      // LD1: Handle any authentication errors
      logger.error(`Authentication failed for TMS provider: ${this.providerType}`, { error: error.message });
      throw createError(`Authentication failed for TMS provider: ${this.providerType}`, { code: 'AUTH_INVALID_CREDENTIALS', details: { message: error.message } });
    }
  }

  /**
   * @method syncLoads
   * @description Synchronizes load data between the TMS and the platform
   * @param {object} syncOptions - Synchronization options including start date, end date, carrier ID, and shipper ID
   * @returns {Promise<object>} Synchronization results with counts of processed loads
   */
  async syncLoads(syncOptions: { startDate: Date; endDate: Date; carrierId: string; shipperId: string }): Promise<object> {
    try {
      // LD1: Authenticate with TMS API if needed
      await this.authenticate();

      // LD1: Prepare sync request based on provider type
      const syncEndpoint = '/loads/sync'; // Default endpoint
      const requestData = {
        startDate: syncOptions.startDate.toISOString(),
        endDate: syncOptions.endDate.toISOString(),
        carrierId: syncOptions.carrierId,
        shipperId: syncOptions.shipperId,
      };

      // LD1: Call the appropriate provider's sync method
      const response = await this.client.get(syncEndpoint, { params: requestData });

      // LD1: Process the sync results
      const loads = response.data.loads || [];
      logger.info(`Synchronized ${loads.length} loads from TMS provider: ${this.providerType}`);

      // LD1: Return synchronization statistics
      return {
        totalLoads: loads.length,
        processedLoads: loads.length, // Assuming all loads are processed successfully
      };
    } catch (error: any) {
      // LD1: Handle any synchronization errors
      logger.error(`Load synchronization failed for TMS provider: ${this.providerType}`, { error: error.message });
      throw createError(`Load synchronization failed for TMS provider: ${this.providerType}`, { code: 'EXT_TMS_SERVICE_ERROR', details: { message: error.message } });
    }
  }

  /**
   * @method pushLoad
   * @description Pushes a load from the platform to the TMS
   * @param {string} loadId - The ID of the load to push
   * @returns {Promise<boolean>} True if the load was successfully pushed
   */
  async pushLoad(loadId: string): Promise<boolean> {
    try {
      // LD1: Retrieve the load from the database
      const load = await LoadModel.get(loadId);
      if (!load) {
        throw createError(`Load not found with ID: ${loadId}`, { code: 'RES_LOAD_NOT_FOUND' });
      }

      // LD1: Authenticate with TMS API if needed
      await this.authenticate();

      // LD1: Select the appropriate push method based on provider type
      const pushEndpoint = '/loads'; // Default endpoint

      // LD1: Transform and send load data to TMS API
      const transformedLoadData = this.transformLoadData(load);
      const response = await this.client.post(pushEndpoint, transformedLoadData);

      // LD1: Handle response and any errors
      if (response.status === 201) {
        logger.info(`Successfully pushed load ${loadId} to TMS provider: ${this.providerType}`);
        return true; // LD1: Return success status
      } else {
        throw createError(`Failed to push load ${loadId} to TMS provider: ${this.providerType}`, { code: 'EXT_TMS_SERVICE_ERROR', details: { status: response.status, data: response.data } });
      }
    } catch (error: any) {
      // LD1: Handle response and any errors
      logger.error(`Failed to push load ${loadId} to TMS provider: ${this.providerType}`, { error: error.message });
      throw createError(`Failed to push load ${loadId} to TMS provider: ${this.providerType}`, { code: 'EXT_TMS_SERVICE_ERROR', details: { message: error.message } });
    }
  }

  /**
   * @method updateLoadStatus
   * @description Updates the status of a load in the TMS
   * @param {string} loadId - The ID of the load to update
   * @param {LoadStatus} status - The new status of the load
   * @returns {Promise<boolean>} True if the status was successfully updated
   */
  async updateLoadStatus(loadId: string, status: LoadStatus): Promise<boolean> {
    try {
      // LD1: Authenticate with TMS API if needed
      await this.authenticate();

      // LD1: Select the appropriate status update method based on provider type
      const updateStatusEndpoint = `/loads/${loadId}/status`; // Default endpoint

      // LD1: Map platform status to TMS-specific status code
      const tmsStatus = this.mapLoadStatus(status);

      // LD1: Send status update to TMS API
      const response = await this.client.put(updateStatusEndpoint, { status: tmsStatus });

      // LD1: Handle response and any errors
      if (response.status === 200) {
        logger.info(`Successfully updated status of load ${loadId} to ${status} in TMS provider: ${this.providerType}`);
        return true; // LD1: Return success status
      } else {
        throw createError(`Failed to update status of load ${loadId} to ${status} in TMS provider: ${this.providerType}`, { code: 'EXT_TMS_SERVICE_ERROR', details: { status: response.status, data: response.data } });
      }
    } catch (error: any) {
      // LD1: Handle response and any errors
      logger.error(`Failed to update status of load ${loadId} to ${status} in TMS provider: ${this.providerType}`, { error: error.message });
      throw createError(`Failed to update status of load ${loadId} to ${status} in TMS provider: ${this.providerType}`, { code: 'EXT_TMS_SERVICE_ERROR', details: { message: error.message } });
    }
  }

  /**
   * @method handleStatusUpdate
   * @description Handles status updates received from the TMS
   * @param {object} statusUpdate - The status update data
   * @returns {Promise<boolean>} True if the status update was successfully processed
   */
  async handleStatusUpdate(statusUpdate: { loadId: string; status: string; details: any }): Promise<boolean> {
    try {
      // LD1: Validate the status update data
      if (!statusUpdate.loadId || !statusUpdate.status) {
        throw createError('Invalid status update data: Missing loadId or status', { code: 'VAL_INVALID_INPUT' });
      }

      // LD1: Map TMS-specific status to platform LoadStatus enum
      const platformStatus = this.mapTmsStatus(statusUpdate.status);

      // LD1: Update the load status in the platform database
      const updatedLoad = await LoadModel.updateStatus(statusUpdate.loadId, {
        status: platformStatus,
        status_details: statusUpdate.details,
        updated_by: 'tms_integration',
      });

      if (!updatedLoad) {
        throw createError(`Load not found with ID: ${statusUpdate.loadId}`, { code: 'RES_LOAD_NOT_FOUND' });
      }

      // LD1: Log the status update
      logger.info(`Successfully handled status update from TMS for load ${statusUpdate.loadId} to status ${platformStatus}`);
      return true; // LD1: Return success status
    } catch (error: any) {
      // LD1: Handle any errors during processing
      logger.error(`Failed to handle status update from TMS for load ${statusUpdate.loadId}`, { error: error.message });
      throw createError(`Failed to handle status update from TMS for load ${statusUpdate.loadId}`, { code: 'SRV_INTERNAL_ERROR', details: { message: error.message } });
    }
  }

  /**
   * @method testConnection
   * @description Tests the connection to the TMS API
   * @returns {Promise<boolean>} True if the connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // LD1: Attempt to authenticate with the API
      await this.authenticate();

      // LD1: Make a simple test request based on provider type
      let testEndpoint = '/ping'; // Default endpoint
      if (this.providerType === 'MercuryGate') {
        testEndpoint = '/system/status';
      }

      const response = await this.client.get(testEndpoint);

      // LD1: Return success status based on response
      if (response.status === 200) {
        logger.info(`Successfully tested connection to TMS provider: ${this.providerType}`);
        return true;
      } else {
        logger.warn(`Connection test failed for TMS provider: ${this.providerType}`, { status: response.status, data: response.data });
        return false;
      }
    } catch (error: any) {
      // LD1: Handle any connection errors
      logger.error(`Connection test failed for TMS provider: ${this.providerType}`, { error: error.message });
      return false;
    }
  }

  /**
   * @method getProviderClient
   * @description Gets the appropriate client for the configured provider type
   * @returns {object} Provider-specific client instance
   */
  private getProviderClient(): any {
    // LD1: Check the provider type
    switch (this.providerType) {
      case 'McLeod':
        return this.client; // LD1: Return the appropriate client based on provider type
      case 'MercuryGate':
        return this.client; // LD1: Return the appropriate client based on provider type
      case 'TMW':
        return this.client; // LD1: Return the appropriate client based on provider type
      default:
        // LD1: Throw error if provider type is not supported
        throw createError(`Unsupported TMS provider type: ${this.providerType}`, { code: 'VAL_INVALID_INPUT' });
    }
  }

  /**
   * @private @method handleApiError
   * @description Handles errors from the TMS API
   * @param {any} error - The error object
   * @returns {never} Throws a standardized error
   */
  private handleApiError(error: any): never {
    // LD1: Log the error details
    logger.error('TMS API error', { error });

    // LD1: Check if error is due to authentication
    if (error.response && error.response.status === 401) {
      throw createError('Authentication failed', { code: 'AUTH_INVALID_CREDENTIALS' });
    }

    // LD1: Format error message based on error type and provider
    let errorMessage = 'TMS API error';
    if (error.response && error.response.data) {
      errorMessage = JSON.stringify(error.response.data);
    }

    // LD1: Throw a standardized error with appropriate code
    throw createError(errorMessage, { code: 'EXT_TMS_SERVICE_ERROR' });
  }

  private transformLoadData(load: Load): any {
    // TODO: Implement transformation logic based on TMS provider
    return load;
  }

  private mapLoadStatus(status: LoadStatus): string {
    // TODO: Implement status mapping based on TMS provider
    return status;
  }

  private mapTmsStatus(status: string): LoadStatus {
    // TODO: Implement status mapping based on TMS provider
    return status as LoadStatus;
  }
}