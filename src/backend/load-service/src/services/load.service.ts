import Joi from 'joi'; // joi@^17.0.0
import {
  Load,
  LoadStatus,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadSearchParams,
  LoadWithDetails
} from '../../../common/interfaces/load.interface';
import { LoadModel } from '../models/load.model';
import { LoadLocationModel } from '../models/load-location.model';
import { LoadStatusModel } from '../models/load-status.model';
import { LoadDocumentModel } from '../models/load-document.model';
import {
  createLoadSchema,
  updateLoadSchema,
  updateLoadStatusSchema,
  loadSearchSchema
} from '../validators/load.validator';
import LoadEventsProducer from '../producers/load-events.producer';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';

/**
 * Service class that provides business logic for load management operations
 */
class LoadService {
  /**
   * Creates a new LoadService instance
   * @param eventsProducer - The LoadEventsProducer instance
   */
  constructor(private eventsProducer: LoadEventsProducer) {
    // Store the provided events producer instance
    this.eventsProducer = eventsProducer;
  }

  /**
   * Retrieves a load by its ID
   * @param loadId - The unique identifier of the load
   * @returns The found load or null if not found
   */
  async getLoadById(loadId: string): Promise<Load | null> {
    try {
      // Call LoadModel.get with the provided load ID
      const load = await LoadModel.get(loadId);
      // Return the found load or null if not found
      return load || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving load with ID ${loadId}`, { error });
      throw new AppError(`Error retrieving load with ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Retrieves a load with all its related details (locations, status history, documents)
   * @param loadId - The unique identifier of the load
   * @returns The load with all details or null if not found
   */
  async getLoadWithDetails(loadId: string): Promise<LoadWithDetails | null> {
    try {
      // Call LoadModel.getWithDetails with the provided load ID
      const loadWithDetails = await LoadModel.getWithDetails(loadId);
      // Return the found load with details or null if not found
      return loadWithDetails || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving load with details for load ID ${loadId}`, { error });
      throw new AppError(`Error retrieving load with details for load ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Retrieves all loads for a specific shipper with pagination
   * @param shipperId - The ID of the shipper
   * @param options - Pagination and sorting options
   * @returns Loads and total count
   */
  async getLoadsByShipperId(
    shipperId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: string;
      status?: LoadStatus[];
    } = {}
  ): Promise<{ loads: Load[]; total: number }> {
    try {
      // Call LoadModel.getByShipperId with the provided shipper ID and options
      const { loads, total } = await LoadModel.getByShipperId(shipperId, options);
      // Return the loads array and total count
      return { loads, total };
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error retrieving loads for shipper ID ${shipperId}`, { error });
      throw new AppError(`Error retrieving loads for shipper ID ${shipperId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Searches for loads based on various criteria with pagination
   * @param searchParams - Search parameters
   * @returns Matching loads and total count
   */
  async searchLoads(searchParams: LoadSearchParams): Promise<{ loads: Load[]; total: number }> {
    try {
      // Validate search parameters against loadSearchSchema
      this.validateLoadData(searchParams, loadSearchSchema);
      // Call LoadModel.search with the validated search parameters
      const { loads, total } = await LoadModel.search(searchParams);
      // Return the matching loads array and total count
      return { loads, total };
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error('Error searching loads', { error, searchParams });
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Creates a new load with associated locations
   * @param loadData - The load data to create
   * @returns The newly created load
   */
  async createLoad(loadData: LoadCreationParams): Promise<Load> {
    try {
      // Validate load data against createLoadSchema
      this.validateLoadData(loadData, createLoadSchema);
      // Call LoadModel.create with the validated load data
      const createdLoad = await LoadModel.create(loadData);
      // Publish a load created event using the events producer
      await this.eventsProducer.createLoadCreatedEvent(createdLoad);
      // Return the created load
      return createdLoad;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error('Error creating load', { error, loadData });
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Updates an existing load
   * @param loadId - The ID of the load to update
   * @param loadData - The updated load data
   * @returns The updated load or null if not found
   */
  async updateLoad(loadId: string, loadData: LoadUpdateParams): Promise<Load | null> {
    try {
      // Validate load data against updateLoadSchema
      this.validateLoadData(loadData, updateLoadSchema);
      // Call LoadModel.update with the load ID and validated data
      const updatedLoad = await LoadModel.update(loadId, loadData);
      // If load is found and updated, publish a load updated event
      if (updatedLoad) {
        await this.eventsProducer.createLoadUpdatedEvent(updatedLoad);
      }
      // Return the updated load or null if not found
      return updatedLoad || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating load with ID ${loadId}`, { error, loadData });
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Updates the status of a load
   * @param loadId - The ID of the load to update
   * @param statusData - The status update data
   * @returns The updated load or null if not found
   */
  async updateLoadStatus(loadId: string, statusData: LoadStatusUpdateParams): Promise<Load | null> {
    try {
      // Validate status data against updateLoadStatusSchema
      this.validateLoadData(statusData, updateLoadStatusSchema);
      // Get the current load to check its status
      const load = await LoadModel.get(loadId);
      if (!load) {
        return null;
      }
      // Verify the status transition is valid using LoadModel.isValidStatusTransition
      if (!LoadModel.isValidStatusTransition(load.status, statusData.status)) {
        throw new AppError(`Invalid status transition from ${load.status} to ${statusData.status}`, { code: ErrorCodes.INVALID_STATUS_TRANSITION });
      }
      // Call LoadModel.updateStatus with the load ID and new status
      const updatedLoad = await LoadModel.updateStatus(loadId, statusData);
      // If load is found and updated, publish a load status changed event
      if (updatedLoad) {
        await this.eventsProducer.createLoadStatusChangedEvent(
          updatedLoad,
          load.status,
          statusData.status_details || {}
        );
      }
      // Return the updated load or null if not found
      return updatedLoad || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating status for load ${loadId}`, { error, statusData });
      throw error; // Re-throw the error to be handled by the controller
    }
  }

  /**
   * Deletes a load and all associated data
   * @param loadId - The ID of the load to delete
   * @returns True if load was deleted, false if not found
   */
  async deleteLoad(loadId: string): Promise<boolean> {
    try {
      // Call LoadModel.delete with the provided load ID
      const deleted = await LoadModel.delete(loadId);
      // If load is deleted, publish a load deleted event
      if (deleted) {
        await this.eventsProducer.createLoadDeletedEvent(loadId);
      }
      // Return true if a load was deleted, false otherwise
      return deleted;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error deleting load with ID ${loadId}`, { error });
      throw new AppError(`Error deleting load with ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Gets counts of loads by status
   * @param shipperId (optional)
   * @returns Object with status counts
   */
  async getLoadStatusCounts(shipperId?: string): Promise<Record<LoadStatus, number>> {
    try {
      // Call LoadModel.getStatusCounts with the optional shipper ID
      const statusCounts = await LoadModel.getStatusCounts({ shipper_id: shipperId });
      // Return an object with status types as keys and counts as values
      return statusCounts;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error('Error getting load status counts', { error, shipperId });
      throw new AppError('Error getting load status counts', { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Gets the status history timeline for a load
   * @param loadId
   * @returns Array of status history records
   */
  async getLoadStatusHistory(loadId: string): Promise<any[]> {
    try {
      // Call LoadStatusModel.getStatusTimeline with the provided load ID
      const statusHistory = await LoadStatusModel.getStatusTimeline(loadId);
      // Return the array of status history records
      return statusHistory;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting status history for load ID ${loadId}`, { error });
      throw new AppError(`Error getting status history for load ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Gets all locations associated with a load
   * @param loadId
   * @returns Array of load locations
   */
  async getLoadLocations(loadId: string): Promise<any[]> {
    try {
      // Call LoadLocationModel.getByLoadId with the provided load ID
      const loadLocations = await LoadLocationModel.getByLoadId(loadId);
      // Return the array of load locations
      return loadLocations;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting locations for load ID ${loadId}`, { error });
      throw new AppError(`Error getting locations for load ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Updates a specific location for a load
   * @param locationId
   * @param locationData
   * @returns The updated location or null if not found
   */
  async updateLoadLocation(locationId: string, locationData: any): Promise<any | null> {
    try {
      // Call LoadLocationModel.update with the location ID and data
      const updatedLocation = await LoadLocationModel.update(locationId, locationData);
      // Return the updated location or null if not found
      return updatedLocation || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating location with ID ${locationId}`, { error, locationData });
      throw new AppError(`Error updating location with ID ${locationId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Gets all documents associated with a load
   * @param loadId
   * @returns Array of load documents
   */
  async getLoadDocuments(loadId: string): Promise<any[]> {
    try {
      // Call LoadDocumentModel.getByLoadId with the provided load ID
      const loadDocuments = await LoadDocumentModel.getByLoadId(loadId);
      // Return the array of load documents
      return loadDocuments;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error getting documents for load ID ${loadId}`, { error });
      throw new AppError(`Error getting documents for load ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Adds a new document to a load
   * @param loadId
   * @param documentData
   * @returns The created document
   */
  async addLoadDocument(loadId: string, documentData: any): Promise<any> {
    try {
      // Prepare document data with the load ID
      const document = {
        ...documentData,
        load_id: loadId
      };
      // Call LoadDocumentModel.create with the document data
      const createdDocument = await LoadDocumentModel.create(document);
      // Publish a load document added event
      await this.eventsProducer.createLoadDocumentAddedEvent(loadId, createdDocument);
      // Return the created document
      return createdDocument;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error adding document to load ID ${loadId}`, { error, documentData });
      throw new AppError(`Error adding document to load ID ${loadId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Updates an existing document for a load
   * @param documentId
   * @param documentData
   * @returns The updated document or null if not found
   */
  async updateLoadDocument(documentId: string, documentData: any): Promise<any | null> {
    try {
      // Call LoadDocumentModel.update with the document ID and data
      const updatedDocument = await LoadDocumentModel.update(documentId, documentData);
      // Return the updated document or null if not found
      return updatedDocument || null;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error updating document with ID ${documentId}`, { error, documentData });
      throw new AppError(`Error updating document with ID ${documentId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Deletes a document from a load
   * @param documentId
   * @returns True if document was deleted, false if not found
   */
  async deleteLoadDocument(documentId: string): Promise<boolean> {
    try {
      // Call LoadDocumentModel.delete with the document ID
      const deleted = await LoadDocumentModel.delete(documentId);
      // Return true if document was deleted, false otherwise
      return deleted;
    } catch (error) {
      // Log and handle any errors that occur during the operation
      logger.error(`Error deleting document with ID ${documentId}`, { error });
      throw new AppError(`Error deleting document with ID ${documentId}`, { code: ErrorCodes.DATABASE_ERROR, details: { error } });
    }
  }

  /**
   * Validates load data against a schema
   * @param data
   * @param schema
   * @returns Validated data
   */
  private validateLoadData(data: any, schema: Joi.Schema): any {
    // Validate the data against the provided schema
    const { value, error } = schema.validate(data);
    // If validation fails, throw an AppError with validation details
    if (error) {
      logger.warn('Load data validation error', { error });
      throw new AppError('Load data validation failed', { code: ErrorCodes.VALIDATION_ERROR, details: { error } });
    }
    // Return the validated data if validation passes
    return value;
  }
}

// Export the LoadService class for use in load-related operations
export { LoadService };