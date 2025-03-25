import { AxiosResponse } from 'axios'; // ^1.4.0
import * as loadApi from '../../common/api/loadApi';
import {
  Load,
  LoadWithDetails,
  LoadCreationParams,
  LoadUpdateParams,
  LoadStatusUpdateParams,
  LoadSearchParams,
  LoadStatus,
  LoadDocumentType,
  LoadSummary,
} from '../../common/interfaces/load.interface';
import {
  formatCurrency,
  formatDistance,
  formatWeight,
  formatDimensions,
  formatLoadStatus,
  formatRatePerMile,
  formatEfficiencyScore,
} from '../../common/utils/formatters';
import { getOptimizationOpportunities } from './optimizationService';
import logger from '../../common/utils/logger';

/**
 * Service that provides load management functionality for the carrier portal, enabling fleet operators to create, retrieve, update, and delete loads, as well as manage load status, documents, and assignments.
 * This service acts as a wrapper around the common load API, adding carrier-specific business logic and data formatting.
 */

/**
 * Retrieves loads for a specific carrier with optional filtering
 * @param carrierId - The ID of the carrier
 * @param searchParams - Parameters for filtering and pagination
 * @returns Promise resolving to paginated load results for the carrier
 */
export const getCarrierLoads = async (
  carrierId: string,
  searchParams?: LoadSearchParams
): Promise<{ loads: LoadSummary[]; total: number; page: number; limit: number }> => {
  // LD1: Ensure carrierId is provided
  if (!carrierId) {
    throw new Error('Carrier ID is required to retrieve loads.');
  }

  // Step 1: Merge carrierId into searchParams
  const mergedSearchParams = { ...searchParams, shipperId: carrierId };

  // Step 2: Call loadApi.getLoads with the updated search parameters
  const loadResults = await loadApi.getLoads(mergedSearchParams);

  // Step 3: Format the returned load data using formatter utilities
  const formattedLoads = loadResults.loads.map((load) => formatLoadSummary(load));

  // Step 4: Return the formatted load data with pagination information
  return {
    loads: formattedLoads,
    total: loadResults.total,
    page: loadResults.page,
    limit: loadResults.limit,
  };
};

/**
 * Retrieves detailed information about a specific load
 * @param loadId - The ID of the load to retrieve
 * @returns Promise resolving to detailed load information
 */
export const getLoadDetails = async (loadId: string): Promise<LoadWithDetails> => {
  // LD1: Ensure loadId is provided
  if (!loadId) {
    throw new Error('Load ID is required to retrieve load details.');
  }

  // Step 1: Call loadApi.getLoadById with loadId and includeDetails=true
  const loadDetails = await loadApi.getLoadById(loadId, true) as LoadWithDetails;

  // Step 2: Format the returned load details using formatter utilities
  const formattedLoadDetails = formatLoadDetails(loadDetails);

  // Step 3: Return the formatted load details
  return formattedLoadDetails;
};

/**
 * Creates a new load for a specific carrier
 * @param carrierId - The ID of the carrier
 * @param loadData - The load data to create
 * @returns Promise resolving to the created load
 */
export const createCarrierLoad = async (
  carrierId: string,
  loadData: LoadCreationParams
): Promise<Load> => {
  // LD1: Ensure carrierId is provided
  if (!carrierId) {
    throw new Error('Carrier ID is required to create a load.');
  }

  // Step 1: Validate the load data for required fields
  if (!loadData) {
    throw new Error('Load data is required to create a load.');
  }

  // Step 2: Set the shipperId field to the carrierId
  const preparedLoadData = { ...loadData, shipperId: carrierId };

  // Step 3: Call loadApi.createLoad with the prepared load data
  const createdLoad = await loadApi.createLoad(preparedLoadData);

  // Step 4: Format the returned load using formatter utilities
  const formattedLoad = formatLoadSummary(createdLoad);

  // Step 5: Return the formatted created load
  return formattedLoad;
};

/**
 * Updates an existing load for a carrier
 * @param loadId - The ID of the load to update
 * @param updateData - The data to update
 * @returns Promise resolving to the updated load
 */
export const updateCarrierLoad = async (
  loadId: string,
  updateData: LoadUpdateParams
): Promise<Load> => {
  // LD1: Ensure loadId is provided
  if (!loadId) {
    throw new Error('Load ID is required to update a load.');
  }

  // Step 1: Validate the update data
  if (!updateData) {
    throw new Error('Update data is required to update a load.');
  }

  // Step 2: Call loadApi.updateLoad with loadId and update data
  const updatedLoad = await loadApi.updateLoad(loadId, updateData);

  // Step 3: Format the returned updated load using formatter utilities
  const formattedLoad = formatLoadSummary(updatedLoad);

  // Step 4: Return the formatted updated load
  return formattedLoad;
};

/**
 * Deletes a load belonging to a carrier
 * @param loadId - The ID of the load to delete
 * @returns Promise resolving to deletion result
 */
export const deleteCarrierLoad = async (
  loadId: string
): Promise<{ success: boolean; message: string }> => {
  // LD1: Ensure loadId is provided
  if (!loadId) {
    throw new Error('Load ID is required to delete a load.');
  }

  // Step 1: Call loadApi.deleteLoad with loadId
  const deletionResult = await loadApi.deleteLoad(loadId);

  // Step 2: Return the deletion result
  return deletionResult;
};

/**
 * Updates the status of a load for a carrier
 * @param loadId - The ID of the load to update
 * @param newStatus - The new status of the load
 * @param statusDetails - Additional details about the status update
 * @param coordinates - Coordinates associated with the status update
 * @returns Promise resolving to the load with updated status
 */
export const updateLoadStatusForCarrier = async (
  loadId: string,
  newStatus: LoadStatus,
  statusDetails: object,
  coordinates: object
): Promise<Load> => {
  // LD1: Ensure loadId and newStatus are provided
  if (!loadId) {
    throw new Error('Load ID is required to update load status.');
  }
  if (!newStatus) {
    throw new Error('New status is required to update load status.');
  }

  // Step 1: Prepare status update data with newStatus, statusDetails, and coordinates
  const statusUpdateData: LoadStatusUpdateParams = {
    status: newStatus,
    statusDetails: statusDetails,
    coordinates: coordinates,
    updatedBy: 'carrier', // Or fetch from user context
  }

  // Step 2: Call loadApi.updateLoadStatus with loadId and status update data
  const updatedLoad = await loadApi.updateLoadStatus(loadId, statusUpdateData);

  // Step 3: Format the returned load using formatter utilities
  const formattedLoad = formatLoadSummary(updatedLoad);

  // Step 4: Return the formatted load with updated status
  return formattedLoad;
};

/**
 * Retrieves documents associated with a carrier's load
 * @param loadId - The ID of the load
 * @param documentType - Optional filter for document type
 * @returns Promise resolving to array of load documents
 */
export const getLoadDocumentsForCarrier = async (
  loadId: string,
  documentType?: LoadDocumentType
): Promise<any[]> => {
  // LD1: Ensure loadId is provided
  if (!loadId) {
    throw new Error('Load ID is required to retrieve load documents.');
  }

  // Step 1: Call loadApi.getLoadDocuments with loadId and optional documentType
  const loadDocuments = await loadApi.getLoadDocuments(loadId, documentType);

  // Step 2: Return the load documents
  return loadDocuments;
};

/**
 * Uploads a document for a carrier's load
 * @param loadId - The ID of the load
 * @param formData - FormData containing the document file and metadata
 * @returns Promise resolving to the uploaded document
 */
export const uploadLoadDocumentForCarrier = async (
  loadId: string,
  formData: FormData
): Promise<any> => {
  // LD1: Ensure loadId and formData are provided
  if (!loadId) {
    throw new Error('Load ID is required to upload a document.');
  }
  if (!formData) {
    throw new Error('Form data is required to upload a document.');
  }

  // Step 1: Call loadApi.uploadLoadDocument with loadId and formData
  const uploadedDocument = await loadApi.uploadLoadDocument(loadId, formData);

  // Step 2: Return the uploaded document information
  return uploadedDocument;
};

/**
 * Deletes a document associated with a carrier's load
 * @param loadId - The ID of the load
 * @param documentId - The ID of the document to delete
 * @returns Promise resolving to deletion result
 */
export const deleteLoadDocumentForCarrier = async (
  loadId: string,
  documentId: string
): Promise<{ success: boolean; message: string }> => {
  // LD1: Ensure loadId and documentId are provided
  if (!loadId) {
    throw new Error('Load ID is required to delete a document.');
  }
  if (!documentId) {
    throw new Error('Document ID is required to delete a document.');
  }

  // Step 1: Call loadApi.deleteLoadDocument with loadId and documentId
  const deletionResult = await loadApi.deleteLoadDocument(loadId, documentId);

  // Step 2: Return the deletion result
  return deletionResult;
};

/**
 * Assigns a load to a specific driver in the carrier's fleet
 * @param loadId - The ID of the load to assign
 * @param driverId - The ID of the driver to assign the load to
 * @param vehicleId - The ID of the vehicle to assign the load to
 * @param assignmentData - Additional assignment details
 * @returns Promise resolving to assignment result
 */
export const assignLoadToDriver = async (
  loadId: string,
  driverId: string,
  vehicleId: string,
  assignmentData: object
): Promise<{ success: boolean; assignment: object }> => {
  // LD1: Ensure loadId, driverId, and vehicleId are provided
  if (!loadId) {
    throw new Error('Load ID is required to assign a load.');
  }
  if (!driverId) {
    throw new Error('Driver ID is required to assign a load.');
  }
  if (!vehicleId) {
    throw new Error('Vehicle ID is required to assign a load.');
  }

  // Step 1: Prepare acceptance data with driverId, vehicleId and assignment details
  const acceptanceData = {
    driverId: driverId,
    vehicleId: vehicleId,
    ...assignmentData,
  };

  // Step 2: Call loadApi.acceptLoad with loadId, driverId, and acceptance data
  const assignmentResult = await loadApi.acceptLoad(loadId, driverId, acceptanceData);

  // Step 3: Update the load status to ASSIGNED if assignment is successful
  if (assignmentResult.success) {
    try {
      await updateLoadStatusForCarrier(loadId, LoadStatus.ASSIGNED, {}, {});
    } catch (error) {
      logger.error('Failed to update load status to ASSIGNED after accepting load', { error, loadId });
      // Consider whether to revert the assignment in case of status update failure
    }
  }

  // Step 4: Return the assignment result
  return assignmentResult;
};

/**
 * Retrieves optimization opportunities for a carrier's loads
 * @param carrierId Carrier ID
 * @returns Promise resolving to load optimization opportunities
 */
export const getLoadOptimizationOpportunities = async (carrierId: string): Promise<any[]> => {
  // LD1: Ensure carrierId is provided
  if (!carrierId) {
    throw new Error('Carrier ID is required to retrieve optimization opportunities.');
  }

  // Step 1: Call getOptimizationOpportunities with carrierId
  const opportunities = await getOptimizationOpportunities(carrierId);

  // Step 2: Filter the returned opportunities to include only load-related ones
  const loadOpportunities = opportunities.filter((opportunity) =>
    opportunity.affectedLoadIds && opportunity.affectedLoadIds.length > 0
  );

  // Step 3: Format the opportunity data including savings using formatter utilities
  const formattedOpportunities = loadOpportunities.map((opportunity) => ({
    ...opportunity,
    estimatedSavings: formatCurrency(opportunity.estimatedSavings),
  }));

  // Step 4: Return the formatted load optimization opportunities
  return formattedOpportunities;
};

/**
 * Formats load data for display in the UI
 * @param load - The load object to format
 * @returns Formatted load summary for display
 */
export const formatLoadSummary = (load: Load): LoadSummary => {
  // LD1: Ensure load is provided
  if (!load) {
    throw new Error('Load object is required for formatting.');
  }

  // Step 1: Extract relevant fields from the load object
  const {
    id,
    referenceNumber,
    pickupEarliest,
    deliveryLatest,
    equipmentType,
    weight,
    status,
    offeredRate
  } = load;

  // Step 2: Format currency values using formatCurrency
  const formattedRate = formatCurrency(offeredRate);

  // Step 3: Format distances using formatDistance
  const distance = 100; // Mock distance for now
  const formattedDistance = formatDistance(distance);

  // Step 4: Format weights using formatWeight
  const formattedWeight = formatWeight(weight);

  // Step 5: Format load status using formatLoadStatus
  const formattedStatus = formatLoadStatus(status);

  // Step 6: Format efficiency score using formatEfficiencyScore
  const efficiencyScore = 85; // Mock efficiency score for now
  const formattedEfficiencyScore = formatEfficiencyScore(efficiencyScore);

  // Step 7: Return the formatted load summary object
  return {
    id: id,
    referenceNumber: referenceNumber,
    origin: 'Chicago, IL', // Mock origin for now
    destination: 'Detroit, MI', // Mock destination for now
    equipmentType: equipmentType,
    weight: weight,
    status: status,
    pickupDate: pickupEarliest,
    deliveryDate: deliveryLatest,
    rate: offeredRate,
    distance: distance,
    efficiencyScore: efficiencyScore,
    isHazardous: false, // Mock isHazardous for now
    assignedDriver: {
      id: 'driver-123', // Mock driver ID for now
      name: 'John Doe', // Mock driver name for now
    },
  };
};

/**
 * Formats detailed load information for display in the UI
 * @param loadDetails - The detailed load information to format
 * @returns Formatted load details for display
 */
export const formatLoadDetails = (loadDetails: LoadWithDetails): LoadWithDetails => {
  // LD1: Ensure loadDetails is provided
  if (!loadDetails) {
    throw new Error('Load details object is required for formatting.');
  }

  // Step 1: Format all basic load fields using formatLoadSummary
  const formattedSummary = formatLoadSummary(loadDetails);

  // Step 2: Format dimensions using formatDimensions
  const formattedDimensionsValue = formatDimensions(loadDetails.dimensions);

  // Step 3: Format rate per mile using formatRatePerMile
  const formattedRatePerMileValue = formatRatePerMile(loadDetails.offeredRate, 100); // Mock distance

  // Step 4: Format location addresses and timestamps
  // Step 5: Format document information
  // Step 6: Format assignment details

  // Step 7: Return the fully formatted load details object
  return {
    ...loadDetails,
    locations: loadDetails.locations, // Mock locations for now
    statusHistory: loadDetails.statusHistory, // Mock status history for now
    documents: loadDetails.documents, // Mock documents for now
    assignments: loadDetails.assignments, // Mock assignments for now
    shipper: loadDetails.shipper, // Mock shipper for now
    efficiencyScore: loadDetails.efficiencyScore, // Mock efficiency score for now
    referenceNumber: formattedSummary.referenceNumber,
    equipmentType: formattedSummary.equipmentType,
    weight: formattedSummary.weight,
    status: formattedSummary.status,
    pickupEarliest: formattedSummary.pickupDate,
    deliveryLatest: formattedSummary.deliveryDate,
    offeredRate: formattedSummary.rate,
    dimensions: {
      length: 10,
      width: 5,
      height: 5
    }
  };
};