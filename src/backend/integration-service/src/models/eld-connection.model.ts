/**
 * ELD Connection Model
 * 
 * This model defines the interfaces and types for Electronic Logging Device (ELD) 
 * connections in the freight optimization platform. It enables secure integration
 * with various ELD providers to retrieve Hours of Service (HOS) data and location
 * information from drivers.
 * 
 * Supported providers include KeepTruckin (Motive), Omnitracs, and Samsara.
 */

/**
 * Enumeration of supported ELD provider types
 */
export enum EldProviderType {
  KEEPTRUCKIN = 'KEEPTRUCKIN', // Also known as Motive
  OMNITRACS = 'OMNITRACS',
  SAMSARA = 'SAMSARA'
}

/**
 * Enumeration of possible ELD connection statuses
 */
export enum EldConnectionStatus {
  ACTIVE = 'ACTIVE',     // Connection is working properly
  PENDING = 'PENDING',   // Connection is in the process of being established
  ERROR = 'ERROR',       // Connection is experiencing an error
  EXPIRED = 'EXPIRED',   // Access token has expired
  REVOKED = 'REVOKED'    // Connection has been revoked by the user or provider
}

/**
 * Represents a connection between a driver and their ELD provider
 */
export interface EldConnection {
  /**
   * Unique identifier for the connection
   */
  connection_id: string;
  
  /**
   * Identifier of the driver who owns this connection
   */
  driver_id: string;
  
  /**
   * Type of ELD provider
   */
  provider_type: EldProviderType;
  
  /**
   * Account identifier within the ELD provider's system
   */
  provider_account_id: string;
  
  /**
   * OAuth access token for accessing ELD provider's API
   */
  access_token: string;
  
  /**
   * OAuth refresh token for obtaining new access tokens
   */
  refresh_token: string;
  
  /**
   * Timestamp when the access token expires
   */
  token_expires_at: Date;
  
  /**
   * Current status of the connection
   */
  status: EldConnectionStatus;
  
  /**
   * Timestamp of the last successful data synchronization
   */
  last_sync_at: Date;
  
  /**
   * Error message if the connection is in ERROR status
   */
  error_message: string;
  
  /**
   * Timestamp when the connection was created
   */
  created_at: Date;
  
  /**
   * Timestamp when the connection was last updated
   */
  updated_at: Date;
}

/**
 * Parameters required for creating a new ELD connection
 */
export interface EldConnectionCreationParams {
  /**
   * Identifier of the driver who owns this connection
   */
  driver_id: string;
  
  /**
   * Type of ELD provider
   */
  provider_type: EldProviderType;
  
  /**
   * Account identifier within the ELD provider's system
   */
  provider_account_id: string;
  
  /**
   * OAuth access token for accessing ELD provider's API
   */
  access_token: string;
  
  /**
   * OAuth refresh token for obtaining new access tokens
   */
  refresh_token: string;
  
  /**
   * Timestamp when the access token expires
   */
  token_expires_at: Date;
}

/**
 * Parameters for updating an existing ELD connection
 */
export interface EldConnectionUpdateParams {
  /**
   * OAuth access token for accessing ELD provider's API
   */
  access_token?: string;
  
  /**
   * OAuth refresh token for obtaining new access tokens
   */
  refresh_token?: string;
  
  /**
   * Timestamp when the access token expires
   */
  token_expires_at?: Date;
  
  /**
   * Current status of the connection
   */
  status?: EldConnectionStatus;
  
  /**
   * Timestamp of the last successful data synchronization
   */
  last_sync_at?: Date;
  
  /**
   * Error message if the connection is in ERROR status
   */
  error_message?: string;
}

/**
 * Request parameters for initiating ELD OAuth authorization flow
 */
export interface EldAuthorizationRequest {
  /**
   * Identifier of the driver who will own this connection
   */
  driver_id: string;
  
  /**
   * Type of ELD provider to connect with
   */
  provider_type: EldProviderType;
  
  /**
   * URI to redirect to after authorization
   */
  redirect_uri: string;
  
  /**
   * State parameter for OAuth security
   */
  state: string;
}

/**
 * Request parameters for exchanging authorization code for access tokens
 */
export interface EldTokenExchangeRequest {
  /**
   * Identifier of the driver who will own this connection
   */
  driver_id: string;
  
  /**
   * Type of ELD provider to connect with
   */
  provider_type: EldProviderType;
  
  /**
   * Authorization code received from the ELD provider
   */
  code: string;
  
  /**
   * URI that was used during the authorization request
   */
  redirect_uri: string;
}

/**
 * Response structure from ELD provider token endpoints
 */
export interface EldTokenResponse {
  /**
   * OAuth access token for API access
   */
  access_token: string;
  
  /**
   * OAuth refresh token for obtaining new access tokens
   */
  refresh_token: string;
  
  /**
   * Number of seconds until the access token expires
   */
  expires_in: number;
  
  /**
   * Type of token, typically "Bearer"
   */
  token_type: string;
  
  /**
   * Space-separated list of authorized scopes
   */
  scope: string;
}

/**
 * Common interface that all ELD provider implementations must implement
 * This ensures consistent interaction with different ELD providers
 */
export interface EldProviderInterface {
  /**
   * Generates the authorization URL for the OAuth flow
   * 
   * @param request Authorization request parameters
   * @returns URL to redirect the user to for authorization
   */
  getAuthorizationUrl(request: EldAuthorizationRequest): string;
  
  /**
   * Exchanges an authorization code for access and refresh tokens
   * 
   * @param request Token exchange request parameters
   * @returns Promise resolving to token response
   */
  exchangeCodeForTokens(request: EldTokenExchangeRequest): Promise<EldTokenResponse>;
  
  /**
   * Refreshes an expired access token using the refresh token
   * 
   * @param refreshToken The refresh token to use
   * @returns Promise resolving to token response
   */
  refreshAccessToken(refreshToken: string): Promise<EldTokenResponse>;
  
  /**
   * Retrieves the current Hours of Service status for a driver
   * 
   * @param accessToken The access token for authentication
   * @param driverId The ELD provider's driver ID (may differ from our system's driver_id)
   * @returns Promise resolving to the driver's HOS status
   */
  getDriverHOS(accessToken: string, driverId: string): Promise<any>;
  
  /**
   * Retrieves the Hours of Service logs for a driver within a date range
   * 
   * @param accessToken The access token for authentication
   * @param driverId The ELD provider's driver ID (may differ from our system's driver_id)
   * @param startDate Start date for the logs
   * @param endDate End date for the logs
   * @returns Promise resolving to the driver's HOS logs
   */
  getDriverHOSLogs(accessToken: string, driverId: string, startDate: Date, endDate: Date): Promise<any>;
  
  /**
   * Retrieves the current location of a driver
   * 
   * @param accessToken The access token for authentication
   * @param driverId The ELD provider's driver ID (may differ from our system's driver_id)
   * @returns Promise resolving to the driver's current location
   */
  getDriverLocation(accessToken: string, driverId: string): Promise<any>;
  
  /**
   * Validates if a connection is still valid
   * 
   * @param accessToken The access token to validate
   * @returns Promise resolving to a boolean indicating if the connection is valid
   */
  validateConnection(accessToken: string): Promise<boolean>;
}