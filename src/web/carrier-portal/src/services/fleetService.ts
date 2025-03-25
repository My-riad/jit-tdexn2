/**
 * Fleet management service module for the carrier portal of the AI-driven Freight Optimization Platform.
 * Provides functions to interact with the backend API for managing vehicles, retrieving fleet statistics,
 * and accessing performance metrics to support efficient fleet operations.
 */

import apiClient from '../../../common/api/apiClient';
import { getCarrierVehicles } from '../../../common/api/carrierApi';
import { 
  Vehicle, 
  VehicleType, 
  VehicleStatus, 
  VehicleSummary, 
  VehicleCreationParams, 
  VehicleUpdateParams, 
  VehicleWithDetails, 
  VehiclePerformanceMetrics, 
  VehicleUtilization, 
  VehicleSearchParams,
  VehicleMaintenance 
} from '../../../common/interfaces/vehicle.interface';
import { handleApiError } from '../../../common/utils/errorHandlers';

/**
 * Summary statistics for a carrier's fleet
 */
export interface FleetSummary {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  outOfServiceVehicles: number;
  fleetUtilizationPercentage: number;
  averageVehicleAge: number;
  vehiclesByType: Record<VehicleType, number>;
}

/**
 * Performance metrics for the entire fleet
 */
export interface FleetPerformanceMetrics {
  carrierId: string;
  totalMiles: number;
  loadedMiles: number;
  emptyMiles: number;
  emptyMilesPercentage: number;
  fuelConsumption: number;
  averageMpg: number;
  fleetUtilizationPercentage: number;
  maintenanceCost: number;
  revenueGenerated: number;
  revenuePerMile: number;
  loadsCompleted: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Recommendations for optimizing the fleet
 */
export interface FleetOptimizationRecommendations {
  carrierId: string;
  recommendations: OptimizationRecommendation[];
  potentialSavings: number;
  potentialEmptyMileReduction: number;
  potentialEfficiencyGain: number;
}

/**
 * Individual optimization recommendation
 */
export interface OptimizationRecommendation {
  recommendationType: string;
  description: string;
  vehicleIds: string[];
  potentialSavings: number;
  priority: string;
  implementationSteps: string[];
}

/**
 * Parameters for performance metric requests
 */
export interface PerformanceParams {
  startDate?: string;
  endDate?: string;
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Parameters for utilization metric requests
 */
export interface UtilizationParams {
  startDate?: string;
  endDate?: string;
  timeframe?: 'day' | 'week' | 'month';
}

/**
 * Parameters for maintenance history requests
 */
export interface MaintenanceParams {
  startDate?: string;
  endDate?: string;
  maintenanceType?: string;
  page?: number;
  limit?: number;
}

/**
 * Parameters for scheduling maintenance
 */
export interface MaintenanceScheduleParams {
  maintenanceType: string;
  description: string;
  scheduledDate: string;
  estimatedCost?: number;
  serviceProvider?: string;
  notes?: string;
}

/**
 * Retrieves a list of vehicles with optional filtering and pagination
 * @param params Optional query parameters for filtering, sorting, and pagination
 * @returns Promise with vehicles array and total count
 */
export const getAllVehicles = async (params?: VehicleSearchParams): Promise<{ vehicles: VehicleSummary[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/v1/vehicles', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves detailed information for a specific vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @returns Promise with detailed vehicle information
 */
export const getVehicleById = async (vehicleId: string): Promise<VehicleWithDetails> => {
  try {
    const response = await apiClient.get(`/api/v1/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Creates a new vehicle in the system
 * @param vehicleData The vehicle data to create
 * @returns Promise with created vehicle data
 */
export const createVehicle = async (vehicleData: VehicleCreationParams): Promise<Vehicle> => {
  try {
    const response = await apiClient.post('/api/v1/vehicles', vehicleData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates an existing vehicle's information
 * @param vehicleId The unique identifier of the vehicle to update
 * @param vehicleData The updated vehicle data
 * @returns Promise with updated vehicle data
 */
export const updateVehicle = async (vehicleId: string, vehicleData: VehicleUpdateParams): Promise<Vehicle> => {
  try {
    const response = await apiClient.put(`/api/v1/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Removes a vehicle from the system
 * @param vehicleId The unique identifier of the vehicle to delete
 * @returns Promise with success indicator
 */
export const deleteVehicle = async (vehicleId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete(`/api/v1/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves summary statistics for the carrier's fleet
 * @param carrierId The unique identifier of the carrier
 * @returns Promise with fleet summary statistics
 */
export const getFleetSummary = async (carrierId: string): Promise<FleetSummary> => {
  try {
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/fleet-summary`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves performance metrics for a specific vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param params Optional parameters for timeframe and period
 * @returns Promise with vehicle performance metrics
 */
export const getVehiclePerformance = async (vehicleId: string, params?: PerformanceParams): Promise<VehiclePerformanceMetrics> => {
  try {
    const response = await apiClient.get(`/api/v1/vehicles/${vehicleId}/performance`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves utilization metrics for a specific vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param params Optional parameters for timeframe and period
 * @returns Promise with vehicle utilization metrics
 */
export const getVehicleUtilization = async (vehicleId: string, params?: UtilizationParams): Promise<VehicleUtilization> => {
  try {
    const response = await apiClient.get(`/api/v1/vehicles/${vehicleId}/utilization`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves performance metrics for the entire fleet
 * @param carrierId The unique identifier of the carrier
 * @param params Optional parameters for timeframe and period
 * @returns Promise with fleet-wide performance metrics
 */
export const getFleetPerformance = async (carrierId: string, params?: PerformanceParams): Promise<FleetPerformanceMetrics> => {
  try {
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/fleet-performance`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves maintenance history for a specific vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param params Optional parameters for filtering maintenance records
 * @returns Promise with maintenance records and total count
 */
export const getVehicleMaintenanceHistory = async (
  vehicleId: string, 
  params?: MaintenanceParams
): Promise<{ maintenance: VehicleMaintenance[]; total: number }> => {
  try {
    const response = await apiClient.get(`/api/v1/vehicles/${vehicleId}/maintenance`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Schedules maintenance for a vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param maintenanceData The maintenance data to schedule
 * @returns Promise with created maintenance record
 */
export const scheduleVehicleMaintenance = async (
  vehicleId: string, 
  maintenanceData: MaintenanceScheduleParams
): Promise<VehicleMaintenance> => {
  try {
    const response = await apiClient.post(`/api/v1/vehicles/${vehicleId}/maintenance`, maintenanceData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Updates the status of a vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param status The new status to set
 * @param notes Optional notes about the status change
 * @returns Promise with updated vehicle data
 */
export const updateVehicleStatus = async (
  vehicleId: string, 
  status: VehicleStatus, 
  notes?: string
): Promise<Vehicle> => {
  try {
    const response = await apiClient.patch(`/api/v1/vehicles/${vehicleId}/status`, { status, notes });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Assigns a driver to a vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @param driverId The unique identifier of the driver to assign
 * @returns Promise with updated vehicle data
 */
export const assignDriverToVehicle = async (vehicleId: string, driverId: string): Promise<Vehicle> => {
  try {
    const response = await apiClient.post(`/api/v1/vehicles/${vehicleId}/assign-driver`, { driverId });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Removes driver assignment from a vehicle
 * @param vehicleId The unique identifier of the vehicle
 * @returns Promise with updated vehicle data
 */
export const unassignDriverFromVehicle = async (vehicleId: string): Promise<Vehicle> => {
  try {
    const response = await apiClient.delete(`/api/v1/vehicles/${vehicleId}/driver-assignment`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves optimization recommendations for the fleet
 * @param carrierId The unique identifier of the carrier
 * @returns Promise with fleet optimization recommendations
 */
export const getOptimizationRecommendations = async (carrierId: string): Promise<FleetOptimizationRecommendations> => {
  try {
    const response = await apiClient.get(`/api/v1/carriers/${carrierId}/fleet-optimization`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getFleetSummary,
  getVehiclePerformance,
  getVehicleUtilization,
  getFleetPerformance,
  getVehicleMaintenanceHistory,
  scheduleVehicleMaintenance,
  updateVehicleStatus,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  getOptimizationRecommendations
};