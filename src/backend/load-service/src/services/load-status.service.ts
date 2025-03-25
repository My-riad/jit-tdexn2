import { LoadStatus, LoadStatusUpdateParams } from '../../../common/interfaces/load.interface'; // version: 1.0
import { LoadStatusModel } from '../models/load-status.model'; // version: 1.0
import { LoadModel } from '../models/load.model'; // version: 1.0
import LoadEventsProducer from '../producers/load-events.producer'; // version: 1.0
import logger from '../../../common/utils/logger'; // version: 1.0
import { AppError } from '../../../common/utils/error-handler'; // version: 1.0
import { ErrorCodes } from '../../../common/constants/error-codes'; // version: 1.0
import { EventTypes } from '../../../common/constants/event-types'; // version: 1.0

/**
 * Service class that provides business logic for load status management operations
 */
export class LoadStatusService {
  /**
   * Creates a new LoadStatusService instance
   * @param eventsProducer The LoadEventsProducer instance
   */
  constructor(private eventsProducer: LoadEventsProducer) {
    // Store the provided events producer instance
    this.eventsProducer = eventsProducer;
  }

  /**
   * Retrieves the complete status history for a load
   * @param loadId The ID of the load to retrieve status history for
   * @returns Promise<any[]>: Array of status history records
   */
  async getStatusHistory(loadId: string): Promise<any[]> {
    try {
      // Call LoadStatusModel.getByLoadId with the provided load ID
      const statusHistory = await LoadStatusModel.getByLoadId(loadId);
      // Return the array of status history records
      return statusHistory;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving status history for load ${loadId}`, { error: error.message });
      throw new AppError(`Error retrieving status history for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId } });
    }
  }

  /**
   * Retrieves a chronological timeline of status changes for a load
   * @param loadId The ID of the load to get status timeline for
   * @returns Promise<any[]>: Chronologically ordered array of status records
   */
  async getStatusTimeline(loadId: string): Promise<any[]> {
    try {
      // Call LoadStatusModel.getStatusTimeline with the provided load ID
      const statusTimeline = await LoadStatusModel.getStatusTimeline(loadId);
      // Return the ordered array of status history records
      return statusTimeline;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving status timeline for load ${loadId}`, { error: error.message });
      throw new AppError(`Error retrieving status timeline for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId } });
    }
  }

  /**
   * Retrieves the current (most recent) status for a load
   * @param loadId The ID of the load to get current status for
   * @returns Promise<LoadStatus | null>: The current status or null if no status found
   */
  async getCurrentStatus(loadId: string): Promise<LoadStatus | null> {
    try {
      // Call LoadStatusModel.getCurrentStatus with the provided load ID
      const currentStatus = await LoadStatusModel.getCurrentStatus(loadId);
      // Return the current status or null if not found
      return currentStatus;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving current status for load ${loadId}`, { error: error.message });
      throw new AppError(`Error retrieving current status for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId } });
    }
  }

  /**
   * Updates the status of a load and creates a status history record
   * @param loadId The ID of the load to update
   * @param statusData The status update data
   * @returns Promise<any>: The updated load with new status
   */
  async updateStatus(loadId: string, statusData: LoadStatusUpdateParams): Promise<any> {
    try {
      // Get the current load to check its status
      const load = await LoadModel.get(loadId);

      // If load not found, throw NOT_FOUND error
      if (!load) {
        logger.warn(`Load with ID ${loadId} not found`);
        throw new AppError(`Load with ID ${loadId} not found`, { code: ErrorCodes.NOT_FOUND, details: { loadId } });
      }

      // Verify the status transition is valid using validateStatusTransition
      if (!this.validateStatusTransition(load.status, statusData.status)) {
        logger.warn(`Invalid status transition from ${load.status} to ${statusData.status} for load ${loadId}`);
        throw new AppError(`Invalid status transition from ${load.status} to ${statusData.status}`, { code: ErrorCodes.INVALID_STATUS_TRANSITION, details: { loadId, currentStatus: load.status, newStatus: statusData.status } });
      }

      // Call LoadModel.updateStatus to update the load's status
      const updatedLoad = await LoadModel.updateStatus(loadId, statusData);

      // Check if the load was actually updated
      if (!updatedLoad) {
        logger.error(`Failed to update status for load ${loadId}`);
        throw new AppError(`Failed to update status for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId } });
      }

      // Create a new status history record using LoadStatusModel.create
      await LoadStatusModel.create({
        load_id: loadId,
        status: statusData.status,
        status_details: statusData.status_details,
        latitude: statusData.latitude,
        longitude: statusData.longitude,
        updated_by: statusData.updated_by
      });

      // Publish a load status changed event using the events producer
      await this.eventsProducer.createLoadStatusChangedEvent(
        updatedLoad,
        load.status,
        statusData.status_details || {}
      );

      // Return the updated load
      return updatedLoad;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating status for load ${loadId}`, { error: error.message, statusData });
      if (error instanceof AppError) {
        throw error; // Re-throw the AppError to preserve its properties
      }
      throw new AppError(`Error updating status for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId, statusData } });
    }
  }

  /**
   * Validates if a status transition is allowed based on the state machine
   * @param currentStatus The current status of the load
   * @param newStatus The proposed new status
   * @returns boolean: True if the transition is valid, false otherwise
   */
  validateStatusTransition(currentStatus: LoadStatus, newStatus: LoadStatus): boolean {
    // Call LoadModel.isValidStatusTransition with current and new status
    const isValid = LoadModel.isValidStatusTransition(currentStatus, newStatus);

    // Log validation result for debugging purposes
    logger.debug(`Validating status transition from ${currentStatus} to ${newStatus}: ${isValid}`);

    // Return the validation result (true/false)
    return isValid;
  }

  /**
   * Gets counts of loads by status for analytics
   * @param filterOptions Optional filtering criteria
   * @returns Promise<Record<LoadStatus, number>>: Object with status counts
   */
  async getStatusCounts(filterOptions?: object): Promise<Record<LoadStatus, number>> {
    try {
      // Call LoadStatusModel.getStatusCounts with the optional filter options
      const statusCounts = await LoadStatusModel.getStatusCounts(filterOptions);
      // Return an object with status types as keys and counts as values
      return statusCounts;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error('Error getting load status counts', { error: error.message, filterOptions });
      throw new AppError('Error getting load status counts', { code: ErrorCodes.DATABASE_ERROR, details: { filterOptions } });
    }
  }

  /**
   * Returns the rules for valid status transitions in the state machine
   * @returns Record<LoadStatus, LoadStatus[]>: Map of current statuses to arrays of valid next statuses
   */
  getStatusTransitionRules(): Record<LoadStatus, LoadStatus[]> {
    // Define and return the state machine rules as a mapping
    const rules: Record<LoadStatus, LoadStatus[]> = {
      [LoadStatus.CREATED]: [LoadStatus.PENDING, LoadStatus.CANCELLED],
      [LoadStatus.PENDING]: [LoadStatus.OPTIMIZING, LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.OPTIMIZING]: [LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.AVAILABLE]: [LoadStatus.RESERVED, LoadStatus.CANCELLED, LoadStatus.EXPIRED],
      [LoadStatus.RESERVED]: [LoadStatus.ASSIGNED, LoadStatus.AVAILABLE, LoadStatus.CANCELLED],
      [LoadStatus.ASSIGNED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.IN_TRANSIT]: [LoadStatus.AT_PICKUP, LoadStatus.DELAYED, LoadStatus.CANCELLED],
      [LoadStatus.AT_PICKUP]: [LoadStatus.LOADED, LoadStatus.EXCEPTION, LoadStatus.CANCELLED],
      [LoadStatus.LOADED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.DELAYED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
      [LoadStatus.EXCEPTION]: [LoadStatus.RESOLVED, LoadStatus.CANCELLED],
      [LoadStatus.RESOLVED]: [LoadStatus.AT_PICKUP, LoadStatus.AT_DROPOFF, LoadStatus.CANCELLED],
      [LoadStatus.AT_DROPOFF]: [LoadStatus.DELIVERED, LoadStatus.EXCEPTION, LoadStatus.CANCELLED],
      [LoadStatus.DELIVERED]: [LoadStatus.COMPLETED, LoadStatus.EXCEPTION],
      [LoadStatus.COMPLETED]: [],
      [LoadStatus.CANCELLED]: [],
      [LoadStatus.EXPIRED]: [LoadStatus.AVAILABLE]
    };

    // For each status, list the valid next statuses it can transition to
    // This provides a reference for the status workflow
    return rules;
  }

  /**
   * Deletes all status history records for a load
   * @param loadId The ID of the load to delete status history for
   * @returns Promise<number>: Number of status records deleted
   */
  async deleteStatusHistory(loadId: string): Promise<number> {
    try {
      // Call LoadStatusModel.deleteByLoadId with the provided load ID
      const deletedCount = await LoadStatusModel.deleteByLoadId(loadId);
      // Return the number of records deleted
      return deletedCount;
    } catch (error: any) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error deleting status history for load ${loadId}`, { error: error.message });
      throw new AppError(`Error deleting status history for load ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { loadId } });
    }
  }
}