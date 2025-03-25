import request from 'supertest'; // supertest@^6.3.3
import { app } from '../../src/app';
import { PositionService } from '../../src/services/position.service';
import { GeofenceService } from '../../src/services/geofence.service';
import { ETAService } from '../../src/services/eta.service';
import { EntityType, GeofenceEventType } from '../../../common/interfaces/position.interface';
import { StatusCodes } from '../../../common/constants/status-codes';
import Redis from 'ioredis-mock'; // ioredis-mock@^8.2.0

// Jest Mock declarations for global usage
declare global {
  var mockPositionService: any;
  var mockGeofenceService: any;
  var mockETAService: any;
  var mockRedisClient: any;
}

// BeforeAll hook to set up mock implementations for services
beforeAll(() => {
  global.mockPositionService = {
    updatePosition: jest.fn(),
    getCurrentPosition: jest.fn(),
    getPositionHistory: jest.fn(),
    getNearbyEntities: jest.fn(),
    calculateDistance: jest.fn(),
    calculateAverageSpeed: jest.fn(),
    bulkUpdatePositions: jest.fn()
  };

  global.mockGeofenceService = {
    createGeofence: jest.fn(),
    getGeofence: jest.fn(),
    getNearbyGeofences: jest.fn(),
    updateGeofence: jest.fn(),
    deleteGeofence: jest.fn(),
    processPositionUpdate: jest.fn()
  };

  global.mockETAService = {
    getETA: jest.fn(),
    getETAWithRouteInfo: jest.fn(),
    getRemainingDistance: jest.fn(),
    getETAForMultipleEntities: jest.fn()
  };

  global.mockRedisClient = new Redis();

  // Override the service implementations with mock implementations
  jest.spyOn(PositionService.prototype, 'updatePosition').mockImplementation(global.mockPositionService.updatePosition);
  jest.spyOn(PositionService.prototype, 'getCurrentPosition').mockImplementation(global.mockPositionService.getCurrentPosition);
  jest.spyOn(PositionService.prototype, 'getPositionHistory').mockImplementation(global.mockPositionService.getPositionHistory);
  jest.spyOn(PositionService.prototype, 'getNearbyEntities').mockImplementation(global.mockPositionService.getNearbyEntities);
  jest.spyOn(PositionService.prototype, 'calculateDistance').mockImplementation(global.mockPositionService.calculateDistance);
  jest.spyOn(PositionService.prototype, 'calculateAverageSpeed').mockImplementation(global.mockPositionService.calculateAverageSpeed);
  jest.spyOn(PositionService.prototype, 'bulkUpdatePositions').mockImplementation(global.mockPositionService.bulkUpdatePositions);

  jest.spyOn(GeofenceService.prototype, 'createGeofence').mockImplementation(global.mockGeofenceService.createGeofence);
  jest.spyOn(GeofenceService.prototype, 'getGeofence').mockImplementation(global.mockGeofenceService.getGeofence);
  jest.spyOn(GeofenceService.prototype, 'getNearbyGeofences').mockImplementation(global.mockGeofenceService.getNearbyGeofences);
  jest.spyOn(GeofenceService.prototype, 'updateGeofence').mockImplementation(global.mockGeofenceService.updateGeofence);
  jest.spyOn(GeofenceService.prototype, 'deleteGeofence').mockImplementation(global.mockGeofenceService.deleteGeofence);
  jest.spyOn(GeofenceService.prototype, 'processPositionUpdate').mockImplementation(global.mockGeofenceService.processPositionUpdate);

  jest.spyOn(ETAService.prototype, 'getETA').mockImplementation(global.mockETAService.getETA);
  jest.spyOn(ETAService.prototype, 'getETAWithRouteInfo').mockImplementation(global.mockETAService.getETAWithRouteInfo);
  jest.spyOn(ETAService.prototype, 'getRemainingDistance').mockImplementation(global.mockETAService.getRemainingDistance);
  jest.spyOn(ETAService.prototype, 'getETAForMultipleEntities').mockImplementation(global.mockETAService.getETAForMultipleEntities);
});

// AfterEach hook to reset all mocks
afterEach(() => {
  jest.clearAllMocks();
});

describe('Position API Endpoints', () => {
  it('GET /positions/:entityId should return current position', async () => {
    // Mock getCurrentPosition to return a test position
    global.mockPositionService.getCurrentPosition.mockResolvedValue({
      latitude: 34.0522,
      longitude: -118.2437,
      heading: 90,
      speed: 60,
      accuracy: 10,
      source: 'mobile_app',
      timestamp: new Date()
    });

    // Send GET request to /api/positions/:entityId
    const res = await request(app).get('/api/v1/tracking/positions/testEntity/driver');

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the expected position data
    expect(res.body).toEqual(expect.objectContaining({
      latitude: 34.0522,
      longitude: -118.2437
    }));

    // Verify getCurrentPosition was called with correct parameters
    expect(global.mockPositionService.getCurrentPosition).toHaveBeenCalledWith('testEntity', 'driver');
  });

  it('GET /positions/:entityId should return 404 when position not found', async () => {
    // Mock getCurrentPosition to return null
    global.mockPositionService.getCurrentPosition.mockResolvedValue(null);

    // Send GET request to /api/positions/:entityId
    const res = await request(app).get('/api/v1/tracking/positions/nonExistentEntity/driver');

    // Verify response status is 404 Not Found
    expect(res.statusCode).toEqual(StatusCodes.NOT_FOUND);

    // Verify getCurrentPosition was called with correct parameters
    expect(global.mockPositionService.getCurrentPosition).toHaveBeenCalledWith('nonExistentEntity', 'driver');
  });

  it('POST /positions should update position', async () => {
    // Mock updatePosition to return updated position
    const updatedPosition = {
      entity_id: 'testEntity',
      entity_type: 'driver',
      latitude: 34.0522,
      longitude: -118.2437,
      heading: 90,
      speed: 60,
      accuracy: 10,
      source: 'mobile_app',
      timestamp: new Date()
    };
    global.mockPositionService.updatePosition.mockResolvedValue(updatedPosition);

    // Send POST request to /api/positions with position data
    const res = await request(app)
      .post('/api/v1/tracking/positions/testEntity/driver')
      .send(updatedPosition);

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the updated position
    expect(res.body).toEqual(expect.objectContaining({
      entity_id: 'testEntity',
      latitude: 34.0522
    }));

    // Verify updatePosition was called with correct parameters
    expect(global.mockPositionService.updatePosition).toHaveBeenCalledWith(expect.objectContaining({
      entity_id: 'testEntity',
      latitude: 34.0522
    }));
  });

  it('POST /positions should return 400 for invalid position data', async () => {
    // Send POST request to /api/positions with invalid position data
    const res = await request(app)
      .post('/api/v1/tracking/positions/testEntity/driver')
      .send({ latitude: 'invalid' });

    // Verify response status is 400 Bad Request
    expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);

    // Verify updatePosition was not called
    expect(global.mockPositionService.updatePosition).not.toHaveBeenCalled();
  });

  it('POST /positions/bulk should update multiple positions', async () => {
    // Mock bulkUpdatePositions to return array of updated positions
    const updatedPositions = [
      {
        entity_id: 'testEntity1',
        entity_type: 'driver',
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: 'mobile_app',
        timestamp: new Date()
      },
      {
        entity_id: 'testEntity2',
        entity_type: 'vehicle',
        latitude: 37.7749,
        longitude: -122.4194,
        heading: 180,
        speed: 45,
        accuracy: 5,
        source: 'gps_device',
        timestamp: new Date()
      }
    ];
    global.mockPositionService.bulkUpdatePositions.mockResolvedValue(updatedPositions);

    // Send POST request to /api/positions/bulk with array of position updates
    const res = await request(app)
      .post('/api/v1/tracking/positions/bulk')
      .send(updatedPositions);

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains array of updated positions
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity_id: 'testEntity1', latitude: 34.0522 }),
      expect.objectContaining({ entity_id: 'testEntity2', latitude: 37.7749 })
    ]));

    // Verify bulkUpdatePositions was called with correct parameters
    expect(global.mockPositionService.bulkUpdatePositions).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ entity_id: 'testEntity1', latitude: 34.0522 }),
      expect.objectContaining({ entity_id: 'testEntity2', latitude: 37.7749 })
    ]));
  });

  it('GET /positions/nearby should return nearby entities', async () => {
    // Mock getNearbyEntities to return array of nearby entities
    const nearbyEntities = [
      {
        entity_id: 'testEntity1',
        entity_type: 'driver',
        position: {
          latitude: 34.0522,
          longitude: -118.2437,
          heading: 90,
          speed: 60,
          accuracy: 10,
          source: 'mobile_app',
          timestamp: new Date()
        }
      },
      {
        entity_id: 'testEntity2',
        entity_type: 'vehicle',
        position: {
          latitude: 34.0530,
          longitude: -118.2450,
          heading: 180,
          speed: 45,
          accuracy: 5,
          source: 'gps_device',
          timestamp: new Date()
        }
      }
    ];
    global.mockPositionService.getNearbyEntities.mockResolvedValue(nearbyEntities);

    // Send GET request to /api/positions/nearby with location parameters
    const res = await request(app)
      .get('/api/v1/tracking/nearby')
      .query({ latitude: 34.05, longitude: -118.24, radius: 10, entity_type: 'driver' });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains array of nearby entities
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity_id: 'testEntity1' }),
      expect.objectContaining({ entity_id: 'testEntity2' })
    ]));

    // Verify getNearbyEntities was called with correct parameters
    expect(global.mockPositionService.getNearbyEntities).toHaveBeenCalledWith(expect.objectContaining({
      latitude: 34.05,
      longitude: -118.24,
      radius: 10,
      entity_type: 'driver'
    }));
  });
});

describe('Geofence API Endpoints', () => {
  it('POST /geofences should create a new geofence', async () => {
    // Mock createGeofence to return a new geofence
    const newGeofence = {
      geofence_id: 'testGeofence',
      name: 'Test Geofence',
      entity_type: EntityType.DRIVER,
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 100
    };
    global.mockGeofenceService.createGeofence.mockResolvedValue(newGeofence);

    // Send POST request to /api/geofences with geofence data
    const res = await request(app)
      .post('/api/v1/tracking/geofences')
      .send(newGeofence);

    // Verify response status is 201 Created
    expect(res.statusCode).toEqual(StatusCodes.CREATED);

    // Verify response body contains the created geofence
    expect(res.body).toEqual(expect.objectContaining({
      geofence_id: 'testGeofence',
      name: 'Test Geofence'
    }));

    // Verify createGeofence was called with correct parameters
    expect(global.mockGeofenceService.createGeofence).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Geofence',
      latitude: 34.0522
    }));
  });

  it('GET /geofences/:geofenceId should return a geofence', async () => {
    // Mock getGeofence to return a test geofence
    const testGeofence = {
      geofence_id: 'testGeofence',
      name: 'Test Geofence',
      entity_type: EntityType.DRIVER,
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 100
    };
    global.mockGeofenceService.getGeofence.mockResolvedValue(testGeofence);

    // Send GET request to /api/geofences/:geofenceId
    const res = await request(app).get('/api/v1/tracking/geofences/testGeofence');

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the expected geofence data
    expect(res.body).toEqual(expect.objectContaining({
      geofence_id: 'testGeofence',
      name: 'Test Geofence'
    }));

    // Verify getGeofence was called with correct parameters
    expect(global.mockGeofenceService.getGeofence).toHaveBeenCalledWith('testGeofence');
  });

  it('GET /geofences/nearby should return nearby geofences', async () => {
    // Mock getNearbyGeofences to return array of nearby geofences
    const nearbyGeofences = [
      {
        geofence_id: 'testGeofence1',
        name: 'Test Geofence 1',
        entity_type: EntityType.DRIVER,
        latitude: 34.0522,
        longitude: -118.2437,
        radius: 100
      },
      {
        geofence_id: 'testGeofence2',
        name: 'Test Geofence 2',
        entity_type: EntityType.VEHICLE,
        latitude: 34.0530,
        longitude: -118.2450,
        radius: 50
      }
    ];
    global.mockGeofenceService.getNearbyGeofences.mockResolvedValue(nearbyGeofences);

    // Send GET request to /api/geofences/nearby with location parameters
    const res = await request(app)
      .get('/api/v1/tracking/geofences/nearby')
      .query({ latitude: 34.05, longitude: -118.24, radius: 1 });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains array of nearby geofences
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ geofence_id: 'testGeofence1' }),
      expect.objectContaining({ geofence_id: 'testGeofence2' })
    ]));

    // Verify getNearbyGeofences was called with correct parameters
    expect(global.mockGeofenceService.getNearbyGeofences).toHaveBeenCalledWith(34.05, -118.24, 1, {});
  });

  it('PUT /geofences/:geofenceId should update a geofence', async () => {
    // Mock updateGeofence to return updated geofence
    const updatedGeofence = {
      geofence_id: 'testGeofence',
      name: 'Updated Geofence Name',
      entity_type: EntityType.DRIVER,
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 100
    };
    global.mockGeofenceService.updateGeofence.mockResolvedValue(updatedGeofence);

    // Send PUT request to /api/geofences/:geofenceId with update data
    const res = await request(app)
      .put('/api/v1/tracking/geofences/testGeofence')
      .send({ name: 'Updated Geofence Name' });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the updated geofence
    expect(res.body).toEqual(expect.objectContaining({
      geofence_id: 'testGeofence',
      name: 'Updated Geofence Name'
    }));

    // Verify updateGeofence was called with correct parameters
    expect(global.mockGeofenceService.updateGeofence).toHaveBeenCalledWith('testGeofence', expect.objectContaining({ name: 'Updated Geofence Name' }));
  });

  it('DELETE /geofences/:geofenceId should delete a geofence', async () => {
    // Mock deleteGeofence to return true
    global.mockGeofenceService.deleteGeofence.mockResolvedValue(true);

    // Send DELETE request to /api/geofences/:geofenceId
    const res = await request(app).delete('/api/v1/tracking/geofences/testGeofence');

    // Verify response status is 204 No Content
    expect(res.statusCode).toEqual(StatusCodes.NO_CONTENT);

    // Verify deleteGeofence was called with correct parameters
    expect(global.mockGeofenceService.deleteGeofence).toHaveBeenCalledWith('testGeofence');
  });
});

describe('History API Endpoints', () => {
  it('GET /history/:entityId should return position history', async () => {
    // Mock getPositionHistory to return array of historical positions
    const historicalPositions = [
      {
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 60,
        accuracy: 10,
        source: 'mobile_app',
        timestamp: new Date()
      },
      {
        latitude: 34.0530,
        longitude: -118.2450,
        heading: 180,
        speed: 45,
        accuracy: 5,
        source: 'gps_device',
        timestamp: new Date()
      }
    ];
    global.mockPositionService.getPositionHistory.mockResolvedValue(historicalPositions);

    // Send GET request to /api/history/:entityId with time range parameters
    const res = await request(app)
      .get('/api/v1/tracking/history/testEntity/driver')
      .query({ startTime: new Date().toISOString(), endTime: new Date().toISOString() });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains array of historical positions
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ latitude: 34.0522 }),
      expect.objectContaining({ latitude: 34.0530 })
    ]));

    // Verify getPositionHistory was called with correct parameters
    expect(global.mockPositionService.getPositionHistory).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      expect.any(Date),
      expect.any(Date),
      expect.objectContaining({ limit: undefined, offset: undefined })
    );
  });

  it('GET /history/:entityId/trajectory should return trajectory data', async () => {
    // Mock getTrajectory to return GeoJSON trajectory data
    const trajectoryData = {
      type: 'LineString',
      coordinates: [[-118.2437, 34.0522], [-118.2450, 34.0530]]
    };
    global.mockPositionService.getPositionHistory.mockResolvedValue(trajectoryData);

    // Send GET request to /api/history/:entityId/trajectory with parameters
    const res = await request(app)
      .get('/api/v1/tracking/history/testEntity/driver/trajectory')
      .query({ startTime: new Date().toISOString(), endTime: new Date().toISOString() });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains GeoJSON trajectory data
    expect(res.body).toEqual(trajectoryData);

    // Verify getTrajectory was called with correct parameters
    expect(global.mockPositionService.getPositionHistory).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      expect.any(Date),
      expect.any(Date),
      expect.objectContaining({ limit: undefined, offset: undefined })
    );
  });

  it('GET /history/:entityId/distance should calculate traveled distance', async () => {
    // Mock calculateDistance to return distance value
    global.mockPositionService.calculateDistance.mockResolvedValue(15.5);

    // Send GET request to /api/history/:entityId/distance with time range
    const res = await request(app)
      .get('/api/v1/tracking/history/testEntity/driver/distance')
      .query({ startTime: new Date().toISOString(), endTime: new Date().toISOString() });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the calculated distance
    expect(res.body).toEqual({ distance_km: 15.5 });

    // Verify calculateDistance was called with correct parameters
    expect(global.mockPositionService.calculateDistance).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      expect.any(Date),
      expect.any(Date)
    );
  });

  it('GET /history/:entityId/speed should calculate average speed', async () => {
    // Mock calculateAverageSpeed to return speed value
    global.mockPositionService.calculateAverageSpeed.mockResolvedValue(70.2);

    // Send GET request to /api/history/:entityId/speed with time range
    const res = await request(app)
      .get('/api/v1/tracking/history/testEntity/driver/speed')
      .query({ startTime: new Date().toISOString(), endTime: new Date().toISOString() });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the calculated average speed
    expect(res.body).toEqual({ average_speed_kmh: 70.2 });

    // Verify calculateAverageSpeed was called with correct parameters
    expect(global.mockPositionService.calculateAverageSpeed).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      expect.any(Date),
      expect.any(Date)
    );
  });
});

describe('ETA API Endpoints', () => {
  it('GET /eta/:entityId should return ETA to destination', async () => {
    // Mock getETA to return ETA prediction
    const etaPrediction = {
      arrivalTime: new Date(),
      confidenceLevel: 0.85,
      remainingDistance: 150,
      estimatedDuration: 120,
      factors: {}
    };
    global.mockETAService.getETA.mockResolvedValue(etaPrediction);

    // Send GET request to /api/eta/:entityId with destination coordinates
    const res = await request(app)
      .get('/api/v1/tracking/eta/testEntity/driver')
      .query({ latitude: 34.0522, longitude: -118.2437 });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the ETA prediction
    expect(res.body).toEqual(expect.objectContaining({
      confidenceLevel: 0.85,
      remainingDistance: 150
    }));

    // Verify getETA was called with correct parameters
    expect(global.mockETAService.getETA).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      34.0522,
      -118.2437,
      expect.any(Object)
    );
  });

  it('POST /eta/:entityId/route should return ETA with route info', async () => {
    // Mock getETAWithRouteInfo to return ETA with route details
    const etaWithRoute = {
      arrivalTime: new Date(),
      confidenceLevel: 0.9,
      remainingDistance: 100,
      estimatedDuration: 90,
      factors: {},
      segments: []
    };
    global.mockETAService.getETAWithRouteInfo.mockResolvedValue(etaWithRoute);

    // Send POST request to /api/eta/:entityId/route with route data
    const res = await request(app)
      .post('/api/v1/tracking/eta/testEntity/driver')
      .query({ latitude: 34.0522, longitude: -118.2437 })
      .send({ routePoints: [{ latitude: 34.0, longitude: -118.2 }, { latitude: 34.1, longitude: -118.3 }] });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the ETA with route details
    expect(res.body).toEqual(expect.objectContaining({
      confidenceLevel: 0.9,
      remainingDistance: 100
    }));

    // Verify getETAWithRouteInfo was called with correct parameters
    expect(global.mockETAService.getETAWithRouteInfo).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      34.0522,
      -118.2437,
      expect.any(Array),
      expect.any(Object)
    );
  });

  it('GET /eta/:entityId/distance should return remaining distance', async () => {
    // Mock getRemainingDistance to return distance value
    global.mockETAService.getRemainingDistance.mockResolvedValue(85.2);

    // Send GET request to /api/eta/:entityId/distance with destination
    const res = await request(app)
      .get('/api/v1/tracking/eta/testEntity/driver/distance')
      .query({ latitude: 34.0522, longitude: -118.2437 });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains the remaining distance
    expect(res.body).toEqual({ remainingDistance: 85.2 });

    // Verify getRemainingDistance was called with correct parameters
    expect(global.mockETAService.getRemainingDistance).toHaveBeenCalledWith(
      'testEntity',
      'driver',
      34.0522,
      -118.2437,
      undefined
    );
  });

  it('POST /eta/batch should return ETAs for multiple entities', async () => {
    // Mock getETAForMultipleEntities to return array of ETAs
    const etaPredictions = [
      { entityId: 'testEntity1', arrivalTime: new Date() },
      { entityId: 'testEntity2', arrivalTime: new Date() }
    ];
    global.mockETAService.getETAForMultipleEntities.mockResolvedValue(etaPredictions);

    // Send POST request to /api/eta/batch with entity IDs and destination
    const res = await request(app)
      .post('/api/v1/tracking/eta/multiple')
      .send({ entityIds: ['testEntity1', 'testEntity2'], entityType: 'driver', latitude: 34.0522, longitude: -118.2437 });

    // Verify response status is 200 OK
    expect(res.statusCode).toEqual(StatusCodes.OK);

    // Verify response body contains array of ETA predictions
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: 'testEntity1' }),
      expect.objectContaining({ entityId: 'testEntity2' })
    ]));

    // Verify getETAForMultipleEntities was called with correct parameters
    expect(global.mockETAService.getETAForMultipleEntities).toHaveBeenCalledWith(
      ['testEntity1', 'testEntity2'],
      'driver',
      34.0522,
      -118.2437,
      expect.any(Object)
    );
  });
});

describe('Error Handling', () => {
  it('Should return 500 when service throws unexpected error', async () => {
    // Mock service method to throw an unexpected error
    global.mockPositionService.getCurrentPosition.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // Send request to API endpoint
    const res = await request(app).get('/api/v1/tracking/positions/testEntity/driver');

    // Verify response status is 500 Internal Server Error
    expect(res.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);

    // Verify response body contains error message
    expect(res.body).toHaveProperty('message', 'An unexpected error occurred');
  });

  it('Should return 400 for malformed request data', async () => {
    // Send request with malformed data to API endpoint
    const res = await request(app)
      .post('/api/v1/tracking/positions/testEntity/driver')
      .send({ latitude: 'invalid' });

    // Verify response status is 400 Bad Request
    expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);

    // Verify response body contains validation error details
    expect(res.body).toHaveProperty('message', 'Invalid request body');
  });

  it('Should return 404 for non-existent resources', async () => {
    // Mock service method to return null or not found
    global.mockPositionService.getCurrentPosition.mockResolvedValue(null);

    // Send request for non-existent resource
    const res = await request(app).get('/api/v1/tracking/positions/nonExistentEntity/driver');

    // Verify response status is 404 Not Found
    expect(res.statusCode).toEqual(StatusCodes.NOT_FOUND);

    // Verify response body contains appropriate error message
    expect(res.body).toHaveProperty('message', 'Position not found');
  });
});