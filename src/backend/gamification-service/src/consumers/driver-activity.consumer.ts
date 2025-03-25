import { KafkaService } from '../../../event-bus/src/services/kafka.service'; // version: local
import { AchievementService } from '../services/achievement.service'; // version: local
import { ScoreService } from '../services/score.service'; // version: local
import { DriverEvent, EventConsumer } from '../../../common/interfaces/event.interface'; // version: local
import { EventTypes, EventCategories } from '../../../common/constants/event-types'; // version: local
import { Topics } from '../../../event-bus/src/config/topics'; // version: local
import { ConsumerGroups } from '../../../event-bus/src/config/consumer-groups'; // version: local
import logger from '../../../common/utils/logger'; // version: local

/**
 * Consumer class that processes driver activity events for the gamification system
 * It listens to driver-related events such as status changes, location updates, and other activities
 * to trigger achievement evaluations and update driver gamification metrics.
 */
export class DriverActivityConsumer implements EventConsumer {
  /**
   * Creates a new DriverActivityConsumer instance
   * @param {KafkaService} kafkaService - The Kafka service for consuming events
   * @param {AchievementService} achievementService - The achievement service for processing driver achievements
   * @param {ScoreService} scoreService - The score service for updating driver efficiency scores
   */
  constructor(
    private kafkaService: KafkaService,
    private achievementService: AchievementService,
    private scoreService: ScoreService
  ) {
    // Store the provided kafkaService for consuming events
    this.KafkaService = kafkaService;
    // Store the provided achievementService for processing achievements
    this.AchievementService = achievementService;
    // Store the provided scoreService for updating driver scores
    this.ScoreService = scoreService;
    // Set isInitialized to false
    this.boolean = false;
  }

  private isInitialized: boolean;
  KafkaService: KafkaService;
  AchievementService: AchievementService;
  ScoreService: ScoreService;
  boolean: boolean;

  /**
   * Initializes the consumer by registering with the Kafka service
   * @returns {Promise<void>} - Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Register a consumer for the DRIVER_EVENTS topic with the GAMIFICATION_DRIVER_ACTIVITY consumer group
    await this.kafkaService.consumeEvents(
      [Topics.DRIVER_EVENTS],
      ConsumerGroups.GAMIFICATION_DRIVER_ACTIVITY,
      {
        [EventTypes.DRIVER_STATUS_CHANGED]: this.consumeEvent.bind(this),
        [EventTypes.DRIVER_LOCATION_UPDATED]: this.consumeEvent.bind(this),
        [EventTypes.DRIVER_AVAILABILITY_CHANGED]: this.consumeEvent.bind(this),
        [EventTypes.DRIVER_HOS_UPDATED]: this.consumeEvent.bind(this),
      }
    );

    // Set isInitialized to true
    this.isInitialized = true;

    // Log successful initialization
    logger.info('DriverActivityConsumer initialized successfully.');
  }

  /**
   * Gracefully shuts down the consumer
   * @returns {Promise<void>} - Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    // Unregister the consumer from the Kafka service
    await this.kafkaService.shutdown();

    // Set isInitialized to false
    this.isInitialized = false;

    // Log successful shutdown
    logger.info('DriverActivityConsumer shut down successfully.');
  }

  /**
   * Processes a driver event received from Kafka
   * @param {DriverEvent} event - The driver event to process
   * @returns {Promise<void>} - Promise that resolves when the event is processed
   */
  async consumeEvent(event: DriverEvent): Promise<void> {
    // Log the received event
    logger.info(`Received event: ${event.metadata.event_type}`, { eventId: event.metadata.event_id, driverId: event.payload.driver_id });

    // Extract the event type from the event metadata
    const eventType = event.metadata.event_type;

    // Extract the driver_id from the event payload
    const driverId = this.extractDriverId(event);

    try {
      // Switch on the event type to process different driver activities
      switch (eventType) {
        // For DRIVER_STATUS_CHANGED events, process status changes
        case EventTypes.DRIVER_STATUS_CHANGED:
          await this.processStatusChange(event);
          break;

        // For DRIVER_LOCATION_UPDATED events, process location updates
        case EventTypes.DRIVER_LOCATION_UPDATED:
          await this.processLocationUpdate(event);
          break;

        // For DRIVER_AVAILABILITY_CHANGED events, process availability changes
        case EventTypes.DRIVER_AVAILABILITY_CHANGED:
          await this.processAvailabilityChange(event);
          break;

        // For DRIVER_HOS_UPDATED events, process hours of service updates
        case EventTypes.DRIVER_HOS_UPDATED:
          await this.processHOSUpdate(event);
          break;

        default:
          logger.warn(`Unknown event type: ${eventType}`, { eventId: event.metadata.event_id, driverId });
          break;
      }
    } catch (error: any) {
      // Handle any errors during processing
      logger.error(`Error processing event: ${eventType}`, { eventId: event.metadata.event_id, driverId, error: error.message });
    }
  }

  /**
   * Processes driver status change events
   * @param {DriverEvent} event - The driver event to process
   * @returns {Promise<void>} - Promise that resolves when the status change is processed
   */
  private async processStatusChange(event: DriverEvent): Promise<void> {
    // Extract the driver_id, previous_status, and new_status from the event payload
    const driverId = event.payload.driver_id;
    const previousStatus = event.payload.previous_status;
    const newStatus = event.payload.new_status;

    // Create an activity data object with the status change information
    const activityData = {
      previousStatus,
      newStatus,
    };

    try {
      // Call the achievementService's processDriverActivity method with the driver ID and activity data
      const achievementProgress = await this.AchievementService.processDriverActivity(driverId, activityData);

      // Log any achievements that were earned
      if (achievementProgress && achievementProgress.length > 0) {
        logger.info(`Driver ${driverId} earned new achievements`, { achievementIds: achievementProgress.map(p => p.achievementId) });
      }
    } catch (error: any) {
      logger.error(`Error processing status change for driver ${driverId}`, { driverId, error: error.message });
    }
  }

  /**
   * Processes driver location update events
   * @param {DriverEvent} event - The driver event to process
   * @returns {Promise<void>} - Promise that resolves when the location update is processed
   */
  private async processLocationUpdate(event: DriverEvent): Promise<void> {
    // Extract the driver_id, latitude, longitude, and other location data from the event payload
    const driverId = event.payload.driver_id;
    const latitude = event.payload.latitude;
    const longitude = event.payload.longitude;

    try {
      // Check if the location update is relevant for gamification (e.g., near a Smart Hub)
      const isNearHub = await this.isNearSmartHub(latitude, longitude);

      if (isNearHub) {
        // If relevant, create an activity data object with the location information
        const activityData = {
          latitude,
          longitude,
          isNearHub,
        };

        // Call the achievementService's processDriverActivity method with the driver ID and activity data
        const achievementProgress = await this.AchievementService.processDriverActivity(driverId, activityData);

        // Log any achievements that were earned
        if (achievementProgress && achievementProgress.length > 0) {
          logger.info(`Driver ${driverId} earned new achievements`, { achievementIds: achievementProgress.map(p => p.achievementId) });
        }
      }
    } catch (error: any) {
      logger.error(`Error processing location update for driver ${driverId}`, { driverId, error: error.message });
    }
  }

  /**
   * Processes driver availability change events
   * @param {DriverEvent} event - The driver event to process
   * @returns {Promise<void>} - Promise that resolves when the availability change is processed
   */
  private async processAvailabilityChange(event: DriverEvent): Promise<void> {
    // Extract the driver_id, previous_availability, and new_availability from the event payload
    const driverId = event.payload.driver_id;
    const previousAvailability = event.payload.previous_availability;
    const newAvailability = event.payload.new_availability;

    // Create an activity data object with the availability change information
    const activityData = {
      previousAvailability,
      newAvailability,
    };

    try {
      // Call the achievementService's processDriverActivity method with the driver ID and activity data
      const achievementProgress = await this.AchievementService.processDriverActivity(driverId, activityData);

      // Log any achievements that were earned
      if (achievementProgress && achievementProgress.length > 0) {
        logger.info(`Driver ${driverId} earned new achievements`, { achievementIds: achievementProgress.map(p => p.achievementId) });
      }
    } catch (error: any) {
      logger.error(`Error processing availability change for driver ${driverId}`, { driverId, error: error.message });
    }
  }

  /**
   * Processes driver hours of service update events
   * @param {DriverEvent} event - The driver event to process
   * @returns {Promise<void>} - Promise that resolves when the HOS update is processed
   */
  private async processHOSUpdate(event: DriverEvent): Promise<void> {
    // Extract the driver_id and HOS data from the event payload
    const driverId = event.payload.driver_id;
    const hosData = event.payload.hosData;

    // Create an activity data object with the HOS information
    const activityData = {
      hosData,
    };

    try {
      // Call the achievementService's processDriverActivity method with the driver ID and activity data
      const achievementProgress = await this.AchievementService.processDriverActivity(driverId, activityData);

      // Log any achievements that were earned
      if (achievementProgress && achievementProgress.length > 0) {
        logger.info(`Driver ${driverId} earned new achievements`, { achievementIds: achievementProgress.map(p => p.achievementId) });
      }
    } catch (error: any) {
      logger.error(`Error processing HOS update for driver ${driverId}`, { driverId, error: error.message });
    }
  }

  /**
   * Extracts the driver ID from an event payload
   * @param {DriverEvent} event - The driver event
   * @returns {string} - The extracted driver ID
   */
  private extractDriverId(event: DriverEvent): string {
    // Extract and return the driver_id from the event payload
    const driverId = event.payload.driver_id;

    // Throw an error if the driver_id is not present
    if (!driverId) {
      throw new Error('Driver ID is missing from event payload');
    }

    return driverId;
  }

  /**
   * Determines if a driver's location is near a Smart Hub
   * @param {number} latitude - The latitude of the driver's location
   * @param {number} longitude - The longitude of the driver's location
   * @returns {Promise<boolean>} - True if the location is near a Smart Hub, false otherwise
   */
  private async isNearSmartHub(latitude: number, longitude: number): Promise<boolean> {
    // Query for Smart Hubs near the provided coordinates
    // This is a placeholder implementation and should be replaced with a real database query
    const smartHubs = []; // await SmartHub.findNear(latitude, longitude);

    // Return true if any Smart Hub is within the threshold distance
    if (smartHubs.length > 0) {
      return true;
    }

    // Return false if no Smart Hub is nearby
    return false;
  }
}
export default DriverActivityConsumer;