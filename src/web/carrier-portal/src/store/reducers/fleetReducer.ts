import { VehicleSummary, VehicleWithDetails, VehicleMaintenance, VehiclePerformanceMetrics, VehicleUtilization } from '../../../common/interfaces/vehicle.interface'; // Import vehicle-related interfaces for type definitions
import { FleetActionTypes } from '../actions/fleetActions'; // Import action type constants for fleet-related Redux actions

/**
 * Interface defining the shape of the fleet state in the Redux store
 */
export interface FleetState {
  /**
   * List of vehicle summaries
   */
  vehicles: VehicleSummary[];
  /**
   * Detailed information for a selected vehicle
   */
  vehicleDetail: VehicleWithDetails | null;
  /**
   * Maintenance records for a selected vehicle
   */
  maintenanceRecords: VehicleMaintenance[];
    /**
   * List of vehicles that need maintenance
   */
  vehiclesNeedingMaintenance: VehicleSummary[];
  /**
   * Utilization metrics for a selected vehicle
   */
  vehicleUtilization: VehicleUtilization | null;
  /**
   * Utilization metrics for the entire fleet
   */
  fleetUtilization: VehiclePerformanceMetrics[];
  /**
   * Summary statistics for the carrier's fleet
   */
  fleetSummary: { totalVehicles: number; active: number; available: number; inUse: number; maintenance: number };
  /**
   * Optimization recommendations for the fleet
   */
  optimizationRecommendations: { vehicleId: string; recommendation: string; estimatedSavings: number; emptyMilesReduction: number }[];
  /**
   * Loading flags for different data fetching operations
   */
  loading: { vehicles: boolean; vehicleDetail: boolean; maintenance: boolean; utilization: boolean; fleetUtilization: boolean; fleetSummary: boolean; maintenanceNeeded: boolean; optimizationRecommendations: boolean };
  /**
   * Error messages for different data fetching operations
   */
  error: { vehicles: string | null; vehicleDetail: string | null; maintenance: string | null; utilization: string | null; fleetUtilization: string | null; fleetSummary: string | null; maintenanceNeeded: string | null; optimizationRecommendations: string | null };
    /**
   * Pagination information for vehicle lists
   */
  pagination: { total: number; page: number; limit: number };
}

/**
 * Initial state for the fleet reducer
 */
export const initialState: FleetState = {
  vehicles: [], // Empty array of vehicle summaries
  vehicleDetail: null, // No selected vehicle initially
  maintenanceRecords: [], // Empty array of maintenance records
  vehiclesNeedingMaintenance: [], // Empty array of vehicles needing maintenance
  vehicleUtilization: null, // No vehicle utilization data initially
  fleetUtilization: [], // Empty array of fleet utilization metrics
  fleetSummary: { totalVehicles: 0, active: 0, available: 0, inUse: 0, maintenance: 0 }, // Empty fleet summary statistics
  optimizationRecommendations: [], // Empty array of optimization recommendations
  loading: { vehicles: false, vehicleDetail: false, maintenance: false, utilization: false, fleetUtilization: false, fleetSummary: false, maintenanceNeeded: false, optimizationRecommendations: false }, // All loading flags initially set to false
  error: { vehicles: null, vehicleDetail: null, maintenance: null, utilization: null, fleetUtilization: null, fleetSummary: null, maintenanceNeeded: null, optimizationRecommendations: null }, // All error messages initially set to null
  pagination: { total: 0, page: 1, limit: 10 } // Default pagination values
};

/**
 * Reducer function that handles fleet-related state updates based on dispatched actions
 * @param {FleetState} state - The previous state of the fleet
 * @param {FleetAction} action - The action dispatched to the reducer
 * @returns {FleetState} Updated state based on the action
 */
const fleetReducer = (state: FleetState = initialState, action: any): FleetState => {
  // Use a switch statement to handle different action types
  switch (action.type) {
    // Handle fetch vehicles request
    case FleetActionTypes.FETCH_VEHICLES_REQUEST:
      return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle fetch vehicles success
    case FleetActionTypes.FETCH_VEHICLES_SUCCESS:
      return {
        ...state,
        vehicles: action.payload.vehicles,
        loading: { ...state.loading, vehicles: false },
        error: { ...state.error, vehicles: null },
        pagination: {
            ...state.pagination,
            total: action.payload.total,
            page: action.payload.page,
            limit: action.payload.limit,
        }
      };
    // Handle fetch vehicles failure
    case FleetActionTypes.FETCH_VEHICLES_FAILURE:
      return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle fetch vehicle detail request
    case FleetActionTypes.FETCH_VEHICLE_DETAIL_REQUEST:
      return { ...state, loading: { ...state.loading, vehicleDetail: true }, error: { ...state.error, vehicleDetail: null } };
    // Handle fetch vehicle detail success
    case FleetActionTypes.FETCH_VEHICLE_DETAIL_SUCCESS:
      return { ...state, vehicleDetail: action.payload, loading: { ...state.loading, vehicleDetail: false }, error: { ...state.error, vehicleDetail: null } };
    // Handle fetch vehicle detail failure
    case FleetActionTypes.FETCH_VEHICLE_DETAIL_FAILURE:
      return { ...state, loading: { ...state.loading, vehicleDetail: false }, error: { ...state.error, vehicleDetail: action.payload.error } };
      
    // Handle create vehicle request
    case FleetActionTypes.CREATE_VEHICLE_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle create vehicle success
    case FleetActionTypes.CREATE_VEHICLE_SUCCESS:
        return { ...state, vehicles: [...state.vehicles, action.payload], loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: null } };
    // Handle create vehicle failure
    case FleetActionTypes.CREATE_VEHICLE_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle update vehicle request
    case FleetActionTypes.UPDATE_VEHICLE_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle update vehicle success
    case FleetActionTypes.UPDATE_VEHICLE_SUCCESS:
        return {
            ...state,
            vehicles: state.vehicles.map(vehicle =>
                vehicle.vehicle_id === action.payload.vehicle_id ? action.payload : vehicle
            ),
            loading: { ...state.loading, vehicles: false },
            error: { ...state.error, vehicles: null }
        };
    // Handle update vehicle failure
    case FleetActionTypes.UPDATE_VEHICLE_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle delete vehicle request
    case FleetActionTypes.DELETE_VEHICLE_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle delete vehicle success
    case FleetActionTypes.DELETE_VEHICLE_SUCCESS:
        return {
            ...state,
            vehicles: state.vehicles.filter(vehicle => vehicle.vehicle_id !== action.payload),
            loading: { ...state.loading, vehicles: false },
            error: { ...state.error, vehicles: null }
        };
    // Handle delete vehicle failure
    case FleetActionTypes.DELETE_VEHICLE_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle fetch vehicle maintenance request
    case FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_REQUEST:
      return { ...state, loading: { ...state.loading, maintenance: true }, error: { ...state.error, maintenance: null } };
    // Handle fetch vehicle maintenance success
    case FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_SUCCESS:
      return { ...state, maintenanceRecords: action.payload, loading: { ...state.loading, maintenance: false }, error: { ...state.error, maintenance: null } };
    // Handle fetch vehicle maintenance failure
    case FleetActionTypes.FETCH_VEHICLE_MAINTENANCE_FAILURE:
      return { ...state, loading: { ...state.loading, maintenance: false }, error: { ...state.error, maintenance: action.payload.error } };

    // Handle add maintenance record request
    case FleetActionTypes.ADD_MAINTENANCE_RECORD_REQUEST:
      return { ...state, loading: { ...state.loading, maintenance: true }, error: { ...state.error, maintenance: null } };
    // Handle add maintenance record success
    case FleetActionTypes.ADD_MAINTENANCE_RECORD_SUCCESS:
      return { ...state, maintenanceRecords: [...state.maintenanceRecords, action.payload], loading: { ...state.loading, maintenance: false }, error: { ...state.error, maintenance: null } };
    // Handle add maintenance record failure
    case FleetActionTypes.ADD_MAINTENANCE_RECORD_FAILURE:
      return { ...state, loading: { ...state.loading, maintenance: false }, error: { ...state.error, maintenance: action.payload.error } };

    // Handle fetch vehicle utilization request
    case FleetActionTypes.FETCH_VEHICLE_UTILIZATION_REQUEST:
      return { ...state, loading: { ...state.loading, utilization: true }, error: { ...state.error, utilization: null } };
    // Handle fetch vehicle utilization success
    case FleetActionTypes.FETCH_VEHICLE_UTILIZATION_SUCCESS:
      return { ...state, vehicleUtilization: action.payload, loading: { ...state.loading, utilization: false }, error: { ...state.error, utilization: null } };
    // Handle fetch vehicle utilization failure
    case FleetActionTypes.FETCH_VEHICLE_UTILIZATION_FAILURE:
      return { ...state, loading: { ...state.loading, utilization: false }, error: { ...state.error, utilization: action.payload.error } };

    // Handle fetch fleet utilization request
    case FleetActionTypes.FETCH_FLEET_UTILIZATION_REQUEST:
      return { ...state, loading: { ...state.loading, fleetUtilization: true }, error: { ...state.error, fleetUtilization: null } };
    // Handle fetch fleet utilization success
    case FleetActionTypes.FETCH_FLEET_UTILIZATION_SUCCESS:
      return { ...state, fleetUtilization: action.payload, loading: { ...state.loading, fleetUtilization: false }, error: { ...state.error, fleetUtilization: null } };
    // Handle fetch fleet utilization failure
    case FleetActionTypes.FETCH_FLEET_UTILIZATION_FAILURE:
      return { ...state, loading: { ...state.loading, fleetUtilization: false }, error: { ...state.error, fleetUtilization: action.payload.error } };

    // Handle fetch fleet summary request
    case FleetActionTypes.FETCH_FLEET_SUMMARY_REQUEST:
      return { ...state, loading: { ...state.loading, fleetSummary: true }, error: { ...state.error, fleetSummary: null } };
    // Handle fetch fleet summary success
    case FleetActionTypes.FETCH_FLEET_SUMMARY_SUCCESS:
      return { ...state, fleetSummary: action.payload, loading: { ...state.loading, fleetSummary: false }, error: { ...state.error, fleetSummary: null } };
    // Handle fetch fleet summary failure
    case FleetActionTypes.FETCH_FLEET_SUMMARY_FAILURE:
      return { ...state, loading: { ...state.loading, fleetSummary: false }, error: { ...state.error, fleetSummary: action.payload.error } };
    
    // Handle fetch maintenance needed request
    case FleetActionTypes.FETCH_MAINTENANCE_NEEDED_REQUEST:
        return { ...state, loading: { ...state.loading, maintenanceNeeded: true }, error: { ...state.error, maintenanceNeeded: null } };
    // Handle fetch maintenance needed success
    case FleetActionTypes.FETCH_MAINTENANCE_NEEDED_SUCCESS:
        return { ...state, vehiclesNeedingMaintenance: action.payload, loading: { ...state.loading, maintenanceNeeded: false }, error: { ...state.error, maintenanceNeeded: null } };
    // Handle fetch maintenance needed failure
    case FleetActionTypes.FETCH_MAINTENANCE_NEEDED_FAILURE:
        return { ...state, loading: { ...state.loading, maintenanceNeeded: false }, error: { ...state.error, maintenanceNeeded: action.payload.error } };

    // Handle update vehicle status request
    case FleetActionTypes.UPDATE_VEHICLE_STATUS_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle update vehicle status success
    case FleetActionTypes.UPDATE_VEHICLE_STATUS_SUCCESS:
        return {
            ...state,
            vehicles: state.vehicles.map(vehicle =>
                vehicle.vehicle_id === action.payload.vehicle_id ? action.payload : vehicle
            ),
            loading: { ...state.loading, vehicles: false },
            error: { ...state.error, vehicles: null }
        };
    // Handle update vehicle status failure
    case FleetActionTypes.UPDATE_VEHICLE_STATUS_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle assign driver request
    case FleetActionTypes.ASSIGN_DRIVER_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle assign driver success
    case FleetActionTypes.ASSIGN_DRIVER_SUCCESS:
        return {
            ...state,
            vehicles: state.vehicles.map(vehicle =>
                vehicle.vehicle_id === action.payload.vehicle_id ? action.payload : vehicle
            ),
            loading: { ...state.loading, vehicles: false },
            error: { ...state.error, vehicles: null }
        };
    // Handle assign driver failure
    case FleetActionTypes.ASSIGN_DRIVER_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle unassign driver request
    case FleetActionTypes.UNASSIGN_DRIVER_REQUEST:
        return { ...state, loading: { ...state.loading, vehicles: true }, error: { ...state.error, vehicles: null } };
    // Handle unassign driver success
    case FleetActionTypes.UNASSIGN_DRIVER_SUCCESS:
        return {
            ...state,
            vehicles: state.vehicles.map(vehicle =>
                vehicle.vehicle_id === action.payload.vehicle_id ? action.payload : vehicle
            ),
            loading: { ...state.loading, vehicles: false },
            error: { ...state.error, vehicles: null }
        };
    // Handle unassign driver failure
    case FleetActionTypes.UNASSIGN_DRIVER_FAILURE:
        return { ...state, loading: { ...state.loading, vehicles: false }, error: { ...state.error, vehicles: action.payload.error } };

    // Handle fetch optimization recommendations request
    case FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_REQUEST:
        return { ...state, loading: { ...state.loading, optimizationRecommendations: true }, error: { ...state.error, optimizationRecommendations: null } };
    // Handle fetch optimization recommendations success
    case FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_SUCCESS:
        return { ...state, optimizationRecommendations: action.payload, loading: { ...state.loading, optimizationRecommendations: false }, error: { ...state.error, optimizationRecommendations: null } };
    // Handle fetch optimization recommendations failure
    case FleetActionTypes.FETCH_OPTIMIZATION_RECOMMENDATIONS_FAILURE:
        return { ...state, loading: { ...state.loading, optimizationRecommendations: false }, error: { ...state.error, optimizationRecommendations: action.payload.error } };

    // Return the unchanged state for unhandled action types
    default:
      return state; // Return the state (either modified or unchanged depending on the action)
  }
};

// Export the fleet reducer function as the default export
export default fleetReducer;