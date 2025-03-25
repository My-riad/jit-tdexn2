import { createReducer, PayloadAction } from '@reduxjs/toolkit'; // ^1.9.5
import {
  TRACKING_ACTION_TYPES
} from '../actions/trackingActions';
import {
  EntityType,
  EntityPosition,
  HistoricalPosition,
  TrajectoryResponse,
  Geofence,
  GeofenceEvent,
  ETAResponse
} from '../../../common/interfaces/tracking.interface';

/**
 * Interface defining the shape of the tracking state in the Redux store
 */
interface TrackingState {
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  currentPositions: Record<string, EntityPosition>;
  positionHistory: Record<string, HistoricalPosition[]>;
  trajectories: Record<string, TrajectoryResponse>;
  nearbyEntities: Record<string, EntityPosition[]>;
  etaData: Record<string, ETAResponse>;
  geofences: Record<string, Geofence>;
  entityGeofences: Record<string, Geofence[]>;
  nearbyGeofences: Record<string, Geofence[]>;
  geofenceEvents: Record<string, GeofenceEvent[]>;
  traveledDistances: Record<string, number>;
  averageSpeeds: Record<string, number>;
  activePositionUpdates: Record<string, boolean>;
  activeGeofenceEvents: Record<string, boolean>;
}

/**
 * Initial state for the tracking reducer
 */
const initialState: TrackingState = {
  loading: {},
  errors: {},
  currentPositions: {},
  positionHistory: {},
  trajectories: {},
  nearbyEntities: {},
  etaData: {},
  geofences: {},
  entityGeofences: {},
  nearbyGeofences: {},
  geofenceEvents: {},
  traveledDistances: {},
  averageSpeeds: {},
  activePositionUpdates: {},
  activeGeofenceEvents: {}
};

/**
 * Redux reducer for tracking-related state management
 */
const trackingReducer = createReducer(initialState, (builder) => {
  builder
    // Current position actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_CURRENT_POSITION_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; bypassCache?: boolean }>) => {
      const { entityId } = action.payload;
      state.loading[`currentPosition_${entityId}`] = true;
      state.errors[`currentPosition_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_CURRENT_POSITION_SUCCESS, (state, action: PayloadAction<{ entityId: string; position: EntityPosition }>) => {
      const { entityId, position } = action.payload;
      state.loading[`currentPosition_${entityId}`] = false;
      state.errors[`currentPosition_${entityId}`] = null;
      state.currentPositions[entityId] = position;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_CURRENT_POSITION_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`currentPosition_${entityId}`] = false;
      state.errors[`currentPosition_${entityId}`] = error;
    })
    
    // Position history actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_POSITION_HISTORY_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; startTime: string; endTime: string; options?: any }>) => {
      const { entityId } = action.payload;
      state.loading[`positionHistory_${entityId}`] = true;
      state.errors[`positionHistory_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_POSITION_HISTORY_SUCCESS, (state, action: PayloadAction<{ entityId: string; history: HistoricalPosition[] }>) => {
      const { entityId, history } = action.payload;
      state.loading[`positionHistory_${entityId}`] = false;
      state.errors[`positionHistory_${entityId}`] = null;
      state.positionHistory[entityId] = history;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_POSITION_HISTORY_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`positionHistory_${entityId}`] = false;
      state.errors[`positionHistory_${entityId}`] = error;
    })
    
    // Trajectory actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAJECTORY_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; startTime: string; endTime: string; simplificationTolerance?: number; bypassCache?: boolean }>) => {
      const { entityId } = action.payload;
      state.loading[`trajectory_${entityId}`] = true;
      state.errors[`trajectory_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAJECTORY_SUCCESS, (state, action: PayloadAction<{ entityId: string; trajectory: TrajectoryResponse }>) => {
      const { entityId, trajectory } = action.payload;
      state.loading[`trajectory_${entityId}`] = false;
      state.errors[`trajectory_${entityId}`] = null;
      state.trajectories[entityId] = trajectory;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAJECTORY_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`trajectory_${entityId}`] = false;
      state.errors[`trajectory_${entityId}`] = error;
    })
    
    // Nearby entities actions
    .addCase(TRACKING_ACTION_TYPES.FIND_NEARBY_ENTITIES_REQUEST, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; entityType?: EntityType; limit?: number }>) => {
      const { latitude, longitude, radius } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyEntities_${queryKey}`] = true;
      state.errors[`nearbyEntities_${queryKey}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FIND_NEARBY_ENTITIES_SUCCESS, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; entities: EntityPosition[] }>) => {
      const { latitude, longitude, radius, entities } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyEntities_${queryKey}`] = false;
      state.errors[`nearbyEntities_${queryKey}`] = null;
      state.nearbyEntities[queryKey] = entities;
    })
    .addCase(TRACKING_ACTION_TYPES.FIND_NEARBY_ENTITIES_FAILURE, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; error: Error }>) => {
      const { latitude, longitude, radius, error } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyEntities_${queryKey}`] = false;
      state.errors[`nearbyEntities_${queryKey}`] = error;
    })
    
    // ETA actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_ETA_REQUEST, (state, action: PayloadAction<{ request: { entityId: string } }>) => {
      const { entityId } = action.payload.request;
      state.loading[`eta_${entityId}`] = true;
      state.errors[`eta_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_ETA_SUCCESS, (state, action: PayloadAction<{ entityId: string; eta: ETAResponse }>) => {
      const { entityId, eta } = action.payload;
      state.loading[`eta_${entityId}`] = false;
      state.errors[`eta_${entityId}`] = null;
      state.etaData[entityId] = eta;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_ETA_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`eta_${entityId}`] = false;
      state.errors[`eta_${entityId}`] = error;
    })
    
    // Geofence CRUD actions
    .addCase(TRACKING_ACTION_TYPES.CREATE_GEOFENCE_REQUEST, (state) => {
      state.loading['createGeofence'] = true;
      state.errors['createGeofence'] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.CREATE_GEOFENCE_SUCCESS, (state, action: PayloadAction<{ geofence: Geofence }>) => {
      const { geofence } = action.payload;
      state.loading['createGeofence'] = false;
      state.errors['createGeofence'] = null;
      state.geofences[geofence.geofenceId] = geofence;
      
      // If the geofence is associated with an entity, update entityGeofences as well
      if (geofence.entityId) {
        const entityGeofences = state.entityGeofences[geofence.entityId] || [];
        state.entityGeofences[geofence.entityId] = [...entityGeofences, geofence];
      }
    })
    .addCase(TRACKING_ACTION_TYPES.CREATE_GEOFENCE_FAILURE, (state, action: PayloadAction<{ error: Error }>) => {
      const { error } = action.payload;
      state.loading['createGeofence'] = false;
      state.errors['createGeofence'] = error;
    })
    
    .addCase(TRACKING_ACTION_TYPES.UPDATE_GEOFENCE_REQUEST, (state, action: PayloadAction<{ geofenceId: string }>) => {
      const { geofenceId } = action.payload;
      state.loading[`updateGeofence_${geofenceId}`] = true;
      state.errors[`updateGeofence_${geofenceId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.UPDATE_GEOFENCE_SUCCESS, (state, action: PayloadAction<{ geofence: Geofence }>) => {
      const { geofence } = action.payload;
      state.loading[`updateGeofence_${geofence.geofenceId}`] = false;
      state.errors[`updateGeofence_${geofence.geofenceId}`] = null;
      state.geofences[geofence.geofenceId] = geofence;
      
      // If the geofence is associated with an entity, update entityGeofences as well
      if (geofence.entityId) {
        const entityGeofences = state.entityGeofences[geofence.entityId] || [];
        const updatedEntityGeofences = entityGeofences.map(g => 
          g.geofenceId === geofence.geofenceId ? geofence : g
        );
        state.entityGeofences[geofence.entityId] = updatedEntityGeofences;
      }
    })
    .addCase(TRACKING_ACTION_TYPES.UPDATE_GEOFENCE_FAILURE, (state, action: PayloadAction<{ geofenceId: string; error: Error }>) => {
      const { geofenceId, error } = action.payload;
      state.loading[`updateGeofence_${geofenceId}`] = false;
      state.errors[`updateGeofence_${geofenceId}`] = error;
    })
    
    .addCase(TRACKING_ACTION_TYPES.DELETE_GEOFENCE_REQUEST, (state, action: PayloadAction<{ geofenceId: string }>) => {
      const { geofenceId } = action.payload;
      state.loading[`deleteGeofence_${geofenceId}`] = true;
      state.errors[`deleteGeofence_${geofenceId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.DELETE_GEOFENCE_SUCCESS, (state, action: PayloadAction<{ geofenceId: string; entityId?: string }>) => {
      const { geofenceId, entityId } = action.payload;
      state.loading[`deleteGeofence_${geofenceId}`] = false;
      state.errors[`deleteGeofence_${geofenceId}`] = null;
      
      // Remove from geofences
      delete state.geofences[geofenceId];
      
      // If entityId is provided, also remove from entityGeofences
      if (entityId && state.entityGeofences[entityId]) {
        state.entityGeofences[entityId] = state.entityGeofences[entityId].filter(
          geofence => geofence.geofenceId !== geofenceId
        );
      }
    })
    .addCase(TRACKING_ACTION_TYPES.DELETE_GEOFENCE_FAILURE, (state, action: PayloadAction<{ geofenceId: string; error: Error }>) => {
      const { geofenceId, error } = action.payload;
      state.loading[`deleteGeofence_${geofenceId}`] = false;
      state.errors[`deleteGeofence_${geofenceId}`] = error;
    })
    
    // Fetch geofence actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_REQUEST, (state, action: PayloadAction<{ geofenceId: string; bypassCache?: boolean }>) => {
      const { geofenceId } = action.payload;
      state.loading[`fetchGeofence_${geofenceId}`] = true;
      state.errors[`fetchGeofence_${geofenceId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_SUCCESS, (state, action: PayloadAction<{ geofence: Geofence }>) => {
      const { geofence } = action.payload;
      state.loading[`fetchGeofence_${geofence.geofenceId}`] = false;
      state.errors[`fetchGeofence_${geofence.geofenceId}`] = null;
      state.geofences[geofence.geofenceId] = geofence;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_FAILURE, (state, action: PayloadAction<{ geofenceId: string; error: Error }>) => {
      const { geofenceId, error } = action.payload;
      state.loading[`fetchGeofence_${geofenceId}`] = false;
      state.errors[`fetchGeofence_${geofenceId}`] = error;
    })
    
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCES_BY_ENTITY_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; activeOnly?: boolean; bypassCache?: boolean }>) => {
      const { entityId } = action.payload;
      state.loading[`fetchGeofencesByEntity_${entityId}`] = true;
      state.errors[`fetchGeofencesByEntity_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCES_BY_ENTITY_SUCCESS, (state, action: PayloadAction<{ entityId: string; geofences: Geofence[] }>) => {
      const { entityId, geofences } = action.payload;
      state.loading[`fetchGeofencesByEntity_${entityId}`] = false;
      state.errors[`fetchGeofencesByEntity_${entityId}`] = null;
      state.entityGeofences[entityId] = geofences;
      
      // Also update the individual geofences
      geofences.forEach(geofence => {
        state.geofences[geofence.geofenceId] = geofence;
      });
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCES_BY_ENTITY_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`fetchGeofencesByEntity_${entityId}`] = false;
      state.errors[`fetchGeofencesByEntity_${entityId}`] = error;
    })
    
    // Nearby geofences actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_NEARBY_GEOFENCES_REQUEST, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; options?: any }>) => {
      const { latitude, longitude, radius } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyGeofences_${queryKey}`] = true;
      state.errors[`nearbyGeofences_${queryKey}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_NEARBY_GEOFENCES_SUCCESS, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; geofences: Geofence[] }>) => {
      const { latitude, longitude, radius, geofences } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyGeofences_${queryKey}`] = false;
      state.errors[`nearbyGeofences_${queryKey}`] = null;
      state.nearbyGeofences[queryKey] = geofences;
      
      // Also update the individual geofences
      geofences.forEach(geofence => {
        state.geofences[geofence.geofenceId] = geofence;
      });
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_NEARBY_GEOFENCES_FAILURE, (state, action: PayloadAction<{ latitude: number; longitude: number; radius: number; error: Error }>) => {
      const { latitude, longitude, radius, error } = action.payload;
      const queryKey = `${latitude}_${longitude}_${radius}`;
      state.loading[`nearbyGeofences_${queryKey}`] = false;
      state.errors[`nearbyGeofences_${queryKey}`] = error;
    })
    
    // Geofence events actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_EVENTS_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; options?: any }>) => {
      const { entityId } = action.payload;
      state.loading[`geofenceEvents_${entityId}`] = true;
      state.errors[`geofenceEvents_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_EVENTS_SUCCESS, (state, action: PayloadAction<{ entityId: string; events: GeofenceEvent[] }>) => {
      const { entityId, events } = action.payload;
      state.loading[`geofenceEvents_${entityId}`] = false;
      state.errors[`geofenceEvents_${entityId}`] = null;
      state.geofenceEvents[entityId] = events;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_EVENTS_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`geofenceEvents_${entityId}`] = false;
      state.errors[`geofenceEvents_${entityId}`] = error;
    })
    
    // Traveled distance actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAVELED_DISTANCE_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; startTime: string; endTime: string }>) => {
      const { entityId } = action.payload;
      state.loading[`traveledDistance_${entityId}`] = true;
      state.errors[`traveledDistance_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAVELED_DISTANCE_SUCCESS, (state, action: PayloadAction<{ entityId: string; distance: number }>) => {
      const { entityId, distance } = action.payload;
      state.loading[`traveledDistance_${entityId}`] = false;
      state.errors[`traveledDistance_${entityId}`] = null;
      state.traveledDistances[entityId] = distance;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_TRAVELED_DISTANCE_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`traveledDistance_${entityId}`] = false;
      state.errors[`traveledDistance_${entityId}`] = error;
    })
    
    // Average speed actions
    .addCase(TRACKING_ACTION_TYPES.FETCH_AVERAGE_SPEED_REQUEST, (state, action: PayloadAction<{ entityId: string; entityType: EntityType; startTime: string; endTime: string }>) => {
      const { entityId } = action.payload;
      state.loading[`averageSpeed_${entityId}`] = true;
      state.errors[`averageSpeed_${entityId}`] = null;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_AVERAGE_SPEED_SUCCESS, (state, action: PayloadAction<{ entityId: string; speed: number }>) => {
      const { entityId, speed } = action.payload;
      state.loading[`averageSpeed_${entityId}`] = false;
      state.errors[`averageSpeed_${entityId}`] = null;
      state.averageSpeeds[entityId] = speed;
    })
    .addCase(TRACKING_ACTION_TYPES.FETCH_AVERAGE_SPEED_FAILURE, (state, action: PayloadAction<{ entityId: string; error: Error }>) => {
      const { entityId, error } = action.payload;
      state.loading[`averageSpeed_${entityId}`] = false;
      state.errors[`averageSpeed_${entityId}`] = error;
    })
    
    // Real-time position updates
    .addCase(TRACKING_ACTION_TYPES.START_POSITION_UPDATES, (state, action: PayloadAction<{ entityId: string }>) => {
      const { entityId } = action.payload;
      state.activePositionUpdates[entityId] = true;
    })
    .addCase(TRACKING_ACTION_TYPES.STOP_POSITION_UPDATES, (state, action: PayloadAction<{ entityId: string }>) => {
      const { entityId } = action.payload;
      state.activePositionUpdates[entityId] = false;
    })
    .addCase(TRACKING_ACTION_TYPES.RECEIVE_POSITION_UPDATE, (state, action: PayloadAction<{ entityId: string; position: EntityPosition }>) => {
      const { entityId, position } = action.payload;
      state.currentPositions[entityId] = position;
    })
    
    // Real-time geofence events
    .addCase(TRACKING_ACTION_TYPES.START_GEOFENCE_EVENTS, (state, action: PayloadAction<{ entityId: string }>) => {
      const { entityId } = action.payload;
      state.activeGeofenceEvents[entityId] = true;
    })
    .addCase(TRACKING_ACTION_TYPES.STOP_GEOFENCE_EVENTS, (state, action: PayloadAction<{ entityId: string }>) => {
      const { entityId } = action.payload;
      state.activeGeofenceEvents[entityId] = false;
    })
    .addCase(TRACKING_ACTION_TYPES.RECEIVE_GEOFENCE_EVENT, (state, action: PayloadAction<GeofenceEvent>) => {
      const event = action.payload;
      const { entityId } = event;
      const currentEvents = state.geofenceEvents[entityId] || [];
      state.geofenceEvents[entityId] = [...currentEvents, event];
    })
    
    // Cache clearing
    .addCase(TRACKING_ACTION_TYPES.CLEAR_TRACKING_CACHE, (state) => {
      // Reset all data collections to empty objects
      state.currentPositions = {};
      state.positionHistory = {};
      state.trajectories = {};
      state.nearbyEntities = {};
      state.etaData = {};
      state.geofences = {};
      state.entityGeofences = {};
      state.nearbyGeofences = {};
      state.geofenceEvents = {};
      state.traveledDistances = {};
      state.averageSpeeds = {};
      
      // Keep active subscriptions
      // activePositionUpdates and activeGeofenceEvents remain unchanged
      
      // Reset loading and errors
      state.loading = {};
      state.errors = {};
    });
});

export default trackingReducer;