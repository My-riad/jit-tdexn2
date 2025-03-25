import io from 'socket.io-client'; // ^4.6.1
import * as trackingApi from '../../../common/api/trackingApi';
import { 
  EntityType, 
  Position, 
  EntityPosition, 
  TrajectoryResponse, 
  ETAResponse 
} from '../../../common/interfaces/tracking.interface';
import { handleApiError } from '../../../common/utils/errorHandlers';
import logger from '../../../common/utils/logger';
import { getLoadById } from '../../../common/api/loadApi';

// Constants
const POSITION_CACHE_PREFIX = 'shipper_position_';
const POSITION_CACHE_EXPIRY = 30 * 1000; // 30 seconds
const TRAJECTORY_CACHE_PREFIX = 'shipper_trajectory_';
const TRAJECTORY_CACHE_EXPIRY = 60 * 1000; // 60 seconds
const WEBSOCKET_URL = process.env.REACT_APP_TRACKING_WEBSOCKET_URL || 'wss://api.freightoptimization.com/tracking';

// Socket.io client instance
let socket: any = null;
let socketConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Active subscriptions
const activeSubscriptions: Record<string, Set<Function>> = {};

/**
 * Ensures socket connection is established
 * @returns Promise that resolves when socket is connected
 */
function ensureSocketConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socketConnected && socket) {
      resolve();
      return;
    }

    if (!socket) {
      try {
        socket = io(WEBSOCKET_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          transports: ['websocket']
        });

        socket.on('connect', () => {
          logger.info('Tracking WebSocket connected');
          socketConnected = true;
          reconnectAttempts = 0;
          resolve();
        });

        socket.on('disconnect', () => {
          logger.info('Tracking WebSocket disconnected');
          socketConnected = false;
        });

        socket.on('connect_error', (error: any) => {
          logger.error('Tracking WebSocket connection error', { error });
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            reject(new Error('Failed to connect to tracking service after maximum attempts'));
          }
          reconnectAttempts++;
        });
      } catch (error) {
        logger.error('Error creating socket connection', { error });
        reject(error);
      }
    } else if (socket.connecting) {
      socket.once('connect', () => {
        socketConnected = true;
        resolve();
      });
    } else {
      reject(new Error('Socket connection failed'));
    }
  });
}

/**
 * Generates a cache key for position data
 * @param entityId Entity ID
 * @param entityType Entity type
 * @returns Cache key string
 */
function getPositionCacheKey(entityId: string, entityType: EntityType): string {
  return `${POSITION_CACHE_PREFIX}${entityType}_${entityId}`;
}

/**
 * Generates a cache key for trajectory data
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param options Optional parameters for trajectory
 * @returns Cache key string
 */
function getTrajectoryCacheKey(entityId: string, entityType: EntityType, options?: any): string {
  const optionsStr = options ? `_${JSON.stringify(options)}` : '';
  return `${TRAJECTORY_CACHE_PREFIX}${entityType}_${entityId}${optionsStr}`;
}

/**
 * Gets cached position data if available and not expired
 * @param key Cache key
 * @returns Cached position data or null
 */
function getPositionFromCache(key: string): EntityPosition | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    const { data, timestamp } = JSON.parse(cachedData);
    const now = Date.now();

    if (now - timestamp > POSITION_CACHE_EXPIRY) {
      // Cache expired
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error retrieving position from cache', { error, key });
    return null;
  }
}

/**
 * Saves position data to cache
 * @param key Cache key
 * @param data Position data
 */
function savePositionToCache(key: string, data: EntityPosition): void {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    logger.error('Error saving position to cache', { error, key });
  }
}

/**
 * Gets cached trajectory data if available and not expired
 * @param key Cache key
 * @returns Cached trajectory data or null
 */
function getTrajectoryFromCache(key: string): TrajectoryResponse | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    const { data, timestamp } = JSON.parse(cachedData);
    const now = Date.now();

    if (now - timestamp > TRAJECTORY_CACHE_EXPIRY) {
      // Cache expired
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error retrieving trajectory from cache', { error, key });
    return null;
  }
}

/**
 * Saves trajectory data to cache
 * @param key Cache key
 * @param data Trajectory data
 */
function saveTrajectoryToCache(key: string, data: TrajectoryResponse): void {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    logger.error('Error saving trajectory to cache', { error, key });
  }
}

/**
 * Gets the current position for a specific entity (driver, vehicle, or load)
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param bypassCache Whether to bypass cache
 * @returns Current position or null
 */
export async function getCurrentPosition(
  entityId: string, 
  entityType: EntityType,
  bypassCache: boolean = false
): Promise<EntityPosition | null> {
  try {
    const cacheKey = getPositionCacheKey(entityId, entityType);
    
    // Try to get from cache first if not bypassing cache
    if (!bypassCache) {
      const cachedPosition = getPositionFromCache(cacheKey);
      if (cachedPosition) {
        logger.debug('Retrieved position from cache', { entityId, entityType });
        return cachedPosition;
      }
    }

    // Get from API
    logger.debug('Fetching current position from API', { entityId, entityType });
    const position = await trackingApi.getCurrentPosition(entityId, entityType);
    
    // Save to cache
    savePositionToCache(cacheKey, position);
    
    return position;
  } catch (error) {
    logger.error('Error getting current position', { 
      error, 
      entityId, 
      entityType 
    });
    
    if (error instanceof Error) {
      // Handle API errors
      return null;
    }
    
    throw error;
  }
}

/**
 * Gets historical positions for an entity within a time range
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param options Options for filtering historical positions
 * @returns Array of historical positions
 */
export async function getPositionHistory(
  entityId: string,
  entityType: EntityType,
  options: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Position[]> {
  try {
    logger.debug('Fetching position history', { entityId, entityType, options });
    
    const history = await trackingApi.getPositionHistory(
      entityId,
      entityType,
      options
    );
    
    return history;
  } catch (error) {
    logger.error('Error getting position history', { 
      error, 
      entityId, 
      entityType, 
      options 
    });
    
    throw handleApiError(error);
  }
}

/**
 * Gets a simplified trajectory for an entity within a time range for map visualization
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param options Options for trajectory generation
 * @param bypassCache Whether to bypass cache
 * @returns Simplified trajectory data or null
 */
export async function getTrajectory(
  entityId: string,
  entityType: EntityType,
  options: {
    startTime?: string;
    endTime?: string;
    simplificationTolerance?: number;
  } = {},
  bypassCache: boolean = false
): Promise<TrajectoryResponse | null> {
  try {
    const cacheKey = getTrajectoryCacheKey(entityId, entityType, options);
    
    // Try to get from cache first if not bypassing cache
    if (!bypassCache) {
      const cachedTrajectory = getTrajectoryFromCache(cacheKey);
      if (cachedTrajectory) {
        logger.debug('Retrieved trajectory from cache', { entityId, entityType, options });
        return cachedTrajectory;
      }
    }

    // Get from API
    logger.debug('Fetching trajectory from API', { entityId, entityType, options });
    const trajectory = await trackingApi.getTrajectory(
      entityId,
      entityType,
      options
    );
    
    // Save to cache
    saveTrajectoryToCache(cacheKey, trajectory);
    
    return trajectory;
  } catch (error) {
    logger.error('Error getting trajectory', { 
      error, 
      entityId, 
      entityType, 
      options 
    });
    
    if (error instanceof Error) {
      // Handle API errors
      return null;
    }
    
    throw error;
  }
}

/**
 * Gets the estimated time of arrival for an entity to a destination
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param destinationLatitude Destination latitude
 * @param destinationLongitude Destination longitude
 * @param options Additional options for ETA calculation
 * @returns ETA calculation result or null
 */
export async function getETA(
  entityId: string,
  entityType: EntityType,
  destinationLatitude: number,
  destinationLongitude: number,
  options: {
    considerTraffic?: boolean;
    considerWeather?: boolean;
    considerDriverPatterns?: boolean;
    considerHOS?: boolean;
  } = {}
): Promise<ETAResponse | null> {
  try {
    logger.debug('Fetching ETA', { 
      entityId, 
      entityType, 
      destinationLatitude, 
      destinationLongitude, 
      options 
    });
    
    const eta = await trackingApi.getETA(
      entityId,
      entityType,
      destinationLatitude,
      destinationLongitude,
      options
    );
    
    return eta;
  } catch (error) {
    logger.error('Error getting ETA', { 
      error, 
      entityId, 
      entityType, 
      destinationLatitude, 
      destinationLongitude 
    });
    
    if (error instanceof Error) {
      // Handle API errors
      return null;
    }
    
    throw error;
  }
}

/**
 * Gets the remaining distance to a destination for an entity
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param destinationLatitude Destination latitude
 * @param destinationLongitude Destination longitude
 * @returns Remaining distance in kilometers or null
 */
export async function getRemainingDistance(
  entityId: string,
  entityType: EntityType,
  destinationLatitude: number,
  destinationLongitude: number
): Promise<number | null> {
  try {
    logger.debug('Fetching remaining distance', { 
      entityId, 
      entityType, 
      destinationLatitude, 
      destinationLongitude 
    });
    
    const response = await trackingApi.getRemainingDistance(
      entityId,
      entityType,
      destinationLatitude,
      destinationLongitude
    );
    
    return response.distance;
  } catch (error) {
    logger.error('Error getting remaining distance', { 
      error, 
      entityId, 
      entityType, 
      destinationLatitude, 
      destinationLongitude 
    });
    
    if (error instanceof Error) {
      // Handle API errors
      return null;
    }
    
    throw error;
  }
}

/**
 * Gets comprehensive tracking information for a load including position, ETA, and route
 * @param loadId Load ID
 * @returns Tracking information for the load
 */
export async function getLoadTracking(loadId: string): Promise<{
  position: EntityPosition | null;
  eta: ETAResponse | null;
  route: TrajectoryResponse | null;
}> {
  try {
    logger.debug('Fetching comprehensive load tracking', { loadId });
    
    // Get load details to determine assigned driver/vehicle
    const load = await getLoadById(loadId, true);
    const result = {
      position: null as EntityPosition | null,
      eta: null as ETAResponse | null,
      route: null as TrajectoryResponse | null
    };
    
    // Check if load is assigned and has delivery location
    if (load.status === 'assigned' || load.status === 'in_transit' || 
        load.status === 'at_pickup' || load.status === 'loaded') {
      // For load with details (from LoadWithDetails interface)
      const loadWithDetails = load as any;
      
      // Get current position
      if (loadWithDetails.assignments && loadWithDetails.assignments.length > 0) {
        const activeAssignment = loadWithDetails.assignments.find((a: any) => 
          a.status !== 'completed' && a.status !== 'cancelled'
        );
        
        if (activeAssignment) {
          const vehicleId = activeAssignment.vehicleId;
          result.position = await getCurrentPosition(vehicleId, EntityType.VEHICLE);
          
          // If we have position and delivery location, get ETA
          if (result.position && loadWithDetails.locations) {
            const deliveryLocation = loadWithDetails.locations.find((loc: any) => 
              loc.locationType === 'delivery'
            );
            
            if (deliveryLocation && deliveryLocation.coordinates) {
              result.eta = await getETA(
                vehicleId,
                EntityType.VEHICLE,
                deliveryLocation.coordinates.latitude,
                deliveryLocation.coordinates.longitude,
                {
                  considerTraffic: true,
                  considerWeather: true,
                  considerHOS: true
                }
              );
            }
          }
          
          // Get route trajectory
          result.route = await getTrajectory(vehicleId, EntityType.VEHICLE);
        }
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Error getting load tracking', { error, loadId });
    throw handleApiError(error);
  }
}

/**
 * Subscribes to real-time position updates for an entity
 * @param entityId Entity ID
 * @param entityType Entity type
 * @param onUpdate Callback for position updates
 * @param onError Callback for errors
 * @returns Unsubscribe function
 */
export function subscribeToPositionUpdates(
  entityId: string,
  entityType: EntityType,
  onUpdate: (position: EntityPosition) => void,
  onError: (error: Error) => void
): Function {
  const subscriptionKey = `${entityType}_${entityId}`;
  
  // Initialize callbacks set if it doesn't exist
  if (!activeSubscriptions[subscriptionKey]) {
    activeSubscriptions[subscriptionKey] = new Set();
  }
  
  // Add this callback to the set
  activeSubscriptions[subscriptionKey].add(onUpdate);
  
  // Create unsubscribe function
  const unsubscribe = () => {
    if (activeSubscriptions[subscriptionKey]) {
      activeSubscriptions[subscriptionKey].delete(onUpdate);
      
      // If no more callbacks for this entity, unsubscribe from server
      if (activeSubscriptions[subscriptionKey].size === 0) {
        delete activeSubscriptions[subscriptionKey];
        
        // If socket connected, send unsubscribe message
        if (socketConnected && socket) {
          socket.emit('unsubscribe', { entityId, entityType });
        }
      }
    }
  };
  
  // Connect to socket and subscribe
  ensureSocketConnection()
    .then(() => {
      // Subscribe to entity updates
      socket.emit('subscribe', { entityId, entityType });
      
      // Set up event listener if not already listening
      if (!socket.hasListeners(`position_update:${subscriptionKey}`)) {
        socket.on(`position_update:${subscriptionKey}`, (data: EntityPosition) => {
          // Update cache with latest position
          const cacheKey = getPositionCacheKey(entityId, entityType);
          savePositionToCache(cacheKey, data);
          
          // Notify all subscribers
          if (activeSubscriptions[subscriptionKey]) {
            activeSubscriptions[subscriptionKey].forEach(callback => {
              try {
                callback(data);
              } catch (callbackError) {
                logger.error('Error in position update callback', { 
                  error: callbackError, 
                  entityId, 
                  entityType 
                });
              }
            });
          }
        });
      }
    })
    .catch(error => {
      logger.error('Error subscribing to position updates', { 
        error, 
        entityId, 
        entityType 
      });
      onError(error instanceof Error ? error : new Error(String(error)));
    });
  
  return unsubscribe;
}

/**
 * Subscribes to real-time updates for a specific load including position and status changes
 * @param loadId Load ID
 * @param onPositionUpdate Callback for position updates
 * @param onStatusUpdate Callback for status updates
 * @param onError Callback for errors
 * @returns Unsubscribe function
 */
export function subscribeToLoadUpdates(
  loadId: string,
  onPositionUpdate: (position: EntityPosition) => void,
  onStatusUpdate: (status: string, details: any) => void,
  onError: (error: Error) => void
): Function {
  let positionUnsubscribe: Function | null = null;
  
  // Get load details to determine assigned driver/vehicle
  getLoadById(loadId, true)
    .then(load => {
      // Check if load is assigned and has active assignment
      const loadWithDetails = load as any;
      
      if (loadWithDetails.assignments && loadWithDetails.assignments.length > 0) {
        const activeAssignment = loadWithDetails.assignments.find((a: any) => 
          a.status !== 'completed' && a.status !== 'cancelled'
        );
        
        if (activeAssignment) {
          const vehicleId = activeAssignment.vehicleId;
          
          // Subscribe to vehicle position updates
          positionUnsubscribe = subscribeToPositionUpdates(
            vehicleId,
            EntityType.VEHICLE,
            onPositionUpdate,
            onError
          );
        }
      }
      
      // Subscribe to load status updates
      ensureSocketConnection()
        .then(() => {
          socket.emit('subscribe_load_status', { loadId });
          
          // Set up event listener if not already listening
          if (!socket.hasListeners(`load_status:${loadId}`)) {
            socket.on(`load_status:${loadId}`, (data: { status: string, details: any }) => {
              try {
                onStatusUpdate(data.status, data.details);
              } catch (callbackError) {
                logger.error('Error in status update callback', { 
                  error: callbackError, 
                  loadId 
                });
              }
            });
          }
        })
        .catch(error => {
          logger.error('Error subscribing to load status updates', { 
            error, 
            loadId 
          });
          onError(error instanceof Error ? error : new Error(String(error)));
        });
    })
    .catch(error => {
      logger.error('Error getting load details for subscription', { 
        error, 
        loadId 
      });
      onError(error instanceof Error ? error : new Error(String(error)));
    });
  
  // Create combined unsubscribe function
  return () => {
    // Unsubscribe from position updates
    if (positionUnsubscribe) {
      positionUnsubscribe();
    }
    
    // Unsubscribe from load status updates
    if (socketConnected && socket) {
      socket.emit('unsubscribe_load_status', { loadId });
      socket.off(`load_status:${loadId}`);
    }
  };
}

/**
 * Gets route visualization data for a load suitable for map display
 * @param loadId Load ID
 * @param options Options for visualization
 * @returns Route visualization data for map display
 */
export async function getRouteVisualization(
  loadId: string,
  options: {
    includeStops?: boolean;
    simplificationTolerance?: number;
  } = {}
): Promise<{
  route: any;
  markers: EntityPosition[];
}> {
  try {
    logger.debug('Fetching route visualization data', { loadId, options });
    
    // Get load details
    const load = await getLoadById(loadId, true);
    const loadWithDetails = load as any;
    const markers: EntityPosition[] = [];
    
    // Check if load has locations
    if (!loadWithDetails.locations || loadWithDetails.locations.length === 0) {
      throw new Error('Load does not have location information');
    }
    
    // Get origin and destination locations
    const originLocation = loadWithDetails.locations.find((loc: any) => 
      loc.locationType === 'pickup'
    );
    
    const destinationLocation = loadWithDetails.locations.find((loc: any) => 
      loc.locationType === 'delivery'
    );
    
    if (!originLocation || !destinationLocation) {
      throw new Error('Load missing origin or destination location');
    }
    
    // Check if load is assigned and has active assignment
    let vehicleId = null;
    let route = null;
    
    if (loadWithDetails.assignments && loadWithDetails.assignments.length > 0) {
      const activeAssignment = loadWithDetails.assignments.find((a: any) => 
        a.status !== 'completed' && a.status !== 'cancelled'
      );
      
      if (activeAssignment) {
        vehicleId = activeAssignment.vehicleId;
        
        // Get current position
        const currentPosition = await getCurrentPosition(vehicleId, EntityType.VEHICLE);
        if (currentPosition) {
          markers.push(currentPosition);
        }
        
        // Get route trajectory
        const trajectoryResponse = await getTrajectory(
          vehicleId, 
          EntityType.VEHICLE,
          {
            simplificationTolerance: options.simplificationTolerance || 0.0001
          }
        );
        
        if (trajectoryResponse) {
          route = trajectoryResponse.trajectory;
        }
      }
    }
    
    // If we don't have a real route (not assigned or no trajectory), create a simple route
    if (!route) {
      // Create a simple straight line route from origin to destination
      route = {
        type: 'LineString',
        coordinates: [
          [originLocation.coordinates.longitude, originLocation.coordinates.latitude],
          [destinationLocation.coordinates.longitude, destinationLocation.coordinates.latitude]
        ]
      };
    }
    
    // Add origin and destination markers
    const originMarker: EntityPosition = {
      entityId: `origin_${loadId}`,
      entityType: EntityType.LOAD,
      position: {
        latitude: originLocation.coordinates.latitude,
        longitude: originLocation.coordinates.longitude,
        heading: 0,
        speed: 0,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        source: 'manual' as any // Used for visualization purposes
      },
      metadata: {
        locationType: 'pickup',
        facilityName: originLocation.facilityName
      }
    };
    
    const destinationMarker: EntityPosition = {
      entityId: `destination_${loadId}`,
      entityType: EntityType.LOAD,
      position: {
        latitude: destinationLocation.coordinates.latitude,
        longitude: destinationLocation.coordinates.longitude,
        heading: 0,
        speed: 0,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        source: 'manual' as any
      },
      metadata: {
        locationType: 'delivery',
        facilityName: destinationLocation.facilityName
      }
    };
    
    markers.push(originMarker, destinationMarker);
    
    // Add intermediate stops if requested
    if (options.includeStops && loadWithDetails.locations.length > 2) {
      const stops = loadWithDetails.locations.filter((loc: any) => 
        loc.locationType === 'stop'
      );
      
      stops.forEach((stop: any, index: number) => {
        const stopMarker: EntityPosition = {
          entityId: `stop_${index}_${loadId}`,
          entityType: EntityType.LOAD,
          position: {
            latitude: stop.coordinates.latitude,
            longitude: stop.coordinates.longitude,
            heading: 0,
            speed: 0,
            accuracy: 0,
            timestamp: new Date().toISOString(),
            source: 'manual' as any
          },
          metadata: {
            locationType: 'stop',
            facilityName: stop.facilityName,
            stopNumber: index + 1
          }
        };
        
        markers.push(stopMarker);
      });
    }
    
    return { route, markers };
  } catch (error) {
    logger.error('Error getting route visualization', { error, loadId });
    throw handleApiError(error);
  }
}

/**
 * Clears cached position data for a specific entity
 * @param entityId Entity ID
 * @param entityType Entity type
 */
export function clearPositionCache(entityId: string, entityType: EntityType): void {
  const cacheKey = getPositionCacheKey(entityId, entityType);
  localStorage.removeItem(cacheKey);
}

/**
 * Clears cached trajectory data for a specific entity
 * @param entityId Entity ID
 * @param entityType Entity type
 */
export function clearTrajectoryCache(entityId: string, entityType: EntityType): void {
  // Since trajectory cache keys may have different options, find all matching keys
  const keyPrefix = `${TRAJECTORY_CACHE_PREFIX}${entityType}_${entityId}`;
  
  // Get all keys from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(keyPrefix)) {
      localStorage.removeItem(key);
    }
  }
}

// Export all functions
export default {
  getCurrentPosition,
  getPositionHistory,
  getTrajectory,
  getETA,
  getRemainingDistance,
  getLoadTracking,
  subscribeToPositionUpdates,
  subscribeToLoadUpdates,
  getRouteVisualization,
  clearPositionCache,
  clearTrajectoryCache
};