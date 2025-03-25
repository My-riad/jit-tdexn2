/**
 * TMS Connection Model
 * 
 * This model defines the interfaces and types for Transportation Management System (TMS)
 * connections within the freight optimization platform. It enables integration with external
 * TMS providers like McLeod, TMW, and MercuryGate for data synchronization.
 */

import {
  Integration,
  IntegrationType,
  IntegrationStatus,
  IntegrationOwnerType,
  IntegrationAuthType,
  IntegrationCreationParams,
  IntegrationUpdateParams,
  IntegrationResponse,
  IntegrationSyncRequest,
  IntegrationSyncResponse
} from './integration.model';

/**
 * Enumeration of supported TMS provider types
 */
export enum TmsProviderType {
  MCLEOD = 'mcleod',           // McLeod Software TMS
  TMW = 'tmw',                 // TMW Systems/Trimble TMS
  MERCURYGATE = 'mercurygate'  // MercuryGate TMS
}

/**
 * Enumeration of possible TMS connection statuses
 */
export enum TmsConnectionStatus {
  ACTIVE = 'active',     // Connection is established and functioning
  PENDING = 'pending',   // Connection setup initiated but not completed
  ERROR = 'error',       // Connection is experiencing errors
  EXPIRED = 'expired',   // Authentication credentials have expired
  REVOKED = 'revoked'    // Connection access has been revoked
}

/**
 * Enumeration of TMS integration methods
 */
export enum TmsIntegrationType {
  API = 'api',           // REST API integration
  SFTP = 'sftp',         // SFTP file transfer integration
  EDI = 'edi'            // EDI document exchange integration
}

/**
 * Interface for API credentials specific to TMS connections
 */
export interface TmsApiCredentials {
  api_key?: string;              // API key for authentication (if applicable)
  api_secret?: string;           // API secret for authentication (if applicable)
  username?: string;             // Username for authentication (if applicable)
  password?: string;             // Password for authentication (if applicable)
  access_token?: string;         // OAuth access token (if applicable)
  refresh_token?: string;        // OAuth refresh token (if applicable)
  token_expires_at?: Date;       // Expiration date of the access token (if applicable)
}

/**
 * Interface for SFTP credentials specific to TMS connections
 */
export interface TmsSftpCredentials {
  host: string;                  // SFTP server hostname
  port: number;                  // SFTP server port
  username: string;              // SFTP username
  password?: string;             // SFTP password (if not using private key)
  private_key?: string;          // Private key for SFTP authentication (if not using password)
  directory_path: string;        // Directory path for file exchange
}

/**
 * Interface for EDI credentials specific to TMS connections
 */
export interface TmsEdiCredentials {
  trading_partner_id: string;    // EDI trading partner identifier
  interchange_id: string;        // EDI interchange identifier
  qualifier: string;             // EDI qualifier
  password?: string;             // EDI password (if applicable)
  endpoint_url?: string;         // EDI endpoint URL (if applicable)
}

/**
 * Interface for TMS connection settings
 */
export interface TmsSettings {
  base_url?: string;             // Base URL for API connections
  company_code?: string;         // Company code or identifier in the TMS
  sync_frequency_minutes?: number; // How often to synchronize data (in minutes)
  sync_entities?: string[];      // Which entity types to synchronize
  auto_sync_enabled?: boolean;   // Whether automatic synchronization is enabled
  webhook_url?: string;          // Webhook URL for receiving TMS updates
  webhook_secret?: string;       // Secret for webhook validation
}

/**
 * Main interface for TMS connection data
 */
export interface TmsConnection {
  connection_id: string;         // Unique identifier for the TMS connection
  owner_type: IntegrationOwnerType; // Type of entity that owns this connection
  owner_id: string;              // ID of the entity that owns this connection
  provider_type: TmsProviderType; // Type of TMS provider
  integration_type: TmsIntegrationType; // Method of integration
  name: string;                  // User-friendly name for the connection
  description?: string;          // Optional description
  credentials: TmsApiCredentials | TmsSftpCredentials | TmsEdiCredentials; // Connection credentials
  settings: TmsSettings;         // Connection settings
  status: TmsConnectionStatus;   // Current status of the connection
  last_sync_at?: Date;           // Timestamp of the last successful synchronization
  error_message?: string;        // Most recent error message, if any
  created_at: Date;              // Timestamp when the connection was created
  updated_at: Date;              // Timestamp when the connection was last updated
}

/**
 * Parameters required for creating a new TMS connection
 */
export interface TmsConnectionCreationParams {
  owner_type: IntegrationOwnerType; // Type of entity that will own this connection
  owner_id: string;              // ID of the entity that will own this connection
  provider_type: TmsProviderType; // Type of TMS provider
  integration_type: TmsIntegrationType; // Method of integration
  name: string;                  // User-friendly name for the connection
  description?: string;          // Optional description
  credentials: TmsApiCredentials | TmsSftpCredentials | TmsEdiCredentials; // Connection credentials
  settings: TmsSettings;         // Connection settings
  test_connection?: boolean;     // Whether to test the connection during creation
}

/**
 * Parameters for updating an existing TMS connection
 */
export interface TmsConnectionUpdateParams {
  name?: string;                 // Updated name
  description?: string;          // Updated description
  credentials?: TmsApiCredentials | TmsSftpCredentials | TmsEdiCredentials; // Updated credentials
  settings?: TmsSettings;        // Updated settings
  status?: TmsConnectionStatus;  // Updated status
  error_message?: string;        // Updated error message
}

/**
 * Response structure for TMS connection data with sensitive credentials removed
 */
export interface TmsConnectionResponse {
  connection_id: string;         // Unique identifier for the TMS connection
  owner_type: IntegrationOwnerType; // Type of entity that owns this connection
  owner_id: string;              // ID of the entity that owns this connection
  provider_type: TmsProviderType; // Type of TMS provider
  integration_type: TmsIntegrationType; // Method of integration
  name: string;                  // User-friendly name for the connection
  description?: string;          // Optional description
  settings: TmsSettings;         // Connection settings
  status: TmsConnectionStatus;   // Current status of the connection
  last_sync_at?: Date;           // Timestamp of the last successful synchronization
  error_message?: string;        // Most recent error message, if any
  created_at: Date;              // Timestamp when the connection was created
  updated_at: Date;              // Timestamp when the connection was last updated
}

/**
 * Request parameters for TMS synchronization
 */
export interface TmsSyncRequest {
  connection_id: string;         // ID of the connection to synchronize
  entity_types?: string[];       // Specific entity types to synchronize (optional)
  force?: boolean;               // Whether to force a full synchronization
  start_date?: Date;             // Start date for incremental synchronization
  end_date?: Date;               // End date for incremental synchronization
}

/**
 * Response structure for TMS synchronization operations
 */
export interface TmsSyncResponse {
  connection_id: string;         // ID of the connection that was synchronized
  sync_id: string;               // Unique identifier for this synchronization operation
  status: string;                // Status of the synchronization (success, in_progress, failed)
  entity_counts?: Record<string, number>; // Counts of entities processed by type
  started_at: Date;              // When the synchronization started
  completed_at?: Date;           // When the synchronization completed (if finished)
  error_message?: string;        // Error message if synchronization failed
}

/**
 * Common interface that all TMS provider implementations must implement
 */
export interface TmsProviderInterface {
  /**
   * Authenticates with the TMS provider
   * @param credentials TMS connection credentials
   * @returns Updated credentials with tokens, etc.
   */
  authenticate(credentials: TmsApiCredentials | TmsSftpCredentials | TmsEdiCredentials): 
    Promise<TmsApiCredentials | TmsSftpCredentials | TmsEdiCredentials>;
  
  /**
   * Refreshes authentication tokens when needed
   * @param credentials Current TMS credentials
   * @returns Updated credentials with new tokens
   */
  refreshToken(credentials: TmsApiCredentials): Promise<TmsApiCredentials>;
  
  /**
   * Synchronizes load data from the TMS
   * @param connection TMS connection details
   * @param options Synchronization options
   * @returns Synchronization results
   */
  syncLoads(connection: TmsConnection, options?: any): Promise<TmsSyncResponse>;
  
  /**
   * Synchronizes carrier data from the TMS
   * @param connection TMS connection details
   * @param options Synchronization options
   * @returns Synchronization results
   */
  syncCarriers(connection: TmsConnection, options?: any): Promise<TmsSyncResponse>;
  
  /**
   * Synchronizes driver data from the TMS
   * @param connection TMS connection details
   * @param options Synchronization options
   * @returns Synchronization results
   */
  syncDrivers(connection: TmsConnection, options?: any): Promise<TmsSyncResponse>;
  
  /**
   * Synchronizes vehicle data from the TMS
   * @param connection TMS connection details
   * @param options Synchronization options
   * @returns Synchronization results
   */
  syncVehicles(connection: TmsConnection, options?: any): Promise<TmsSyncResponse>;
  
  /**
   * Pushes a load to the TMS
   * @param connection TMS connection details
   * @param loadData Load data to push
   * @returns Result of the push operation
   */
  pushLoad(connection: TmsConnection, loadData: any): Promise<any>;
  
  /**
   * Updates a load's status in the TMS
   * @param connection TMS connection details
   * @param loadId Load identifier
   * @param status New status
   * @returns Result of the update operation
   */
  updateLoadStatus(connection: TmsConnection, loadId: string, status: string): Promise<any>;
  
  /**
   * Tests the connection to the TMS
   * @param connection TMS connection details
   * @returns Boolean indicating if the connection is valid
   */
  testConnection(connection: TmsConnection): Promise<boolean>;
}