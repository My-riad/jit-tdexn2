import {
  LoadStatus,
  LoadStatusUpdateParams, // Import load status enum and status update parameters interface
} from '../../../common/interfaces/load.interface';
import { updateLoadStatus } from '../../../common/api/loadApi'; // API function to update load status on the backend
import logger from '../../../common/utils/logger'; // Logging utility for operational logging and debugging
import { DriverLocationService } from './locationService'; // Service to get the current driver location for status updates
import {
  addQueuedRequest,
  getQueuedRequests,
  removeQueuedRequest, // Functions for managing offline status update requests
} from './offlineStorageService';
import NetInfo from '@react-native-community/netinfo'; // ^9.3.7 Library for monitoring network connectivity status
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0 Generate unique IDs for status update requests

// Global constants
const STATUS_UPDATE_ENDPOINT = '/api/v1/loads/:loadId/status';
const STATUS_TRANSITIONS = {
  /* mapping of valid status transitions */
};

/**
 * Validates if a status transition is allowed based on the current status
 * @param currentStatus
 * @param newStatus
 * @returns True if the transition is valid, false otherwise
 */
const validateStatusTransition = (
  currentStatus: LoadStatus,
  newStatus: LoadStatus
): boolean => {
  // Check if the current status exists in the STATUS_TRANSITIONS mapping
  if (!STATUS_TRANSITIONS[currentStatus]) {
    logger.debug(
      `validateStatusTransition: Current status ${currentStatus} not found in STATUS_TRANSITIONS.`
    );
    return false;
  }

  // If it exists, check if the new status is in the list of allowed transitions
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    logger.debug(
      `validateStatusTransition: Invalid status transition from ${currentStatus} to ${newStatus}.`
    );
    return false;
  }

  // Return true if the transition is allowed, false otherwise
  return true;
};

/**
 * Gets a list of valid next statuses based on the current status
 * @param currentStatus
 * @returns Array of valid next statuses
 */
const getNextValidStatuses = (currentStatus: LoadStatus): LoadStatus[] => {
  // Check if the current status exists in the STATUS_TRANSITIONS mapping
  if (STATUS_TRANSITIONS[currentStatus]) {
    // If it exists, return the list of allowed transitions
    logger.debug(
      `getNextValidStatuses: Returning allowed transitions for ${currentStatus}.`
    );
    return STATUS_TRANSITIONS[currentStatus];
  }

  // Otherwise, return an empty array
  logger.debug(
    `getNextValidStatuses: No allowed transitions found for ${currentStatus}.`
  );
  return [];
};

/**
 * Checks if the device is currently connected to the network
 * @returns Promise that resolves to true if connected, false otherwise
 */
const isNetworkConnected = async (): Promise<boolean> => {
  // Use NetInfo to fetch the current network state
  const netInfoState = await NetInfo.fetch();

  // Return true if the device is connected, false otherwise
  return netInfoState.isConnected === true;
};

/**
 * Processes queued status updates when the device comes back online
 * @returns Result of the synchronization process
 */
const processOfflineStatusUpdates = async (): Promise<{
  success: boolean;
  syncedCount: number;
  failedCount: number;
}> => {
  // Get all queued status update requests
  const queuedRequests = await getQueuedRequests();

  // Filter for status update requests only
  const statusUpdateRequests = queuedRequests.filter(
    (request) => request.endpoint === STATUS_UPDATE_ENDPOINT
  );

  let syncedCount = 0;
  let failedCount = 0;

  // For each request, attempt to send it to the backend
  for (const request of statusUpdateRequests) {
    try {
      // Attempt to send it to the backend
      await updateLoadStatus(request.data.loadId, request.data);

      // Remove successfully processed requests from the queue
      await removeQueuedRequest(request.id);
      syncedCount++;
    } catch (error) {
      // Track successful and failed updates
      failedCount++;
      logger.error(
        `processOfflineStatusUpdates: Failed to sync status update for request ${request.id}`,
        { error }
      );
    }
  }

  // Return the synchronization results with counts
  const syncResult = { success: failedCount === 0, syncedCount, failedCount };

  // Log the synchronization process and results
  logger.info(
    `processOfflineStatusUpdates: Synced ${syncedCount} status updates, ${failedCount} failed.`,
    syncResult
  );

  return syncResult;
};

/**
 * Service class for handling load status updates
 */
export class StatusUpdateService {
  DriverLocationService: any;
  isOnline: boolean;
  /**
   * Creates a new StatusUpdateService instance
   * @param locationService
   */
  constructor(locationService: DriverLocationService) {
    // Initialize the location service property
    this.DriverLocationService = locationService;

    // Set up network connectivity monitoring
    NetInfo.addEventListener((state) => this.handleNetworkChange(state));

    // Initialize the isOnline property based on current network state
    this.isOnline = true;
  }

  /**
   * Updates the status of a load with the current location
   * @param loadId
   * @param driverId
   * @param newStatus
   * @param statusDetails
   * @returns Result of the status update operation
   */
  async updateLoadStatus(
    loadId: string,
    driverId: string,
    newStatus: LoadStatus,
    statusDetails: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Get the current driver position from the location service
    const position = await this.DriverLocationService.getDriverPosition();

    // Create a LoadStatusUpdateParams object with the new status, details, and coordinates
    const statusUpdateParams: LoadStatusUpdateParams = {
      status: newStatus,
      statusDetails: statusDetails,
      coordinates: position
        ? { latitude: position.latitude, longitude: position.longitude }
        : undefined,
      updatedBy: driverId,
    };

    try {
      // Check if the device is online
      if (this.isOnline) {
        // If online, send the status update to the backend
        await updateLoadStatus(loadId, statusUpdateParams);
        logger.info(`updateLoadStatus: Successfully updated status to ${newStatus} for load ${loadId}`);
        return { success: true };
      } else {
        // If offline, queue the status update for later synchronization
        const { queued, id } = await addQueuedRequest(
          STATUS_UPDATE_ENDPOINT.replace(':loadId', loadId),
          'PUT',
          statusUpdateParams
        );
        logger.info(`updateLoadStatus: Queued status update for load ${loadId} (offline), requestId: ${id}`);
        return { success: queued };
      }
    } catch (error: any) {
      // Return the result of the operation
      logger.error(`updateLoadStatus: Failed to update status for load ${loadId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reports a delay in the load delivery
   * @param loadId
   * @param driverId
   * @param delayReason
   * @param additionalDetails
   * @returns Result of the delay report operation
   */
  async reportLoadDelay(
    loadId: string,
    driverId: string,
    delayReason: string,
    additionalDetails: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Get the current driver position from the location service
    const position = await this.DriverLocationService.getDriverPosition();

    // Create a LoadStatusUpdateParams object with DELAYED status, reason, and coordinates
    const statusUpdateParams: LoadStatusUpdateParams = {
      status: LoadStatus.DELAYED,
      statusDetails: { reason: delayReason, ...additionalDetails },
      coordinates: position
        ? { latitude: position.latitude, longitude: position.longitude }
        : undefined,
      updatedBy: driverId,
    };

    try {
      // Call updateLoadStatus with the delay parameters
      await updateLoadStatus(loadId, statusUpdateParams);
      logger.info(`reportLoadDelay: Successfully reported delay for load ${loadId}`);
      return { success: true };
    } catch (error: any) {
      // Return the result of the operation
      logger.error(`reportLoadDelay: Failed to report delay for load ${loadId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reports an exception or issue with the load
   * @param loadId
   * @param driverId
   * @param exceptionDetails
   * @param additionalDetails
   * @returns Result of the exception report operation
   */
  async reportLoadException(
    loadId: string,
    driverId: string,
    exceptionDetails: string,
    additionalDetails: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // Get the current driver position from the location service
    const position = await this.DriverLocationService.getDriverPosition();

    // Create a LoadStatusUpdateParams object with EXCEPTION status, details, and coordinates
    const statusUpdateParams: LoadStatusUpdateParams = {
      status: LoadStatus.EXCEPTION,
      statusDetails: { details: exceptionDetails, ...additionalDetails },
      coordinates: position
        ? { latitude: position.latitude, longitude: position.longitude }
        : undefined,
      updatedBy: driverId,
    };

    try {
      // Call updateLoadStatus with the exception parameters
      await updateLoadStatus(loadId, statusUpdateParams);
      logger.info(`reportLoadException: Successfully reported exception for load ${loadId}`);
      return { success: true };
    } catch (error: any) {
      // Return the result of the operation
      logger.error(`reportLoadException: Failed to report exception for load ${loadId}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Synchronizes offline status updates when coming back online
   * @returns Result of the synchronization process
   */
  async syncOfflineUpdates(): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
  }> {
    // Check if the device is currently online
    if (this.isOnline) {
      // If online, call processOfflineStatusUpdates to sync queued updates
      const syncResult = await processOfflineStatusUpdates();

      // Log the synchronization attempt and result
      logger.info(
        `syncOfflineUpdates: Attempted to sync offline updates.`,
        syncResult
      );

      // Return the result of the synchronization
      return syncResult;
    } else {
      logger.info(`syncOfflineUpdates: Device is offline, skipping sync.`);
      return { success: false, syncedCount: 0, failedCount: 0 };
    }
  }

  /**
   * Handles changes in network connectivity
   * @param state
   */
  handleNetworkChange(state: any): void {
    // Update the isOnline property based on the network state
    this.isOnline = state.isConnected === true;

    // If coming back online, attempt to sync offline updates
    if (this.isOnline) {
      this.syncOfflineUpdates();
    }

    // Log the network state change
    logger.info(`handleNetworkChange: Network state changed: ${this.isOnline ? 'Online' : 'Offline'}`);
  }
}

// Export the StatusUpdateService class
export { StatusUpdateService };

// Export the validateStatusTransition function
export { validateStatusTransition };

// Export the getNextValidStatuses function
export { getNextValidStatuses };