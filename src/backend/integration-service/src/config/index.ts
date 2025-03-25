/**
 * Configuration module for the Integration Service
 * 
 * This module centralizes all external service integration settings, including
 * ELD providers, payment processors, mapping services, TMS systems, and weather services.
 * It provides a uniform way to access configuration for all external integrations.
 */

import { getEnv, requireEnv, getEnvBoolean, IS_PRODUCTION } from '../../../common/config';
import logger from '../../../common/utils/logger';
import { IntegrationType } from '../models/integration.model';

// Define interfaces for provider configurations

/**
 * Base configuration interface for all service providers
 */
interface BaseProviderConfig {
  apiUrl: string;           // Base URL for API requests
  apiVersion?: string;      // API version to use
  timeout: number;          // Request timeout in milliseconds
  retryAttempts: number;    // Number of retry attempts for failed requests
}

/**
 * Configuration interface for OAuth-based providers
 */
interface OAuthProviderConfig extends BaseProviderConfig {
  clientId: string;         // OAuth client ID
  clientSecret: string;     // OAuth client secret
  authUrl: string;          // Authorization URL
  tokenUrl: string;         // Token URL
  callbackUrl: string;      // OAuth callback URL
  scopes: string[];         // OAuth scopes
}

/**
 * Configuration interface for API key-based providers
 */
interface ApiKeyProviderConfig extends BaseProviderConfig {
  apiKey: string;           // API key
  apiSecret?: string;       // API secret (if required)
}

/**
 * ELD provider configurations
 */
interface ELDConfig {
  keeptruckin: OAuthProviderConfig;  // KeepTruckin ELD
  omnitracs: OAuthProviderConfig;    // Omnitracs ELD
  samsara: OAuthProviderConfig;      // Samsara ELD
}

/**
 * Payment provider configurations
 */
interface PaymentConfig {
  stripe: ApiKeyProviderConfig;     // Stripe payment processor - stripe@8.195.0
  plaid: OAuthProviderConfig;       // Plaid financial data provider - plaid@9.15.0
}

/**
 * Mapping provider configurations
 */
interface MappingConfig {
  googleMaps: ApiKeyProviderConfig;  // Google Maps API - @googlemaps/google-maps-services-js@3.3.28
  mapbox: ApiKeyProviderConfig;      // Mapbox API - @mapbox/mapbox-sdk@0.15.0
}

/**
 * TMS provider configurations
 */
interface TMSConfig {
  mcleod: OAuthProviderConfig;      // McLeod TMS
  mercurygate: OAuthProviderConfig; // MercuryGate TMS
  tmw: OAuthProviderConfig;         // TMW TMS
}

/**
 * Weather provider configurations
 */
interface WeatherConfig {
  openWeatherMap: ApiKeyProviderConfig;  // OpenWeatherMap API - openweather-api@0.0.7
  weatherApi: ApiKeyProviderConfig;      // WeatherAPI.com - weather-api-client@1.0.1
}

/**
 * General integration service configuration
 */
interface IntegrationServiceConfig {
  webhookSecret: string;            // Secret for webhook signature validation
  webhookBaseUrl: string;           // Base URL for incoming webhooks
  oauthCallbackBaseUrl: string;     // Base URL for OAuth callbacks
  syncIntervals: {                  // Automatic synchronization intervals (in minutes)
    eld: number;                    // ELD sync interval
    tms: number;                    // TMS sync interval
    payment: number;                // Payment sync interval
    mapping: number;                // Mapping sync interval
    weather: number;                // Weather sync interval
  };
}

/**
 * ELD (Electronic Logging Device) provider configurations
 */
export const eldConfig: ELDConfig = {
  // KeepTruckin ELD API configuration
  keeptruckin: {
    apiUrl: getEnv('ELD_KEEPTRUCKIN_API_URL', 'https://api.keeptruckin.com'),
    apiVersion: getEnv('ELD_KEEPTRUCKIN_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('ELD_KEEPTRUCKIN_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('ELD_KEEPTRUCKIN_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('ELD_KEEPTRUCKIN_CLIENT_ID', ''),
    clientSecret: getEnv('ELD_KEEPTRUCKIN_CLIENT_SECRET', ''),
    authUrl: getEnv('ELD_KEEPTRUCKIN_AUTH_URL', 'https://api.keeptruckin.com/oauth/authorize'),
    tokenUrl: getEnv('ELD_KEEPTRUCKIN_TOKEN_URL', 'https://api.keeptruckin.com/oauth/token'),
    callbackUrl: getEnv('ELD_KEEPTRUCKIN_CALLBACK_URL', ''),
    scopes: getEnv('ELD_KEEPTRUCKIN_SCOPES', 'vehicles:read logs:read').split(' '),
  },
  // Omnitracs ELD API configuration
  omnitracs: {
    apiUrl: getEnv('ELD_OMNITRACS_API_URL', 'https://api.omnitracs.com'),
    apiVersion: getEnv('ELD_OMNITRACS_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('ELD_OMNITRACS_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('ELD_OMNITRACS_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('ELD_OMNITRACS_CLIENT_ID', ''),
    clientSecret: getEnv('ELD_OMNITRACS_CLIENT_SECRET', ''),
    authUrl: getEnv('ELD_OMNITRACS_AUTH_URL', 'https://api.omnitracs.com/oauth/authorize'),
    tokenUrl: getEnv('ELD_OMNITRACS_TOKEN_URL', 'https://api.omnitracs.com/oauth/token'),
    callbackUrl: getEnv('ELD_OMNITRACS_CALLBACK_URL', ''),
    scopes: getEnv('ELD_OMNITRACS_SCOPES', 'vehicles:read logs:read').split(' '),
  },
  // Samsara ELD API configuration
  samsara: {
    apiUrl: getEnv('ELD_SAMSARA_API_URL', 'https://api.samsara.com'),
    apiVersion: getEnv('ELD_SAMSARA_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('ELD_SAMSARA_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('ELD_SAMSARA_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('ELD_SAMSARA_CLIENT_ID', ''),
    clientSecret: getEnv('ELD_SAMSARA_CLIENT_SECRET', ''),
    authUrl: getEnv('ELD_SAMSARA_AUTH_URL', 'https://cloud.samsara.com/oauth/authorize'),
    tokenUrl: getEnv('ELD_SAMSARA_TOKEN_URL', 'https://api.samsara.com/oauth/token'),
    callbackUrl: getEnv('ELD_SAMSARA_CALLBACK_URL', ''),
    scopes: getEnv('ELD_SAMSARA_SCOPES', 'vehicles:read logs:read').split(' '),
  },
};

/**
 * Payment processor configurations
 */
export const paymentConfig: PaymentConfig = {
  // Stripe payment processor configuration
  stripe: {
    apiUrl: getEnv('PAYMENT_STRIPE_API_URL', 'https://api.stripe.com'),
    apiVersion: getEnv('PAYMENT_STRIPE_API_VERSION', '2023-08-16'),
    timeout: parseInt(getEnv('PAYMENT_STRIPE_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('PAYMENT_STRIPE_RETRY_ATTEMPTS', '3')),
    apiKey: getEnv('PAYMENT_STRIPE_API_KEY', ''),
    apiSecret: getEnv('PAYMENT_STRIPE_API_SECRET', ''),
  },
  // Plaid financial data provider configuration
  plaid: {
    apiUrl: getEnv('PAYMENT_PLAID_API_URL', 'https://sandbox.plaid.com'),
    apiVersion: getEnv('PAYMENT_PLAID_API_VERSION', '2020-09-14'),
    timeout: parseInt(getEnv('PAYMENT_PLAID_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('PAYMENT_PLAID_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('PAYMENT_PLAID_CLIENT_ID', ''),
    clientSecret: getEnv('PAYMENT_PLAID_CLIENT_SECRET', ''),
    authUrl: getEnv('PAYMENT_PLAID_AUTH_URL', 'https://sandbox.plaid.com/link/create'),
    tokenUrl: getEnv('PAYMENT_PLAID_TOKEN_URL', 'https://sandbox.plaid.com/link/token/exchange'),
    callbackUrl: getEnv('PAYMENT_PLAID_CALLBACK_URL', ''),
    scopes: getEnv('PAYMENT_PLAID_SCOPES', 'transactions auth').split(' '),
  },
};

/**
 * Mapping and geolocation service configurations
 */
export const mappingConfig: MappingConfig = {
  // Google Maps API configuration
  googleMaps: {
    apiUrl: getEnv('MAPPING_GOOGLE_MAPS_API_URL', 'https://maps.googleapis.com'),
    apiVersion: getEnv('MAPPING_GOOGLE_MAPS_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('MAPPING_GOOGLE_MAPS_TIMEOUT', '10000')),
    retryAttempts: parseInt(getEnv('MAPPING_GOOGLE_MAPS_RETRY_ATTEMPTS', '3')),
    apiKey: getEnv('MAPPING_GOOGLE_MAPS_API_KEY', ''),
  },
  // Mapbox API configuration
  mapbox: {
    apiUrl: getEnv('MAPPING_MAPBOX_API_URL', 'https://api.mapbox.com'),
    apiVersion: getEnv('MAPPING_MAPBOX_API_VERSION', 'v5'),
    timeout: parseInt(getEnv('MAPPING_MAPBOX_TIMEOUT', '10000')),
    retryAttempts: parseInt(getEnv('MAPPING_MAPBOX_RETRY_ATTEMPTS', '3')),
    apiKey: getEnv('MAPPING_MAPBOX_API_KEY', ''),
  },
};

/**
 * Transportation Management System (TMS) configurations
 */
export const tmsConfig: TMSConfig = {
  // McLeod TMS configuration
  mcleod: {
    apiUrl: getEnv('TMS_MCLEOD_API_URL', 'https://api.mcleodsoft.com'),
    apiVersion: getEnv('TMS_MCLEOD_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('TMS_MCLEOD_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('TMS_MCLEOD_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('TMS_MCLEOD_CLIENT_ID', ''),
    clientSecret: getEnv('TMS_MCLEOD_CLIENT_SECRET', ''),
    authUrl: getEnv('TMS_MCLEOD_AUTH_URL', 'https://api.mcleodsoft.com/oauth/authorize'),
    tokenUrl: getEnv('TMS_MCLEOD_TOKEN_URL', 'https://api.mcleodsoft.com/oauth/token'),
    callbackUrl: getEnv('TMS_MCLEOD_CALLBACK_URL', ''),
    scopes: getEnv('TMS_MCLEOD_SCOPES', 'loads:read drivers:read').split(' '),
  },
  // MercuryGate TMS configuration
  mercurygate: {
    apiUrl: getEnv('TMS_MERCURYGATE_API_URL', 'https://api.mercurygate.com'),
    apiVersion: getEnv('TMS_MERCURYGATE_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('TMS_MERCURYGATE_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('TMS_MERCURYGATE_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('TMS_MERCURYGATE_CLIENT_ID', ''),
    clientSecret: getEnv('TMS_MERCURYGATE_CLIENT_SECRET', ''),
    authUrl: getEnv('TMS_MERCURYGATE_AUTH_URL', 'https://api.mercurygate.com/oauth/authorize'),
    tokenUrl: getEnv('TMS_MERCURYGATE_TOKEN_URL', 'https://api.mercurygate.com/oauth/token'),
    callbackUrl: getEnv('TMS_MERCURYGATE_CALLBACK_URL', ''),
    scopes: getEnv('TMS_MERCURYGATE_SCOPES', 'loads:read drivers:read').split(' '),
  },
  // TMW TMS configuration
  tmw: {
    apiUrl: getEnv('TMS_TMW_API_URL', 'https://api.tmwsuite.com'),
    apiVersion: getEnv('TMS_TMW_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('TMS_TMW_TIMEOUT', '30000')),
    retryAttempts: parseInt(getEnv('TMS_TMW_RETRY_ATTEMPTS', '3')),
    clientId: getEnv('TMS_TMW_CLIENT_ID', ''),
    clientSecret: getEnv('TMS_TMW_CLIENT_SECRET', ''),
    authUrl: getEnv('TMS_TMW_AUTH_URL', 'https://api.tmwsuite.com/oauth/authorize'),
    tokenUrl: getEnv('TMS_TMW_TOKEN_URL', 'https://api.tmwsuite.com/oauth/token'),
    callbackUrl: getEnv('TMS_TMW_CALLBACK_URL', ''),
    scopes: getEnv('TMS_TMW_SCOPES', 'loads:read drivers:read').split(' '),
  },
};

/**
 * Weather data service configurations
 */
export const weatherConfig: WeatherConfig = {
  // OpenWeatherMap API configuration
  openWeatherMap: {
    apiUrl: getEnv('WEATHER_OPENWEATHERMAP_API_URL', 'https://api.openweathermap.org'),
    apiVersion: getEnv('WEATHER_OPENWEATHERMAP_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('WEATHER_OPENWEATHERMAP_TIMEOUT', '10000')),
    retryAttempts: parseInt(getEnv('WEATHER_OPENWEATHERMAP_RETRY_ATTEMPTS', '3')),
    apiKey: getEnv('WEATHER_OPENWEATHERMAP_API_KEY', ''),
  },
  // WeatherAPI.com configuration
  weatherApi: {
    apiUrl: getEnv('WEATHER_WEATHERAPI_API_URL', 'https://api.weatherapi.com'),
    apiVersion: getEnv('WEATHER_WEATHERAPI_API_VERSION', 'v1'),
    timeout: parseInt(getEnv('WEATHER_WEATHERAPI_TIMEOUT', '10000')),
    retryAttempts: parseInt(getEnv('WEATHER_WEATHERAPI_RETRY_ATTEMPTS', '3')),
    apiKey: getEnv('WEATHER_WEATHERAPI_API_KEY', ''),
  },
};

/**
 * General integration service configuration
 */
export const integrationConfig: IntegrationServiceConfig = {
  webhookSecret: getEnv('INTEGRATION_WEBHOOK_SECRET', ''),
  webhookBaseUrl: getEnv('INTEGRATION_WEBHOOK_BASE_URL', ''),
  oauthCallbackBaseUrl: getEnv('INTEGRATION_OAUTH_CALLBACK_BASE_URL', ''),
  syncIntervals: {
    eld: parseInt(getEnv('INTEGRATION_SYNC_INTERVAL_ELD', '15')),         // 15 minutes
    tms: parseInt(getEnv('INTEGRATION_SYNC_INTERVAL_TMS', '30')),         // 30 minutes
    payment: parseInt(getEnv('INTEGRATION_SYNC_INTERVAL_PAYMENT', '60')), // 60 minutes
    mapping: parseInt(getEnv('INTEGRATION_SYNC_INTERVAL_MAPPING', '1440')), // 24 hours
    weather: parseInt(getEnv('INTEGRATION_SYNC_INTERVAL_WEATHER', '60')), // 60 minutes
  },
};

/**
 * Get configuration for a specific provider by type and name
 * 
 * @param type - The integration type (ELD, TMS, etc.)
 * @param providerName - The name of the provider
 * @returns The provider configuration or undefined if not found
 */
export const getProviderConfig = (type: string, providerName: string): BaseProviderConfig | undefined => {
  if (!type || !providerName) {
    logger.error('Integration type and provider name are required');
    return undefined;
  }
  
  const normalizedType = type.toLowerCase();
  const normalizedProviderName = providerName.toLowerCase();
  
  switch (normalizedType) {
    case IntegrationType.ELD:
      if (normalizedProviderName === 'keeptruckin') return eldConfig.keeptruckin;
      if (normalizedProviderName === 'omnitracs') return eldConfig.omnitracs;
      if (normalizedProviderName === 'samsara') return eldConfig.samsara;
      break;
    
    case IntegrationType.TMS:
      if (normalizedProviderName === 'mcleod') return tmsConfig.mcleod;
      if (normalizedProviderName === 'mercurygate') return tmsConfig.mercurygate;
      if (normalizedProviderName === 'tmw') return tmsConfig.tmw;
      break;
    
    case IntegrationType.PAYMENT:
      if (normalizedProviderName === 'stripe') return paymentConfig.stripe;
      if (normalizedProviderName === 'plaid') return paymentConfig.plaid;
      break;
    
    case IntegrationType.MAPPING:
      if (normalizedProviderName === 'googlemaps') return mappingConfig.googleMaps;
      if (normalizedProviderName === 'mapbox') return mappingConfig.mapbox;
      break;
    
    case IntegrationType.WEATHER:
      if (normalizedProviderName === 'openweathermap') return weatherConfig.openWeatherMap;
      if (normalizedProviderName === 'weatherapi') return weatherConfig.weatherApi;
      break;
    
    default:
      logger.error(`Unknown integration type: ${type}`);
      return undefined;
  }
  
  logger.error(`Unknown provider name: ${providerName} for integration type: ${type}`);
  return undefined;
};

/**
 * Initialize and validate all integration configurations
 * 
 * This function validates that all required environment variables are present
 * and that at least one provider is configured for each integration type in
 * production environments.
 */
export const initializeIntegrationConfig = (): void => {
  try {
    logger.info('Initializing integration service configuration');
    
    // Validate required environment variables
    if (IS_PRODUCTION) {
      // Validate webhook secret for production environments
      requireEnv('INTEGRATION_WEBHOOK_SECRET');
      
      // Validate base URLs
      requireEnv('INTEGRATION_WEBHOOK_BASE_URL');
      requireEnv('INTEGRATION_OAUTH_CALLBACK_BASE_URL');
      
      // Validate at least one provider for each integration type
      const hasValidEldProvider = eldConfig.keeptruckin.clientId || 
        eldConfig.omnitracs.clientId || 
        eldConfig.samsara.clientId;
      
      const hasValidTmsProvider = tmsConfig.mcleod.clientId || 
        tmsConfig.mercurygate.clientId || 
        tmsConfig.tmw.clientId;
      
      const hasValidPaymentProvider = paymentConfig.stripe.apiKey || 
        paymentConfig.plaid.clientId;
      
      const hasValidMappingProvider = mappingConfig.googleMaps.apiKey || 
        mappingConfig.mapbox.apiKey;
      
      const hasValidWeatherProvider = weatherConfig.openWeatherMap.apiKey || 
        weatherConfig.weatherApi.apiKey;
      
      if (!hasValidEldProvider) {
        logger.warn('No valid ELD provider configured for production environment');
      }
      
      if (!hasValidTmsProvider) {
        logger.warn('No valid TMS provider configured for production environment');
      }
      
      if (!hasValidPaymentProvider) {
        logger.warn('No valid payment provider configured for production environment');
      }
      
      if (!hasValidMappingProvider) {
        logger.warn('No valid mapping provider configured for production environment');
      }
      
      if (!hasValidWeatherProvider) {
        logger.warn('No valid weather provider configured for production environment');
      }
    }
    
    logger.info('Integration service configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize integration service configuration', { error });
    throw error;
  }
};