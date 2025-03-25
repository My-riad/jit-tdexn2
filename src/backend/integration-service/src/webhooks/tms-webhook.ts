import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0

import {
  TmsProviderType,
  TmsService,
} from '../services/tms.service';
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
import {
  EventTypes,
  EventCategories,
} from '../../../common/constants/event-types';
import { Event } from '../../../common/interfaces/event.interface';
import { KafkaService } from '../../../event-bus/src/services/kafka.service';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';
import { tmsConfig, integrationConfig } from '../config';

/**
 * Handles incoming webhooks from McLeod TMS provider
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const handleMcLeodWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract the McLeod signature from the request headers
    const mcleodSignature = req.headers['x-mcleod-signature'] as string;

    // LD1: Get the raw request body as a string
    const rawBody = JSON.stringify(req.body);

    // LD1: Log the receipt of a McLeod webhook event
    logger.info('Received McLeod webhook event', {
      mcleodSignature,
      body: rawBody,
    });

    // LD1: Validate the webhook signature using McLeodProvider
    const mcleodProvider = new McLeodProvider({} as any); // Provide a dummy connection object
    const isValidSignature = await mcleodProvider.validateWebhookSignature(rawBody, mcleodSignature, integrationConfig.webhookSecret);

    if (!isValidSignature) {
      // LD1: Throw an error if the signature is invalid
      logger.error('Invalid McLeod webhook signature');
      throw new AppError('Invalid McLeod webhook signature', { code: ErrorCodes.AUTH_INVALID_TOKEN, statusCode: StatusCodes.UNAUTHORIZED });
    }

    // LD1: Extract the connection ID from the webhook payload
    const connectionId = req.body.connectionId;

    // LD1: Get the TMS connection using TmsService
    const tmsService = new TmsService();
    const tmsConnection = await tmsService.getConnection(connectionId);

    // LD1: Process the webhook event based on its type (load created, load updated, etc.)
    const eventType = req.body.eventType;
    let loadData: Load;

    const kafkaService = new KafkaService();

    switch (eventType) {
      case 'load.created':
        // LD1: For load creation events, extract the load data and publish a LOAD_CREATED event
        loadData = req.body.load;
        await publishLoadCreatedEvent(loadData, kafkaService);
        break;
      case 'load.updated':
        // LD1: For load update events, extract the load data and publish a LOAD_UPDATED event
        loadData = req.body.load;
        await publishLoadUpdatedEvent(loadData, kafkaService);
        break;
      case 'load.status_changed':
        // LD1: For load status change events, extract the status data and publish a LOAD_STATUS_CHANGED event
        const loadId = req.body.loadId;
        const status = req.body.status as LoadStatus;
        await publishLoadStatusChangedEvent(loadId, status, kafkaService);
        break;
      default:
        // LD1: Log a warning for unknown event types
        logger.warn('Unknown McLeod webhook event type', { eventType });
    }

    // LD1: Update the TMS connection's last_sync_at timestamp
    tmsConnection.settings.last_sync_at = new Date();
    await tmsService.updateConnection(connectionId, tmsConnection.settings);

    // LD1: Return a 200 OK response to acknowledge receipt
    res.status(StatusCodes.OK).send({ message: 'McLeod webhook received and processed successfully' });
  } catch (error) {
    // LD1: Handle any errors and pass them to the next middleware
    logger.error('Error handling McLeod webhook', { error });
    next(error);
  }
};

/**
 * Handles incoming webhooks from TMW TMS provider
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const handleTmwWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract the TMW signature from the request headers
    const tmwSignature = req.headers['x-tmw-signature'] as string;

    // LD1: Get the raw request body as a string
    const rawBody = JSON.stringify(req.body);

    // LD1: Log the receipt of a TMW webhook event
    logger.info('Received TMW webhook event', {
      tmwSignature,
      body: rawBody,
    });

    // LD1: Validate the webhook signature using TmwProvider
    const tmwProvider = new TmwProvider({} as any); // Provide a dummy connection object
    const isValidSignature = await tmwProvider.validateWebhookSignature(rawBody, tmwSignature, integrationConfig.webhookSecret);

    if (!isValidSignature) {
      // LD1: Throw an error if the signature is invalid
      logger.error('Invalid TMW webhook signature');
      throw new AppError('Invalid TMW webhook signature', { code: ErrorCodes.AUTH_INVALID_TOKEN, statusCode: StatusCodes.UNAUTHORIZED });
    }

    // LD1: Extract the connection ID from the webhook payload
    const connectionId = req.body.connectionId;

    // LD1: Get the TMS connection using TmsService
    const tmsService = new TmsService();
    const tmsConnection = await tmsService.getConnection(connectionId);

    // LD1: Process the webhook event based on its type (load created, load updated, etc.)
    const eventType = req.body.eventType;
    let loadData: Load;

    const kafkaService = new KafkaService();

    switch (eventType) {
      case 'load.created':
        // LD1: For load creation events, extract the load data and publish a LOAD_CREATED event
        loadData = req.body.load;
        await publishLoadCreatedEvent(loadData, kafkaService);
        break;
      case 'load.updated':
        // LD1: For load update events, extract the load data and publish a LOAD_UPDATED event
        loadData = req.body.load;
        await publishLoadUpdatedEvent(loadData, kafkaService);
        break;
      case 'load.status_changed':
        // LD1: For load status change events, extract the status data and publish a LOAD_STATUS_CHANGED event
        const loadId = req.body.loadId;
        const status = req.body.status as LoadStatus;
        await publishLoadStatusChangedEvent(loadId, status, kafkaService);
        break;
      default:
        // LD1: Log a warning for unknown event types
        logger.warn('Unknown TMW webhook event type', { eventType });
    }

    // LD1: Update the TMS connection's last_sync_at timestamp
    tmsConnection.settings.last_sync_at = new Date();
    await tmsService.updateConnection(connectionId, tmsConnection.settings);

    // LD1: Return a 200 OK response to acknowledge receipt
    res.status(StatusCodes.OK).send({ message: 'TMW webhook received and processed successfully' });
  } catch (error) {
    // LD1: Handle any errors and pass them to the next middleware
    logger.error('Error handling TMW webhook', { error });
    next(error);
  }
};

/**
 * Handles incoming webhooks from MercuryGate TMS provider
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 */
export const handleMercuryGateWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract the MercuryGate signature from the request headers
    const mercuryGateSignature = req.headers['x-mercurygate-signature'] as string;

    // LD1: Get the raw request body as a string
    const rawBody = JSON.stringify(req.body);

    // LD1: Log the receipt of a MercuryGate webhook event
    logger.info('Received MercuryGate webhook event', {
      mercuryGateSignature,
      body: rawBody,
    });

    // LD1: Validate the webhook signature using MercuryGateProvider
    const mercuryGateProvider = new MercuryGateProvider({} as any); // Provide a dummy connection object
    const isValidSignature = await mercuryGateProvider.validateWebhookSignature(rawBody, mercuryGateSignature, integrationConfig.webhookSecret);

    if (!isValidSignature) {
      // LD1: Throw an error if the signature is invalid
      logger.error('Invalid MercuryGate webhook signature');
      throw new AppError('Invalid MercuryGate webhook signature', { code: ErrorCodes.AUTH_INVALID_TOKEN, statusCode: StatusCodes.UNAUTHORIZED });
    }

    // LD1: Extract the connection ID from the webhook payload
    const connectionId = req.body.connectionId;

    // LD1: Get the TMS connection using TmsService
    const tmsService = new TmsService();
    const tmsConnection = await tmsService.getConnection(connectionId);

    // LD1: Process the webhook event based on its type (load created, load updated, etc.)
    const eventType = req.body.eventType;
    let loadData: Load;

    const kafkaService = new KafkaService();

    switch (eventType) {
      case 'load.created':
        // LD1: For load creation events, extract the load data and publish a LOAD_CREATED event
        loadData = req.body.load;
        await publishLoadCreatedEvent(loadData, kafkaService);
        break;
      case 'load.updated':
        // LD1: For load update events, extract the load data and publish a LOAD_UPDATED event
        loadData = req.body.load;
        await publishLoadUpdatedEvent(loadData, kafkaService);
        break;
      case 'load.status_changed':
        // LD1: For load status change events, extract the status data and publish a LOAD_STATUS_CHANGED event
        const loadId = req.body.loadId;
        const status = req.body.status as LoadStatus;
        await publishLoadStatusChangedEvent(loadId, status, kafkaService);
        break;
      default:
        // LD1: Log a warning for unknown event types
        logger.warn('Unknown MercuryGate webhook event type', { eventType });
    }

    // LD1: Update the TMS connection's last_sync_at timestamp
    tmsConnection.settings.last_sync_at = new Date();
    await tmsService.updateConnection(connectionId, tmsConnection.settings);

    // LD1: Return a 200 OK response to acknowledge receipt
    res.status(StatusCodes.OK).send({ message: 'MercuryGate webhook received and processed successfully' });
  } catch (error) {
    // LD1: Handle any errors and pass them to the next middleware
    logger.error('Error handling MercuryGate webhook', { error });
    next(error);
  }
};

/**
 * Publishes a load creation event to the event bus
 * @param loadData The load data to include in the event
 * @param kafkaService The Kafka service to use for publishing the event
 */
async function publishLoadCreatedEvent(loadData: Load, kafkaService: KafkaService): Promise<void> {
  // LD1: Create an event with the event type LOAD_CREATED
  const event: Event = {
    metadata: {
      event_id: uuidv4(),
      event_type: EventTypes.LOAD_CREATED,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'integration-service',
      correlation_id: uuidv4(),
      category: EventCategories.LOAD,
    },
    payload: loadData,
  };

  // LD1: Publish the event using the Kafka service
  await kafkaService.produceEvent(event);

  // LD1: Log the successful event publication
  logger.info('Published LOAD_CREATED event', { loadId: loadData.load_id, eventId: event.metadata.event_id });
}

/**
 * Publishes a load update event to the event bus
 * @param loadData The load data to include in the event
 * @param kafkaService The Kafka service to use for publishing the event
 */
async function publishLoadUpdatedEvent(loadData: Load, kafkaService: KafkaService): Promise<void> {
  // LD1: Create an event with the event type LOAD_UPDATED
  const event: Event = {
    metadata: {
      event_id: uuidv4(),
      event_type: EventTypes.LOAD_UPDATED,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'integration-service',
      correlation_id: uuidv4(),
      category: EventCategories.LOAD,
    },
    payload: loadData,
  };

  // LD1: Publish the event using the Kafka service
  await kafkaService.produceEvent(event);

  // LD1: Log the successful event publication
  logger.info('Published LOAD_UPDATED event', { loadId: loadData.load_id, eventId: event.metadata.event_id });
}

/**
 * Publishes a load status change event to the event bus
 * @param loadId The ID of the load
 * @param status The new status of the load
 * @param kafkaService The Kafka service to use for publishing the event
 */
async function publishLoadStatusChangedEvent(loadId: string, status: LoadStatus, kafkaService: KafkaService): Promise<void> {
  // LD1: Create an event with the event type LOAD_STATUS_CHANGED
  const event: Event = {
    metadata: {
      event_id: uuidv4(),
      event_type: EventTypes.LOAD_STATUS_CHANGED,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'integration-service',
      correlation_id: uuidv4(),
      category: EventCategories.LOAD,
    },
    payload: {
      load_id: loadId,
      status: status,
    },
  };

  // LD1: Publish the event using the Kafka service
  await kafkaService.produceEvent(event);

  // LD1: Log the successful event publication
  logger.info('Published LOAD_STATUS_CHANGED event', { loadId: loadId, status: status, eventId: event.metadata.event_id });
}

/**
 * Publishes a generic TMS data received event to the event bus
 * @param connectionId The ID of the TMS connection
 * @param providerType The type of the TMS provider
 * @param rawData The raw data received from the TMS
 * @param kafkaService The Kafka service to use for publishing the event
 */
async function publishTmsDataEvent(connectionId: string, providerType: TmsProviderType, rawData: object, kafkaService: KafkaService): Promise<void> {
  // LD1: Create an event with the event type TMS_DATA_RECEIVED
  const event: Event = {
    metadata: {
      event_id: uuidv4(),
      event_type: EventTypes.TMS_DATA_RECEIVED,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'integration-service',
      correlation_id: uuidv4(),
      category: EventCategories.INTEGRATION,
    },
    payload: {
      connection_id: connectionId,
      provider_type: providerType,
      raw_data: sanitizeTmsData(rawData),
    },
  };

  // LD1: Publish the event using the Kafka service
  await kafkaService.produceEvent(event);

  // LD1: Log the successful event publication
  logger.info('Published TMS_DATA_RECEIVED event', { connectionId: connectionId, providerType: providerType, eventId: event.metadata.event_id });
}

/**
 * Sanitizes TMS data to remove sensitive information before logging or publishing
 * @param tmsData The TMS data to sanitize
 * @returns Sanitized TMS data object
 */
function sanitizeTmsData(tmsData: object): object {
  // LD1: Create a deep copy of the TMS data
  const sanitizedData = JSON.parse(JSON.stringify(tmsData));

  // LD1: Remove any sensitive fields like authentication tokens or credentials
  delete sanitizedData['auth_token'];
  delete sanitizedData['password'];
  delete sanitizedData['api_key'];

  // LD1: Remove any personally identifiable information not needed for processing
  delete sanitizedData['driver_name'];
  delete sanitizedData['driver_phone'];

  // LD1: Return the sanitized data object
  return sanitizedData;
}

/**
 * Triggers a data synchronization after receiving a webhook
 * @param connectionId The ID of the TMS connection
 * @param tmsService The TMS service to use for triggering the sync
 */
async function triggerSyncAfterWebhook(connectionId: string, tmsService: TmsService): Promise<void> {
  // LD1: Create a sync request with the connection ID
  const syncRequest = {
    connection_id: connectionId,
    force: false, // LD1: Set the force flag to false to respect rate limits
  };

  // LD1: Determine which entity types to sync based on the webhook event
  // For example, if the webhook is for a load update, only sync loads
  // This is a placeholder and should be adjusted based on your specific needs

  // LD1: Call the TMS service's syncData method with the request
  logger.info('Triggering TMS data sync after webhook', { connectionId });
  await tmsService.syncData(syncRequest);

  // LD1: Log the sync initiation
  logger.info('TMS data sync initiated after webhook', { connectionId });
}