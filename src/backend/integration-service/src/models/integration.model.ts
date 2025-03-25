/**
 * Integration Model
 * 
 * Core model definition for the integration service that provides base types and interfaces
 * for all external system integrations. This defines common structures and enumerations used
 * across different integration types.
 */

/**
 * Enumeration of supported integration types in the system
 */
export enum IntegrationType {
  ELD = 'eld',           // Electronic Logging Device integrations
  TMS = 'tms',           // Transportation Management System integrations
  PAYMENT = 'payment',   // Payment processor integrations
  MAPPING = 'mapping',   // Mapping service integrations
  WEATHER = 'weather',   // Weather service integrations
}

/**
 * Enumeration of possible integration connection statuses
 */
export enum IntegrationStatus {
  ACTIVE = 'active',     // Integration is connected and functioning
  PENDING = 'pending',   // Integration setup initiated but not completed
  ERROR = 'error',       // Integration is experiencing errors
  EXPIRED = 'expired',   // Authentication credentials have expired
  REVOKED = 'revoked',   // Integration access has been revoked
}

/**
 * Enumeration of entity types that can own an integration
 */
export enum IntegrationOwnerType {
  CARRIER = 'carrier',   // Trucking company or fleet operator
  SHIPPER = 'shipper',   // Company sending freight
  DRIVER = 'driver',     // Individual truck driver
}

/**
 * Enumeration of authentication methods used by integrations
 */
export enum IntegrationAuthType {
  API_KEY = 'api_key',       // API key-based authentication
  OAUTH2 = 'oauth2',         // OAuth 2.0 authentication
  BASIC_AUTH = 'basic_auth', // Username/password basic authentication
  TOKEN = 'token',           // Token-based authentication
  CERTIFICATE = 'certificate', // Certificate-based authentication
}

/**
 * Base interface for all integration entities in the system
 */
export interface Integration {
  integration_id: string;                 // Unique identifier for the integration
  integration_type: IntegrationType;      // Type of integration
  provider_name: string;                  // Name of the service provider
  owner_type: IntegrationOwnerType;       // Type of entity that owns this integration
  owner_id: string;                       // ID of the entity that owns this integration
  auth_type: IntegrationAuthType;         // Authentication method used
  credentials: object;                    // Credentials for authenticating with the provider
  settings: object;                       // Provider-specific configuration settings
  status: IntegrationStatus;              // Current status of the integration
  last_sync_at: Date;                     // Timestamp of the last successful synchronization
  error_message: string;                  // Most recent error message, if any
  created_at: Date;                       // Timestamp when the integration was created
  updated_at: Date;                       // Timestamp when the integration was last updated
}

/**
 * Parameters required for creating a new integration
 */
export interface IntegrationCreationParams {
  integration_type: IntegrationType;      // Type of integration to create
  provider_name: string;                  // Name of the service provider
  owner_type: IntegrationOwnerType;       // Type of entity that will own this integration
  owner_id: string;                       // ID of the entity that will own this integration
  auth_type: IntegrationAuthType;         // Authentication method to use
  credentials: object;                    // Credentials for authenticating with the provider
  settings?: object;                      // Optional provider-specific configuration settings
}

/**
 * Parameters for updating an existing integration
 */
export interface IntegrationUpdateParams {
  credentials?: object;                   // Updated authentication credentials
  settings?: object;                      // Updated provider-specific settings
  status?: IntegrationStatus;             // Updated integration status
  last_sync_at?: Date;                    // Updated last synchronization timestamp
  error_message?: string;                 // Updated error message
}

/**
 * Safe response object for integration data with sensitive credentials removed
 */
export interface IntegrationResponse {
  integration_id: string;                 // Unique identifier for the integration
  integration_type: IntegrationType;      // Type of integration
  provider_name: string;                  // Name of the service provider
  owner_type: IntegrationOwnerType;       // Type of entity that owns this integration
  owner_id: string;                       // ID of the entity that owns this integration
  auth_type: IntegrationAuthType;         // Authentication method used
  settings: object;                       // Provider-specific configuration settings
  status: IntegrationStatus;              // Current status of the integration
  last_sync_at: Date;                     // Timestamp of the last successful synchronization
  created_at: Date;                       // Timestamp when the integration was created
  updated_at: Date;                       // Timestamp when the integration was last updated
}

/**
 * Request parameters for triggering a manual integration synchronization
 */
export interface IntegrationSyncRequest {
  integration_id: string;                 // ID of the integration to synchronize
  entity_types?: string[];                // Specific entity types to synchronize (optional)
  force?: boolean;                        // Whether to force a full synchronization
  start_date?: Date;                      // Start date for incremental synchronization
  end_date?: Date;                        // End date for incremental synchronization
}

/**
 * Response object for integration synchronization operations
 */
export interface IntegrationSyncResponse {
  sync_id: string;                        // Unique identifier for this synchronization operation
  integration_id: string;                 // ID of the integration that was synchronized
  status: string;                         // Status of the synchronization (success, in_progress, failed)
  started_at: Date;                       // When the synchronization started
  completed_at?: Date;                    // When the synchronization completed (if finished)
  entity_counts?: {                       // Counts of entities processed
    [entityType: string]: {
      created: number;
      updated: number;
      deleted: number;
      errored: number;
    }
  };
  error_message?: string;                 // Error message if synchronization failed
}

/**
 * Common interface that all integration provider implementations must implement
 */
export interface IntegrationProviderInterface {
  /**
   * Authenticates with the external service
   * @param credentials Authentication credentials
   * @returns Updated credentials with tokens, etc.
   */
  authenticate(credentials: object): Promise<object>;
  
  /**
   * Refreshes authentication tokens when needed
   * @param credentials Current credentials
   * @returns Updated credentials with new tokens
   */
  refreshAuthentication(credentials: object): Promise<object>;
  
  /**
   * Validates the current connection to the external service
   * @param credentials Authentication credentials
   * @returns Boolean indicating if the connection is valid
   */
  validateConnection(credentials: object): Promise<boolean>;
  
  /**
   * Synchronizes data between the platform and the external service
   * @param integration Integration record
   * @param options Synchronization options
   * @returns Synchronization results
   */
  sync(integration: Integration, options?: any): Promise<IntegrationSyncResponse>;
}

/**
 * Interface for OAuth 2.0 credentials used by integrations
 */
export interface OAuthCredentials {
  access_token: string;                   // OAuth access token
  refresh_token: string;                  // OAuth refresh token
  token_expires_at: Date;                 // Expiration date of the access token
  scope: string;                          // OAuth scope of the tokens
}

/**
 * Interface for API key credentials used by integrations
 */
export interface ApiKeyCredentials {
  api_key: string;                        // API key for authentication
  api_secret?: string;                    // API secret (if required)
}

/**
 * Interface for basic authentication credentials used by integrations
 */
export interface BasicAuthCredentials {
  username: string;                       // Username for basic authentication
  password: string;                       // Password for basic authentication
}