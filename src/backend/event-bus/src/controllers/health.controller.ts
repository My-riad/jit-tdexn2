import { Request, Response, NextFunction } from 'express'; // express@^4.17.1
import KafkaService from '../services/kafka.service';
import SchemaRegistryService from '../services/schema-registry.service';
import logger from '../../../common/utils/logger';
import { StatusCodes } from '../../../common/constants/status-codes';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Controller that provides health check endpoints for the Event Bus service, enabling monitoring systems to verify the operational status of Kafka connections, schema registry, and overall service health.
 * These endpoints are essential for Kubernetes liveness and readiness probes, as well as for general monitoring and alerting.
 */
export const getHealth = (req: Request, res: Response, next: NextFunction): void => {
  // Log the health check request
  logger.info('Health check requested');

  try {
    // Return a 200 OK response with a simple status message
    res.status(StatusCodes.OK).json({ status: 'OK', message: 'Event Bus service is running' });
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Detailed health check that provides status of all service components
 */
export const getDetailedHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Log the detailed health check request
  logger.info('Detailed health check requested');

  try {
    // Create instances of KafkaService and SchemaRegistryService
    const kafkaService = new KafkaService(new SchemaRegistryService());
    const schemaRegistryService = new SchemaRegistryService();

    // Check Kafka service health
    const kafkaHealth = await checkKafkaHealth(kafkaService);

    // Check Schema Registry service health
    const schemaRegistryHealth = await checkSchemaRegistryHealth(schemaRegistryService);

    // Combine health check results
    const healthStatus = {
      kafka: kafkaHealth,
      schemaRegistry: schemaRegistryHealth
    };

    // Determine overall status based on component health
    const overallStatus = kafkaHealth.status === 'OK' && schemaRegistryHealth.status === 'OK' ? 'OK' : 'SERVICE_UNAVAILABLE';

    // Return response with detailed health information
    res.status(overallStatus === 'OK' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
      status: overallStatus,
      components: healthStatus
    });
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Health check specifically for the Kafka service
 */
export const getKafkaHealth = async (req: Request, res: Response, next: NextFunction, kafkaService: KafkaService): Promise<void> => {
  // Log the Kafka health check request
  logger.info('Kafka health check requested');

  try {
    // Check if Kafka service is initialized and connected
    const kafkaHealth = await checkKafkaHealth(kafkaService);

    // Return appropriate status based on Kafka health
    res.status(kafkaHealth.status === 'OK' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json(kafkaHealth);
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Health check specifically for the Schema Registry service
 */
export const getSchemaRegistryHealth = async (req: Request, res: Response, next: NextFunction, schemaRegistryService: SchemaRegistryService): Promise<void> => {
  // Log the Schema Registry health check request
  logger.info('Schema Registry health check requested');

  try {
    // Check if Schema Registry service is enabled and functioning
    const schemaRegistryHealth = await checkSchemaRegistryHealth(schemaRegistryService);

    // Return appropriate status based on Schema Registry health
    res.status(schemaRegistryHealth.status === 'OK' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json(schemaRegistryHealth);
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Readiness probe endpoint for Kubernetes to determine if the service is ready to accept traffic
 */
export const getReadiness = async (req: Request, res: Response, next: NextFunction, kafkaService: KafkaService, schemaRegistryService: SchemaRegistryService): Promise<void> => {
  // Log the readiness probe request
  logger.info('Readiness probe requested');

  try {
    // Check if Kafka service is initialized and connected
    const kafkaHealth = await checkKafkaHealth(kafkaService);

    // Check if Schema Registry service is functioning (if enabled)
    const schemaRegistryHealth = await checkSchemaRegistryHealth(schemaRegistryService);

    // Return 200 OK if all checks pass, indicating service is ready
    if (kafkaHealth.status === 'OK' && schemaRegistryHealth.status === 'OK') {
      res.status(StatusCodes.OK).json({ status: 'OK', message: 'Event Bus service is ready' });
    } else {
      // Return 503 Service Unavailable if any check fails
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'SERVICE_UNAVAILABLE',
        message: 'Event Bus service is not ready',
        components: {
          kafka: kafkaHealth,
          schemaRegistry: schemaRegistryHealth
        }
      });
    }
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Liveness probe endpoint for Kubernetes to determine if the service is running
 */
export const getLiveness = (req: Request, res: Response, next: NextFunction): void => {
  // Log the liveness probe request
  logger.info('Liveness probe requested');

  try {
    // Return 200 OK to indicate the service is running
    res.status(StatusCodes.OK).send('OK');
  } catch (error: any) {
    // Handle any errors with the next function
    next(error);
  }
};

/**
 * Helper function to check the health of the Kafka service
 */
async function checkKafkaHealth(kafkaService: KafkaService): Promise<object> {
  try {
    // Check if Kafka service instance is provided
    if (!kafkaService) {
      return { status: 'ERROR', message: 'Kafka service instance is not provided' };
    }

    // Check if Kafka service is initialized
    if (!kafkaService['isInitialized']) {
      return { status: 'ERROR', message: 'Kafka service is not initialized' };
    }

    // Check if Kafka service is connected to brokers
    if (!kafkaService['isConnected']) {
      return { status: 'ERROR', message: 'Kafka service is not connected to brokers' };
    }

    // Return health status object with status and details
    return { status: 'OK', message: 'Kafka service is running', details: { brokers: 'Connected' } };
  } catch (error: any) {
    // Handle any errors and return error status
    logger.error('Kafka health check failed', { error: error.message });
    return { status: 'ERROR', message: 'Kafka health check failed', details: { error: error.message } };
  }
}

/**
 * Helper function to check the health of the Schema Registry service
 */
async function checkSchemaRegistryHealth(schemaRegistryService: SchemaRegistryService): Promise<object> {
  try {
    // Check if Schema Registry service instance is provided
    if (!schemaRegistryService) {
      return { status: 'OK', message: 'Schema Registry is disabled' };
    }

    // Check if Schema Registry is enabled in configuration
    if (!schemaRegistryService['isEnabled']) {
      return { status: 'OK', message: 'Schema Registry is disabled' };
    }

    // Check if Schema Registry is functioning properly
    if (!schemaRegistryService['schemaRegistry']) {
      return { status: 'ERROR', message: 'Schema Registry client is not initialized' };
    }

    // Return health status object with status and details
    return { status: 'OK', message: 'Schema Registry is enabled and running' };
  } catch (error: any) {
    // Handle any errors and return error status
    logger.error('Schema Registry health check failed', { error: error.message });
    return { status: 'ERROR', message: 'Schema Registry health check failed', details: { error: error.message } };
  }
}