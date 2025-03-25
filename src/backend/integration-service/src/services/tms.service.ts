import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import {
  TmsConnection,
  TmsConnectionCreationParams,
  TmsConnectionUpdateParams,
  TmsConnectionResponse,
  TmsSyncRequest,
  TmsSyncResponse,
  TmsProviderType,
  TmsConnectionStatus,
  TmsIntegrationType,
} from '../models/tms-connection.model';
import {
  McLeodProvider,
} from '../providers/mcleod.provider';
import {
  TmwProvider,
} from '../providers/tmw.provider';
import {
  MercuryGateProvider,
} from '../providers/mercurygate.provider';
import { Load, LoadStatus } from '../../../common/interfaces/load.interface';
import { tmsConfig } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Service for managing TMS connections and synchronization operations
 */
export class TmsService {
  private connections: Map<string, TmsConnection> = new Map();
  private providers: Map<string, any> = new Map();

  /**
   * Initializes the TMS service with empty connection and provider maps
   */
  constructor() {
    logger.info('TmsService initialized');
  }

  /**
   * Creates a new TMS connection with the specified parameters
   * @param params - Parameters for creating the TMS connection
   * @returns Promise resolving to the created connection without sensitive data
   */
  async createConnection(params: TmsConnectionCreationParams): Promise<TmsConnectionResponse> {
    logger.info('Creating a new TMS connection', { params });

    // Validate connection parameters
    if (!params.owner_type || !params.owner_id || !params.provider_type || !params.integration_type || !params.name || !params.credentials || !params.settings) {
      throw new AppError('Missing required parameters for TMS connection creation', { code: 'VAL_INVALID_INPUT' });
    }

    // Generate a unique connection ID
    const connectionId = uuidv4();

    // Create a new TMS connection object
    const newConnection: TmsConnection = {
      connection_id: connectionId,
      owner_type: params.owner_type,
      owner_id: params.owner_id,
      provider_type: params.provider_type,
      integration_type: params.integration_type,
      name: params.name,
      description: params.description,
      credentials: params.credentials,
      settings: params.settings,
      status: TmsConnectionStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Test the connection if requested
    if (params.test_connection) {
      try {
        const testResult = await this.testConnection(connectionId);
        if (!testResult) {
          newConnection.status = TmsConnectionStatus.ERROR;
        } else {
          newConnection.status = TmsConnectionStatus.ACTIVE;
        }
      } catch (error) {
        newConnection.status = TmsConnectionStatus.ERROR;
        newConnection.error_message = (error as AppError).message;
        logger.error('Connection test failed during creation', { connectionId, error });
      }
    }

    // Store the connection in the connections map
    this.connections.set(connectionId, newConnection);

    logger.info('TMS connection created successfully', { connectionId });

    // Return the connection response without sensitive data
    return this.sanitizeConnectionResponse(newConnection);
  }

  /**
   * Retrieves a TMS connection by ID
   * @param connectionId - The ID of the connection to retrieve
   * @returns Promise resolving to the TMS connection without sensitive data
   */
  async getConnection(connectionId: string): Promise<TmsConnectionResponse> {
    logger.info('Retrieving TMS connection', { connectionId });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const connection = this.connections.get(connectionId)!;

    // Return the connection response without sensitive data
    return this.sanitizeConnectionResponse(connection);
  }

  /**
   * Updates an existing TMS connection
   * @param connectionId - The ID of the connection to update
   * @param params - Parameters for updating the connection
   * @returns Promise resolving to the updated connection without sensitive data
   */
  async updateConnection(connectionId: string, params: TmsConnectionUpdateParams): Promise<TmsConnectionResponse> {
    logger.info('Updating TMS connection', { connectionId, params });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const existingConnection = this.connections.get(connectionId)!;

    // Update the connection with the provided parameters
    const updatedConnection: TmsConnection = {
      ...existingConnection,
      name: params.name !== undefined ? params.name : existingConnection.name,
      description: params.description !== undefined ? params.description : existingConnection.description,
      credentials: params.credentials !== undefined ? params.credentials : existingConnection.credentials,
      settings: params.settings !== undefined ? params.settings : existingConnection.settings,
      status: params.status !== undefined ? params.status : existingConnection.status,
      error_message: params.error_message !== undefined ? params.error_message : existingConnection.error_message,
      updated_at: new Date(),
    };

    // Test the connection if credentials were updated
    if (params.credentials) {
      try {
        const testResult = await this.testConnection(connectionId);
        if (!testResult) {
          updatedConnection.status = TmsConnectionStatus.ERROR;
        } else {
          updatedConnection.status = TmsConnectionStatus.ACTIVE;
        }
      } catch (error) {
        updatedConnection.status = TmsConnectionStatus.ERROR;
        updatedConnection.error_message = (error as AppError).message;
        logger.error('Connection test failed during update', { connectionId, error });
      }
    }

    // Store the updated connection
    this.connections.set(connectionId, updatedConnection);

    logger.info('TMS connection updated successfully', { connectionId });

    // Return the updated connection response without sensitive data
    return this.sanitizeConnectionResponse(updatedConnection);
  }

  /**
   * Deletes a TMS connection
   * @param connectionId - The ID of the connection to delete
   * @returns Promise resolving to true if the connection was deleted
   */
  async deleteConnection(connectionId: string): Promise<boolean> {
    logger.info('Deleting TMS connection', { connectionId });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    // Remove the connection from the connections map
    this.connections.delete(connectionId);

    // Remove the provider instance if it exists
    if (this.providers.has(connectionId)) {
      this.providers.delete(connectionId);
    }

    logger.info('TMS connection deleted successfully', { connectionId });

    return true;
  }

  /**
   * Lists all TMS connections for a specific owner
   * @param ownerType - The type of entity that owns the connections
   * @param ownerId - The ID of the entity that owns the connections
   * @returns Promise resolving to an array of TMS connections without sensitive data
   */
  async listConnections(ownerType: string, ownerId: string): Promise<TmsConnectionResponse[]> {
    logger.info('Listing TMS connections', { ownerType, ownerId });

    // Filter connections by owner type and ID
    const filteredConnections = Array.from(this.connections.values())
      .filter(connection => connection.owner_type === ownerType && connection.owner_id === ownerId);

    // Map connections to response objects without sensitive data
    const connectionResponses = filteredConnections.map(connection => this.sanitizeConnectionResponse(connection));

    logger.info(`Found ${connectionResponses.length} TMS connections`, { ownerType, ownerId });

    return connectionResponses;
  }

  /**
   * Tests a TMS connection to verify credentials and connectivity
   * @param connectionId - The ID of the connection to test
   * @returns Promise resolving to true if the connection test was successful
   */
  async testConnection(connectionId: string): Promise<boolean> {
    logger.info('Testing TMS connection', { connectionId });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const connection = this.connections.get(connectionId)!;

    // Get or create the provider for the connection
    const provider = this.getProvider(connection);

    try {
      // Test the connection using the provider
      const testResult = await provider.testConnection(connection);

      // Update the connection status based on the test result
      connection.status = testResult ? TmsConnectionStatus.ACTIVE : TmsConnectionStatus.ERROR;
      connection.error_message = testResult ? undefined : 'Connection test failed';
      connection.updated_at = new Date();
      this.connections.set(connectionId, connection);

      logger.info('TMS connection test successful', { connectionId, testResult });

      return testResult;
    } catch (error) {
      // Update the connection status and error message
      connection.status = TmsConnectionStatus.ERROR;
      connection.error_message = (error as AppError).message;
      connection.updated_at = new Date();
      this.connections.set(connectionId, connection);

      logger.error('TMS connection test failed', { connectionId, error });
      return false;
    }
  }

  /**
   * Synchronizes data between the platform and the TMS
   * @param request - Synchronization request parameters
   * @returns Promise resolving to the synchronization results
   */
  async syncData(request: TmsSyncRequest): Promise<TmsSyncResponse> {
    logger.info('Synchronizing data with TMS', { request });

    // Check if the connection exists
    if (!this.connections.has(request.connection_id)) {
      logger.warn('TMS connection not found', { connectionId: request.connection_id });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const connection = this.connections.get(request.connection_id)!;

    // Get or create the provider for the connection
    const provider = this.getProvider(connection);

    // Initialize sync response with a unique sync ID
    const syncResponse: TmsSyncResponse = {
      connection_id: request.connection_id,
      sync_id: uuidv4(),
      status: 'in_progress',
      started_at: new Date(),
    };

    try {
      // Determine which entity types to synchronize
      const entityTypes = request.entity_types || ['loads', 'carriers', 'drivers', 'vehicles'];

      // Synchronize loads if requested
      if (entityTypes.includes('loads')) {
        logger.info('Synchronizing loads', { connectionId: request.connection_id });
        const loadSyncResult = await provider.syncLoads(request);
        syncResponse.entity_counts = { ...syncResponse.entity_counts, loads: loadSyncResult.entity_counts?.loads };
      }

      // Synchronize carriers if requested
      if (entityTypes.includes('carriers')) {
        logger.info('Synchronizing carriers', { connectionId: request.connection_id });
        const carrierSyncResult = await provider.syncCarriers(request);
        syncResponse.entity_counts = { ...syncResponse.entity_counts, carriers: carrierSyncResult.entity_counts?.carriers };
      }

      // Synchronize drivers if requested
      if (entityTypes.includes('drivers')) {
        logger.info('Synchronizing drivers', { connectionId: request.connection_id });
        const driverSyncResult = await provider.syncDrivers(request);
        syncResponse.entity_counts = { ...syncResponse.entity_counts, drivers: driverSyncResult.entity_counts?.drivers };
      }

      // Synchronize vehicles if requested
      if (entityTypes.includes('vehicles')) {
        logger.info('Synchronizing vehicles', { connectionId: request.connection_id });
        const vehicleSyncResult = await provider.syncVehicles(request);
        syncResponse.entity_counts = { ...syncResponse.entity_counts, vehicles: vehicleSyncResult.entity_counts?.vehicles };
      }

      // Update the connection's last sync timestamp
      connection.last_sync_at = new Date();
      this.connections.set(request.connection_id, connection);

      syncResponse.status = 'success';
      syncResponse.completed_at = new Date();

      logger.info('Data synchronization completed successfully', { syncResponse });

      return syncResponse;
    } catch (error) {
      logger.error('Data synchronization failed', { request, error });

      syncResponse.status = 'failed';
      syncResponse.completed_at = new Date();
      syncResponse.error_message = (error as AppError).message;

      return syncResponse;
    }
  }

  /**
   * Pushes a load from the platform to the TMS
   * @param connectionId - The ID of the connection to use
   * @param load - The load to push
   * @returns Promise resolving to true if the load was successfully pushed
   */
  async pushLoad(connectionId: string, load: Load): Promise<boolean> {
    logger.info('Pushing load to TMS', { connectionId, loadId: load.load_id });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const connection = this.connections.get(connectionId)!;

    // Get or create the provider for the connection
    const provider = this.getProvider(connection);

    try {
      // Push the load to the TMS using the provider
      const result = await provider.pushLoad(connection, load);

      logger.info('Load pushed to TMS successfully', { connectionId, loadId: load.load_id, result });

      return result;
    } catch (error) {
      logger.error('Failed to push load to TMS', { connectionId, loadId: load.load_id, error });
      throw error;
    }
  }

  /**
   * Updates the status of a load in the TMS
   * @param connectionId - The ID of the connection to use
   * @param loadId - The ID of the load to update
   * @param status - The new status of the load
   * @returns Promise resolving to true if the status was successfully updated
   */
  async updateLoadStatus(connectionId: string, loadId: string, status: LoadStatus): Promise<boolean> {
    logger.info('Updating load status in TMS', { connectionId, loadId, status });

    // Check if the connection exists
    if (!this.connections.has(connectionId)) {
      logger.warn('TMS connection not found', { connectionId });
      throw new AppError('TMS connection not found', { code: 'RES_TMS_CONNECTION_NOT_FOUND' });
    }

    const connection = this.connections.get(connectionId)!;

    // Get or create the provider for the connection
    const provider = this.getProvider(connection);

    try {
      // Update the load status in the TMS using the provider
      const result = await provider.updateLoadStatus(connection, loadId, status);

      logger.info('Load status updated in TMS successfully', { connectionId, loadId, status, result });

      return result;
    } catch (error) {
      logger.error('Failed to update load status in TMS', { connectionId, loadId, status, error });
      throw error;
    }
  }

  /**
   * Gets or creates a provider instance for a TMS connection
   * @param connection - The TMS connection
   * @returns Provider instance for the connection
   */
  private getProvider(connection: TmsConnection): any {
    const connectionId = connection.connection_id;

    // Check if a provider instance already exists for the connection
    if (this.providers.has(connectionId)) {
      logger.debug('Using existing provider instance', { connectionId });
      return this.providers.get(connectionId);
    }

    // Create a new provider based on the provider type
    const provider = this.createProviderInstance(connection.provider_type, connection);

    // Store the new provider instance
    this.providers.set(connectionId, provider);
    logger.debug('Created new provider instance', { connectionId, providerType: connection.provider_type });

    return provider;
  }

  /**
   * Creates a new provider instance based on the provider type
   * @param providerType - The type of the TMS provider
   * @param connection - The TMS connection
   * @returns New provider instance
   */
  private createProviderInstance(providerType: TmsProviderType, connection: TmsConnection): any {
    logger.debug('Creating provider instance', { providerType, connectionId: connection.connection_id });

    switch (providerType) {
      case TmsProviderType.MCLEOD:
        return new McLeodProvider(connection);
      case TmsProviderType.TMW:
        return new TmwProvider(connection);
      case TmsProviderType.MERCURYGATE:
        return new MercuryGateProvider(connection);
      default:
        logger.error('Unsupported TMS provider type', { providerType });
        throw new AppError(`Unsupported TMS provider type: ${providerType}`, { code: 'VAL_INVALID_INPUT' });
    }
  }

  /**
   * Removes sensitive data from a connection for external responses
   * @param connection - The TMS connection
   * @returns Connection without sensitive data
   */
  private sanitizeConnectionResponse(connection: TmsConnection): TmsConnectionResponse {
    logger.debug('Sanitizing connection response', { connectionId: connection.connection_id });

    // Create a new object with non-sensitive connection properties
    const { credentials, ...safeConnection } = connection;

    // Exclude credentials and other sensitive information
    const sanitizedConnection: TmsConnectionResponse = {
      ...safeConnection,
    };

    return sanitizedConnection;
  }

  /**
   * Schedules automatic synchronization for connections with auto-sync enabled
   */
  scheduleAutoSync(): void {
    logger.info('Scheduling automatic synchronization for TMS connections');

    // Iterate through all connections
    this.connections.forEach((connection) => {
      // Check if auto-sync is enabled for the connection
      if (connection.settings?.auto_sync_enabled) {
        // Schedule sync based on the configured frequency
        const syncInterval = connection.settings.sync_frequency_minutes || tmsConfig.tmw.timeout;
        setInterval(async () => {
          try {
            // Create a sync request
            const syncRequest: TmsSyncRequest = {
              connection_id: connection.connection_id,
            };

            // Perform the synchronization
            await this.syncData(syncRequest);
          } catch (error) {
            logger.error('Automatic synchronization failed', { connectionId: connection.connection_id, error });
          }
        }, syncInterval * 60 * 1000); // Convert minutes to milliseconds

        logger.info('Scheduled automatic synchronization', {
          connectionId: connection.connection_id,
          syncInterval,
        });
      }
    });
  }
}