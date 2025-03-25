# src/backend/integration-service/src/services/eld.service.ts
```typescript
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import { Knex } from 'knex'; // knex@^2.4.2
import {
  EldProviderType,
  EldConnectionStatus,
  EldConnection,
  EldConnectionCreationParams,
  EldConnectionUpdateParams,
  EldTokenResponse,
} from '../models/eld-connection.model';
import {
  KeepTruckinProvider,
} from '../providers/keeptruckin.provider';
import {
  OmnitracsProvider,
} from '../providers/omnitracs.provider';
import {
  SamsaraProvider,
} from '../providers/samsara.provider';
import {
  DriverHOS,
  HOSStatus,
  Position,
} from '../../../common/interfaces/driver.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import logger from '../../../common/utils/logger';

/**
 * Service for managing ELD integrations and retrieving driver HOS data
 */
export class EldService {
  /**
   * Initializes the ELD service with database connection and provider instances
   * @param db 
   */
  constructor(
    private readonly db: Knex,
  ) {
    // Initialize the KeepTruckin provider
    this.keeptruckinProvider = new KeepTruckinProvider();
    // Initialize the Omnitracs provider
    this.omnitracsProvider = new OmnitracsProvider();
    // Initialize the Samsara provider
    this.samsaraProvider = new SamsaraProvider();

    logger.info('EldService initialized');
  }

  private keeptruckinProvider: KeepTruckinProvider;
  private omnitracsProvider: OmnitracsProvider;
  private samsaraProvider: SamsaraProvider;

  /**
   * Generates an OAuth authorization URL for a specific ELD provider
   * @param driverId 
   * @param providerType 
   * @param redirectUri 
   * @param state 
   * @param scope 
   * @returns The authorization URL to redirect the driver to
   */
  async getAuthorizationUrl(
    driverId: string,
    providerType: EldProviderType,
    redirectUri: string,
    state: string,
    scope: string
  ): Promise<string> {
    // Validate input parameters
    if (!driverId || !providerType || !redirectUri || !state || !scope) {
      throw new AppError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Select the appropriate provider based on providerType
    let provider;
    switch (providerType) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${providerType}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Call the provider's getAuthorizationUrl method
    const authorizationUrl = provider.getAuthorizationUrl(redirectUri, state, scope);

    // Log the generated authorization URL
    logger.info('Generated authorization URL', { providerType, authorizationUrl });

    // Return the authorization URL
    return authorizationUrl;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens, creating an ELD connection
   * @param driverId 
   * @param providerType 
   * @param code 
   * @param redirectUri 
   * @returns The created ELD connection
   */
  async exchangeCodeForTokens(
    driverId: string,
    providerType: EldProviderType,
    code: string,
    redirectUri: string
  ): Promise<EldConnection> {
    // Validate input parameters
    if (!driverId || !providerType || !code || !redirectUri) {
      throw new AppError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Select the appropriate provider based on providerType
    let provider;
    switch (providerType) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${providerType}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Call the provider's exchangeCodeForTokens method
    const tokenResponse: EldTokenResponse = await provider.exchangeCodeForTokens(code, redirectUri);

    // Calculate token expiration time from expires_in
    const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Create a new ELD connection with the tokens
    const connectionParams: EldConnectionCreationParams = {
      driver_id: driverId,
      provider_type: providerType,
      provider_account_id: '', // The provider account ID is not available in this flow
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: tokenExpiresAt,
    };

    // Store the connection in the database
    const connection = await this.createConnection(connectionParams);

    // Log the successful connection creation
    logger.info('Successfully created ELD connection', { connectionId: connection.connection_id, driverId, providerType });

    // Return the created connection
    return connection;
  }

  /**
   * Creates a new ELD connection manually (without OAuth flow)
   * @param params 
   * @returns The created ELD connection
   */
  async createConnection(params: EldConnectionCreationParams): Promise<EldConnection> {
    // Validate input parameters
    if (!params.driver_id || !params.provider_type || !params.access_token || !params.refresh_token || !params.token_expires_at) {
      throw new AppError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if a connection already exists for the driver
    const existingConnection = await this.getConnectionByDriverId(params.driver_id);
    if (existingConnection) {
      throw new AppError('An ELD connection already exists for this driver', { code: ErrorCodes.CONF_ALREADY_EXISTS });
    }

    // Generate a unique connection ID
    const connectionId = uuidv4();

    // Create a new ELD connection object
    const newConnection: EldConnection = {
      connection_id: connectionId,
      driver_id: params.driver_id,
      provider_type: params.provider_type,
      provider_account_id: params.provider_account_id,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      token_expires_at: params.token_expires_at,
      status: EldConnectionStatus.ACTIVE,
      last_sync_at: new Date(),
      error_message: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Store the connection in the database
    await this.db('eld_connections').insert(newConnection);

    // Log the successful connection creation
    logger.info('Successfully created ELD connection', { connectionId, driverId: params.driver_id, providerType: params.provider_type });

    // Return the created connection
    return newConnection;
  }

  /**
   * Updates an existing ELD connection
   * @param connectionId 
   * @param params 
   * @returns The updated ELD connection
   */
  async updateConnection(connectionId: string, params: EldConnectionUpdateParams): Promise<EldConnection> {
    // Validate input parameters
    if (!connectionId || !params) {
      throw new AppError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Retrieve the existing connection from the database
    const existingConnection = await this.getConnection(connectionId);
    if (!existingConnection) {
      throw new AppError('ELD connection not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
    }

    // Update the connection with the provided parameters
    const updatedConnection: EldConnection = {
      ...existingConnection,
      access_token: params.access_token !== undefined ? params.access_token : existingConnection.access_token,
      refresh_token: params.refresh_token !== undefined ? params.refresh_token : existingConnection.refresh_token,
      token_expires_at: params.token_expires_at !== undefined ? params.token_expires_at : existingConnection.token_expires_at,
      status: params.status !== undefined ? params.status : existingConnection.status,
      last_sync_at: params.last_sync_at !== undefined ? params.last_sync_at : existingConnection.last_sync_at,
      error_message: params.error_message !== undefined ? params.error_message : existingConnection.error_message,
      updated_at: new Date(),
    };

    // Store the updated connection in the database
    await this.db('eld_connections').where('connection_id', connectionId).update(updatedConnection);

    // Log the successful connection update
    logger.info('Successfully updated ELD connection', { connectionId });

    // Return the updated connection
    return updatedConnection;
  }

  /**
   * Retrieves an ELD connection by ID
   * @param connectionId 
   * @returns The retrieved ELD connection
   */
  async getConnection(connectionId: string): Promise<EldConnection> {
    // Validate the connection ID
    if (!connectionId) {
      throw new AppError('Missing connection ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Query the database for the connection
    const connection = await this.db('eld_connections').where('connection_id', connectionId).first();

    // Throw an error if the connection is not found
    if (!connection) {
      throw new AppError('ELD connection not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
    }

    // Return the connection
    return connection;
  }

  /**
   * Retrieves an ELD connection by driver ID
   * @param driverId 
   * @returns The retrieved ELD connection
   */
  async getConnectionByDriverId(driverId: string): Promise<EldConnection> {
    // Validate the driver ID
    if (!driverId) {
      throw new AppError('Missing driver ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Query the database for the connection
    const connection = await this.db('eld_connections').where('driver_id', driverId).first();

    // Throw an error if the connection is not found
    if (!connection) {
      throw new AppError('ELD connection not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
    }

    // Return the connection
    return connection;
  }

  /**
   * Deletes an ELD connection
   * @param connectionId 
   * @returns True if the connection was deleted
   */
  async deleteConnection(connectionId: string): Promise<boolean> {
    // Validate the connection ID
    if (!connectionId) {
      throw new AppError('Missing connection ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Delete the connection from the database
    const deletedCount = await this.db('eld_connections').where('connection_id', connectionId).del();

    // Throw an error if the connection is not found
    if (deletedCount === 0) {
      throw new AppError('ELD connection not found', { code: ErrorCodes.RES_DRIVER_NOT_FOUND });
    }

    // Log the successful deletion
    logger.info('Successfully deleted ELD connection', { connectionId });

    // Return true if the connection was deleted
    return true;
  }

  /**
   * Retrieves the current Hours of Service data for a driver
   * @param driverId 
   * @returns The driver's current HOS data
   */
  async getDriverHOS(driverId: string): Promise<DriverHOS> {
    // Validate the driver ID
    if (!driverId) {
      throw new AppError('Missing driver ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Retrieve the driver's ELD connection
    const connection = await this.getConnectionByDriverId(driverId);

    // Check if the connection is active
    if (connection.status !== EldConnectionStatus.ACTIVE) {
      throw new AppError('ELD connection is not active', { code: ErrorCodes.EXT_SERVICE_UNAVAILABLE });
    }

    // Select the appropriate provider based on the connection's provider type
    let provider;
    switch (connection.provider_type) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${connection.provider_type}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if the access token is expired and refresh if needed
    if (this.isTokenExpired(connection.token_expires_at)) {
      logger.info('Access token expired, refreshing token', { driverId });
      const updatedConnection = await this.refreshAccessToken(connection);
      // Update the connection object with the new tokens
      connection.access_token = updatedConnection.access_token;
      connection.refresh_token = updatedConnection.refresh_token;
      connection.token_expires_at = updatedConnection.token_expires_at;
    }

    // Call the provider's getDriverHOS method
    const hosData = await provider.getDriverHOS(connection.driver_id, connection.access_token);

    // Update the connection's last_sync_at timestamp
    await this.updateConnection(connection.connection_id, { last_sync_at: new Date() });

    // Return the HOS data
    return hosData;
  }

  /**
   * Retrieves the HOS logs for a driver within a specified time range
   * @param driverId 
   * @param startDate 
   * @param endDate 
   * @returns Array of driver HOS log entries
   */
  async getDriverHOSLogs(driverId: string, startDate: Date, endDate: Date): Promise<DriverHOS[]> {
    // Validate the driver ID and date range
    if (!driverId || !startDate || !endDate) {
      throw new AppError('Missing required parameters', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Retrieve the driver's ELD connection
    const connection = await this.getConnectionByDriverId(driverId);

    // Check if the connection is active
    if (connection.status !== EldConnectionStatus.ACTIVE) {
      throw new AppError('ELD connection is not active', { code: ErrorCodes.EXT_SERVICE_UNAVAILABLE });
    }

    // Select the appropriate provider based on the connection's provider type
    let provider;
    switch (connection.provider_type) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${connection.provider_type}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if the access token is expired and refresh if needed
    if (this.isTokenExpired(connection.token_expires_at)) {
      logger.info('Access token expired, refreshing token', { driverId });
      const updatedConnection = await this.refreshAccessToken(connection);
      // Update the connection object with the new tokens
      connection.access_token = updatedConnection.access_token;
      connection.refresh_token = updatedConnection.refresh_token;
      connection.token_expires_at = updatedConnection.token_expires_at;
    }

    // Call the provider's getDriverHOSLogs method
    const hosLogs = await provider.getDriverHOSLogs(connection.driver_id, connection.access_token, startDate, endDate);

    // Update the connection's last_sync_at timestamp
    await this.updateConnection(connection.connection_id, { last_sync_at: new Date() });

    // Return the HOS logs
    return hosLogs;
  }

  /**
   * Retrieves the current location of a driver
   * @param driverId 
   * @returns The driver's current location
   */
  async getDriverLocation(driverId: string): Promise<Position> {
    // Validate the driver ID
    if (!driverId) {
      throw new AppError('Missing driver ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Retrieve the driver's ELD connection
    const connection = await this.getConnectionByDriverId(driverId);

    // Check if the connection is active
    if (connection.status !== EldConnectionStatus.ACTIVE) {
      throw new AppError('ELD connection is not active', { code: ErrorCodes.EXT_SERVICE_UNAVAILABLE });
    }

    // Select the appropriate provider based on the connection's provider type
    let provider;
    switch (connection.provider_type) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${connection.provider_type}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if the access token is expired and refresh if needed
    if (this.isTokenExpired(connection.token_expires_at)) {
      logger.info('Access token expired, refreshing token', { driverId });
      const updatedConnection = await this.refreshAccessToken(connection);
      // Update the connection object with the new tokens
      connection.access_token = updatedConnection.access_token;
      connection.refresh_token = updatedConnection.refresh_token;
      connection.token_expires_at = updatedConnection.token_expires_at;
    }

    // Call the provider's getDriverLocation method
    const location = await provider.getDriverLocation(connection.driver_id, connection.access_token);

    // Update the connection's last_sync_at timestamp
    await this.updateConnection(connection.connection_id, { last_sync_at: new Date() });

    // Return the location data
    return location;
  }

  /**
   * Validates an ELD connection by making a test API call
   * @param connectionId 
   * @returns True if the connection is valid
   */
  async validateConnection(connectionId: string): Promise<boolean> {
    // Validate the connection ID
    if (!connectionId) {
      throw new AppError('Missing connection ID', { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Retrieve the connection from the database
    const connection = await this.getConnection(connectionId);

    // Select the appropriate provider based on the connection's provider type
    let provider;
    switch (connection.provider_type) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${connection.provider_type}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Check if the access token is expired and refresh if needed
    if (this.isTokenExpired(connection.token_expires_at)) {
      logger.info('Access token expired, refreshing token for validation');
      const updatedConnection = await this.refreshAccessToken(connection);
      // Update the connection object with the new tokens
      connection.access_token = updatedConnection.access_token;
      connection.refresh_token = updatedConnection.refresh_token;
      connection.token_expires_at = updatedConnection.token_expires_at;
    }

    // Call the provider's validateConnection method
    const isValid = await provider.validateConnection(connection.access_token);

    // Update the connection status based on the validation result
    await this.updateConnection(connection.connection_id, { status: isValid ? EldConnectionStatus.ACTIVE : EldConnectionStatus.ERROR });

    // Return the validation result
    return isValid;
  }

  /**
   * Refreshes an expired access token for an ELD connection
   * @param connection 
   * @returns The updated connection with new tokens
   */
  private async refreshAccessToken(connection: EldConnection): Promise<EldConnection> {
    // Select the appropriate provider based on the connection's provider type
    let provider;
    switch (connection.provider_type) {
      case EldProviderType.KEEPTRUCKIN:
        provider = this.keeptruckinProvider;
        break;
      case EldProviderType.OMNITRACS:
        provider = this.omnitracsProvider;
        break;
      case EldProviderType.SAMSARA:
        provider = this.samsaraProvider;
        break;
      default:
        throw new AppError(`Unsupported ELD provider type: ${connection.provider_type}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }

    // Call the provider's refreshAccessToken method with the refresh token
    const tokenResponse: EldTokenResponse = await provider.refreshAccessToken(connection.refresh_token);

    // Calculate token expiration time from expires_in
    const tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Update the connection with the new access token, refresh token, and expiration time
    const updatedConnectionParams: EldConnectionUpdateParams = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: tokenExpiresAt,
    };

    // Store the updated connection in the database
    const updatedConnection = await this.updateConnection(connection.connection_id, updatedConnectionParams);

    // Log the successful token refresh
    logger.info('Successfully refreshed access token', { connectionId: connection.connection_id });

    // Return the updated connection
    return updatedConnection;
  }

  /**
   * Checks if an access token is expired or about to expire
   * @param expiresAt 
   * @returns True if the token is expired or will expire within 5 minutes
   */
  private isTokenExpired(expiresAt: Date): boolean {
    // Get the current time
    const now = new Date();

    // Add a 5-minute buffer to the current time
    const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expiresSoon = new Date(now.getTime() + buffer);

    // Compare the expiration time with the buffered current time
    return expiresAt <= expiresSoon;
  }

  /**
   * Returns the appropriate provider instance for a given provider type
   * @param providerType 
   * @returns The provider instance
   */
  private getProviderForType(providerType: EldProviderType): KeepTruckinProvider | OmnitracsProvider | SamsaraProvider {
    // Switch on the provider type
    switch (providerType) {
      case EldProviderType.KEEPTRUCKIN:
        return this.keeptruckinProvider;
      case EldProviderType.OMNITRACS:
        return this.omnitracsProvider;
      case EldProviderType.SAMSARA:
        return this.samsaraProvider;
      default:
        throw new AppError(`Unsupported ELD provider type: ${providerType}`, { code: ErrorCodes.VAL_INVALID_INPUT });
    }
  }
}