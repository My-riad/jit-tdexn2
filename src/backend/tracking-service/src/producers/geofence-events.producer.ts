import { v4 as uuidv4 } from 'uuid'; // package_version: ^9.0.0
import { GeofenceEventModel } from '../models/geofence-event.model';
import { GeofenceModel } from '../models/geofence.model';
import KafkaService from '../../../event-bus/src/services/kafka.service';
import { EventProducer, GeofenceEvent } from '../../../common/interfaces/event.interface';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import logger from '../../../common/utils/logger';

/**
 * Interface defining the structure of geofence event payloads
 */
interface GeofenceEventPayload {
  geofence_id: string;
  entity_id: string;
  entity_type: string;
  event_type: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  geofence_name?: string;
  geofence_type?: string;
  metadata?: object;
}

/**
 * Producer for geofence events that publishes to the Kafka event bus
 */
export class GeofenceEventsProducer implements EventProducer {
  private kafkaService: KafkaService;
  private isInitialized: boolean;

  /**
   * Creates a new GeofenceEventsProducer instance
   * @param kafkaService The Kafka service instance for event production
   */
  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService; // Store the Kafka service instance for event production
    this.isInitialized = false; // Set isInitialized to false initially
  }

  /**
   * Initializes the producer by ensuring the Kafka service is ready
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Check if the Kafka service is available
    if (!this.kafkaService) {
      throw new Error('Kafka service is not available.');
    }

    // Initialize the Kafka service if needed
    await this.kafkaService.initialize();

    this.isInitialized = true; // Set isInitialized to true
    logger.info('GeofenceEventsProducer initialized successfully.'); // Log successful initialization
  }

  /**
   * Produces a geofence event to the Kafka event bus
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  async produceEvent(event: GeofenceEvent): Promise<void> {
    // Check if the producer is initialized, throw error if not
    if (!this.isInitialized) {
      throw new Error('GeofenceEventsProducer is not initialized. Call initialize() first.');
    }

    // Validate the event has required fields
    if (!event || !event.metadata || !event.payload) {
      throw new Error('Invalid geofence event format. Event must have metadata and payload.');
    }

    // Send the event to Kafka using the Kafka service
    await this.kafkaService.produceEvent(event);

    logger.info(`Geofence event produced: ${event.metadata.event_type}`, { eventId: event.metadata.event_id }); // Log successful event production
  }

  /**
   * Creates and publishes a geofence event based on a GeofenceEventModel
   * @param geofenceEvent The GeofenceEventModel to publish
   * @returns Promise that resolves when the event is published
   */
  async publishGeofenceEvent(geofenceEvent: GeofenceEventModel): Promise<void> {
    // Convert the GeofenceEventModel to an event payload using toEventPayload
    const eventPayload = geofenceEvent.toEventPayload();

    // Create event metadata with UUID, timestamp, event type, etc.
    const eventMetadata = this.createEventMetadata(eventPayload.event_type);

    // Create the complete event object with metadata and payload
    const event: GeofenceEvent = {
      metadata: eventMetadata,
      payload: eventPayload
    };

    // Produce the event using produceEvent method
    await this.produceEvent(event);

    logger.info(`Geofence event published: ${event.metadata.event_type}`, { eventId: event.metadata.event_id }); // Log successful event publication
  }

  /**
   * Publishes a geofence entered event
   * @param geofenceEvent The GeofenceEventModel for the entered event
   * @returns Promise that resolves when the event is published
   */
  async publishGeofenceEnteredEvent(geofenceEvent: GeofenceEventModel): Promise<void> {
    // Validate the geofence event is an ENTER type
    if (geofenceEvent.event_type !== 'enter') {
      throw new Error('Invalid event type. Expected "enter" for publishGeofenceEnteredEvent.');
    }

    // Create event metadata with GEOFENCE_ENTERED event type
    const eventMetadata = this.createEventMetadata(EventTypes.GEOFENCE_ENTERED);

    // Create the complete event object with metadata and payload
    const event: GeofenceEvent = {
      metadata: eventMetadata,
      payload: geofenceEvent.toEventPayload()
    };

    // Produce the event using produceEvent method
    await this.produceEvent(event);

    logger.info(`Geofence entered event published: ${event.metadata.event_type}`, { eventId: event.metadata.event_id }); // Log successful event publication
  }

  /**
   * Publishes a geofence exited event
   * @param geofenceEvent The GeofenceEventModel for the exited event
   * @returns Promise that resolves when the event is published
   */
  async publishGeofenceExitedEvent(geofenceEvent: GeofenceEventModel): Promise<void> {
    // Validate the geofence event is an EXIT type
    if (geofenceEvent.event_type !== 'exit') {
      throw new Error('Invalid event type. Expected "exit" for publishGeofenceExitedEvent.');
    }

    // Create event metadata with GEOFENCE_EXITED event type
    const eventMetadata = this.createEventMetadata(EventTypes.GEOFENCE_EXITED);

    // Create the complete event object with metadata and payload
    const event: GeofenceEvent = {
      metadata: eventMetadata,
      payload: geofenceEvent.toEventPayload()
    };

    // Produce the event using produceEvent method
    await this.produceEvent(event);

    logger.info(`Geofence exited event published: ${event.metadata.event_type}`, { eventId: event.metadata.event_id }); // Log successful event publication
  }

  /**
   * Creates standardized event metadata for geofence events
   * @param eventType The event type
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: string): any {
    // Generate a unique event ID using UUID
    const eventId = uuidv4();

    // Set the event version to current version
    const eventVersion = '1.0';

    // Set the event time to current timestamp in ISO format
    const eventTime = new Date().toISOString();

    // Set the producer to 'tracking-service'
    const producer = 'tracking-service';

    // Generate a correlation ID using UUID
    const correlationId = uuidv4();

    // Set the category to GEOFENCE
    const category = EventCategories.GEOFENCE;

    // Return the complete metadata object
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: eventVersion,
      event_time: eventTime,
      producer: producer,
      correlation_id: correlationId,
      category: category
    };
  }

  /**
   * Gracefully shuts down the producer
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    this.isInitialized = false; // Set isInitialized to false
    logger.info('GeofenceEventsProducer shut down successfully.'); // Log successful shutdown
  }
}