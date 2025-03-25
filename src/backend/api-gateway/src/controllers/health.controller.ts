import { Request, Response } from 'express'; // express@4.18.2
import { ServiceRegistry, SERVICES, API_GATEWAY_CONFIG } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

// Cache for service health check results to reduce frequent calls
const SERVICE_HEALTH_CACHE = new Map<string, { status: boolean; timestamp: number }>();
// TTL for health check cache in milliseconds (30 seconds)
const HEALTH_CHECK_CACHE_TTL = 30000;

/**
 * Handles requests to check the health of the API Gateway itself
 * @param req Express request object
 * @param res Express response object
 * @returns Response with gateway health status
 */
export async function getGatewayHealth(req: Request, res: Response): Promise<Response> {
  logger.info('API Gateway health check requested');
  
  const healthResponse = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    name: 'api-gateway',
    details: {
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      basePath: API_GATEWAY_CONFIG.basePath,
      host: API_GATEWAY_CONFIG.host,
      port: API_GATEWAY_CONFIG.port
    }
  };
  
  return res.status(200).json(healthResponse);
}

/**
 * Handles requests to check the health of all registered microservices
 * @param req Express request object
 * @param res Express response object
 * @returns Response with health status of all services
 */
export async function getAllServicesHealth(req: Request, res: Response): Promise<Response> {
  logger.info('All services health check requested');
  
  // Check if we have a valid cached result
  if (isCacheValid('all-services')) {
    const cachedEntry = SERVICE_HEALTH_CACHE.get('all-services');
    logger.debug('Returning cached health check result for all services');
    
    return res.status(cachedEntry?.status ? 200 : 503)
      .json(formatHealthResponse(cachedEntry as any));
  }
  
  try {
    // Get health status for all registered services
    const healthResults = await ServiceRegistry.getAllServicesHealth();
    
    // Determine overall health status
    const isHealthy = Object.entries(healthResults).every(
      ([service, status]) => {
        // Critical services must be healthy
        if (isCriticalService(service)) {
          return status === true;
        }
        return true;
      }
    );
    
    // Cache the result
    SERVICE_HEALTH_CACHE.set('all-services', {
      status: isHealthy,
      timestamp: Date.now(),
      ...healthResults
    });
    
    // Format and return the response
    const healthResponse = formatHealthResponse(healthResults);
    return res.status(isHealthy ? 200 : 503).json(healthResponse);
  } catch (error) {
    logger.error('Error checking services health', { error });
    
    const appError = new AppError('Failed to check services health', {
      code: 'SRV_SERVICE_UNAVAILABLE',
      statusCode: 503
    });
    
    return res.status(appError.statusCode).json(appError.toJSON());
  }
}

/**
 * Handles requests to check the health of a specific microservice
 * @param req Express request object with service name parameter
 * @param res Express response object
 * @returns Response with health status of the requested service
 */
export async function getServiceHealth(req: Request, res: Response): Promise<Response> {
  const serviceName = req.params.service;
  
  logger.info(`Health check requested for service: ${serviceName}`);
  
  // Validate the service name
  if (!Object.values(SERVICES).includes(serviceName)) {
    logger.warn(`Invalid service name requested: ${serviceName}`);
    
    const appError = new AppError(`Service '${serviceName}' not found`, {
      code: 'RES_ROUTE_NOT_FOUND',
      statusCode: 404
    });
    
    return res.status(appError.statusCode).json(appError.toJSON());
  }
  
  // Check if we have a valid cached result
  if (isCacheValid(serviceName)) {
    const cachedEntry = SERVICE_HEALTH_CACHE.get(serviceName);
    logger.debug(`Returning cached health check result for service: ${serviceName}`);
    
    return res.status(cachedEntry?.status ? 200 : 503).json({
      status: cachedEntry?.status ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      name: serviceName,
      details: {
        status: cachedEntry?.status ? 'UP' : 'DOWN'
      }
    });
  }
  
  try {
    // Check the health of the requested service
    const isHealthy = await ServiceRegistry.checkServiceHealth(serviceName);
    
    // Cache the result
    SERVICE_HEALTH_CACHE.set(serviceName, {
      status: isHealthy,
      timestamp: Date.now()
    });
    
    // Format and return the response
    const healthResponse = {
      status: isHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      name: serviceName,
      details: {
        status: isHealthy ? 'UP' : 'DOWN'
      }
    };
    
    return res.status(isHealthy ? 200 : 503).json(healthResponse);
  } catch (error) {
    logger.error(`Error checking health for service: ${serviceName}`, { error });
    
    const appError = new AppError(`Failed to check health for service: ${serviceName}`, {
      code: 'SRV_SERVICE_UNAVAILABLE',
      statusCode: 503
    });
    
    return res.status(appError.statusCode).json(appError.toJSON());
  }
}

/**
 * Formats health check results into a standardized response format
 * @param healthResults Object mapping service names to health status
 * @returns Formatted health response object
 */
function formatHealthResponse(healthResults: Record<string, boolean>): object {
  const services: Record<string, { status: string }> = {};
  let overallStatus = 'UP';
  
  // Process each service's health status
  for (const [serviceName, isHealthy] of Object.entries(healthResults)) {
    // Skip non-boolean entries (like timestamp)
    if (typeof isHealthy !== 'boolean') continue;
    
    services[serviceName] = {
      status: isHealthy ? 'UP' : 'DOWN'
    };
    
    // If any critical service is down, the overall status is DOWN
    if (!isHealthy && isCriticalService(serviceName)) {
      overallStatus = 'DOWN';
    }
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    name: 'platform-services',
    services
  };
}

/**
 * Checks if cached health check result is still valid based on TTL
 * @param serviceName Name of the service to check cache for
 * @returns True if cache is valid, false otherwise
 */
function isCacheValid(serviceName: string): boolean {
  const cachedEntry = SERVICE_HEALTH_CACHE.get(serviceName);
  
  if (!cachedEntry) {
    return false;
  }
  
  const now = Date.now();
  const elapsedTime = now - cachedEntry.timestamp;
  
  return elapsedTime < HEALTH_CHECK_CACHE_TTL;
}

/**
 * Determines if a service is critical to overall system health
 * @param serviceName Name of the service to check
 * @returns True if the service is critical
 */
function isCriticalService(serviceName: string): boolean {
  // Define services that are critical for the platform to function
  const criticalServices = [
    SERVICES.AUTH_SERVICE,
    SERVICES.LOAD_SERVICE,
    SERVICES.DRIVER_SERVICE,
    SERVICES.LOAD_MATCHING_SERVICE,
    SERVICES.TRACKING_SERVICE
  ];
  
  return criticalServices.includes(serviceName as any);
}