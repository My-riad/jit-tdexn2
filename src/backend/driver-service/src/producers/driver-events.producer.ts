import { v4 as uuidv4 } from 'uuid'; // uuid@^9.0.0
import {
  EventProducer,
  Event,
  DriverEvent,
} from '../../../common/interfaces/event.interface';
import {
  EventTypes,
  EventCategories,
} from '../../../common/constants/event-types';
import { Driver, DriverStatus, HOSStatus } from '../../../common/interfaces/driver.interface';
import KafkaService from '../../../event-bus/src/services/kafka.service';
import logger from '../../../common/utils/logger';

/**
 * Producer service for driver-related events
 */
export class DriverEventsProducer implements EventProducer {
  private readonly serviceName: string = 'driver-service';

  /**
   * Creates a new DriverEventsProducer instance
   * @param kafkaService The KafkaService instance
   */
  constructor(private kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
  }

  /**
   * Produces a DRIVER_CREATED event
   * @param driver The driver data
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverCreatedEvent(driver: Driver): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_CREATED);

      // Create event payload
      const payload = {
        driver_id: driver.driver_id,
        user_id: driver.user_id,
        carrier_id: driver.carrier_id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        license_state: driver.license_state,
        license_class: driver.license_class,
        license_endorsements: driver.license_endorsements,
        license_expiration: driver.license_expiration,
        status: driver.status,
        created_at: driver.created_at,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_CREATED event for driver ${driver.driver_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_CREATED event for driver ${driver.driver_id}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_UPDATED event
   * @param driver The driver data
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverUpdatedEvent(driver: Driver): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_UPDATED);

      // Create event payload
      const payload = {
        driver_id: driver.driver_id,
        user_id: driver.user_id,
        carrier_id: driver.carrier_id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        license_state: driver.license_state,
        license_class: driver.license_class,
        license_endorsements: driver.license_endorsements,
        license_expiration: driver.license_expiration,
        status: driver.status,
        updated_at: driver.updated_at,
        updated_fields: [], // TODO: Implement logic to track updated fields
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_UPDATED event for driver ${driver.driver_id}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_UPDATED event for driver ${driver.driver_id}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_DELETED event
   * @param driverId The ID of the deleted driver
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverDeletedEvent(driverId: string): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_DELETED);

      // Create event payload
      const payload = {
        driver_id: driverId,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_DELETED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_DELETED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_STATUS_CHANGED event
   * @param driverId The ID of the driver
   * @param status The new status of the driver
   * @param previousStatus The previous status of the driver
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverStatusChangedEvent(
    driverId: string,
    status: DriverStatus,
    previousStatus: DriverStatus
  ): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_STATUS_CHANGED);

      // Create event payload
      const payload = {
        driver_id: driverId,
        previous_status: previousStatus,
        new_status: status,
        timestamp: new Date().toISOString(),
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_STATUS_CHANGED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_STATUS_CHANGED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_AVAILABILITY_CHANGED event
   * @param driverId The ID of the driver
   * @param isAvailable Whether the driver is available
   * @param availabilityDetails Additional availability details
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverAvailabilityChangedEvent(
    driverId: string,
    isAvailable: boolean,
    availabilityDetails: object
  ): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_AVAILABILITY_CHANGED);

      // Create event payload
      const payload = {
        driver_id: driverId,
        is_available: isAvailable,
        availability_details: availabilityDetails,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_AVAILABILITY_CHANGED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_AVAILABILITY_CHANGED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_HOS_UPDATED event
   * @param driverId The ID of the driver
   * @param hosStatus The new HOS status of the driver
   * @param hosDetails Additional HOS details
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverHOSUpdatedEvent(
    driverId: string,
    hosStatus: HOSStatus,
    hosDetails: object
  ): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_HOS_UPDATED);

      // Create event payload
      const payload = {
        driver_id: driverId,
        hos_status: hosStatus,
        hos_details: hosDetails,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_HOS_UPDATED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_HOS_UPDATED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_LOCATION_UPDATED event
   * @param driverId The ID of the driver
   * @param location The new location of the driver
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverLocationUpdatedEvent(
    driverId: string,
    location: object
  ): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_LOCATION_UPDATED);

      // Create event payload
      const payload = {
        driver_id: driverId,
        location: location,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_LOCATION_UPDATED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_LOCATION_UPDATED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Produces a DRIVER_SCORE_UPDATED event
   * @param driverId The ID of the driver
   * @param score The new score of the driver
   * @param scoreDetails Additional score details
   * @returns Promise that resolves when the event is produced
   */
  async produceDriverScoreUpdatedEvent(
    driverId: string,
    score: number,
    scoreDetails: object
  ): Promise<void> {
    try {
      // Create event metadata
      const metadata = this.createEventMetadata(EventTypes.DRIVER_SCORE_UPDATED);

      // Create event payload
      const payload = {
        driver_id: driverId,
        score: score,
        score_details: scoreDetails,
      };

      // Produce the event
      await this.produceEvent({ metadata, payload });
      logger.info(`Successfully produced DRIVER_SCORE_UPDATED event for driver ${driverId}`);
    } catch (error: any) {
      logger.error(`Failed to produce DRIVER_SCORE_UPDATED event for driver ${driverId}`, { error: error.message });
    }
  }

  /**
   * Creates standardized event metadata
   * @param eventType The type of the event
   * @returns Event metadata object
   */
  private createEventMetadata(eventType: string): object {
    const eventId = uuidv4();
    const correlationId = uuidv4();
    return {
      event_id: eventId,
      event_type: eventType,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: this.serviceName,
      correlation_id: correlationId,
      category: EventCategories.DRIVER,
    };
  }

  /**
   * Implements the EventProducer interface method to produce an event
   * @param event The event to produce
   * @returns Promise that resolves when the event is produced
   */
  async produceEvent(event: Event): Promise<void> {
    try {
      // Delegate to the KafkaService to produce the event
      await this.kafkaService.produceEvent(event);
    } catch (error: any) {
      // Handle and log any errors
      logger.error(`Failed to produce event ${event.metadata.event_id}`, { error: error.message });
      throw error; // Re-throw the error to be handled upstream
    }
  }
}