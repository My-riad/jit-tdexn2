import { AxiosResponse } from 'axios'; // ^1.4.0
import integrationApi from '../../../common/api/integrationApi';
import { 
  EldConnection, 
  TmsConnection, 
  PaymentMethod, 
  ApiKey, 
  IntegrationSettings 
} from '../../../common/interfaces';
import logger from '../../../common/utils/logger';

/**
 * Service module that provides methods for managing external system integrations in the carrier portal.
 * It handles connections with ELD providers, TMS systems, payment processors, mapping services, weather data providers, and API key management.
 */
export default {
  /**
   * Retrieves integration settings for a carrier
   * @param carrierId The carrier ID
   * @returns Promise resolving to the carrier's integration settings
   */
  async getIntegrationSettings(carrierId: string): Promise<IntegrationSettings> {
    try {
      logger.info(`Retrieving integration settings for carrier: ${carrierId}`);
      const response: AxiosResponse<IntegrationSettings> = await integrationApi.getIntegrationSettings(carrierId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve integration settings for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Updates integration settings for a carrier
   * @param carrierId The carrier ID
   * @param settings The updated integration settings
   * @returns Promise resolving to the updated integration settings
   */
  async updateIntegrationSettings(carrierId: string, settings: IntegrationSettings): Promise<IntegrationSettings> {
    try {
      logger.info(`Updating integration settings for carrier: ${carrierId}`);
      const response: AxiosResponse<IntegrationSettings> = await integrationApi.updateIntegrationSettings(carrierId, settings);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update integration settings for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves all ELD connections for a carrier
   * @param carrierId The carrier ID
   * @returns Promise resolving to the list of ELD connections
   */
  async getEldConnections(carrierId: string): Promise<EldConnection[]> {
    try {
      logger.info(`Retrieving ELD connections for carrier: ${carrierId}`);
      const response: AxiosResponse<EldConnection[]> = await integrationApi.eld.getConnections(carrierId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve ELD connections for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves a specific ELD connection by ID
   * @param connectionId The connection ID
   * @returns Promise resolving to the ELD connection details
   */
  async getEldConnection(connectionId: string): Promise<EldConnection> {
    try {
      logger.info(`Retrieving ELD connection with ID: ${connectionId}`);
      const response: AxiosResponse<EldConnection> = await integrationApi.eld.getConnection(connectionId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve ELD connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Creates a new ELD connection for a carrier
   * @param carrierId The carrier ID
   * @param connectionData The ELD connection data
   * @returns Promise resolving to the created ELD connection
   */
  async createEldConnection(carrierId: string, connectionData: any): Promise<EldConnection> {
    try {
      logger.info(`Creating ELD connection for carrier: ${carrierId}`);
      const response: AxiosResponse<EldConnection> = await integrationApi.eld.createConnection(connectionData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create ELD connection for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Updates an existing ELD connection
   * @param connectionId The connection ID
   * @param connectionData The updated ELD connection data
   * @returns Promise resolving to the updated ELD connection
   */
  async updateEldConnection(connectionId: string, connectionData: any): Promise<EldConnection> {
    try {
      logger.info(`Updating ELD connection with ID: ${connectionId}`);
      const response: AxiosResponse<EldConnection> = await integrationApi.eld.updateConnection(connectionId, connectionData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update ELD connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Deletes an ELD connection
   * @param connectionId The connection ID
   * @returns Promise resolving when the connection is deleted
   */
  async deleteEldConnection(connectionId: string): Promise<void> {
    try {
      logger.info(`Deleting ELD connection with ID: ${connectionId}`);
      await integrationApi.eld.deleteConnection(connectionId);
    } catch (error: any) {
      logger.error(`Failed to delete ELD connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Generates an OAuth authorization URL for a specific ELD provider
   * @param carrierId The carrier ID
   * @param providerType The ELD provider type
   * @param redirectUri The redirect URI after authorization
   * @returns Promise resolving to the authorization URL
   */
  async getEldAuthorizationUrl(carrierId: string, providerType: string, redirectUri: string): Promise<string> {
    try {
      logger.info(`Generating ELD authorization URL for carrier: ${carrierId}, provider: ${providerType}`);
      const response: AxiosResponse<string> = await integrationApi.eld.getAuthorizationUrl({ carrierId, providerType, redirectUri });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to generate ELD authorization URL for carrier: ${carrierId}, provider: ${providerType}`, { error });
      throw error;
    }
  },

  /**
   * Exchanges an authorization code for access and refresh tokens
   * @param carrierId The carrier ID
   * @param providerType The ELD provider type
   * @param code The authorization code
   * @param redirectUri The redirect URI used for authorization
   * @returns Promise resolving to the ELD connection details with tokens
   */
  async exchangeEldToken(carrierId: string, providerType: string, code: string, redirectUri: string): Promise<EldConnection> {
    try {
      logger.info(`Exchanging ELD token for carrier: ${carrierId}, provider: ${providerType}`);
      const response: AxiosResponse<EldConnection> = await integrationApi.eld.exchangeToken({ carrierId, providerType, code, redirectUri });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to exchange ELD token for carrier: ${carrierId}, provider: ${providerType}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves all TMS connections for a carrier
   * @param carrierId The carrier ID
   * @returns Promise resolving to the list of TMS connections
   */
  async getTmsConnections(carrierId: string): Promise<TmsConnection[]> {
    try {
      logger.info(`Retrieving TMS connections for carrier: ${carrierId}`);
      const response: AxiosResponse<TmsConnection[]> = await integrationApi.tms.getConnections(carrierId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve TMS connections for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves a specific TMS connection by ID
   * @param connectionId The connection ID
   * @returns Promise resolving to the TMS connection details
   */
  async getTmsConnection(connectionId: string): Promise<TmsConnection> {
    try {
      logger.info(`Retrieving TMS connection with ID: ${connectionId}`);
      const response: AxiosResponse<TmsConnection> = await integrationApi.tms.getConnection(connectionId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve TMS connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Creates a new TMS connection for a carrier
   * @param carrierId The carrier ID
   * @param connectionData The TMS connection data
   * @returns Promise resolving to the created TMS connection
   */
  async createTmsConnection(carrierId: string, connectionData: any): Promise<TmsConnection> {
    try {
      logger.info(`Creating TMS connection for carrier: ${carrierId}`);
      const response: AxiosResponse<TmsConnection> = await integrationApi.tms.createConnection(connectionData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create TMS connection for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Updates an existing TMS connection
   * @param connectionId The connection ID
   * @param connectionData The updated TMS connection data
   * @returns Promise resolving to the updated TMS connection
   */
  async updateTmsConnection(connectionId: string, connectionData: any): Promise<TmsConnection> {
    try {
      logger.info(`Updating TMS connection with ID: ${connectionId}`);
      const response: AxiosResponse<TmsConnection> = await integrationApi.tms.updateConnection(connectionId, connectionData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update TMS connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Deletes a TMS connection
   * @param connectionId The connection ID
   * @returns Promise resolving when the connection is deleted
   */
  async deleteTmsConnection(connectionId: string): Promise<void> {
    try {
      logger.info(`Deleting TMS connection with ID: ${connectionId}`);
      await integrationApi.tms.deleteConnection(connectionId);
    } catch (error: any) {
      logger.error(`Failed to delete TMS connection with ID: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Triggers synchronization between TMS and platform
   * @param connectionId The TMS connection ID
   * @param options Synchronization options
   * @returns Promise resolving to the sync results
   */
  async syncTmsData(connectionId: string, options: any): Promise<object> {
    try {
      logger.info(`Syncing TMS data for connection: ${connectionId}`);
      const response: AxiosResponse<object> = await integrationApi.tms.syncData({ connectionId, options });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to sync TMS data for connection: ${connectionId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves all payment methods for a carrier
   * @param carrierId The carrier ID
   * @returns Promise resolving to the list of payment methods
   */
  async getPaymentMethods(carrierId: string): Promise<PaymentMethod[]> {
    try {
      logger.info(`Retrieving payment methods for carrier: ${carrierId}`);
      const response: AxiosResponse<PaymentMethod[]> = await integrationApi.payment.getMethods(carrierId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve payment methods for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves a specific payment method by ID
   * @param paymentMethodId The payment method ID
   * @returns Promise resolving to the payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      logger.info(`Retrieving payment method with ID: ${paymentMethodId}`);
      const response: AxiosResponse<PaymentMethod> = await integrationApi.payment.getMethod(paymentMethodId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve payment method with ID: ${paymentMethodId}`, { error });
      throw error;
    }
  },

  /**
   * Creates a tokenization session for securely collecting payment method information
   * @param carrierId The carrier ID
   * @param options Tokenization options
   * @returns Promise resolving to the tokenization session details
   */
  async createTokenizationSession(carrierId: string, options: any): Promise<object> {
    try {
      logger.info(`Creating tokenization session for carrier: ${carrierId}`);
      const response: AxiosResponse<object> = await integrationApi.payment.createTokenizationSession(options);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create tokenization session for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Processes the callback from tokenization session and creates a payment method
   * @param carrierId The carrier ID
   * @param callbackData The callback data from the tokenization provider
   * @returns Promise resolving to the created payment method
   */
  async processTokenCallback(carrierId: string, callbackData: any): Promise<PaymentMethod> {
    try {
      logger.info(`Processing token callback for carrier: ${carrierId}`);
      const response: AxiosResponse<PaymentMethod> = await integrationApi.payment.processTokenCallback(carrierId, callbackData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to process token callback for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Deletes a payment method
   * @param paymentMethodId The payment method ID
   * @returns Promise resolving when the payment method is deleted
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      logger.info(`Deleting payment method with ID: ${paymentMethodId}`);
      await integrationApi.payment.deleteMethod(paymentMethodId);
    } catch (error: any) {
      logger.error(`Failed to delete payment method with ID: ${paymentMethodId}`, { error });
      throw error;
    }
  },

  /**
   * Sets a payment method as the default for a carrier
   * @param paymentMethodId The payment method ID
   * @returns Promise resolving to the updated payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      logger.info(`Setting default payment method with ID: ${paymentMethodId}`);
      const response: AxiosResponse<PaymentMethod> = await integrationApi.payment.setDefaultMethod(paymentMethodId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to set default payment method with ID: ${paymentMethodId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves all API keys for a carrier
   * @param carrierId The carrier ID
   * @returns Promise resolving to the list of API keys
   */
  async getApiKeys(carrierId: string): Promise<ApiKey[]> {
    try {
      logger.info(`Retrieving API keys for carrier: ${carrierId}`);
      const response: AxiosResponse<ApiKey[]> = await integrationApi.getApiKeys(carrierId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve API keys for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Retrieves a specific API key by ID
   * @param keyId The API key ID
   * @returns Promise resolving to the API key details
   */
  async getApiKey(keyId: string): Promise<ApiKey> {
    try {
      logger.info(`Retrieving API key with ID: ${keyId}`);
      const response: AxiosResponse<ApiKey> = await integrationApi.getApiKey(keyId);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to retrieve API key with ID: ${keyId}`, { error });
      throw error;
    }
  },

  /**
   * Creates a new API key for a carrier
   * @param carrierId The carrier ID
   * @param keyData The API key data
   * @returns Promise resolving to the created API key with secret
   */
  async createApiKey(carrierId: string, keyData: any): Promise<ApiKey> {
    try {
      logger.info(`Creating API key for carrier: ${carrierId}`);
      const response: AxiosResponse<ApiKey> = await integrationApi.createApiKey(carrierId, keyData);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create API key for carrier: ${carrierId}`, { error });
      throw error;
    }
  },

  /**
   * Revokes an API key
   * @param keyId The API key ID
   * @returns Promise resolving when the API key is revoked
   */
  async revokeApiKey(keyId: string): Promise<void> {
    try {
      logger.info(`Revoking API key with ID: ${keyId}`);
      await integrationApi.revokeApiKey(keyId);
    } catch (error: any) {
      logger.error(`Failed to revoke API key with ID: ${keyId}`, { error });
      throw error;
    }
  },
  
   /**
   * Calculates directions between an origin and destination
   * @param directionsRequest Origin, destination, and routing preferences
   * @returns Promise resolving to the directions result
   */
  async getDirections(directionsRequest: any): Promise<object> {
    try {
      logger.info(`Calculating directions`);
      const response: AxiosResponse<object> = await integrationApi.mapping.getDirections(directionsRequest);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to calculate directions`, { error });
      throw error;
    }
  },

  /**
   * Converts an address into geographic coordinates
   * @param address The address to geocode
   * @param options Additional geocoding options
   * @returns Promise resolving to the geocoding result
   */
  async geocode(address: string, options: any = {}): Promise<object> {
    try {
      logger.info(`Geocoding address: ${address}`);
      const response: AxiosResponse<object> = await integrationApi.mapping.geocode(address, options);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to geocode address: ${address}`, { error });
      throw error;
    }
  },

  /**
   * Validates an address by geocoding it and checking the result quality
   * @param address The address to validate
   * @param options Additional validation options
   * @returns Promise resolving to the address validation result
   */
  async validateAddress(address: string, options: any = {}): Promise<object> {
    try {
      logger.info(`Validating address: ${address}`);
      const response: AxiosResponse<object> = await integrationApi.mapping.validateAddress(address, options);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to validate address: ${address}`, { error });
      throw error;
    }
  },

  /**
   * Gets current weather conditions for a specific location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @param options Additional weather options
   * @returns Promise resolving to the current weather data
   */
  async getCurrentWeather(latitude: number, longitude: number, options: any = {}): Promise<object> {
    try {
      logger.info(`Getting current weather for: ${latitude}, ${longitude}`);
      const response: AxiosResponse<object> = await integrationApi.weather.getCurrent(latitude, longitude, options);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get current weather for: ${latitude}, ${longitude}`, { error });
      throw error;
    }
  },

  /**
   * Gets weather forecast for a specific location
   * @param latitude Location latitude
   * @param longitude Location longitude
   * @param options Additional forecast options
   * @returns Promise resolving to the forecast data
   */
  async getWeatherForecast(latitude: number, longitude: number, options: any = {}): Promise<object> {
    try {
      logger.info(`Getting weather forecast for: ${latitude}, ${longitude}`);
      const response: AxiosResponse<object> = await integrationApi.weather.getForecast(latitude, longitude, options);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get weather forecast for: ${latitude}, ${longitude}`, { error });
      throw error;
    }
  },

  /**
   * Gets weather conditions along a route with multiple waypoints
   * @param waypoints Array of waypoint coordinates [lat, lng]
   * @param departureTime ISO string of departure time
   * @returns Promise resolving to the route weather data
   */
  async getRouteWeather(waypoints: [number, number][], departureTime: string): Promise<object> {
    try {
      logger.info(`Getting route weather for ${waypoints.length} waypoints`);
      const response: AxiosResponse<object> = await integrationApi.weather.getRouteWeather(waypoints, departureTime);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get route weather for ${waypoints.length} waypoints`, { error });
      throw error;
    }
  }
};