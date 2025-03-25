import { createAction } from '@reduxjs/toolkit';
import {
  CarrierFilterParams,
  CarrierCreationParams,
  CarrierUpdateParams,
  CarrierPerformanceMetrics,
  CarrierSummary,
  CarrierRecommendation,
  CarrierNetworkStatistics,
  Carrier
} from '../../../common/interfaces/carrier.interface';
import { Driver } from '../../../common/interfaces/driver.interface';
import { Vehicle } from '../../../common/interfaces/vehicle.interface';

// Action Types
export const FETCH_CARRIERS_REQUEST = 'carrier/fetchCarriersRequest';
export const FETCH_CARRIERS_SUCCESS = 'carrier/fetchCarriersSuccess';
export const FETCH_CARRIERS_FAILURE = 'carrier/fetchCarriersFailure';

export const FETCH_CARRIER_REQUEST = 'carrier/fetchCarrierRequest';
export const FETCH_CARRIER_SUCCESS = 'carrier/fetchCarrierSuccess';
export const FETCH_CARRIER_FAILURE = 'carrier/fetchCarrierFailure';

export const CREATE_CARRIER_REQUEST = 'carrier/createCarrierRequest';
export const CREATE_CARRIER_SUCCESS = 'carrier/createCarrierSuccess';
export const CREATE_CARRIER_FAILURE = 'carrier/createCarrierFailure';

export const UPDATE_CARRIER_REQUEST = 'carrier/updateCarrierRequest';
export const UPDATE_CARRIER_SUCCESS = 'carrier/updateCarrierSuccess';
export const UPDATE_CARRIER_FAILURE = 'carrier/updateCarrierFailure';

export const DELETE_CARRIER_REQUEST = 'carrier/deleteCarrierRequest';
export const DELETE_CARRIER_SUCCESS = 'carrier/deleteCarrierSuccess';
export const DELETE_CARRIER_FAILURE = 'carrier/deleteCarrierFailure';

export const FETCH_CARRIER_DRIVERS_REQUEST = 'carrier/fetchCarrierDriversRequest';
export const FETCH_CARRIER_DRIVERS_SUCCESS = 'carrier/fetchCarrierDriversSuccess';
export const FETCH_CARRIER_DRIVERS_FAILURE = 'carrier/fetchCarrierDriversFailure';

export const FETCH_CARRIER_VEHICLES_REQUEST = 'carrier/fetchCarrierVehiclesRequest';
export const FETCH_CARRIER_VEHICLES_SUCCESS = 'carrier/fetchCarrierVehiclesSuccess';
export const FETCH_CARRIER_VEHICLES_FAILURE = 'carrier/fetchCarrierVehiclesFailure';

export const FETCH_CARRIER_PERFORMANCE_REQUEST = 'carrier/fetchCarrierPerformanceRequest';
export const FETCH_CARRIER_PERFORMANCE_SUCCESS = 'carrier/fetchCarrierPerformanceSuccess';
export const FETCH_CARRIER_PERFORMANCE_FAILURE = 'carrier/fetchCarrierPerformanceFailure';

export const FETCH_CARRIER_SUMMARY_REQUEST = 'carrier/fetchCarrierSummaryRequest';
export const FETCH_CARRIER_SUMMARY_SUCCESS = 'carrier/fetchCarrierSummarySuccess';
export const FETCH_CARRIER_SUMMARY_FAILURE = 'carrier/fetchCarrierSummaryFailure';

export const FETCH_CARRIER_RECOMMENDATIONS_REQUEST = 'carrier/fetchCarrierRecommendationsRequest';
export const FETCH_CARRIER_RECOMMENDATIONS_SUCCESS = 'carrier/fetchCarrierRecommendationsSuccess';
export const FETCH_CARRIER_RECOMMENDATIONS_FAILURE = 'carrier/fetchCarrierRecommendationsFailure';

export const FETCH_CARRIER_NETWORK_STATS_REQUEST = 'carrier/fetchCarrierNetworkStatsRequest';
export const FETCH_CARRIER_NETWORK_STATS_SUCCESS = 'carrier/fetchCarrierNetworkStatsSuccess';
export const FETCH_CARRIER_NETWORK_STATS_FAILURE = 'carrier/fetchCarrierNetworkStatsFailure';

export const CLEAR_CARRIER_CACHE = 'carrier/clearCarrierCache';

// Action Creators

// Fetch Carriers List
export const fetchCarriers = createAction<CarrierFilterParams | undefined>(
  FETCH_CARRIERS_REQUEST
);

export const fetchCarriersSuccess = createAction<{
  carriers: Carrier[];
  total: number;
  page: number;
  limit: number;
}>(FETCH_CARRIERS_SUCCESS);

export const fetchCarriersFailure = createAction<string>(
  FETCH_CARRIERS_FAILURE
);

// Fetch Specific Carrier
export const fetchCarrierById = createAction<string>(
  FETCH_CARRIER_REQUEST
);

export const fetchCarrierByIdSuccess = createAction<Carrier>(
  FETCH_CARRIER_SUCCESS
);

export const fetchCarrierByIdFailure = createAction<string>(
  FETCH_CARRIER_FAILURE
);

// Create Carrier
export const createCarrier = createAction<CarrierCreationParams>(
  CREATE_CARRIER_REQUEST
);

export const createCarrierSuccess = createAction<Carrier>(
  CREATE_CARRIER_SUCCESS
);

export const createCarrierFailure = createAction<string>(
  CREATE_CARRIER_FAILURE
);

// Update Carrier
export const updateCarrier = createAction<{
  carrierId: string;
  updates: CarrierUpdateParams;
}>(UPDATE_CARRIER_REQUEST);

export const updateCarrierSuccess = createAction<Carrier>(
  UPDATE_CARRIER_SUCCESS
);

export const updateCarrierFailure = createAction<string>(
  UPDATE_CARRIER_FAILURE
);

// Delete Carrier
export const deleteCarrier = createAction<string>(
  DELETE_CARRIER_REQUEST
);

export const deleteCarrierSuccess = createAction<string>(
  DELETE_CARRIER_SUCCESS
);

export const deleteCarrierFailure = createAction<string>(
  DELETE_CARRIER_FAILURE
);

// Fetch Carrier Drivers
export const fetchCarrierDrivers = createAction<{
  carrierId: string;
  page?: number;
  limit?: number;
}>(FETCH_CARRIER_DRIVERS_REQUEST);

export const fetchCarrierDriversSuccess = createAction<{
  drivers: Driver[];
  total: number;
  page: number;
  limit: number;
}>(FETCH_CARRIER_DRIVERS_SUCCESS);

export const fetchCarrierDriversFailure = createAction<string>(
  FETCH_CARRIER_DRIVERS_FAILURE
);

// Fetch Carrier Vehicles
export const fetchCarrierVehicles = createAction<{
  carrierId: string;
  page?: number;
  limit?: number;
}>(FETCH_CARRIER_VEHICLES_REQUEST);

export const fetchCarrierVehiclesSuccess = createAction<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
}>(FETCH_CARRIER_VEHICLES_SUCCESS);

export const fetchCarrierVehiclesFailure = createAction<string>(
  FETCH_CARRIER_VEHICLES_FAILURE
);

// Fetch Carrier Performance Metrics
export const fetchCarrierPerformance = createAction<{
  carrierId: string;
  startDate?: string;
  endDate?: string;
}>(FETCH_CARRIER_PERFORMANCE_REQUEST);

export const fetchCarrierPerformanceSuccess = createAction<CarrierPerformanceMetrics>(
  FETCH_CARRIER_PERFORMANCE_SUCCESS
);

export const fetchCarrierPerformanceFailure = createAction<string>(
  FETCH_CARRIER_PERFORMANCE_FAILURE
);

// Fetch Carrier Summary
export const fetchCarrierSummary = createAction<string>(
  FETCH_CARRIER_SUMMARY_REQUEST
);

export const fetchCarrierSummarySuccess = createAction<CarrierSummary>(
  FETCH_CARRIER_SUMMARY_SUCCESS
);

export const fetchCarrierSummaryFailure = createAction<string>(
  FETCH_CARRIER_SUMMARY_FAILURE
);

// Fetch Carrier Recommendations
export const fetchCarrierRecommendations = createAction<{
  loadId: string;
  limit?: number;
}>(FETCH_CARRIER_RECOMMENDATIONS_REQUEST);

export const fetchCarrierRecommendationsSuccess = createAction<{
  recommendations: CarrierRecommendation[];
  total: number;
}>(FETCH_CARRIER_RECOMMENDATIONS_SUCCESS);

export const fetchCarrierRecommendationsFailure = createAction<string>(
  FETCH_CARRIER_RECOMMENDATIONS_FAILURE
);

// Fetch Carrier Network Statistics
export const fetchCarrierNetworkStats = createAction<{
  carrierId: string;
  startDate?: string;
  endDate?: string;
}>(FETCH_CARRIER_NETWORK_STATS_REQUEST);

export const fetchCarrierNetworkStatsSuccess = createAction<CarrierNetworkStatistics>(
  FETCH_CARRIER_NETWORK_STATS_SUCCESS
);

export const fetchCarrierNetworkStatsFailure = createAction<string>(
  FETCH_CARRIER_NETWORK_STATS_FAILURE
);

// Clear Carrier Cache
export const clearCarrierCache = createAction(CLEAR_CARRIER_CACHE);