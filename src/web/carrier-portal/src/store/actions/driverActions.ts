import {
  Driver,
  DriverCreationParams,
  DriverUpdateParams,
  DriverAvailability,
  DriverHOS,
  DriverPreference,
  DriverScore,
  DriverPerformanceMetrics,
  DriverStatus,
  DriverSearchParams
} from '../../../common/interfaces/driver.interface';
import { PayloadAction } from '@reduxjs/toolkit';

// Driver leaderboard entry interface
interface DriverLeaderboardEntry {
  driverId: string;
  rank: number;
  driverName: string;
  score: number;
  change: number;
  bonusEarned: number;
}

// Action type constants
export enum DriverActionTypes {
  // Fetch drivers
  FETCH_DRIVERS_REQUEST = 'driver/FETCH_DRIVERS_REQUEST',
  FETCH_DRIVERS_SUCCESS = 'driver/FETCH_DRIVERS_SUCCESS',
  FETCH_DRIVERS_FAILURE = 'driver/FETCH_DRIVERS_FAILURE',

  // Fetch a specific driver
  FETCH_DRIVER_DETAIL_REQUEST = 'driver/FETCH_DRIVER_DETAIL_REQUEST',
  FETCH_DRIVER_DETAIL_SUCCESS = 'driver/FETCH_DRIVER_DETAIL_SUCCESS',
  FETCH_DRIVER_DETAIL_FAILURE = 'driver/FETCH_DRIVER_DETAIL_FAILURE',

  // Create a driver
  CREATE_DRIVER_REQUEST = 'driver/CREATE_DRIVER_REQUEST',
  CREATE_DRIVER_SUCCESS = 'driver/CREATE_DRIVER_SUCCESS',
  CREATE_DRIVER_FAILURE = 'driver/CREATE_DRIVER_FAILURE',

  // Update a driver
  UPDATE_DRIVER_REQUEST = 'driver/UPDATE_DRIVER_REQUEST',
  UPDATE_DRIVER_SUCCESS = 'driver/UPDATE_DRIVER_SUCCESS',
  UPDATE_DRIVER_FAILURE = 'driver/UPDATE_DRIVER_FAILURE',

  // Delete a driver
  DELETE_DRIVER_REQUEST = 'driver/DELETE_DRIVER_REQUEST',
  DELETE_DRIVER_SUCCESS = 'driver/DELETE_DRIVER_SUCCESS',
  DELETE_DRIVER_FAILURE = 'driver/DELETE_DRIVER_FAILURE',

  // Update driver availability
  UPDATE_DRIVER_AVAILABILITY_REQUEST = 'driver/UPDATE_DRIVER_AVAILABILITY_REQUEST',
  UPDATE_DRIVER_AVAILABILITY_SUCCESS = 'driver/UPDATE_DRIVER_AVAILABILITY_SUCCESS',
  UPDATE_DRIVER_AVAILABILITY_FAILURE = 'driver/UPDATE_DRIVER_AVAILABILITY_FAILURE',

  // Fetch driver availability
  FETCH_DRIVER_AVAILABILITY_REQUEST = 'driver/FETCH_DRIVER_AVAILABILITY_REQUEST',
  FETCH_DRIVER_AVAILABILITY_SUCCESS = 'driver/FETCH_DRIVER_AVAILABILITY_SUCCESS',
  FETCH_DRIVER_AVAILABILITY_FAILURE = 'driver/FETCH_DRIVER_AVAILABILITY_FAILURE',

  // Fetch driver HOS (Hours of Service)
  FETCH_DRIVER_HOS_REQUEST = 'driver/FETCH_DRIVER_HOS_REQUEST',
  FETCH_DRIVER_HOS_SUCCESS = 'driver/FETCH_DRIVER_HOS_SUCCESS',
  FETCH_DRIVER_HOS_FAILURE = 'driver/FETCH_DRIVER_HOS_FAILURE',

  // Fetch driver preferences
  FETCH_DRIVER_PREFERENCES_REQUEST = 'driver/FETCH_DRIVER_PREFERENCES_REQUEST',
  FETCH_DRIVER_PREFERENCES_SUCCESS = 'driver/FETCH_DRIVER_PREFERENCES_SUCCESS',
  FETCH_DRIVER_PREFERENCES_FAILURE = 'driver/FETCH_DRIVER_PREFERENCES_FAILURE',

  // Update driver preference
  UPDATE_DRIVER_PREFERENCE_REQUEST = 'driver/UPDATE_DRIVER_PREFERENCE_REQUEST',
  UPDATE_DRIVER_PREFERENCE_SUCCESS = 'driver/UPDATE_DRIVER_PREFERENCE_SUCCESS',
  UPDATE_DRIVER_PREFERENCE_FAILURE = 'driver/UPDATE_DRIVER_PREFERENCE_FAILURE',

  // Fetch driver score
  FETCH_DRIVER_SCORE_REQUEST = 'driver/FETCH_DRIVER_SCORE_REQUEST',
  FETCH_DRIVER_SCORE_SUCCESS = 'driver/FETCH_DRIVER_SCORE_SUCCESS',
  FETCH_DRIVER_SCORE_FAILURE = 'driver/FETCH_DRIVER_SCORE_FAILURE',

  // Fetch driver performance
  FETCH_DRIVER_PERFORMANCE_REQUEST = 'driver/FETCH_DRIVER_PERFORMANCE_REQUEST',
  FETCH_DRIVER_PERFORMANCE_SUCCESS = 'driver/FETCH_DRIVER_PERFORMANCE_SUCCESS',
  FETCH_DRIVER_PERFORMANCE_FAILURE = 'driver/FETCH_DRIVER_PERFORMANCE_FAILURE',

  // Fetch driver leaderboard
  FETCH_DRIVER_LEADERBOARD_REQUEST = 'driver/FETCH_DRIVER_LEADERBOARD_REQUEST',
  FETCH_DRIVER_LEADERBOARD_SUCCESS = 'driver/FETCH_DRIVER_LEADERBOARD_SUCCESS',
  FETCH_DRIVER_LEADERBOARD_FAILURE = 'driver/FETCH_DRIVER_LEADERBOARD_FAILURE',

  // Fetch drivers by status
  FETCH_DRIVERS_BY_STATUS_REQUEST = 'driver/FETCH_DRIVERS_BY_STATUS_REQUEST',
  FETCH_DRIVERS_BY_STATUS_SUCCESS = 'driver/FETCH_DRIVERS_BY_STATUS_SUCCESS',
  FETCH_DRIVERS_BY_STATUS_FAILURE = 'driver/FETCH_DRIVERS_BY_STATUS_FAILURE',

  // Fetch top drivers
  FETCH_TOP_DRIVERS_REQUEST = 'driver/FETCH_TOP_DRIVERS_REQUEST',
  FETCH_TOP_DRIVERS_SUCCESS = 'driver/FETCH_TOP_DRIVERS_SUCCESS',
  FETCH_TOP_DRIVERS_FAILURE = 'driver/FETCH_TOP_DRIVERS_FAILURE',

  // Assign vehicle to driver
  ASSIGN_VEHICLE_REQUEST = 'driver/ASSIGN_VEHICLE_REQUEST',
  ASSIGN_VEHICLE_SUCCESS = 'driver/ASSIGN_VEHICLE_SUCCESS',
  ASSIGN_VEHICLE_FAILURE = 'driver/ASSIGN_VEHICLE_FAILURE',

  // Unassign vehicle from driver
  UNASSIGN_VEHICLE_REQUEST = 'driver/UNASSIGN_VEHICLE_REQUEST',
  UNASSIGN_VEHICLE_SUCCESS = 'driver/UNASSIGN_VEHICLE_SUCCESS',
  UNASSIGN_VEHICLE_FAILURE = 'driver/UNASSIGN_VEHICLE_FAILURE',

  // Search drivers
  SEARCH_DRIVERS_REQUEST = 'driver/SEARCH_DRIVERS_REQUEST',
  SEARCH_DRIVERS_SUCCESS = 'driver/SEARCH_DRIVERS_SUCCESS',
  SEARCH_DRIVERS_FAILURE = 'driver/SEARCH_DRIVERS_FAILURE',

  // Validate driver for load
  VALIDATE_DRIVER_FOR_LOAD_REQUEST = 'driver/VALIDATE_DRIVER_FOR_LOAD_REQUEST',
  VALIDATE_DRIVER_FOR_LOAD_SUCCESS = 'driver/VALIDATE_DRIVER_FOR_LOAD_SUCCESS',
  VALIDATE_DRIVER_FOR_LOAD_FAILURE = 'driver/VALIDATE_DRIVER_FOR_LOAD_FAILURE'
}

// Fetch drivers
export const fetchDrivers = (params?: object): PayloadAction<object> => ({
  type: DriverActionTypes.FETCH_DRIVERS_REQUEST,
  payload: params
});

export const fetchDriversSuccess = (data: { drivers: Driver[], total: number }): PayloadAction<{ drivers: Driver[], total: number }> => ({
  type: DriverActionTypes.FETCH_DRIVERS_SUCCESS,
  payload: data
});

export const fetchDriversFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVERS_FAILURE,
  payload: error
});

// Fetch driver detail
export const fetchDriverDetail = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_DETAIL_REQUEST,
  payload: driverId
});

export const fetchDriverDetailSuccess = (driver: Driver): PayloadAction<Driver> => ({
  type: DriverActionTypes.FETCH_DRIVER_DETAIL_SUCCESS,
  payload: driver
});

export const fetchDriverDetailFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_DETAIL_FAILURE,
  payload: error
});

// Create driver
export const createDriver = (driverData: DriverCreationParams): PayloadAction<DriverCreationParams> => ({
  type: DriverActionTypes.CREATE_DRIVER_REQUEST,
  payload: driverData
});

export const createDriverSuccess = (driver: Driver): PayloadAction<Driver> => ({
  type: DriverActionTypes.CREATE_DRIVER_SUCCESS,
  payload: driver
});

export const createDriverFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.CREATE_DRIVER_FAILURE,
  payload: error
});

// Update driver
export const updateDriver = (driverId: string, driverData: DriverUpdateParams): PayloadAction<{ driverId: string, driverData: DriverUpdateParams }> => ({
  type: DriverActionTypes.UPDATE_DRIVER_REQUEST,
  payload: { driverId, driverData }
});

export const updateDriverSuccess = (driver: Driver): PayloadAction<Driver> => ({
  type: DriverActionTypes.UPDATE_DRIVER_SUCCESS,
  payload: driver
});

export const updateDriverFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.UPDATE_DRIVER_FAILURE,
  payload: error
});

// Delete driver
export const deleteDriver = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.DELETE_DRIVER_REQUEST,
  payload: driverId
});

export const deleteDriverSuccess = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.DELETE_DRIVER_SUCCESS,
  payload: driverId
});

export const deleteDriverFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.DELETE_DRIVER_FAILURE,
  payload: error
});

// Update driver availability
export const updateDriverAvailability = (
  driverId: string, 
  availabilityData: Partial<DriverAvailability>
): PayloadAction<{ driverId: string, availabilityData: Partial<DriverAvailability> }> => ({
  type: DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_REQUEST,
  payload: { driverId, availabilityData }
});

export const updateDriverAvailabilitySuccess = (
  availability: DriverAvailability
): PayloadAction<DriverAvailability> => ({
  type: DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_SUCCESS,
  payload: availability
});

export const updateDriverAvailabilityFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.UPDATE_DRIVER_AVAILABILITY_FAILURE,
  payload: error
});

// Fetch driver availability
export const fetchDriverAvailability = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_AVAILABILITY_REQUEST,
  payload: driverId
});

export const fetchDriverAvailabilitySuccess = (
  availability: DriverAvailability
): PayloadAction<DriverAvailability> => ({
  type: DriverActionTypes.FETCH_DRIVER_AVAILABILITY_SUCCESS,
  payload: availability
});

export const fetchDriverAvailabilityFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_AVAILABILITY_FAILURE,
  payload: error
});

// Fetch driver HOS
export const fetchDriverHOS = (
  driverId: string, 
  options?: object
): PayloadAction<{ driverId: string, options?: object }> => ({
  type: DriverActionTypes.FETCH_DRIVER_HOS_REQUEST,
  payload: { driverId, options }
});

export const fetchDriverHOSSuccess = (hosRecords: DriverHOS[]): PayloadAction<DriverHOS[]> => ({
  type: DriverActionTypes.FETCH_DRIVER_HOS_SUCCESS,
  payload: hosRecords
});

export const fetchDriverHOSFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_HOS_FAILURE,
  payload: error
});

// Fetch driver preferences
export const fetchDriverPreferences = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_PREFERENCES_REQUEST,
  payload: driverId
});

export const fetchDriverPreferencesSuccess = (
  preferences: DriverPreference[]
): PayloadAction<DriverPreference[]> => ({
  type: DriverActionTypes.FETCH_DRIVER_PREFERENCES_SUCCESS,
  payload: preferences
});

export const fetchDriverPreferencesFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_PREFERENCES_FAILURE,
  payload: error
});

// Update driver preference
export const updateDriverPreference = (
  driverId: string, 
  preference: DriverPreference
): PayloadAction<{ driverId: string, preference: DriverPreference }> => ({
  type: DriverActionTypes.UPDATE_DRIVER_PREFERENCE_REQUEST,
  payload: { driverId, preference }
});

export const updateDriverPreferenceSuccess = (
  preference: DriverPreference
): PayloadAction<DriverPreference> => ({
  type: DriverActionTypes.UPDATE_DRIVER_PREFERENCE_SUCCESS,
  payload: preference
});

export const updateDriverPreferenceFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.UPDATE_DRIVER_PREFERENCE_FAILURE,
  payload: error
});

// Fetch driver score
export const fetchDriverScore = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_SCORE_REQUEST,
  payload: driverId
});

export const fetchDriverScoreSuccess = (score: DriverScore): PayloadAction<DriverScore> => ({
  type: DriverActionTypes.FETCH_DRIVER_SCORE_SUCCESS,
  payload: score
});

export const fetchDriverScoreFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_SCORE_FAILURE,
  payload: error
});

// Fetch driver performance
export const fetchDriverPerformance = (
  driverId: string, 
  params?: object
): PayloadAction<{ driverId: string, params?: object }> => ({
  type: DriverActionTypes.FETCH_DRIVER_PERFORMANCE_REQUEST,
  payload: { driverId, params }
});

export const fetchDriverPerformanceSuccess = (
  metrics: DriverPerformanceMetrics
): PayloadAction<DriverPerformanceMetrics> => ({
  type: DriverActionTypes.FETCH_DRIVER_PERFORMANCE_SUCCESS,
  payload: metrics
});

export const fetchDriverPerformanceFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_PERFORMANCE_FAILURE,
  payload: error
});

// Fetch driver leaderboard
export const fetchDriverLeaderboard = (params?: object): PayloadAction<object> => ({
  type: DriverActionTypes.FETCH_DRIVER_LEADERBOARD_REQUEST,
  payload: params
});

export const fetchDriverLeaderboardSuccess = (
  data: { entries: DriverLeaderboardEntry[], total: number }
): PayloadAction<{ entries: DriverLeaderboardEntry[], total: number }> => ({
  type: DriverActionTypes.FETCH_DRIVER_LEADERBOARD_SUCCESS,
  payload: data
});

export const fetchDriverLeaderboardFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVER_LEADERBOARD_FAILURE,
  payload: error
});

// Fetch drivers by status
export const fetchDriversByStatus = (
  status: DriverStatus, 
  params?: object
): PayloadAction<{ status: DriverStatus, params?: object }> => ({
  type: DriverActionTypes.FETCH_DRIVERS_BY_STATUS_REQUEST,
  payload: { status, params }
});

export const fetchDriversByStatusSuccess = (
  data: { drivers: Driver[], total: number }
): PayloadAction<{ drivers: Driver[], total: number }> => ({
  type: DriverActionTypes.FETCH_DRIVERS_BY_STATUS_SUCCESS,
  payload: data
});

export const fetchDriversByStatusFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_DRIVERS_BY_STATUS_FAILURE,
  payload: error
});

// Fetch top drivers
export const fetchTopDrivers = (limit?: number): PayloadAction<number> => ({
  type: DriverActionTypes.FETCH_TOP_DRIVERS_REQUEST,
  payload: limit
});

export const fetchTopDriversSuccess = (
  data: { drivers: Driver[], total: number }
): PayloadAction<{ drivers: Driver[], total: number }> => ({
  type: DriverActionTypes.FETCH_TOP_DRIVERS_SUCCESS,
  payload: data
});

export const fetchTopDriversFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.FETCH_TOP_DRIVERS_FAILURE,
  payload: error
});

// Assign vehicle
export const assignVehicle = (
  driverId: string, 
  vehicleId: string
): PayloadAction<{ driverId: string, vehicleId: string }> => ({
  type: DriverActionTypes.ASSIGN_VEHICLE_REQUEST,
  payload: { driverId, vehicleId }
});

export const assignVehicleSuccess = (driver: Driver): PayloadAction<Driver> => ({
  type: DriverActionTypes.ASSIGN_VEHICLE_SUCCESS,
  payload: driver
});

export const assignVehicleFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.ASSIGN_VEHICLE_FAILURE,
  payload: error
});

// Unassign vehicle
export const unassignVehicle = (driverId: string): PayloadAction<string> => ({
  type: DriverActionTypes.UNASSIGN_VEHICLE_REQUEST,
  payload: driverId
});

export const unassignVehicleSuccess = (driver: Driver): PayloadAction<Driver> => ({
  type: DriverActionTypes.UNASSIGN_VEHICLE_SUCCESS,
  payload: driver
});

export const unassignVehicleFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.UNASSIGN_VEHICLE_FAILURE,
  payload: error
});

// Search drivers
export const searchDrivers = (
  searchParams: DriverSearchParams
): PayloadAction<DriverSearchParams> => ({
  type: DriverActionTypes.SEARCH_DRIVERS_REQUEST,
  payload: searchParams
});

export const searchDriversSuccess = (
  data: { drivers: Driver[], total: number, page: number, limit: number }
): PayloadAction<{ drivers: Driver[], total: number, page: number, limit: number }> => ({
  type: DriverActionTypes.SEARCH_DRIVERS_SUCCESS,
  payload: data
});

export const searchDriversFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.SEARCH_DRIVERS_FAILURE,
  payload: error
});

// Validate driver for load
export const validateDriverForLoad = (
  driverId: string, 
  loadDetails: object
): PayloadAction<{ driverId: string, loadDetails: object }> => ({
  type: DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_REQUEST,
  payload: { driverId, loadDetails }
});

export const validateDriverForLoadSuccess = (
  result: { eligible: boolean, reasons?: string[] }
): PayloadAction<{ eligible: boolean, reasons?: string[] }> => ({
  type: DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_SUCCESS,
  payload: result
});

export const validateDriverForLoadFailure = (error: string): PayloadAction<string> => ({
  type: DriverActionTypes.VALIDATE_DRIVER_FOR_LOAD_FAILURE,
  payload: error
});