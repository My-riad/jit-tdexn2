import { AnyAction } from 'redux'; // v4.2.1
import { LOAD_ACTION_TYPES } from '../actions/loadActions';
import { Load, LoadSummary, LoadWithDetails, LoadDocument } from '../../../common/interfaces/load.interface';

/**
 * Interface defining the structure of the load state in the Redux store
 */
export interface LoadState {
  // Loading flags
  loading: boolean;
  loadingDetail: boolean;
  loadingDocuments: boolean;
  loadingRecommendations: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  updatingStatus: boolean;
  uploadingDocument: boolean;
  deletingDocument: boolean;
  assigningCarrier: boolean;

  // Data
  loads: LoadSummary[];
  selectedLoad: LoadWithDetails | null;
  documents: LoadDocument[];
  carrierRecommendations: any[]; // Using any[] as the specific carrier recommendation interface isn't provided

  // Pagination
  totalLoads: number;
  currentPage: number;
  pageSize: number;

  // Errors
  error: Error | null;
  detailError: Error | null;
  documentsError: Error | null;
  recommendationsError: Error | null;
  createError: Error | null;
  updateError: Error | null;
  deleteError: Error | null;
  statusError: Error | null;
  documentUploadError: Error | null;
  documentDeleteError: Error | null;
  assignCarrierError: Error | null;
}

/**
 * Initial state for the load reducer
 */
const initialState: LoadState = {
  // Loading flags
  loading: false,
  loadingDetail: false,
  loadingDocuments: false,
  loadingRecommendations: false,
  creating: false,
  updating: false,
  deleting: false,
  updatingStatus: false,
  uploadingDocument: false,
  deletingDocument: false,
  assigningCarrier: false,

  // Data
  loads: [],
  selectedLoad: null,
  documents: [],
  carrierRecommendations: [],

  // Pagination
  totalLoads: 0,
  currentPage: 1,
  pageSize: 10,

  // Errors
  error: null,
  detailError: null,
  documentsError: null,
  recommendationsError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  statusError: null,
  documentUploadError: null,
  documentDeleteError: null,
  assignCarrierError: null
};

/**
 * Redux reducer function that handles state updates for load-related actions
 */
const loadReducer = (state: LoadState = initialState, action: AnyAction): LoadState => {
  switch (action.type) {
    // Fetch loads (list)
    case LOAD_ACTION_TYPES.FETCH_LOADS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case LOAD_ACTION_TYPES.FETCH_LOADS_SUCCESS:
      return {
        ...state,
        loading: false,
        loads: action.payload.loads,
        totalLoads: action.payload.pagination.total,
        currentPage: action.payload.pagination.page,
        pageSize: action.payload.pagination.limit
      };
    case LOAD_ACTION_TYPES.FETCH_LOADS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };

    // Fetch single load details
    case LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_REQUEST:
      return {
        ...state,
        loadingDetail: true,
        detailError: null
      };
    case LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_SUCCESS:
      return {
        ...state,
        loadingDetail: false,
        selectedLoad: action.payload
      };
    case LOAD_ACTION_TYPES.FETCH_LOAD_DETAIL_FAILURE:
      return {
        ...state,
        loadingDetail: false,
        detailError: action.payload.error
      };

    // Create load
    case LOAD_ACTION_TYPES.CREATE_LOAD_REQUEST:
      return {
        ...state,
        creating: true,
        createError: null
      };
    case LOAD_ACTION_TYPES.CREATE_LOAD_SUCCESS:
      return {
        ...state,
        creating: false,
        loads: [action.payload, ...state.loads],
        totalLoads: state.totalLoads + 1
      };
    case LOAD_ACTION_TYPES.CREATE_LOAD_FAILURE:
      return {
        ...state,
        creating: false,
        createError: action.payload.error
      };

    // Update load
    case LOAD_ACTION_TYPES.UPDATE_LOAD_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null
      };
    case LOAD_ACTION_TYPES.UPDATE_LOAD_SUCCESS:
      return {
        ...state,
        updating: false,
        loads: state.loads.map(load => 
          load.id === action.payload.id ? { ...load, ...action.payload } : load
        ),
        selectedLoad: state.selectedLoad && state.selectedLoad.id === action.payload.id 
          ? { ...state.selectedLoad, ...action.payload } 
          : state.selectedLoad
      };
    case LOAD_ACTION_TYPES.UPDATE_LOAD_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: action.payload.error
      };

    // Delete load
    case LOAD_ACTION_TYPES.DELETE_LOAD_REQUEST:
      return {
        ...state,
        deleting: true,
        deleteError: null
      };
    case LOAD_ACTION_TYPES.DELETE_LOAD_SUCCESS:
      return {
        ...state,
        deleting: false,
        loads: state.loads.filter(load => load.id !== action.payload.loadId),
        totalLoads: state.totalLoads - 1,
        selectedLoad: state.selectedLoad && state.selectedLoad.id === action.payload.loadId 
          ? null 
          : state.selectedLoad
      };
    case LOAD_ACTION_TYPES.DELETE_LOAD_FAILURE:
      return {
        ...state,
        deleting: false,
        deleteError: action.payload.error
      };

    // Update load status
    case LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_REQUEST:
      return {
        ...state,
        updatingStatus: true,
        statusError: null
      };
    case LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_SUCCESS: {
      const { loadId, status, statusDetails } = action.payload;
      return {
        ...state,
        updatingStatus: false,
        loads: state.loads.map(load => 
          load.id === loadId ? { ...load, status } : load
        ),
        selectedLoad: state.selectedLoad && state.selectedLoad.id === loadId 
          ? { 
              ...state.selectedLoad, 
              status,
              statusHistory: [
                { 
                  id: Date.now().toString(), // Generate temporary ID
                  loadId,
                  status,
                  statusDetails,
                  coordinates: statusDetails?.coordinates || null,
                  updatedBy: statusDetails?.updatedBy || 'system',
                  timestamp: new Date().toISOString()
                },
                ...(state.selectedLoad.statusHistory || [])
              ] 
            } 
          : state.selectedLoad
      };
    }
    case LOAD_ACTION_TYPES.UPDATE_LOAD_STATUS_FAILURE:
      return {
        ...state,
        updatingStatus: false,
        statusError: action.payload.error
      };

    // Load documents
    case LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_REQUEST:
      return {
        ...state,
        loadingDocuments: true,
        documentsError: null
      };
    case LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_SUCCESS:
      return {
        ...state,
        loadingDocuments: false,
        documents: action.payload.documents,
        selectedLoad: state.selectedLoad && state.selectedLoad.id === action.payload.loadId 
          ? { 
              ...state.selectedLoad, 
              documents: action.payload.documents 
            } 
          : state.selectedLoad
      };
    case LOAD_ACTION_TYPES.FETCH_LOAD_DOCUMENTS_FAILURE:
      return {
        ...state,
        loadingDocuments: false,
        documentsError: action.payload.error
      };

    // Upload document
    case LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_REQUEST:
      return {
        ...state,
        uploadingDocument: true,
        documentUploadError: null
      };
    case LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_SUCCESS:
      return {
        ...state,
        uploadingDocument: false,
        documents: [...state.documents, action.payload.document],
        selectedLoad: state.selectedLoad && state.selectedLoad.id === action.payload.loadId 
          ? { 
              ...state.selectedLoad, 
              documents: [...(state.selectedLoad.documents || []), action.payload.document] 
            } 
          : state.selectedLoad
      };
    case LOAD_ACTION_TYPES.UPLOAD_LOAD_DOCUMENT_FAILURE:
      return {
        ...state,
        uploadingDocument: false,
        documentUploadError: action.payload.error
      };

    // Delete document
    case LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_REQUEST:
      return {
        ...state,
        deletingDocument: true,
        documentDeleteError: null
      };
    case LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_SUCCESS: {
      const { loadId, documentId } = action.payload;
      return {
        ...state,
        deletingDocument: false,
        documents: state.documents.filter(doc => doc.id !== documentId),
        selectedLoad: state.selectedLoad && state.selectedLoad.id === loadId 
          ? { 
              ...state.selectedLoad, 
              documents: state.selectedLoad.documents.filter(doc => doc.id !== documentId) 
            } 
          : state.selectedLoad
      };
    }
    case LOAD_ACTION_TYPES.DELETE_LOAD_DOCUMENT_FAILURE:
      return {
        ...state,
        deletingDocument: false,
        documentDeleteError: action.payload.error
      };

    // Carrier recommendations
    case LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_REQUEST:
      return {
        ...state,
        loadingRecommendations: true,
        recommendationsError: null
      };
    case LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_SUCCESS:
      return {
        ...state,
        loadingRecommendations: false,
        carrierRecommendations: action.payload.recommendations,
        selectedLoad: state.selectedLoad && state.selectedLoad.id === action.payload.loadId 
          ? { 
              ...state.selectedLoad, 
              carrierRecommendations: action.payload.recommendations 
            } 
          : state.selectedLoad
      };
    case LOAD_ACTION_TYPES.GET_CARRIER_RECOMMENDATIONS_FAILURE:
      return {
        ...state,
        loadingRecommendations: false,
        recommendationsError: action.payload.error
      };

    // Assign load to carrier
    case LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_REQUEST:
      return {
        ...state,
        assigningCarrier: true,
        assignCarrierError: null
      };
    case LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_SUCCESS: {
      const { loadId, carrierId, assignmentId, rate } = action.payload;
      // Update load status to ASSIGNED in the loads list
      const updatedLoads = state.loads.map(load => 
        load.id === loadId 
          ? { 
              ...load, 
              status: 'assigned',
              assignedDriver: { 
                id: carrierId, 
                name: state.carrierRecommendations.find(c => c.id === carrierId)?.name || 'Assigned Driver' 
              }
            } 
          : load
      );
      
      return {
        ...state,
        assigningCarrier: false,
        loads: updatedLoads,
        selectedLoad: state.selectedLoad && state.selectedLoad.id === loadId 
          ? { 
              ...state.selectedLoad, 
              status: 'assigned',
              assignments: [
                {
                  id: assignmentId,
                  loadId,
                  driverId: carrierId,
                  vehicleId: '',
                  assignmentType: 'direct',
                  status: 'assigned',
                  segmentStartLocation: null,
                  segmentEndLocation: null,
                  agreedRate: rate,
                  efficiencyScore: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                ...(state.selectedLoad.assignments || [])
              ],
              statusHistory: [
                { 
                  id: Date.now().toString(), // Generate temporary ID
                  loadId,
                  status: 'assigned',
                  statusDetails: { carrierId, assignmentId, rate },
                  coordinates: null,
                  updatedBy: 'system',
                  timestamp: new Date().toISOString()
                },
                ...(state.selectedLoad.statusHistory || [])
              ]
            } 
          : state.selectedLoad
      };
    }
    case LOAD_ACTION_TYPES.ASSIGN_LOAD_TO_CARRIER_FAILURE:
      return {
        ...state,
        assigningCarrier: false,
        assignCarrierError: action.payload.error
      };

    // Clear load cache
    case LOAD_ACTION_TYPES.CLEAR_LOAD_CACHE:
      return {
        ...state,
        selectedLoad: null,
        documents: [],
        carrierRecommendations: [],
        detailError: null,
        documentsError: null,
        recommendationsError: null
      };

    default:
      return state;
  }
};

export default loadReducer;