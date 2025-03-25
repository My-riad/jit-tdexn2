import { PositionService, validatePositionUpdate } from '../../src/services/position.service';
import { PositionModel } from '../../src/models/position.model';
import { HistoricalPositionModel } from '../../src/models/historical-position.model';
import { PositionEventsProducer } from '../../src/producers/position-events.producer';
import { GeofenceService } from '../../src/services/geofence.service';
import { EntityType, Position, PositionUpdate, NearbyQuery, PositionSource } from '../../../common/interfaces/position.interface';
import { AppError } from '../../../common/utils/error-handler';
import Redis from 'ioredis-mock'; // ioredis-mock@^8.0.0
import { Redis as RedisType } from 'ioredis'; // ioredis-mock@^8.0.0
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0

// Mock the logger
jest.mock('../../../common/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

/**
 * Creates a mock Redis client for testing
 * @returns Mock Redis client with spied methods
 */
function createMockRedisClient(): RedisType {
  // Create a new Redis mock instance
  const redisClient = new Redis();

  // Spy on the get, set, and del methods
  jest.spyOn(redisClient, 'get');
  jest.spyOn(redisClient, 'set');
  jest.spyOn(redisClient, 'del');

  // Return the mocked Redis client
  return redisClient as unknown as RedisType;
}

/**
 * Creates a mock position events producer for testing
 * @returns Mock position events producer with spied methods
 */
function createMockPositionProducer(): { publishPositionUpdate: jest.Mock } {
  // Create a mock object with publishPositionUpdate method
  const producer = {
    publishPositionUpdate: jest.fn().mockResolvedValue(undefined)
  };

  // Return the mocked producer
  return producer;
}

/**
 * Creates a mock geofence service for testing
 * @returns Mock geofence service with spied methods
 */
function createMockGeofenceService(): { processPositionUpdate: jest.Mock } {
  // Create a mock object with processPositionUpdate method
  const geofenceService = {
    processPositionUpdate: jest.fn().mockResolvedValue([])
  };

  // Return the mocked service
  return geofenceService;
}

/**
 * Creates a test position update object
 * @param overrides - Optional overrides for the default position update
 * @returns Test position update data
 */
function createTestPositionUpdate(overrides: Partial<PositionUpdate> = {}): PositionUpdate {
  // Create a default position update object with test data
  const defaultPositionUpdate: PositionUpdate = {
    entity_id: uuidv4(),
    entity_type: EntityType.DRIVER,
    latitude: 34.0522,
    longitude: -118.2437,
    heading: 90,
    speed: 60,
    accuracy: 10,
    source: PositionSource.MOBILE_APP,
    timestamp: new Date()
  };

  // Override default values with any provided overrides
  return { ...defaultPositionUpdate, ...overrides };
}

/**
 * Creates a test position object
 * @param overrides - Optional overrides for the default position
 * @returns Test position data
 */
function createTestPosition(overrides: Partial<Position> = {}): Position {
  // Create a default position object with test data
  const defaultPosition: Position = {
    latitude: 34.0522,
    longitude: -118.2437,
    heading: 90,
    speed: 60,
    accuracy: 10,
    source: PositionSource.MOBILE_APP,
    timestamp: new Date()
  };

  // Override default values with any provided overrides
  return { ...defaultPosition, ...overrides };
}

describe('PositionService', () => {
  let positionService: PositionService;
  let redisClient: RedisType;
  let positionProducer: { publishPositionUpdate: jest.Mock };
  let geofenceService: { processPositionUpdate: jest.Mock };

  beforeEach(() => {
    redisClient = createMockRedisClient();
    positionProducer = createMockPositionProducer();
    geofenceService = createMockGeofenceService();
    positionService = new PositionService(redisClient, positionProducer as any, geofenceService as any);
  });

  it('should be defined', () => {
    expect(PositionService).toBeDefined();
  });

  it('should initialize with required dependencies', () => {
    expect(positionService.redisClient).toBeDefined();
    expect(positionService.positionProducer).toBeDefined();
    expect(positionService.geofenceService).toBeDefined();
  });

  describe('validatePositionUpdate', () => {
    it('should validate a valid position update', () => {
      const positionUpdate = createTestPositionUpdate();
      expect(validatePositionUpdate(positionUpdate)).toBe(true);
    });

    it('should throw an error for missing required fields', () => {
      const positionUpdate = createTestPositionUpdate({ latitude: undefined });
      expect(() => validatePositionUpdate(positionUpdate as PositionUpdate)).toThrow(AppError);
    });

    it('should throw an error for invalid latitude', () => {
      const positionUpdate = createTestPositionUpdate({ latitude: 100 });
      expect(() => validatePositionUpdate(positionUpdate as PositionUpdate)).toThrow(AppError);
    });

    it('should throw an error for invalid longitude', () => {
      const positionUpdate = createTestPositionUpdate({ longitude: 200 });
      expect(() => validatePositionUpdate(positionUpdate as PositionUpdate)).toThrow(AppError);
    });

    it('should throw an error for invalid entity type', () => {
      const positionUpdate = createTestPositionUpdate({ entity_type: 'invalid' as EntityType });
      expect(() => validatePositionUpdate(positionUpdate as PositionUpdate)).toThrow(AppError);
    });
  });

  describe('getCurrentPosition', () => {
    it('should return cached position if available', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const cachedPosition = createTestPosition();
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedPosition));

      const position = await positionService.getCurrentPosition(entityId, entityType);

      expect(redisClient.get).toHaveBeenCalledWith(`position:cache:${entityId}:${entityType}`);
      expect(position).toEqual(cachedPosition);
    });

    it('should query database if position not in cache', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const dbPosition = {
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      };
      (PositionModel.getByEntityId as jest.Mock).mockResolvedValue(dbPosition);

      await positionService.getCurrentPosition(entityId, entityType);

      expect(PositionModel.getByEntityId).toHaveBeenCalledWith(entityId, entityType);
    });

    it('should cache position retrieved from database', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const dbPosition = {
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      };
      (PositionModel.getByEntityId as jest.Mock).mockResolvedValue(dbPosition);

      await positionService.getCurrentPosition(entityId, entityType);

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should return null if position not found', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (PositionModel.getByEntityId as jest.Mock).mockResolvedValue(null);

      const position = await positionService.getCurrentPosition(entityId, entityType);

      expect(position).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const position = await positionService.getCurrentPosition(entityId, entityType);

      expect(position).toBeNull();
    });
  });

  describe('getPositionHistory', () => {
    it('should retrieve historical positions within time range', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const startTime = new Date('2023-01-01');
      const endTime = new Date('2023-01-02');
      const historicalPositions = [{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }];
      (HistoricalPositionModel.getByEntityId as jest.Mock).mockResolvedValue(historicalPositions);

      const positions = await positionService.getPositionHistory(entityId, entityType, startTime, endTime, {});

      expect(HistoricalPositionModel.getByEntityId).toHaveBeenCalledWith(entityId, entityType, startTime, endTime, {});
      expect(positions).toEqual(historicalPositions);
    });

    it('should apply limit and offset options', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const startTime = new Date('2023-01-01');
      const endTime = new Date('2023-01-02');
      const options = { limit: 10, offset: 5 };
      (HistoricalPositionModel.getByEntityId as jest.Mock).mockResolvedValue([]);

      await positionService.getPositionHistory(entityId, entityType, startTime, endTime, options);

      expect(HistoricalPositionModel.getByEntityId).toHaveBeenCalledWith(entityId, entityType, startTime, endTime, options);
    });

    it('should return empty array if no positions found', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const startTime = new Date('2023-01-01');
      const endTime = new Date('2023-01-02');
      (HistoricalPositionModel.getByEntityId as jest.Mock).mockResolvedValue([]);

      const positions = await positionService.getPositionHistory(entityId, entityType, startTime, endTime, {});

      expect(positions).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const startTime = new Date('2023-01-01');
      const endTime = new Date('2023-01-02');
      (HistoricalPositionModel.getByEntityId as jest.Mock).mockRejectedValue(new Error('Database error'));

      const positions = await positionService.getPositionHistory(entityId, entityType, startTime, endTime, {});

      expect(positions).toEqual([]);
    });
  });

  describe('getNearbyEntities', () => {
    it('should retrieve entities near a location', async () => {
      const query: NearbyQuery = { latitude: 34.0522, longitude: -118.2437, radius: 10 };
      const nearbyEntities = [{
        entity_id: uuidv4(),
        entity_type: EntityType.DRIVER,
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }];
      (PositionModel.getNearbyEntities as jest.Mock).mockResolvedValue(nearbyEntities);

      const entities = await positionService.getNearbyEntities(query);

      expect(PositionModel.getNearbyEntities).toHaveBeenCalledWith(query);
      expect(entities).toEqual(nearbyEntities.map(entity => ({
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        position: {
          latitude: entity.latitude,
          longitude: entity.longitude,
          heading: entity.heading,
          speed: entity.speed,
          accuracy: entity.accuracy,
          source: entity.source,
          timestamp: entity.timestamp
        }
      })));
    });

    it('should apply entity type filter if provided', async () => {
      const query: NearbyQuery = { latitude: 34.0522, longitude: -118.2437, radius: 10, entity_type: EntityType.DRIVER };
      (PositionModel.getNearbyEntities as jest.Mock).mockResolvedValue([]);

      await positionService.getNearbyEntities(query);

      expect(PositionModel.getNearbyEntities).toHaveBeenCalledWith(query);
    });

    it('should apply limit if provided', async () => {
      const query: NearbyQuery = { latitude: 34.0522, longitude: -118.2437, radius: 10, limit: 5 };
      (PositionModel.getNearbyEntities as jest.Mock).mockResolvedValue([]);

      await positionService.getNearbyEntities(query);

      expect(PositionModel.getNearbyEntities).toHaveBeenCalledWith(query);
    });

    it('should return empty array if no entities found', async () => {
      const query: NearbyQuery = { latitude: 34.0522, longitude: -118.2437, radius: 10 };
      (PositionModel.getNearbyEntities as jest.Mock).mockResolvedValue([]);

      const entities = await positionService.getNearbyEntities(query);

      expect(entities).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const query: NearbyQuery = { latitude: 34.0522, longitude: -118.2437, radius: 10 };
      (PositionModel.getNearbyEntities as jest.Mock).mockRejectedValue(new Error('Database error'));

      const entities = await positionService.getNearbyEntities(query);

      expect(entities).toEqual([]);
    });
  });

  describe('updatePosition', () => {
    it('should validate the position update', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });

      await positionService.updatePosition(positionUpdate);

      expect(PositionModel.updatePosition).toHaveBeenCalled();
    });

    it('should update position in database', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });

      await positionService.updatePosition(positionUpdate);

      expect(PositionModel.updatePosition).toHaveBeenCalledWith(positionUpdate);
    });

    it('should cache the updated position', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });

      await positionService.updatePosition(positionUpdate);

      expect(redisClient.set).toHaveBeenCalled();
    });

    it('should publish the position update event', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });

      await positionService.updatePosition(positionUpdate);

      expect(positionProducer.publishPositionUpdate).toHaveBeenCalledWith(positionUpdate);
    });

    it('should process the position update for geofence events', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });

      await positionService.updatePosition(positionUpdate);

      expect(geofenceService.processPositionUpdate).toHaveBeenCalledWith(
        positionUpdate.entity_id,
        positionUpdate.entity_type,
        positionUpdate.latitude,
        positionUpdate.longitude,
        positionUpdate.timestamp
      );
    });

    it('should return the updated position', async () => {
      const positionUpdate = createTestPositionUpdate();
      const dbPosition = {
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      };
      (PositionModel.updatePosition as jest.Mock).mockResolvedValue(dbPosition);

      const position = await positionService.updatePosition(positionUpdate);

      expect(position).toEqual({
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      });
    });

    it('should handle errors gracefully', async () => {
      const positionUpdate = createTestPositionUpdate();
      (PositionModel.updatePosition as jest.Mock).mockRejectedValue(new Error('Database error'));

      const position = await positionService.updatePosition(positionUpdate);

      expect(position).toBeNull();
    });
  });

  describe('bulkUpdatePositions', () => {
    it('should validate each position update', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      await positionService.bulkUpdatePositions(positionUpdates);

      expect(PositionModel.bulkUpdatePositions).toHaveBeenCalled();
    });

    it('should update positions in database', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      await positionService.bulkUpdatePositions(positionUpdates);

      expect(PositionModel.bulkUpdatePositions).toHaveBeenCalledWith(positionUpdates);
    });

    it('should cache each updated position', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      await positionService.bulkUpdatePositions(positionUpdates);

      expect(redisClient.set).toHaveBeenCalledTimes(positionUpdates.length);
    });

    it('should publish events for each position update', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      await positionService.bulkUpdatePositions(positionUpdates);

      expect(positionProducer.publishPositionUpdate).toHaveBeenCalledTimes(positionUpdates.length);
    });

    it('should process each position update for geofence events', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      await positionService.bulkUpdatePositions(positionUpdates);

      expect(geofenceService.processPositionUpdate).toHaveBeenCalledTimes(positionUpdates.length);
    });

    it('should return array of updated positions', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockResolvedValue([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);

      const positions = await positionService.bulkUpdatePositions(positionUpdates);

      expect(positions).toEqual([{
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: PositionSource.MOBILE_APP,
        timestamp: new Date()
      }]);
    });

    it('should handle errors gracefully', async () => {
      const positionUpdates = [createTestPositionUpdate()];
      (PositionModel.bulkUpdatePositions as jest.Mock).mockRejectedValue(new Error('Database error'));

      const positions = await positionService.bulkUpdatePositions(positionUpdates);

      expect(positions).toEqual([]);
    });
  });

  describe('deletePosition', () => {
    it('should delete position from database', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (PositionModel.deletePosition as jest.Mock).mockResolvedValue(1);

      await positionService.deletePosition(entityId, entityType);

      expect(PositionModel.deletePosition).toHaveBeenCalledWith(entityId, entityType);
    });

    it('should invalidate position cache', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (PositionModel.deletePosition as jest.Mock).mockResolvedValue(1);

      await positionService.deletePosition(entityId, entityType);

      expect(redisClient.del).toHaveBeenCalledWith(`position:cache:${entityId}:${entityType}`);
    });

    it('should return true if deletion successful', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (PositionModel.deletePosition as jest.Mock).mockResolvedValue(1);

      const result = await positionService.deletePosition(entityId, entityType);

      expect(result).toBe(true);
    });

    it('should return false if position not found', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (PositionModel.deletePosition as jest.Mock).mockResolvedValue(0);

      const result = await positionService.deletePosition(entityId, entityType);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (PositionModel.deletePosition as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await positionService.deletePosition(entityId, entityType);

      expect(result).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two entities', async () => {
      const entityId1 = uuidv4();
      const entityType1 = EntityType.DRIVER;
      const entityId2 = uuidv4();
      const entityType2 = EntityType.DRIVER;
      const position1 = createTestPosition({ latitude: 34.0522, longitude: -118.2437 });
      const position2 = createTestPosition({ latitude: 34.0522, longitude: -118.2437 });
      (positionService.getCurrentPosition as jest.Mock).mockResolvedValueOnce(position1).mockResolvedValueOnce(position2);

      await positionService.calculateDistance(entityId1, entityType1, entityId2, entityType2);

      expect(positionService.getCurrentPosition).toHaveBeenCalledWith(entityId1, entityType1);
      expect(positionService.getCurrentPosition).toHaveBeenCalledWith(entityId2, entityType2);
    });

    it('should calculate distance between entity and coordinates', async () => {
      const entityId1 = uuidv4();
      const entityType1 = EntityType.DRIVER;
      const latitude = 34.0522;
      const longitude = -118.2437;
      const position1 = createTestPosition({ latitude: 34.0522, longitude: -118.2437 });
      (positionService.getCurrentPosition as jest.Mock).mockResolvedValueOnce(position1);

      await positionService.calculateDistance(entityId1, entityType1, latitude, longitude);

      expect(positionService.getCurrentPosition).toHaveBeenCalledWith(entityId1, entityType1);
    });

    it('should return null if any position not found', async () => {
      const entityId1 = uuidv4();
      const entityType1 = EntityType.DRIVER;
      const entityId2 = uuidv4();
      const entityType2 = EntityType.DRIVER;
      (positionService.getCurrentPosition as jest.Mock).mockResolvedValueOnce(null);

      const distance = await positionService.calculateDistance(entityId1, entityType1, entityId2, entityType2);

      expect(distance).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const entityId1 = uuidv4();
      const entityType1 = EntityType.DRIVER;
      const entityId2 = uuidv4();
      const entityType2 = EntityType.DRIVER;
      (positionService.getCurrentPosition as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const distance = await positionService.calculateDistance(entityId1, entityType1, entityId2, entityType2);

      expect(distance).toBeNull();
    });
  });

  describe('cachePosition', () => {
    it('should cache position with correct key', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const position = createTestPosition();

      await positionService.cachePosition(entityId, entityType, position);

      expect(redisClient.set).toHaveBeenCalledWith(`position:cache:${entityId}:${entityType}`, JSON.stringify(position), 'EX', 300);
    });

    it('should set appropriate TTL for cached position', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const position = createTestPosition();

      await positionService.cachePosition(entityId, entityType, position);

      expect(redisClient.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
    });

    it('should handle errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const position = createTestPosition();
      (redisClient.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await positionService.cachePosition(entityId, entityType, position);

      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getCachedPosition', () => {
    it('should retrieve cached position if available', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      const position = createTestPosition();
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(position));

      const cachedPosition = await positionService.getCachedPosition(entityId, entityType);

      expect(redisClient.get).toHaveBeenCalledWith(`position:cache:${entityId}:${entityType}`);
      expect(cachedPosition).toEqual(position);
    });

    it('should return null if position not in cache', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const cachedPosition = await positionService.getCachedPosition(entityId, entityType);

      expect(cachedPosition).toBeNull();
    });

    it('should handle parsing errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockResolvedValue('invalid json');

      const cachedPosition = await positionService.getCachedPosition(entityId, entityType);

      expect(cachedPosition).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const cachedPosition = await positionService.getCachedPosition(entityId, entityType);

      expect(cachedPosition).toBeNull();
    });
  });

  describe('invalidatePositionCache', () => {
    it('should delete position from cache with correct key', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;

      await positionService.invalidatePositionCache(entityId, entityType);

      expect(redisClient.del).toHaveBeenCalledWith(`position:cache:${entityId}:${entityType}`);
    });

    it('should handle errors gracefully', async () => {
      const entityId = uuidv4();
      const entityType = EntityType.DRIVER;
      (redisClient.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await positionService.invalidatePositionCache(entityId, entityType);

      expect(redisClient.del).toHaveBeenCalled();
    });
  });
});