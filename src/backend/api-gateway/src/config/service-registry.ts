import axios from 'axios'; // axios@1.3.4
import CircuitBreaker from 'opossum'; // opossum@6.4.0
import logger from '../../common/utils/logger';
import { getEnv, getEnvNumber, getEnvBoolean } from '../../common/config/environment.config';

/**
 * Interface defining the structure of a service in the registry
 */
export interface Service {
  name: string;
  url: string;
}

/**
 * Interface defining a specific instance of a service with its circuit breaker
 */
export interface ServiceInstance {
  service: Service;
  circuitBreaker: CircuitBreaker;
}

/**
 * Interface defining circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  capacity: number;
  volumeThreshold: number;
}

/**
 * Constants defining all available service names
 */
export const SERVICES = {
  AUTH_SERVICE: 'auth-service',
  DRIVER_SERVICE: 'driver-service',
  LOAD_SERVICE: 'load-service',
  CARRIER_SERVICE: 'carrier-service',
  SHIPPER_SERVICE: 'shipper-service',
  TRACKING_SERVICE: 'tracking-service',
  GAMIFICATION_SERVICE: 'gamification-service',
  MARKET_INTELLIGENCE_SERVICE: 'market-intelligence-service',
  LOAD_MATCHING_SERVICE: 'load-matching-service',
  OPTIMIZATION_ENGINE: 'optimization-engine',
  NOTIFICATION_SERVICE: 'notification-service',
  INTEGRATION_SERVICE: 'integration-service',
  CACHE_SERVICE: 'cache-service',
  DATA_SERVICE: 'data-service'
};

/**
 * Default circuit breaker options
 */
const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  timeout: 10000, // 10 seconds
  errorThresholdPercentage: 50, // Open after 50% of requests fail
  resetTimeout: 30000, // 30 seconds until circuit half-opens
  rollingCountTimeout: 10000, // 10 second window for counts
  rollingCountBuckets: 10, // 10 buckets of 1 second each
  capacity: 10, // Max concurrent requests
  volumeThreshold: 5 // Minimum requests before circuit can open
};

// In-memory registry of service instances
const serviceRegistry: Record<string, ServiceInstance> = {};

/**
 * Creates a circuit breaker for a service to handle failures gracefully
 * 
 * @param serviceName - The name of the service
 * @param options - Circuit breaker configuration options
 * @returns Configured circuit breaker instance for the service
 */
export const createServiceCircuitBreaker = (
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker => {
  // Merge with default options
  const circuitOptions: CircuitBreakerOptions = {
    ...DEFAULT_CIRCUIT_BREAKER_OPTIONS,
    ...options
  };

  // Create circuit breaker instance
  const circuit = new CircuitBreaker(async (context: any) => {
    return axios(context);
  }, circuitOptions);

  // Set up event listeners for logging and monitoring
  circuit.on('open', () => {
    logger.warn(`Circuit for ${serviceName} is now OPEN (failing fast)`, {
      service: serviceName,
      circuitState: 'open'
    });
  });

  circuit.on('close', () => {
    logger.info(`Circuit for ${serviceName} is now CLOSED (operating normally)`, {
      service: serviceName,
      circuitState: 'closed'
    });
  });

  circuit.on('halfOpen', () => {
    logger.info(`Circuit for ${serviceName} is now HALF-OPEN (testing for recovery)`, {
      service: serviceName,
      circuitState: 'halfOpen'
    });
  });

  circuit.on('fallback', (error: Error) => {
    logger.debug(`Circuit for ${serviceName} executed fallback`, {
      service: serviceName,
      error
    });
  });

  return circuit;
};

/**
 * Gets the URL for a specific service based on environment configuration
 * 
 * @param serviceName - The name of the service
 * @returns URL for the requested service
 */
const getServiceUrl = (serviceName: string): string => {
  // Convert service name to environment variable format
  // e.g., 'auth-service' becomes 'AUTH_SERVICE_URL'
  const envName = serviceName
    .replace(/-/g, '_')
    .toUpperCase() + '_URL';
  
  // Get the URL from environment variables
  const serviceUrl = getEnv(envName);
  
  if (!serviceUrl) {
    throw new Error(`Service URL for ${serviceName} is not configured. Set ${envName} environment variable.`);
  }
  
  return serviceUrl;
};

/**
 * Gets a service instance from the registry or creates one if it doesn't exist
 * 
 * @param serviceName - The name of the service
 * @returns Service instance with URL and circuit breaker
 */
const getServiceInstance = (serviceName: string): ServiceInstance => {
  // Return existing instance if already in registry
  if (serviceRegistry[serviceName]) {
    return serviceRegistry[serviceName];
  }
  
  // Get service URL from environment
  const serviceUrl = getServiceUrl(serviceName);
  
  // Create circuit breaker for service
  const circuitBreaker = createServiceCircuitBreaker(serviceName);
  
  // Create new service instance
  const serviceInstance: ServiceInstance = {
    service: {
      name: serviceName,
      url: serviceUrl
    },
    circuitBreaker
  };
  
  // Add to registry
  serviceRegistry[serviceName] = serviceInstance;
  
  return serviceInstance;
};

/**
 * Initializes the service registry by pre-loading all service instances
 * 
 * @returns Promise that resolves when initialization is complete
 */
const initializeServiceRegistry = async (): Promise<void> => {
  logger.info('Initializing service registry...');
  
  try {
    // Initialize all defined services
    for (const service of Object.values(SERVICES)) {
      try {
        const instance = getServiceInstance(service);
        logger.debug(`Initialized service: ${service}`, {
          service: service,
          url: instance.service.url
        });
      } catch (error) {
        logger.error(`Failed to initialize service: ${service}`, {
          service,
          error
        });
      }
    }
    
    logger.info('Service registry initialization complete');
  } catch (error) {
    logger.error('Service registry initialization failed', { error });
    throw error;
  }
};

/**
 * Checks the health of a specific service
 * 
 * @param serviceName - The name of the service
 * @returns Promise that resolves to true if service is healthy, false otherwise
 */
const checkServiceHealth = async (serviceName: string): Promise<boolean> => {
  try {
    // Get service instance
    const serviceInstance = getServiceInstance(serviceName);
    
    // Make health check request
    await serviceInstance.circuitBreaker.fire({
      method: 'GET',
      url: `${serviceInstance.service.url}/health`,
      timeout: 5000 // Short timeout for health checks
    });
    
    logger.debug(`Health check passed for service: ${serviceName}`);
    return true;
  } catch (error) {
    logger.warn(`Health check failed for service: ${serviceName}`, {
      service: serviceName,
      error
    });
    return false;
  }
};

/**
 * Checks the health of all registered services
 * 
 * @returns Promise that resolves to an object mapping service names to health status
 */
const getAllServicesHealth = async (): Promise<Record<string, boolean>> => {
  const result: Record<string, boolean> = {};
  
  // Check health for all services in the registry
  for (const serviceName of Object.keys(serviceRegistry)) {
    result[serviceName] = await checkServiceHealth(serviceName);
  }
  
  return result;
};

/**
 * Main service registry object for managing service instances
 */
export const ServiceRegistry = {
  getServiceInstance,
  initializeServiceRegistry,
  checkServiceHealth,
  getAllServicesHealth
};