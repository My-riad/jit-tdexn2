import {
  takeLatest,
  takeEvery,
  put,
  call,
  all,
  fork,
  take,
  race,
  cancel,
  cancelled,
  delay,
  select,
} from 'redux-saga/effects'; // ^1.1.3
import { eventChannel, END } from 'redux-saga'; // ^1.1.3
import {
  TRACKING_ACTION_TYPES,
  fetchCurrentPositionSuccess,
  fetchCurrentPositionFailure,
  fetchPositionHistorySuccess,
  fetchPositionHistoryFailure,
  fetchTrajectorySuccess,
  fetchTrajectoryFailure,
  findNearbyEntitiesSuccess,
  findNearbyEntitiesFailure,
  fetchETASuccess,
  fetchETAFailure,
  createGeofenceSuccess,
  createGeofenceFailure,
  updateGeofenceSuccess,
  updateGeofenceFailure,
  deleteGeofenceSuccess,
  deleteGeofenceFailure,
  fetchGeofenceSuccess,
  fetchGeofenceFailure,
  fetchGeofencesByEntitySuccess,
  fetchGeofencesByEntityFailure,
  fetchNearbyGeofencesSuccess,
  fetchNearbyGeofencesFailure,
  fetchGeofenceEventsSuccess,
  fetchGeofenceEventsFailure,
  fetchTraveledDistanceSuccess,
  fetchTraveledDistanceFailure,
  fetchAverageSpeedSuccess,
  fetchAverageSpeedFailure,
  receivePositionUpdate,
  receiveGeofenceEvent,
} from '../actions/trackingActions';
import {
  getCurrentPosition,
  getPositionHistory,
  getTrajectory,
  findNearbyEntities,
  getETA,
  createGeofence,
  getGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofencesByEntity,
  getNearbyGeofences,
  getGeofenceEvents,
  getGeofenceEventsByEntity,
  calculateTraveledDistance,
  calculateAverageSpeed,
} from '../../../common/api/trackingApi';
import {
  EntityType,
  NearbyQuery,
  ETARequest,
  GeofenceEvent,
  Position,
} from '../../../common/interfaces/tracking.interface';
import logger from '../../../common/utils/logger';

import { createWebSocketConnection } from '../../../common/services/locationService';

/**
 * Saga that handles fetching the current position of an entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchCurrentPositionSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, and bypassCache from action payload
  const { entityId, entityType, bypassCache } = action.payload;

  try {
    // LD2: Try to call getCurrentPosition with the entityId and entityType
    const position = yield call(getCurrentPosition, entityId, entityType);

    // LD3: If successful, dispatch fetchCurrentPositionSuccess with the position data
    yield put(fetchCurrentPositionSuccess(entityId, entityType, position));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchCurrentPositionFailure with the error message
    logger.error('Error fetching current position', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchCurrentPositionFailure(error.message));
  }
}

/**
 * Saga that handles fetching position history for an entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchPositionHistorySaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, startTime, endTime, and options from action payload
  const { entityId, entityType, startTime, endTime, options } = action.payload;

  try {
    // LD2: Try to call getPositionHistory with the parameters
    const history = yield call(getPositionHistory, entityId, entityType, {
      startTime,
      endTime,
      ...options,
    });

    // LD3: If successful, dispatch fetchPositionHistorySuccess with the history data
    yield put(fetchPositionHistorySuccess(entityId, entityType, history));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchPositionHistoryFailure with the error message
    logger.error('Error fetching position history', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchPositionHistoryFailure(error.message));
  }
}

/**
 * Saga that handles fetching trajectory data for an entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchTrajectorySaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, startTime, endTime, simplificationTolerance, and bypassCache from action payload
  const {
    entityId,
    entityType,
    startTime,
    endTime,
    simplificationTolerance,
    bypassCache,
  } = action.payload;

  // LD2: Create options object with startTime, endTime, and simplificationTolerance
  const options = { startTime, endTime, simplificationTolerance };

  try {
    // LD3: Try to call getTrajectory with entityId, entityType, and options
    const trajectory = yield call(getTrajectory, entityId, entityType, options);

    // LD4: If successful, dispatch fetchTrajectorySuccess with the trajectory data
    yield put(fetchTrajectorySuccess(entityId, entityType, trajectory));
  } catch (error: any) {
    // LD5: If an error occurs, log the error and dispatch fetchTrajectoryFailure with the error message
    logger.error('Error fetching trajectory', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchTrajectoryFailure(error.message));
  }
}

/**
 * Saga that handles finding entities near a specific location
 * @param action The action dispatched to trigger this saga
 */
function* findNearbyEntitiesSaga(action: any): Generator<any, void, any> {
  // LD1: Extract query parameters from action payload
  const query: NearbyQuery = action.payload;

  try {
    // LD2: Try to call findNearbyEntities with the query
    const entities = yield call(findNearbyEntities, query);

    // LD3: If successful, dispatch findNearbyEntitiesSuccess with the nearby entities
    yield put(findNearbyEntitiesSuccess(entities));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch findNearbyEntitiesFailure with the error message
    logger.error('Error finding nearby entities', {
      component: 'trackingSaga',
      query,
      error,
    });
    yield put(findNearbyEntitiesFailure(error.message));
  }
}

/**
 * Saga that handles fetching ETA for an entity to a destination
 * @param action The action dispatched to trigger this saga
 */
function* fetchETASaga(action: any): Generator<any, void, any> {
  // LD1: Extract request and bypassCache from action payload
  const { request, bypassCache } = action.payload;

  try {
    // LD2: Try to call getETA with the request parameters
    const eta = yield call(
      getETA,
      request.entityId,
      request.entityType,
      request.destinationLatitude,
      request.destinationLongitude,
      request.options
    );

    // LD3: If successful, dispatch fetchETASuccess with the ETA data
    yield put(fetchETASuccess(eta));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchETAFailure with the error message
    logger.error('Error fetching ETA', {
      component: 'trackingSaga',
      request,
      error,
    });
    yield put(fetchETAFailure(error.message));
  }
}

/**
 * Saga that handles creating a new geofence
 * @param action The action dispatched to trigger this saga
 */
function* createGeofenceSaga(action: any): Generator<any, void, any> {
  // LD1: Extract geofence data from action payload
  const geofence = action.payload;

  try {
    // LD2: Try to call createGeofence with the geofence data
    const createdGeofence = yield call(createGeofence, geofence);

    // LD3: If successful, dispatch createGeofenceSuccess with the created geofence
    yield put(createGeofenceSuccess(createdGeofence));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch createGeofenceFailure with the error message
    logger.error('Error creating geofence', {
      component: 'trackingSaga',
      geofence,
      error,
    });
    yield put(createGeofenceFailure(error.message));
  }
}

/**
 * Saga that handles updating an existing geofence
 * @param action The action dispatched to trigger this saga
 */
function* updateGeofenceSaga(action: any): Generator<any, void, any> {
  // LD1: Extract geofenceId and geofence update data from action payload
  const { geofenceId, geofence } = action.payload;

  try {
    // LD2: Try to call updateGeofence with the geofenceId and update data
    const updatedGeofence = yield call(updateGeofence, geofenceId, geofence);

    // LD3: If successful, dispatch updateGeofenceSuccess with the updated geofence
    yield put(updateGeofenceSuccess(updatedGeofence));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch updateGeofenceFailure with the error message
    logger.error('Error updating geofence', {
      component: 'trackingSaga',
      geofenceId,
      geofence,
      error,
    });
    yield put(updateGeofenceFailure(error.message));
  }
}

/**
 * Saga that handles deleting a geofence
 * @param action The action dispatched to trigger this saga
 */
function* deleteGeofenceSaga(action: any): Generator<any, void, any> {
  // LD1: Extract geofenceId from action payload
  const { payload: geofenceId } = action;

  try {
    // LD2: Try to call deleteGeofence with the geofenceId
    yield call(deleteGeofence, geofenceId);

    // LD3: If successful, dispatch deleteGeofenceSuccess with the geofenceId
    yield put(deleteGeofenceSuccess(geofenceId));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch deleteGeofenceFailure with the error message
    logger.error('Error deleting geofence', {
      component: 'trackingSaga',
      geofenceId,
      error,
    });
    yield put(deleteGeofenceFailure(error.message));
  }
}

/**
 * Saga that handles fetching a specific geofence
 * @param action The action dispatched to trigger this saga
 */
function* fetchGeofenceSaga(action: any): Generator<any, void, any> {
  // LD1: Extract geofenceId and bypassCache from action payload
  const { geofenceId, bypassCache } = action.payload;

  try {
    // LD2: Try to call getGeofence with the geofenceId
    const geofence = yield call(getGeofence, geofenceId);

    // LD3: If successful, dispatch fetchGeofenceSuccess with the geofence data
    yield put(fetchGeofenceSuccess(geofence));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchGeofenceFailure with the error message
    logger.error('Error fetching geofence', {
      component: 'trackingSaga',
      geofenceId,
      error,
    });
    yield put(fetchGeofenceFailure(error.message));
  }
}

/**
 * Saga that handles fetching geofences associated with a specific entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchGeofencesByEntitySaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, activeOnly, and bypassCache from action payload
  const { entityId, entityType, activeOnly, bypassCache } = action.payload;

  try {
    // LD2: Try to call getGeofencesByEntity with the parameters
    const geofences = yield call(getGeofencesByEntity, entityId, entityType, activeOnly, bypassCache);

    // LD3: If successful, dispatch fetchGeofencesByEntitySuccess with the geofences
    yield put(fetchGeofencesByEntitySuccess(entityId, entityType, geofences));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchGeofencesByEntityFailure with the error message
    logger.error('Error fetching geofences by entity', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchGeofencesByEntityFailure(error.message));
  }
}

/**
 * Saga that handles fetching geofences near a specific location
 * @param action The action dispatched to trigger this saga
 */
function* fetchNearbyGeofencesSaga(action: any): Generator<any, void, any> {
  // LD1: Extract latitude, longitude, radius, and options from action payload
  const { latitude, longitude, radius, options } = action.payload;

  try {
    // LD2: Try to call getNearbyGeofences with the parameters
    const geofences = yield call(getNearbyGeofences, latitude, longitude, radius, options);

    // LD3: If successful, dispatch fetchNearbyGeofencesSuccess with the geofences
    yield put(fetchNearbyGeofencesSuccess(latitude, longitude, radius, geofences));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchNearbyGeofencesFailure with the error message
    logger.error('Error fetching nearby geofences', {
      component: 'trackingSaga',
      latitude,
      longitude,
      radius,
      error,
    });
    yield put(fetchNearbyGeofencesFailure(error.message));
  }
}

/**
 * Saga that handles fetching geofence events for a specific entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchGeofenceEventsSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, and options from action payload
  const { entityId, entityType, options } = action.payload;

  try {
    // LD2: Try to call getGeofenceEventsByEntity with the parameters
    const events = yield call(getGeofenceEventsByEntity, entityId, entityType, options);

    // LD3: If successful, dispatch fetchGeofenceEventsSuccess with the events
    yield put(fetchGeofenceEventsSuccess(entityId, entityType, events));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchGeofenceEventsFailure with the error message
    logger.error('Error fetching geofence events', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchGeofenceEventsFailure(error.message));
  }
}

/**
 * Saga that handles fetching the distance traveled by an entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchTraveledDistanceSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, startTime, and endTime from action payload
  const { entityId, entityType, startTime, endTime } = action.payload;

  try {
    // LD2: Try to call calculateTraveledDistance with the parameters
    const result = yield call(calculateTraveledDistance, entityId, entityType, startTime, endTime);

    // LD3: If successful, dispatch fetchTraveledDistanceSuccess with the distance data
    yield put(fetchTraveledDistanceSuccess(entityId, entityType, result.distance));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchTraveledDistanceFailure with the error message
    logger.error('Error fetching traveled distance', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchTraveledDistanceFailure(error.message));
  }
}

/**
 * Saga that handles fetching the average speed of an entity
 * @param action The action dispatched to trigger this saga
 */
function* fetchAverageSpeedSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId, entityType, startTime, and endTime from action payload
  const { entityId, entityType, startTime, endTime } = action.payload;

  try {
    // LD2: Try to call calculateAverageSpeed with the parameters
    const result = yield call(calculateAverageSpeed, entityId, entityType, startTime, endTime);

    // LD3: If successful, dispatch fetchAverageSpeedSuccess with the speed data
    yield put(fetchAverageSpeedSuccess(entityId, entityType, result.speed));
  } catch (error: any) {
    // LD4: If an error occurs, log the error and dispatch fetchAverageSpeedFailure with the error message
    logger.error('Error fetching average speed', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
    yield put(fetchAverageSpeedFailure(error.message));
  }
}

/**
 * Creates an event channel for real-time position updates
 * @param entityId The ID of the entity to track
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
function createPositionUpdateChannel(entityId: string, entityType: EntityType) {
  // LD1: Create an event channel using eventChannel
  return eventChannel((emit) => {
    // LD2: Inside the channel, create a WebSocket connection using createWebSocketConnection
    const ws = createWebSocketConnection();

    // LD3: Set up event listeners for position updates
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // LD4: When a position update is received, emit it through the channel
        if (data.entityId === entityId && data.entityType === entityType && data.position) {
          emit(data);
        }
      } catch (error) {
        logger.error('Error parsing position update', {
          component: 'trackingSaga',
          entityId,
          entityType,
          error,
        });
      }
    };

    // LD5: Handle WebSocket errors and connection closures
    ws.onerror = (error) => {
      logger.error('WebSocket error', {
        component: 'trackingSaga',
        entityId,
        entityType,
        error,
      });
      emit(new Error('WebSocket error'));
    };

    ws.onclose = () => {
      logger.info('WebSocket connection closed', {
        component: 'trackingSaga',
        entityId,
        entityType,
      });
      emit(END);
    };

    // LD6: Return a cleanup function that closes the WebSocket connection
    const unsubscribe = () => {
      ws.close();
    };

    return unsubscribe;
  });
}

/**
 * Creates an event channel for real-time geofence events
 * @param entityId The ID of the entity to track
 * @param entityType The type of entity (driver, vehicle, load, etc.)
 */
function createGeofenceEventChannel(entityId: string, entityType: EntityType) {
  // LD1: Create an event channel using eventChannel
  return eventChannel((emit) => {
    // LD2: Inside the channel, create a WebSocket connection using createWebSocketConnection
    const ws = createWebSocketConnection();

    // LD3: Set up event listeners for geofence events
    ws.onmessage = (event) => {
      try {
        const data: GeofenceEvent = JSON.parse(event.data);
        // LD4: When a geofence event is received, emit it through the channel
        if (data.entityId === entityId && data.entityType === entityType) {
          emit(data);
        }
      } catch (error) {
        logger.error('Error parsing geofence event', {
          component: 'trackingSaga',
          entityId,
          entityType,
          error,
        });
      }
    };

    // LD5: Handle WebSocket errors and connection closures
    ws.onerror = (error) => {
      logger.error('WebSocket error', {
        component: 'trackingSaga',
        entityId,
        entityType,
        error,
      });
      emit(new Error('WebSocket error'));
    };

    ws.onclose = () => {
      logger.info('WebSocket connection closed', {
        component: 'trackingSaga',
        entityId,
        entityType,
      });
      emit(END);
    };

    // LD6: Return a cleanup function that closes the WebSocket connection
    const unsubscribe = () => {
      ws.close();
    };

    return unsubscribe;
  });
}

/**
 * Saga that handles starting and stopping real-time position updates
 * @param action The action dispatched to trigger this saga
 */
function* watchPositionUpdatesSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId and entityType from action payload
  const { entityId, entityType } = action.payload;

  // Create a channel for position updates
  const positionUpdateChannel = yield call(createPositionUpdateChannel, entityId, entityType);

  try {
    // LD2: Set up a loop to receive position updates from the channel
    while (true) {
      // LD3: For each update, dispatch receivePositionUpdate with the position data
      const { position } = yield take(positionUpdateChannel);
      yield put(receivePositionUpdate(entityId, entityType, position));
    }
  } catch (error) {
    // LD4: Handle channel completion and errors
    logger.error('Error watching position updates', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
  } finally {
    // LD5: Watch for STOP_POSITION_UPDATES action for the same entity
    if (yield cancelled()) {
      // LD6: When stop action is received, cancel the channel and clean up
      positionUpdateChannel.close();
      logger.info('Position updates cancelled', {
        component: 'trackingSaga',
        entityId,
        entityType,
      });
    }
  }
}

/**
 * Saga that handles starting and stopping real-time geofence event monitoring
 * @param action The action dispatched to trigger this saga
 */
function* watchGeofenceEventsSaga(action: any): Generator<any, void, any> {
  // LD1: Extract entityId and entityType from action payload
  const { entityId, entityType } = action.payload;

  // Create a channel for geofence events
  const geofenceEventChannel = yield call(createGeofenceEventChannel, entityId, entityType);

  try {
    // LD2: Set up a loop to receive geofence events from the channel
    while (true) {
      // LD3: For each event, dispatch receiveGeofenceEvent with the event data
      const geofenceEvent: GeofenceEvent = yield take(geofenceEventChannel);
      yield put(receiveGeofenceEvent(geofenceEvent));
    }
  } catch (error) {
    // LD4: Handle channel completion and errors
    logger.error('Error watching geofence events', {
      component: 'trackingSaga',
      entityId,
      entityType,
      error,
    });
  } finally {
    // LD5: Watch for STOP_GEOFENCE_EVENTS action for the same entity
    if (yield cancelled()) {
      // LD6: When stop action is received, cancel the channel and clean up
      geofenceEventChannel.close();
      logger.info('Geofence events cancelled', {
        component: 'trackingSaga',
        entityId,
        entityType,
      });
    }
  }
}

/**
 * Root saga watcher that listens for tracking-related actions and triggers the appropriate sagas
 */
export default function* watchTracking(): Generator<any, void, any> {
  // LD1: Yield all to combine multiple takeLatest and fork effects
  yield all([
    // LD2: Use takeLatest for FETCH_CURRENT_POSITION_REQUEST to handle fetchCurrentPositionSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_CURRENT_POSITION_REQUEST, fetchCurrentPositionSaga),

    // LD3: Use takeLatest for FETCH_POSITION_HISTORY_REQUEST to handle fetchPositionHistorySaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_POSITION_HISTORY_REQUEST, fetchPositionHistorySaga),

    // LD4: Use takeLatest for FETCH_TRAJECTORY_REQUEST to handle fetchTrajectorySaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_TRAJECTORY_REQUEST, fetchTrajectorySaga),

    // LD5: Use takeLatest for FIND_NEARBY_ENTITIES_REQUEST to handle findNearbyEntitiesSaga
    takeLatest(TRACKING_ACTION_TYPES.FIND_NEARBY_ENTITIES_REQUEST, findNearbyEntitiesSaga),

    // LD6: Use takeLatest for FETCH_ETA_REQUEST to handle fetchETASaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_ETA_REQUEST, fetchETASaga),

    // LD7: Use takeLatest for CREATE_GEOFENCE_REQUEST to handle createGeofenceSaga
    takeLatest(TRACKING_ACTION_TYPES.CREATE_GEOFENCE_REQUEST, createGeofenceSaga),

    // LD8: Use takeLatest for UPDATE_GEOFENCE_REQUEST to handle updateGeofenceSaga
    takeLatest(TRACKING_ACTION_TYPES.UPDATE_GEOFENCE_REQUEST, updateGeofenceSaga),

    // LD9: Use takeLatest for DELETE_GEOFENCE_REQUEST to handle deleteGeofenceSaga
    takeLatest(TRACKING_ACTION_TYPES.DELETE_GEOFENCE_REQUEST, deleteGeofenceSaga),

    // LD10: Use takeLatest for FETCH_GEOFENCE_REQUEST to handle fetchGeofenceSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_REQUEST, fetchGeofenceSaga),

    // LD11: Use takeLatest for FETCH_GEOFENCES_BY_ENTITY_REQUEST to handle fetchGeofencesByEntitySaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_GEOFENCES_BY_ENTITY_REQUEST, fetchGeofencesByEntitySaga),

    // LD12: Use takeLatest for FETCH_NEARBY_GEOFENCES_REQUEST to handle fetchNearbyGeofencesSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_NEARBY_GEOFENCES_REQUEST, fetchNearbyGeofencesSaga),

    // LD13: Use takeLatest for FETCH_GEOFENCE_EVENTS_REQUEST to handle fetchGeofenceEventsSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_GEOFENCE_EVENTS_REQUEST, fetchGeofenceEventsSaga),

    // LD14: Use takeLatest for FETCH_TRAVELED_DISTANCE_REQUEST to handle fetchTraveledDistanceSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_TRAVELED_DISTANCE_REQUEST, fetchTraveledDistanceSaga),

    // LD15: Use takeLatest for FETCH_AVERAGE_SPEED_REQUEST to handle fetchAverageSpeedSaga
    takeLatest(TRACKING_ACTION_TYPES.FETCH_AVERAGE_SPEED_REQUEST, fetchAverageSpeedSaga),

    // LD16: Use takeEvery for START_POSITION_UPDATES to handle watchPositionUpdatesSaga
    takeEvery(TRACKING_ACTION_TYPES.START_POSITION_UPDATES, watchPositionUpdatesSaga),

    // LD17: Use takeEvery for START_GEOFENCE_EVENTS to handle watchGeofenceEventsSaga
    takeEvery(TRACKING_ACTION_TYPES.START_GEOFENCE_EVENTS, watchGeofenceEventsSaga),
  ]);
}