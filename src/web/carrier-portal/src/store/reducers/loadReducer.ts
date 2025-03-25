import { createReducer } from '@reduxjs/toolkit';
import { LoadActionTypes } from '../actions/loadActions';
import { 
  Load, 
  LoadWithDetails, 
  LoadDocument, 
  LoadRecommendation,
  LoadStatus,
  LoadAssignmentType
} from '../../../common/interfaces/load.interface';

/**
 * Interface defining the structure of the load state in the Redux store
 */
interface LoadState {
  loads: Load[];
  loadDetail: LoadWithDetails | null;
  activeLoads: Load[];
  pendingLoads: Load[];
  completedLoads: Load[];
  upcomingDeliveries: Load[];
  documents: LoadDocument[];
  optimizationRecommendations: any[];
  driverRecommendations: LoadRecommendation[];
  loading: boolean;
  loadingDetail: boolean;
  loadingDocuments: boolean;
  loadingOptimizations: boolean;
  loadingDriverRecommendations: boolean;
  loadingActiveLoads: boolean;
  loadingPendingLoads: boolean;
  loadingCompletedLoads: boolean;
  loadingUpcomingDeliveries: boolean;
  error: string | null;
  detailError: string | null;
  documentError: string | null;
  optimizationError: string | null;
  driverRecommendationsError: string | null;
  activeLoadsError: string | null;
  pendingLoadsError: string | null;
  completedLoadsError: string | null;
  upcomingDeliveriesError: string | null;
  totalLoads: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Initial state for the load reducer
 */
const initialState: LoadState = {
  loads: [],
  loadDetail: null,
  activeLoads: [],
  pendingLoads: [],
  completedLoads: [],
  upcomingDeliveries: [],
  documents: [],
  optimizationRecommendations: [],
  driverRecommendations: [],
  loading: false,
  loadingDetail: false,
  loadingDocuments: false,
  loadingOptimizations: false,
  loadingDriverRecommendations: false,
  loadingActiveLoads: false,
  loadingPendingLoads: false,
  loadingCompletedLoads: false,
  loadingUpcomingDeliveries: false,
  error: null,
  detailError: null,
  documentError: null,
  optimizationError: null,
  driverRecommendationsError: null,
  activeLoadsError: null,
  pendingLoadsError: null,
  completedLoadsError: null,
  upcomingDeliveriesError: null,
  totalLoads: 0,
  currentPage: 1,
  pageSize: 10
};

/**
 * Reducer for managing load-related state
 */
const loadReducer = createReducer(initialState, (builder) => {
  builder
    // Fetch loads
    .addCase(LoadActionTypes.FETCH_LOADS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.FETCH_LOADS_SUCCESS, (state, action) => {
      state.loading = false;
      state.loads = action.payload.loads;
      state.totalLoads = action.payload.total;
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.limit;
    })
    .addCase(LoadActionTypes.FETCH_LOADS_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Fetch load detail
    .addCase(LoadActionTypes.FETCH_LOAD_DETAIL_REQUEST, (state) => {
      state.loadingDetail = true;
      state.detailError = null;
    })
    .addCase(LoadActionTypes.FETCH_LOAD_DETAIL_SUCCESS, (state, action) => {
      state.loadingDetail = false;
      state.loadDetail = action.payload.load;
    })
    .addCase(LoadActionTypes.FETCH_LOAD_DETAIL_FAILURE, (state, action) => {
      state.loadingDetail = false;
      state.detailError = action.payload.error;
    })

    // Create load
    .addCase(LoadActionTypes.CREATE_LOAD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.CREATE_LOAD_SUCCESS, (state, action) => {
      state.loading = false;
      state.loads.push(action.payload.load);
      
      // Add to pending loads if appropriate
      if (['created', 'pending', 'available'].includes(action.payload.load.status)) {
        state.pendingLoads.push(action.payload.load);
      }
    })
    .addCase(LoadActionTypes.CREATE_LOAD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Update load
    .addCase(LoadActionTypes.UPDATE_LOAD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.UPDATE_LOAD_SUCCESS, (state, action) => {
      state.loading = false;
      
      // Update in main loads array
      const index = state.loads.findIndex(load => load.id === action.payload.load.id);
      if (index !== -1) {
        state.loads[index] = action.payload.load;
      }
      
      // Update in specific category arrays if present
      updateLoadInArray(state.activeLoads, action.payload.load);
      updateLoadInArray(state.pendingLoads, action.payload.load);
      updateLoadInArray(state.completedLoads, action.payload.load);
      updateLoadInArray(state.upcomingDeliveries, action.payload.load);
      
      // Update loadDetail if it matches the updated load
      if (state.loadDetail && state.loadDetail.id === action.payload.load.id) {
        state.loadDetail = { 
          ...state.loadDetail, 
          ...action.payload.load 
        };
      }
    })
    .addCase(LoadActionTypes.UPDATE_LOAD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Delete load
    .addCase(LoadActionTypes.DELETE_LOAD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.DELETE_LOAD_SUCCESS, (state, action) => {
      state.loading = false;
      
      // Remove from all load arrays
      state.loads = state.loads.filter(load => load.id !== action.payload.loadId);
      state.activeLoads = state.activeLoads.filter(load => load.id !== action.payload.loadId);
      state.pendingLoads = state.pendingLoads.filter(load => load.id !== action.payload.loadId);
      state.completedLoads = state.completedLoads.filter(load => load.id !== action.payload.loadId);
      state.upcomingDeliveries = state.upcomingDeliveries.filter(load => load.id !== action.payload.loadId);
      
      // Clear loadDetail if it matches the deleted load
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        state.loadDetail = null;
      }
    })
    .addCase(LoadActionTypes.DELETE_LOAD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Update load status
    .addCase(LoadActionTypes.UPDATE_LOAD_STATUS_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.UPDATE_LOAD_STATUS_SUCCESS, (state, action) => {
      state.loading = false;
      
      // Update status in main loads array
      const index = state.loads.findIndex(load => load.id === action.payload.loadId);
      if (index !== -1) {
        state.loads[index].status = action.payload.status as LoadStatus;
      }
      
      // Update status in specific category arrays
      updateLoadStatusInArray(state.activeLoads, action.payload.loadId, action.payload.status);
      updateLoadStatusInArray(state.pendingLoads, action.payload.loadId, action.payload.status);
      updateLoadStatusInArray(state.completedLoads, action.payload.loadId, action.payload.status);
      updateLoadStatusInArray(state.upcomingDeliveries, action.payload.loadId, action.payload.status);
      
      // Update load categories based on new status
      reclassifyLoadByStatus(state, action.payload.loadId, action.payload.status);
      
      // Update loadDetail if it matches
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        state.loadDetail.status = action.payload.status as LoadStatus;
        
        // Add to status history if available
        if (state.loadDetail.statusHistory) {
          state.loadDetail.statusHistory.push({
            id: `${Date.now()}`, // Temporary ID, would be replaced by backend
            loadId: action.payload.loadId,
            status: action.payload.status as LoadStatus,
            statusDetails: action.payload.statusDetails || {},
            coordinates: { latitude: 0, longitude: 0 }, // Default coordinates
            updatedBy: 'system', // Default, would be set by backend
            timestamp: new Date().toISOString()
          });
        }
      }
    })
    .addCase(LoadActionTypes.UPDATE_LOAD_STATUS_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Fetch load documents
    .addCase(LoadActionTypes.FETCH_LOAD_DOCUMENTS_REQUEST, (state) => {
      state.loadingDocuments = true;
      state.documentError = null;
    })
    .addCase(LoadActionTypes.FETCH_LOAD_DOCUMENTS_SUCCESS, (state, action) => {
      state.loadingDocuments = false;
      state.documents = action.payload.documents;
      
      // Also update documents in loadDetail if it matches
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        state.loadDetail.documents = action.payload.documents;
      }
    })
    .addCase(LoadActionTypes.FETCH_LOAD_DOCUMENTS_FAILURE, (state, action) => {
      state.loadingDocuments = false;
      state.documentError = action.payload.error;
    })

    // Upload document
    .addCase(LoadActionTypes.UPLOAD_DOCUMENT_REQUEST, (state) => {
      state.loadingDocuments = true;
      state.documentError = null;
    })
    .addCase(LoadActionTypes.UPLOAD_DOCUMENT_SUCCESS, (state, action) => {
      state.loadingDocuments = false;
      state.documents.push(action.payload.document);
      
      // Also update documents in loadDetail if it matches
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        if (!state.loadDetail.documents) {
          state.loadDetail.documents = [];
        }
        state.loadDetail.documents.push(action.payload.document);
      }
    })
    .addCase(LoadActionTypes.UPLOAD_DOCUMENT_FAILURE, (state, action) => {
      state.loadingDocuments = false;
      state.documentError = action.payload.error;
    })

    // Delete document
    .addCase(LoadActionTypes.DELETE_DOCUMENT_REQUEST, (state) => {
      state.loadingDocuments = true;
      state.documentError = null;
    })
    .addCase(LoadActionTypes.DELETE_DOCUMENT_SUCCESS, (state, action) => {
      state.loadingDocuments = false;
      
      // Remove from documents array
      state.documents = state.documents.filter(
        doc => doc.id !== action.payload.documentId
      );
      
      // Also update documents in loadDetail if it matches
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        if (state.loadDetail.documents) {
          state.loadDetail.documents = state.loadDetail.documents.filter(
            doc => doc.id !== action.payload.documentId
          );
        }
      }
    })
    .addCase(LoadActionTypes.DELETE_DOCUMENT_FAILURE, (state, action) => {
      state.loadingDocuments = false;
      state.documentError = action.payload.error;
    })

    // Fetch optimizations
    .addCase(LoadActionTypes.FETCH_OPTIMIZATIONS_REQUEST, (state) => {
      state.loadingOptimizations = true;
      state.optimizationError = null;
    })
    .addCase(LoadActionTypes.FETCH_OPTIMIZATIONS_SUCCESS, (state, action) => {
      state.loadingOptimizations = false;
      state.optimizationRecommendations = action.payload.recommendations;
    })
    .addCase(LoadActionTypes.FETCH_OPTIMIZATIONS_FAILURE, (state, action) => {
      state.loadingOptimizations = false;
      state.optimizationError = action.payload.error;
    })

    // Assign load
    .addCase(LoadActionTypes.ASSIGN_LOAD_REQUEST, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(LoadActionTypes.ASSIGN_LOAD_SUCCESS, (state, action) => {
      state.loading = false;
      
      // Update loadDetail if it matches
      if (state.loadDetail && state.loadDetail.id === action.payload.loadId) {
        // Create a new assignment object
        const newAssignment = {
          id: action.payload.assignment.assignmentId,
          loadId: action.payload.loadId,
          driverId: action.payload.assignment.driverId,
          vehicleId: action.payload.assignment.vehicleId,
          assignmentType: LoadAssignmentType.DIRECT, // Default
          status: state.loadDetail.status,
          segmentStartLocation: { latitude: 0, longitude: 0 }, // Default
          segmentEndLocation: { latitude: 0, longitude: 0 }, // Default
          agreedRate: state.loadDetail.offeredRate, // Using offered rate as default
          efficiencyScore: 0, // Default
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add assignment to loadDetail
        if (!state.loadDetail.assignments) {
          state.loadDetail.assignments = [newAssignment];
        } else {
          state.loadDetail.assignments.push(newAssignment);
        }
      }
      
      // Update the load in the loads array
      const index = state.loads.findIndex(load => load.id === action.payload.loadId);
      if (index !== -1) {
        // Update the status to reflect assignment
        state.loads[index].status = LoadStatus.ASSIGNED;
      }
      
      // Similarly update in other arrays
      updateLoadStatusInArray(state.activeLoads, action.payload.loadId, LoadStatus.ASSIGNED);
      updateLoadStatusInArray(state.pendingLoads, action.payload.loadId, LoadStatus.ASSIGNED);
      updateLoadStatusInArray(state.upcomingDeliveries, action.payload.loadId, LoadStatus.ASSIGNED);
      
      // Reclassify the load
      reclassifyLoadByStatus(state, action.payload.loadId, LoadStatus.ASSIGNED);
    })
    .addCase(LoadActionTypes.ASSIGN_LOAD_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload.error;
    })

    // Fetch driver recommendations
    .addCase(LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_REQUEST, (state) => {
      state.loadingDriverRecommendations = true;
      state.driverRecommendationsError = null;
    })
    .addCase(LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_SUCCESS, (state, action) => {
      state.loadingDriverRecommendations = false;
      state.driverRecommendations = action.payload.recommendations;
    })
    .addCase(LoadActionTypes.FETCH_DRIVER_RECOMMENDATIONS_FAILURE, (state, action) => {
      state.loadingDriverRecommendations = false;
      state.driverRecommendationsError = action.payload.error;
    })

    // Apply optimization
    .addCase(LoadActionTypes.APPLY_OPTIMIZATION_REQUEST, (state) => {
      state.loadingOptimizations = true;
      state.optimizationError = null;
    })
    .addCase(LoadActionTypes.APPLY_OPTIMIZATION_SUCCESS, (state, action) => {
      state.loadingOptimizations = false;
      
      // Remove the applied optimization from recommendations
      state.optimizationRecommendations = state.optimizationRecommendations.filter(
        rec => rec.id !== action.payload.recommendationId
      );
      
      // Update affected loads if provided in payload
      if (action.payload.affectedLoads && action.payload.affectedLoads.length > 0) {
        action.payload.affectedLoads.forEach(loadId => {
          // Mark these loads for refresh on next data fetch
          // In a real implementation, the backend would provide updated load data
        });
      }
    })
    .addCase(LoadActionTypes.APPLY_OPTIMIZATION_FAILURE, (state, action) => {
      state.loadingOptimizations = false;
      state.optimizationError = action.payload.error;
    })

    // Fetch active loads
    .addCase(LoadActionTypes.FETCH_ACTIVE_LOADS_REQUEST, (state) => {
      state.loadingActiveLoads = true;
      state.activeLoadsError = null;
    })
    .addCase(LoadActionTypes.FETCH_ACTIVE_LOADS_SUCCESS, (state, action) => {
      state.loadingActiveLoads = false;
      state.activeLoads = action.payload.loads;
    })
    .addCase(LoadActionTypes.FETCH_ACTIVE_LOADS_FAILURE, (state, action) => {
      state.loadingActiveLoads = false;
      state.activeLoadsError = action.payload.error;
    })

    // Fetch pending loads
    .addCase(LoadActionTypes.FETCH_PENDING_LOADS_REQUEST, (state) => {
      state.loadingPendingLoads = true;
      state.pendingLoadsError = null;
    })
    .addCase(LoadActionTypes.FETCH_PENDING_LOADS_SUCCESS, (state, action) => {
      state.loadingPendingLoads = false;
      state.pendingLoads = action.payload.loads;
    })
    .addCase(LoadActionTypes.FETCH_PENDING_LOADS_FAILURE, (state, action) => {
      state.loadingPendingLoads = false;
      state.pendingLoadsError = action.payload.error;
    })

    // Fetch completed loads
    .addCase(LoadActionTypes.FETCH_COMPLETED_LOADS_REQUEST, (state) => {
      state.loadingCompletedLoads = true;
      state.completedLoadsError = null;
    })
    .addCase(LoadActionTypes.FETCH_COMPLETED_LOADS_SUCCESS, (state, action) => {
      state.loadingCompletedLoads = false;
      state.completedLoads = action.payload.loads;
    })
    .addCase(LoadActionTypes.FETCH_COMPLETED_LOADS_FAILURE, (state, action) => {
      state.loadingCompletedLoads = false;
      state.completedLoadsError = action.payload.error;
    })

    // Fetch upcoming deliveries
    .addCase(LoadActionTypes.FETCH_UPCOMING_DELIVERIES_REQUEST, (state) => {
      state.loadingUpcomingDeliveries = true;
      state.upcomingDeliveriesError = null;
    })
    .addCase(LoadActionTypes.FETCH_UPCOMING_DELIVERIES_SUCCESS, (state, action) => {
      state.loadingUpcomingDeliveries = false;
      state.upcomingDeliveries = action.payload.loads;
    })
    .addCase(LoadActionTypes.FETCH_UPCOMING_DELIVERIES_FAILURE, (state, action) => {
      state.loadingUpcomingDeliveries = false;
      state.upcomingDeliveriesError = action.payload.error;
    });
});

/**
 * Helper function to update a load in an array
 */
function updateLoadInArray(loadArray: Load[], updatedLoad: Load): void {
  const index = loadArray.findIndex(load => load.id === updatedLoad.id);
  if (index !== -1) {
    loadArray[index] = updatedLoad;
  }
}

/**
 * Helper function to update a load's status in an array
 */
function updateLoadStatusInArray(loadArray: Load[], loadId: string, status: string): void {
  const index = loadArray.findIndex(load => load.id === loadId);
  if (index !== -1) {
    loadArray[index].status = status as LoadStatus;
  }
}

/**
 * Helper function to reclassify a load based on its status
 */
function reclassifyLoadByStatus(state: LoadState, loadId: string, status: string): void {
  // Get the load from the main loads array
  const load = state.loads.find(load => load.id === loadId);
  if (!load) return;
  
  // Handle active loads
  if (['assigned', 'in_transit', 'at_pickup', 'loaded', 'at_dropoff'].includes(status)) {
    // Add to active loads if not already there
    if (!state.activeLoads.some(l => l.id === loadId)) {
      state.activeLoads.push(load);
    }
    // Remove from pending loads if present
    state.pendingLoads = state.pendingLoads.filter(l => l.id !== loadId);
  } 
  // Handle pending loads
  else if (['created', 'pending', 'available'].includes(status)) {
    // Add to pending loads if not already there
    if (!state.pendingLoads.some(l => l.id === loadId)) {
      state.pendingLoads.push(load);
    }
    // Remove from active loads if present
    state.activeLoads = state.activeLoads.filter(l => l.id !== loadId);
  }
  // Handle completed loads
  else if (['delivered', 'completed', 'cancelled'].includes(status)) {
    // Add to completed loads if not already there
    if (!state.completedLoads.some(l => l.id === loadId)) {
      state.completedLoads.push(load);
    }
    // Remove from active and pending loads
    state.activeLoads = state.activeLoads.filter(l => l.id !== loadId);
    state.pendingLoads = state.pendingLoads.filter(l => l.id !== loadId);
  }
}

export default loadReducer;