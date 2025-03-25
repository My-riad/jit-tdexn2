import { WebSocket, Server, IncomingMessage } from 'ws'; // ws@^8.13.0
import { parse } from 'url'; // url@^0.11.0
import { parse as parseQuery } from 'querystring'; // querystring@^0.2.1
import * as jsonwebtoken from 'jsonwebtoken'; // jsonwebtoken@^9.0.0
import logger from '../../../common/utils/logger';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/notification.model';
import { NotificationChannelType } from '../models/notification-channel.model';
import { config } from '../config';
import { EventTypes } from '../../../common/constants/event-types';

/**
 * @interface ConnectionInfo
 * Interface defining information about a WebSocket connection
 */
interface ConnectionInfo {
  userId: string;
  userType: string;
  lastActivity: Date;
}

/**
 * @interface WebSocketMessage
 * Interface defining the structure of messages exchanged over WebSocket
 */
interface WebSocketMessage {
  type: string;
  data: any;
}

/**
 * @interface NotificationMessage
 * Interface defining the structure of notification messages sent to clients
 */
interface NotificationMessage {
  type: 'notification';
  notification: Notification;
}

/**
 * @interface NotificationsListMessage
 * Interface defining the structure of notifications list messages sent to clients
 */
interface NotificationsListMessage {
  type: 'notificationsList';
  notifications: Notification[];
  total: number;
}

/**
 * @interface UnreadCountMessage
 * Interface defining the structure of unread count messages sent to clients
 */
interface UnreadCountMessage {
  type: 'unreadCount';
  count: number;
}

/**
 * @const {number} HEARTBEAT_INTERVAL
 * Interval for sending heartbeat messages (ping) to keep connections alive (30 seconds)
 */
const HEARTBEAT_INTERVAL = 30000;

/**
 * @const {number} CONNECTION_TIMEOUT
 * Timeout for WebSocket connections (120 seconds)
 */
const CONNECTION_TIMEOUT = 120000;

/**
 * @class NotificationSocket
 * Manages WebSocket connections for real-time notification delivery.
 * Handles connection lifecycle, authentication, and message routing.
 */
export class NotificationSocket {
  /**
   * @property {Server} wss - WebSocket server instance
   */
  private wss: Server;

  /**
   * @property {NotificationService} notificationService - Notification service instance
   */
  private notificationService: NotificationService;

  /**
   * @property {Map<string, Set<WebSocket>>} connectionsByUserType - Map of user types to WebSocket connections
   */
  private connectionsByUserType: Map<string, Set<WebSocket>> = new Map();

  /**
   * @property {Map<string, WebSocket>} connectionsByUserId - Map of user IDs to WebSocket connections
   */
  private connectionsByUserId: Map<string, WebSocket> = new Map();

  /**
   * @property {Map<WebSocket, ConnectionInfo>} connectionInfo - Map of WebSocket connections to connection information
   */
  private connectionInfo: Map<WebSocket, ConnectionInfo> = new Map();

  /**
   * @property {number} heartbeatInterval - Interval ID for the heartbeat check
   */
  private heartbeatInterval: number;

  /**
   * @constructor
   * Initializes the notification WebSocket server
   * @param {NotificationService} notificationService - Notification service instance
   */
  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    this.heartbeatInterval = HEARTBEAT_INTERVAL;
  }

  /**
   * @function initialize
   * Initializes the WebSocket server and sets up event listeners
   * @param {object} server - HTTP server instance
   * @returns {void} No return value
   */
  public initialize(server: any): void {
    // Create a new WebSocket server attached to the HTTP server
    this.wss = new WebSocket.Server({ noServer: true });

    // Set up connection event handler
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => this.handleConnection(ws, request));

    // Set up error event handler
    this.wss.on('error', (error: Error) => logger.error('WebSocket server error', { error }));

    // Start the heartbeat interval
    this.startHeartbeat();

    // Log successful initialization
    logger.info('WebSocket server initialized');

    // Subscribe to notification events from Kafka
    // this.subscribeToNotificationEvents(); // TODO: Implement Kafka subscription
  }

  /**
   * @function handleConnection
   * Handles new WebSocket connections
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {IncomingMessage} request - HTTP request object
   * @returns {void} No return value
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Parse the URL and query parameters
    const parsedUrl = parse(request.url || '', true);
    const queryParams = parseQuery(parsedUrl.query) as { token?: string; userId?: string; userType?: string };

    // Extract token, userId, and userType parameters
    const token = queryParams.token;
    const userId = queryParams.userId;
    const userType = queryParams.userType;

    // Verify the authentication token
    if (!token || !userId || !userType) {
      logger.error('Missing authentication parameters');
      ws.close(1008, 'Missing authentication parameters');
      return;
    }

    // Verify the authentication token
    jsonwebtoken.verify(token, config.config.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        logger.error('Invalid authentication token', { error: err });
        ws.close(1008, 'Invalid authentication token');
        return;
      }

      // Check if the decoded userId matches the userId from the query parameters
      if (decoded.userId !== userId) {
        logger.error('User ID mismatch in authentication token');
        ws.close(1008, 'User ID mismatch in authentication token');
        return;
      }

      // Register the connection with appropriate tracking maps
      this.registerConnection(ws, userId, userType);

      // Set up message event handler for the connection
      ws.on('message', (message: string) => this.handleMessage(ws, message));

      // Set up close event handler for the connection
      ws.on('close', (code: number, reason: string) => this.handleClose(ws, code, reason));

      // Set up error event handler for the connection
      ws.on('error', (error: Error) => this.handleError(ws, error));

      // Send initial unread notifications count
      this.sendUnreadCount(ws, userId, userType);

      // Log successful connection establishment
      logger.info('WebSocket connection established', { userId, userType });
    });
  }

  /**
   * @function handleMessage
   * Handles incoming messages from WebSocket clients
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {string} message - Message received from the client
   * @returns {Promise<void>} Promise that resolves when message is processed
   */
  private async handleMessage(ws: WebSocket, message: string): Promise<void> {
    try {
      // Parse the message as JSON
      const parsedMessage: WebSocketMessage = JSON.parse(message);

      // Extract message type and data
      const { type, data } = parsedMessage;

      // Get connection info for the WebSocket
      const connectionInfo = this.connectionInfo.get(ws);

      // Check if connection info exists
      if (!connectionInfo) {
        logger.error('Connection info not found for WebSocket');
        return;
      }

      // Extract userId and userType from connection info
      const { userId, userType } = connectionInfo;

      // Handle different message types
      switch (type) {
        case 'getNotifications':
          // Fetch and send notifications to the client
          const { notifications, total } = await this.notificationService.getUserNotifications(userId, userType, data);
          const notificationsListMessage: NotificationsListMessage = { type: 'notificationsList', notifications, total };
          this.sendToConnection(ws, notificationsListMessage);
          break;

        case 'markAsRead':
          // Mark notification as read and broadcast update
          const notificationId = data.notificationId;
          await this.notificationService.markAsRead(notificationId);
          this.broadcastNotification(await this.notificationService.getNotification(notificationId));
          break;

        case 'markAllAsRead':
          // Mark all notifications as read and update count
          await this.notificationService.markAllAsRead(userId, userType);
          this.sendUnreadCount(ws, userId, userType);
          break;

        case 'pong':
          // Update last activity timestamp
          const now = new Date();
          connectionInfo.lastActivity = now;
          this.connectionInfo.set(ws, connectionInfo);
          logger.debug('Received pong message, updating last activity', { userId, now });
          break;

        default:
          logger.warn('Unknown message type received', { type });
      }

      // Log message processing
      logger.info('WebSocket message processed', { type, userId, userType });
    } catch (error) {
      logger.error('Error processing WebSocket message', { error, message });
    }
  }

  /**
   * @function handleClose
   * Handles WebSocket connection closures
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {number} code - Closure code
   * @param {string} reason - Closure reason
   * @returns {void} No return value
   */
  private handleClose(ws: WebSocket, code: number, reason: string): void {
    // Get connection info for the closed WebSocket
    const connectionInfo = this.connectionInfo.get(ws);

    // Check if connection info exists
    if (!connectionInfo) {
      logger.warn('Connection info not found for WebSocket on close');
      return;
    }

    // Extract userId and userType from connection info
    const { userId, userType } = connectionInfo;

    // Remove the connection from all tracking maps
    this.unregisterConnection(ws);

    // Log connection closure with code and reason
    logger.info('WebSocket connection closed', { userId, userType, code, reason });
  }

  /**
   * @function handleError
   * Handles WebSocket errors
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {Error} error - Error object
   * @returns {void} No return value
   */
  private handleError(ws: WebSocket, error: Error): void {
    // Get connection info for the WebSocket
    const connectionInfo = this.connectionInfo.get(ws);

    // Check if connection info exists
    if (!connectionInfo) {
      logger.warn('Connection info not found for WebSocket on error');
      return;
    }

    // Extract userId and userType from connection info
    const { userId, userType } = connectionInfo;

    // Log the error with connection details
    logger.error('WebSocket error', { userId, userType, error });

    // Attempt to close the connection gracefully
    ws.close(1011, 'Internal server error');

    // Remove the connection from all tracking maps
    this.unregisterConnection(ws);
  }

  /**
   * @function registerConnection
   * Registers a new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @returns {void} No return value
   */
  private registerConnection(ws: WebSocket, userId: string, userType: string): void {
    // Store connection info in connectionInfo map
    this.connectionInfo.set(ws, { userId, userType, lastActivity: new Date() });

    // Add to connectionsByUserId map
    if (!this.connectionsByUserId.has(userId)) {
      this.connectionsByUserId.set(userId, ws);
    }

    // Add to connectionsByUserType map
    if (!this.connectionsByUserType.has(userType)) {
      this.connectionsByUserType.set(userType, new Set());
    }
    this.connectionsByUserType.get(userType)!.add(ws);

    // Set initial last activity timestamp
    const now = new Date();
    const connectionInfo = this.connectionInfo.get(ws);
    if (connectionInfo) {
      connectionInfo.lastActivity = now;
      this.connectionInfo.set(ws, connectionInfo);
    }
  }

  /**
   * @function unregisterConnection
   * Unregisters a WebSocket connection
   * @param {WebSocket} ws - WebSocket connection instance
   * @returns {void} No return value
   */
  private unregisterConnection(ws: WebSocket): void {
    // Get connection info for the WebSocket
    const connectionInfo = this.connectionInfo.get(ws);

    // Check if connection info exists
    if (!connectionInfo) {
      logger.warn('Connection info not found for WebSocket on unregister');
      return;
    }

    // Extract userId and userType from connection info
    const { userId, userType } = connectionInfo;

    // Remove the connection from connectionsByUserId map
    this.connectionsByUserId.delete(userId);

    // Remove the connection from connectionsByUserType map
    const userTypeConnections = this.connectionsByUserType.get(userType);
    if (userTypeConnections) {
      userTypeConnections.delete(ws);
      if (userTypeConnections.size === 0) {
        this.connectionsByUserType.delete(userType);
      }
    }

    // Remove the connection from connectionInfo map
    this.connectionInfo.delete(ws);
  }

  /**
   * @function broadcastNotification
   * Broadcasts a notification to the intended recipient
   * @param {Notification} notification - Notification object to broadcast
   * @returns {Promise<boolean>} True if notification was delivered, false otherwise
   */
  public async broadcastNotification(notification: Notification): Promise<boolean> {
    // Extract userId and userType from notification
    const { userId, userType } = notification;

    // Check if user has an active WebSocket connection
    const ws = this.connectionsByUserId.get(userId);

    // If connection exists, create notification message
    if (ws && ws.readyState === WebSocket.OPEN) {
      const notificationMessage: NotificationMessage = { type: 'notification', notification };

      // Send notification to the user's connection
      const success = this.sendToConnection(ws, notificationMessage);

      // Return true if notification was sent successfully
      if (success) {
        logger.info('Broadcasted notification to WebSocket connection', { notificationId: notification.id, userId, userType });
        return true;
      } else {
        logger.error('Failed to broadcast notification to WebSocket connection', { notificationId: notification.id, userId, userType });
        return false;
      }
    } else {
      logger.warn('No active WebSocket connection found for user', { userId, userType });
      return false;
    }
  }

  /**
   * @function sendToConnection
   * Sends a message to a specific WebSocket connection
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {object} message - Message to send
   * @returns {boolean} True if message was sent successfully, false otherwise
   */
  private sendToConnection(ws: WebSocket, message: object): boolean {
    // Check if the connection is open (readyState === WebSocket.OPEN)
    if (ws.readyState === WebSocket.OPEN) {
      try {
        // Stringify the message and send it
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        logger.error('Error sending message to WebSocket connection', { error, message });
        return false;
      }
    } else {
      logger.warn('WebSocket connection is not open, cannot send message');
      return false;
    }
  }

  /**
   * @function startHeartbeat
   * Starts the heartbeat interval to keep connections alive and detect stale connections
   * @returns {void} No return value
   */
  private startHeartbeat(): void {
    // Set up an interval to run the heartbeat check
    this.heartbeatInterval = setInterval(() => {
      // Iterate over all connections
      this.wss.clients.forEach((ws: WebSocket) => {
        // Get connection info for the WebSocket
        const connectionInfo = this.connectionInfo.get(ws);

        // Check if connection info exists
        if (!connectionInfo) {
          logger.warn('Connection info not found for WebSocket during heartbeat check');
          ws.terminate();
          return;
        }

        // Check last activity timestamp
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - connectionInfo.lastActivity.getTime();

        // If connection is stale (no activity for too long), close it
        if (timeSinceLastActivity > CONNECTION_TIMEOUT) {
          logger.warn('Stale WebSocket connection, terminating', {
            userId: connectionInfo.userId,
            userType: connectionInfo.userType,
            timeSinceLastActivity
          });
          ws.terminate();
          this.unregisterConnection(ws);
          return;
        }

        // For active connections, send ping message
        ws.ping();
        logger.debug('Sending ping message to WebSocket connection', {
          userId: connectionInfo.userId,
          userType: connectionInfo.userType
        });
      });
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * @function stopHeartbeat
   * Stops the heartbeat interval
   * @returns {void} No return value
   */
  private stopHeartbeat(): void {
    // Clear the heartbeat interval
    clearInterval(this.heartbeatInterval);

    // Log heartbeat stopped
    logger.info('WebSocket heartbeat stopped');
  }

  /**
   * @function handleNotificationEvent
   * Handles notification events from Kafka
   * @param {object} event - Kafka event object
   * @returns {Promise<void>} Promise that resolves when event is processed
   */
  private async handleNotificationEvent(event: any): Promise<void> {
    try {
      // Extract event type and notification data from event
      const { type, notification } = event;

      // If event type is NOTIFICATION_CREATED, broadcast the new notification
      if (type === EventTypes.NOTIFICATION_CREATED) {
        this.broadcastNotification(notification);
      }

      // If event type is NOTIFICATION_UPDATED, broadcast the notification update
      if (type === EventTypes.NOTIFICATION_UPDATED) {
        this.broadcastNotification(notification);
      }

      // Log event processing
      logger.info('Notification event processed', { type, notificationId: notification.id });
    } catch (error) {
      logger.error('Error processing notification event', { error, event });
    }
  }

  /**
   * @function sendUnreadCount
   * Sends the unread notification count to a user
   * @param {WebSocket} ws - WebSocket connection instance
   * @param {string} userId - User ID
   * @param {string} userType - User type
   * @returns {Promise<void>} Promise that resolves when count is sent
   */
  private async sendUnreadCount(ws: WebSocket, userId: string, userType: string): Promise<void> {
    try {
      // Call notificationService.getUnreadCount to get count
      const count = await this.notificationService.getUnreadCount(userId, userType);

      // Create unread count message
      const unreadCountMessage: UnreadCountMessage = { type: 'unreadCount', count };

      // Send message to the WebSocket connection
      this.sendToConnection(ws, unreadCountMessage);

      // Log successful count delivery
      logger.info('Sent unread notification count to WebSocket connection', { userId, userType, count });
    } catch (error) {
      logger.error('Error sending unread notification count to WebSocket connection', { error, userId, userType });
    }
  }

  /**
   * @function close
   * Closes the WebSocket server and all connections
   * @returns {Promise<void>} Promise that resolves when server is closed
   */
  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop the heartbeat interval
      this.stopHeartbeat();

      // Close all open connections
      this.wss.clients.forEach((ws: WebSocket) => {
        ws.close(1000, 'Server is closing');
        this.unregisterConnection(ws);
      });

      // Close the WebSocket server
      this.wss.close((err: any) => {
        if (err) {
          logger.error('Error closing WebSocket server', { error: err });
          reject(err);
        } else {
          // Clear all connection tracking maps
          this.connectionsByUserId.clear();
          this.connectionsByUserType.clear();
          this.connectionInfo.clear();

          // Log server closure
          logger.info('WebSocket server closed');
          resolve();
        }
      });
    });
  }
}