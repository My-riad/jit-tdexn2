import { WebSocket, WebSocketServer } from 'ws'; // ws@^8.13.0
import * as http from 'http'; // http@^0.0.1-security
import * as url from 'url'; // url@^0.11.1
import logger from '../../common/utils/logger';
import { WEBSOCKET_PATH } from '../config';
import { PositionService } from '../services/position.service';
import { EntityType, Position, EntityPosition } from '../../common/interfaces/position.interface';

// Define global constants for heartbeat interval and client timeout
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CLIENT_TIMEOUT = 60000; // 60 seconds

/**
 * Parses subscription parameters from the WebSocket connection URL
 * @param urlString The URL string to parse
 * @returns Parsed subscription parameters including entityIds, entityTypes, and radius
 */
function parseSubscriptionParams(urlString: string): { entityIds?: string[]; entityTypes?: string[]; radius?: number; latitude?: number; longitude?: number } {
  // Parse the URL using the url module
  const parsedUrl = url.parse(urlString, true);

  // Extract query parameters from the URL
  const queryParams = parsedUrl.query;

  // Parse entityIds as an array if present
  const entityIds = Array.isArray(queryParams.entityIds) ? queryParams.entityIds : (queryParams.entityIds ? [queryParams.entityIds as string] : undefined);

  // Parse entityTypes as an array if present
  const entityTypes = Array.isArray(queryParams.entityTypes) ? queryParams.entityTypes : (queryParams.entityTypes ? [queryParams.entityTypes as string] : undefined);

  // Parse radius as a number if present
  const radius = queryParams.radius ? parseFloat(queryParams.radius as string) : undefined;

  // Parse latitude and longitude as numbers if present
  const latitude = queryParams.latitude ? parseFloat(queryParams.latitude as string) : undefined;
  const longitude = queryParams.longitude ? parseFloat(queryParams.longitude as string) : undefined;

  // Return an object with the parsed parameters
  return { entityIds, entityTypes, radius, latitude, longitude };
}

/**
 * Validates subscription parameters for correctness
 * @param params The parameters to validate
 * @returns True if parameters are valid, false otherwise
 */
function validateSubscriptionParams(params: { entityIds?: string[]; entityTypes?: string[]; radius?: number; latitude?: number; longitude?: number }): boolean {
  // Check if either entityIds or (latitude and longitude) are provided
  if (!params.entityIds && (!params.latitude || !params.longitude)) {
    logger.error('Subscription parameters are invalid: either entityIds or latitude and longitude must be provided');
    return false;
  }

  // Validate that entityTypes contains only valid EntityType values if provided
  if (params.entityTypes) {
    for (const entityType of params.entityTypes) {
      if (!Object.values(EntityType).includes(entityType as EntityType)) {
        logger.error(`Subscription parameters are invalid: invalid entityType ${entityType}`);
        return false;
      }
    }
  }

  // Validate that radius is a positive number if provided
  if (params.radius && (typeof params.radius !== 'number' || params.radius <= 0)) {
    logger.error('Subscription parameters are invalid: radius must be a positive number');
    return false;
  }

  // Validate that latitude is between -90 and 90 if provided
  if (params.latitude && (typeof params.latitude !== 'number' || params.latitude < -90 || params.latitude > 90)) {
    logger.error('Subscription parameters are invalid: latitude must be between -90 and 90');
    return false;
  }

  // Validate that longitude is between -180 and 180 if provided
  if (params.longitude && (typeof params.longitude !== 'number' || params.longitude < -180 || params.longitude > 180)) {
    logger.error('Subscription parameters are invalid: longitude must be between -180 and 180');
    return false;
  }

  // Return true if all validations pass, false otherwise
  return true;
}

/**
 * WebSocket server implementation for real-time position tracking
 */
export class PositionSocket {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, { entityIds?: string[]; entityTypes?: string[]; radius?: number; latitude?: number; longitude?: number }> = new Map();
  private lastHeartbeat: Map<string, number> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  /**
   * Creates a new PositionSocket instance
   * @param positionService The PositionService instance to use for retrieving position data
   */
  constructor(private positionService: PositionService) {
    // Log the initialization of the PositionSocket
    logger.info('PositionSocket initialized');
  }

  /**
   * Initializes the WebSocket server with the provided HTTP server
   * @param server The HTTP server to attach the WebSocket server to
   */
  initialize(server: http.Server): void {
    // Create a new WebSocket.Server instance with the provided HTTP server
    this.wss = new WebSocketServer({ noServer: true, path: WEBSOCKET_PATH });

    // Set up event handlers for connection and error events
    this.wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => this.handleConnection(ws, request));
    this.wss.on('error', (error: Error) => logger.error('WebSocket server error', { error }));

    // Start the heartbeat interval for connection monitoring
    this.startHeartbeat();

    // Log successful initialization of the WebSocket server
    logger.info('WebSocket server initialized');
  }

  /**
   * Handles new WebSocket connections
   * @param ws The WebSocket connection
   * @param request The HTTP request
   */
  handleConnection(ws: WebSocket, request: http.IncomingMessage): void {
    // Generate a unique client ID for the connection
    const clientId = require('uuid').v4();

    // Parse subscription parameters from the request URL
    const subscriptionParams = parseSubscriptionParams(request.url || '');

    // Validate the subscription parameters
    if (!validateSubscriptionParams(subscriptionParams)) {
      // If parameters are invalid, close the connection with an error message
      ws.close(1003, 'Invalid subscription parameters');
      return;
    }

    // Store the client in the clients Map
    this.clients.set(clientId, ws);

    // Store the subscription parameters in the subscriptions Map
    this.subscriptions.set(clientId, subscriptionParams);

    // Initialize the lastHeartbeat timestamp for the client
    this.lastHeartbeat.set(clientId, Date.now());

    // Set up event handlers for message, close, and error events
    ws.on('message', (data: WebSocket.Data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleClose(clientId));
    ws.on('error', (error: Error) => this.handleError(clientId, error));

    // Send initial position data based on subscription parameters
    this.sendInitialPositions(clientId, ws, subscriptionParams);

    // Log the new client connection
    logger.info(`New client connected: ${clientId}`);
  }

  /**
   * Handles incoming WebSocket messages from clients
   * @param clientId The ID of the client sending the message
   * @param data The message data
   */
  handleMessage(clientId: string, data: WebSocket.Data): void {
    try {
      // Update the lastHeartbeat timestamp for the client
      this.lastHeartbeat.set(clientId, Date.now());

      // Parse the message data as JSON
      const message = JSON.parse(data.toString());

      // If message type is 'heartbeat', respond with a heartbeat acknowledgment
      if (message.type === 'heartbeat') {
        logger.debug(`Received heartbeat from client: ${clientId}`);
        this.clients.get(clientId)?.send(JSON.stringify({ type: 'heartbeat_ack' }));
      }
      // If message type is 'subscribe', update the client's subscription parameters
      else if (message.type === 'subscribe') {
        logger.info(`Received subscribe request from client: ${clientId}`, { subscription: message.subscription });
        this.subscriptions.set(clientId, message.subscription);
        this.sendInitialPositions(clientId, this.clients.get(clientId), message.subscription);
      }
      // If message type is 'unsubscribe', remove specific subscriptions
      else if (message.type === 'unsubscribe') {
        logger.info(`Received unsubscribe request from client: ${clientId}`, { subscription: message.subscription });
        this.subscriptions.delete(clientId);
      }
      // If message type is unknown, log a warning
      else {
        logger.warn(`Unknown message type received from client: ${clientId}`, { messageType: message.type });
      }
    } catch (error) {
      // Handle any errors during message processing
      logger.error(`Error processing message from client: ${clientId}`, { error });
    }
  }

  /**
   * Handles WebSocket connection closures
   * @param clientId The ID of the client that disconnected
   */
  handleClose(clientId: string): void {
    // Remove the client from the clients Map
    this.clients.delete(clientId);

    // Remove the client's subscription from the subscriptions Map
    this.subscriptions.delete(clientId);

    // Remove the client's heartbeat timestamp from the lastHeartbeat Map
    this.lastHeartbeat.delete(clientId);

    // Log the client disconnection
    logger.info(`Client disconnected: ${clientId}`);
  }

  /**
   * Handles WebSocket errors
   * @param clientId The ID of the client that experienced an error
   * @param error The error object
   */
  handleError(clientId: string, error: Error): void {
    // Log the error with client ID and error details
    logger.error(`WebSocket error for client: ${clientId}`, { error });

    // Attempt to close the connection if still open
    if (this.clients.has(clientId)) {
      this.clients.get(clientId)?.close();
      this.clients.delete(clientId);
    }

    // Remove the client from tracking maps if needed
    this.subscriptions.delete(clientId);
    this.lastHeartbeat.delete(clientId);
  }

  /**
   * Broadcasts position updates to subscribed clients
   * @param entityId The ID of the entity that was updated
   * @param entityType The type of the entity that was updated
   * @param position The new position data
   */
  broadcastPositionUpdate(entityId: string, entityType: EntityType, position: Position): void {
    // Create a position update message object
    const message = {
      type: 'position_update',
      entity_id: entityId,
      entity_type: entityType,
      position: position,
    };

    // Iterate through all clients
    this.clients.forEach((ws: WebSocket, clientId: string) => {
      // Check if they are subscribed to this entity
      if (this.isClientSubscribed(clientId, entityId, entityType)) {
        try {
          // Send the position update message
          ws.send(JSON.stringify(message));
        } catch (error) {
          // Handle any errors during message sending
          logger.error(`Error sending position update to client: ${clientId}`, { error });
        }
      }
    });

    // Log the broadcast at debug level
    logger.debug(`Broadcasted position update for ${entityType} ${entityId} to subscribed clients`);
  }

  /**
   * Broadcasts position updates to clients subscribed to a geographic area
   * @param latitude The latitude of the updated position
   * @param longitude The longitude of the updated position
   * @param entityType The type of the entity that was updated
   * @param position The new position data
   * @param entityId The ID of the entity that was updated
   */
  broadcastToNearbySubscribers(latitude: number, longitude: number, entityType: EntityType, position: Position, entityId: string): void {
    // Create a position update message object
    const message = {
      type: 'position_update',
      entity_id: entityId,
      entity_type: entityType,
      position: position,
    };

    // Iterate through all clients
    this.clients.forEach((ws: WebSocket, clientId: string) => {
      // Check if they have a geographic subscription
      const subscription = this.subscriptions.get(clientId);
      if (subscription && subscription.latitude && subscription.longitude && subscription.radius) {
        // Calculate if the position update is within the subscribed radius
        const distance = require('../../common/utils/geo-utils').calculateDistance(
          latitude,
          longitude,
          subscription.latitude,
          subscription.longitude,
          'miles'
        );

        // If within radius and matching entity type, send the position update
        if (distance <= subscription.radius && (!subscription.entityTypes || subscription.entityTypes.includes(entityType))) {
          try {
            // Send the position update message
            ws.send(JSON.stringify(message));
          } catch (error) {
            // Handle any errors during message sending
            logger.error(`Error sending position update to client: ${clientId}`, { error });
          }
        }
      }
    });

    // Log the broadcast at debug level
    logger.debug(`Broadcasted position update for ${entityType} ${entityId} to nearby subscribers`);
  }

  /**
   * Sends initial position data to a newly connected client
   * @param clientId The ID of the client
   * @param ws The WebSocket connection
   * @param subscription The subscription parameters
   */
  async sendInitialPositions(clientId: string, ws: WebSocket, subscription: { entityIds?: string[]; entityTypes?: string[]; radius?: number; latitude?: number; longitude?: number }): Promise<void> {
    try {
      let initialPositions: EntityPosition[] = [];

      // If subscription includes specific entityIds, fetch their current positions
      if (subscription.entityIds && subscription.entityIds.length > 0) {
        for (const entityId of subscription.entityIds) {
          const entityType = subscription.entityTypes ? subscription.entityTypes[0] : EntityType.DRIVER; // Default to DRIVER if not specified
          const position = await this.positionService.getCurrentPosition(entityId, entityType as EntityType);
          if (position) {
            initialPositions.push({
              entity_id: entityId,
              entity_type: entityType as EntityType,
              position: position,
            });
          }
        }
      }
      // If subscription includes a geographic area, fetch entities within that area
      else if (subscription.latitude && subscription.longitude && subscription.radius) {
        const nearbyEntities = await this.positionService.getNearbyEntities({
          latitude: subscription.latitude,
          longitude: subscription.longitude,
          radius: subscription.radius,
          entity_type: subscription.entityTypes ? subscription.entityTypes[0] as EntityType : undefined,
          limit: 100, // Limit to 100 nearby entities for initial load
        });
        initialPositions = nearbyEntities;
      }

      // Format the position data as a batch update message
      const batchUpdate = {
        type: 'initial_positions',
        positions: initialPositions,
      };

      // Send the batch update to the client
      ws.send(JSON.stringify(batchUpdate));

      // Log the initial data transmission
      logger.info(`Sent initial data to client: ${clientId}`, { positionCount: initialPositions.length });
    } catch (error) {
      // Handle any errors during data fetching or sending
      logger.error(`Error sending initial data to client: ${clientId}`, { error });
    }
  }

  /**
   * Starts the heartbeat interval to monitor client connections
   */
  startHeartbeat(): void {
    // Set up an interval timer that runs every HEARTBEAT_INTERVAL milliseconds
    this.heartbeatInterval = setInterval(() => {
      // In each interval, check all clients for activity timeout
      this.clients.forEach((ws: WebSocket, clientId: string) => {
        // If inactive clients (no heartbeat within CLIENT_TIMEOUT), close the connection
        if (Date.now() - (this.lastHeartbeat.get(clientId) || 0) > CLIENT_TIMEOUT) {
          logger.warn(`Client timed out: ${clientId}`);
          ws.terminate();
          this.clients.delete(clientId);
          this.subscriptions.delete(clientId);
          this.lastHeartbeat.delete(clientId);
        }
      });

      // Log heartbeat checks at debug level
      logger.debug('Performing heartbeat checks');
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stops the heartbeat interval
   */
  stopHeartbeat(): void {
    // Clear the heartbeat interval timer
    clearInterval(this.heartbeatInterval);

    // Log the heartbeat monitoring stoppage
    logger.info('Heartbeat monitoring stopped');
  }

  /**
   * Closes the WebSocket server and all client connections
   */
  async close(): Promise<void> {
    // Stop the heartbeat interval
    this.stopHeartbeat();

    // Close all client connections with a normal closure code
    this.clients.forEach((ws: WebSocket) => {
      ws.close(1000, 'Server shutting down');
    });

    // Close the WebSocket server
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err) => {
        if (err) {
          logger.error('Failed to close WebSocket server', { error: err });
          reject(err);
        } else {
          logger.info('WebSocket server closed');
          resolve();
        }
      });
    });

    // Clear all client tracking maps
    this.clients.clear();
    this.subscriptions.clear();
    this.lastHeartbeat.clear();
  }

  /**
   * Checks if a client is subscribed to a specific entity
   * @param clientId The ID of the client
   * @param entityId The ID of the entity
   * @param entityType The type of the entity
   * @returns True if the client is subscribed, false otherwise
   */
  isClientSubscribed(clientId: string, entityId: string, entityType: EntityType): boolean {
    // Get the client's subscription from the subscriptions Map
    const subscription = this.subscriptions.get(clientId);

    // If no subscription exists, return false
    if (!subscription) {
      return false;
    }

    // Check if the client is subscribed to the specific entityId
    if (subscription.entityIds && subscription.entityIds.includes(entityId)) {
      return true;
    }

    // Check if the client is subscribed to the entity type
    if (subscription.entityTypes && subscription.entityTypes.includes(entityType)) {
      return true;
    }

    // Return true if either condition is met, false otherwise
    return false;
  }
}

// Export utility functions for parsing and validating subscription parameters
export { parseSubscriptionParams, validateSubscriptionParams };