import { EldService } from '../../src/services/eld.service';
import {
  EldProviderType,
  EldConnectionStatus,
  EldConnection,
  EldConnectionCreationParams,
  EldConnectionUpdateParams,
  EldTokenResponse,
} from '../../src/models/eld-connection.model';
import {
  KeepTruckinProvider,
} from '../../src/providers/keeptruckin.provider';
import {
  OmnitracsProvider,
} from '../../src/providers/omnitracs.provider';
import {
  SamsaraProvider,
} from '../../src/providers/samsara.provider';
import {
  DriverHOS,
  HOSStatus,
  Position,
} from '../../../common/interfaces/driver.interface';
import { AppError } from '../../../common/utils/error-handler';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { Knex } from 'knex'; // knex@^2.4.2
import { jest } from '@jest/globals'; // jest@^29.5.0

/**
 * Creates a mock Knex database instance for testing
 * @returns A mock Knex instance with stubbed methods
 */
const createMockDb = () => {
  const db: any = {};
  db.transaction = jest.fn().mockReturnThis();
  db.select = jest.fn().mockReturnThis();
  db.where = jest.fn().mockReturnThis();
  db.insert = jest.fn().mockReturnThis();
  db.update = jest.fn().mockReturnThis();
  db.del = jest.fn().mockReturnThis();
  db.first = jest.fn().mockReturnThis();
  db.then = jest.fn().mockReturnThis();
  db.catch = jest.fn().mockReturnThis();
  db.raw = jest.fn().mockReturnThis();
  return db;
};

/**
 * Creates a mock KeepTruckin provider for testing
 * @returns A mock KeepTruckinProvider with stubbed methods
 */
const createMockKeepTruckinProvider = () => {
  return {
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    getDriverHOS: jest.fn(),
    getDriverHOSLogs: jest.fn(),
    getDriverLocation: jest.fn(),
    validateConnection: jest.fn(),
  };
};

/**
 * Creates a mock Omnitracs provider for testing
 * @returns A mock OmnitracsProvider with stubbed methods
 */
const createMockOmnitracsProvider = () => {
  return {
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    getDriverHOS: jest.fn(),
    getDriverHOSLogs: jest.fn(),
    getDriverLocation: jest.fn(),
    validateConnection: jest.fn(),
  };
};

/**
 * Creates a mock Samsara provider for testing
 * @returns A mock SamsaraProvider with stubbed methods
 */
const createMockSamsaraProvider = () => {
  return {
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
    getDriverHOS: jest.fn(),
    getDriverHOSLogs: jest.fn(),
    getDriverLocation: jest.fn(),
    validateConnection: jest.fn(),
  };
};

describe('EldService', () => {
  let eldService: EldService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = createMockDb();
    eldService = new EldService(mockDb);

    // Mock provider instances
    eldService['keeptruckinProvider'] = createMockKeepTruckinProvider() as any;
    eldService['omnitracsProvider'] = createMockOmnitracsProvider() as any;
    eldService['samsaraProvider'] = createMockSamsaraProvider() as any;
  });

  describe('getAuthorizationUrl', () => {
    it('should return an authorization URL', async () => {
      const driverId = 'driver123';
      const providerType = EldProviderType.KEEPTRUCKIN;
      const redirectUri = 'https://example.com/callback';
      const state = 'teststate';
      const scope = 'read';
      const mockAuthUrl = 'https://keeptruckin.com/auth?test';

      (eldService['keeptruckinProvider'].getAuthorizationUrl as jest.Mock).mockReturnValue(mockAuthUrl);

      const authUrl = await eldService.getAuthorizationUrl(driverId, providerType, redirectUri, state, scope);

      expect(authUrl).toBe(mockAuthUrl);
      expect(eldService['keeptruckinProvider'].getAuthorizationUrl).toHaveBeenCalledWith(redirectUri, state, scope);
    });

    it('should throw an error if provider type is unsupported', async () => {
      const driverId = 'driver123';
      const providerType = 'INVALID' as any;
      const redirectUri = 'https://example.com/callback';
      const state = 'teststate';
      const scope = 'read';

      await expect(eldService.getAuthorizationUrl(driverId, providerType, redirectUri, state, scope))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if required parameters are missing', async () => {
      await expect(eldService.getAuthorizationUrl('', EldProviderType.KEEPTRUCKIN, 'uri', 'state', 'scope'))
        .rejects.toThrow(AppError);
      await expect(eldService.getAuthorizationUrl('driver', null, 'uri', 'state', 'scope'))
        .rejects.toThrow(AppError);
      await expect(eldService.getAuthorizationUrl('driver', EldProviderType.KEEPTRUCKIN, '', 'state', 'scope'))
        .rejects.toThrow(AppError);
      await expect(eldService.getAuthorizationUrl('driver', EldProviderType.KEEPTRUCKIN, 'uri', '', 'scope'))
        .rejects.toThrow(AppError);
      await expect(eldService.getAuthorizationUrl('driver', EldProviderType.KEEPTRUCKIN, 'uri', 'state', ''))
        .rejects.toThrow(AppError);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens and create a connection', async () => {
      const driverId = 'driver123';
      const providerType = EldProviderType.KEEPTRUCKIN;
      const code = 'testcode';
      const redirectUri = 'https://example.com/callback';
      const mockTokenResponse: EldTokenResponse = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'read',
      };

      (eldService['keeptruckinProvider'].exchangeCodeForTokens as jest.Mock).mockResolvedValue(mockTokenResponse);
      mockDb.getConnectionByDriverId.mockResolvedValue(null);
      mockDb.insert.mockResolvedValue([{ connection_id: 'conn123' }]);

      const connection = await eldService.exchangeCodeForTokens(driverId, providerType, code, redirectUri);

      expect(connection).toBeDefined();
      expect(eldService['keeptruckinProvider'].exchangeCodeForTokens).toHaveBeenCalledWith(code, redirectUri);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw an error if provider type is unsupported', async () => {
      const driverId = 'driver123';
      const providerType = 'INVALID' as any;
      const code = 'testcode';
      const redirectUri = 'https://example.com/callback';

      await expect(eldService.exchangeCodeForTokens(driverId, providerType, code, redirectUri))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if required parameters are missing', async () => {
      await expect(eldService.exchangeCodeForTokens('', EldProviderType.KEEPTRUCKIN, 'code', 'uri'))
        .rejects.toThrow(AppError);
      await expect(eldService.exchangeCodeForTokens('driver', null, 'code', 'uri'))
        .rejects.toThrow(AppError);
      await expect(eldService.exchangeCodeForTokens('driver', EldProviderType.KEEPTRUCKIN, '', 'uri'))
        .rejects.toThrow(AppError);
      await expect(eldService.exchangeCodeForTokens('driver', EldProviderType.KEEPTRUCKIN, 'code', ''))
        .rejects.toThrow(AppError);
    });
  });

  describe('createConnection', () => {
    it('should create a new ELD connection', async () => {
      const params: EldConnectionCreationParams = {
        driver_id: 'driver123',
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000),
      };

      mockDb.getConnectionByDriverId.mockResolvedValue(null);
      mockDb.insert.mockResolvedValue([{ connection_id: 'conn123' }]);

      const connection = await eldService.createConnection(params);

      expect(connection).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw an error if a connection already exists for the driver', async () => {
      const params: EldConnectionCreationParams = {
        driver_id: 'driver123',
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000),
      };

      mockDb.getConnectionByDriverId.mockResolvedValue({ connection_id: 'conn456' });

      await expect(eldService.createConnection(params))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if required parameters are missing', async () => {
      const params: any = {
        driver_id: 'driver123',
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
      };
      await expect(eldService.createConnection(params))
        .rejects.toThrow(AppError);
    });
  });

  describe('updateConnection', () => {
    it('should update an existing ELD connection', async () => {
      const connectionId = 'conn123';
      const params: EldConnectionUpdateParams = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_expires_at: new Date(Date.now() + 7200000),
        status: EldConnectionStatus.ACTIVE,
      };

      mockDb.getConnection.mockResolvedValue({ connection_id: connectionId });
      mockDb.update.mockResolvedValue(1);

      const connection = await eldService.updateConnection(connectionId, params);

      expect(connection).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw an error if the connection does not exist', async () => {
      const connectionId = 'conn123';
      const params: EldConnectionUpdateParams = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_expires_at: new Date(Date.now() + 7200000),
        status: EldConnectionStatus.ACTIVE,
      };

      mockDb.getConnection.mockResolvedValue(null);

      await expect(eldService.updateConnection(connectionId, params))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if required parameters are missing', async () => {
      const connectionId = 'conn123';
      const params: any = {};

      await expect(eldService.updateConnection(connectionId, params))
        .rejects.toThrow(AppError);
    });
  });

  describe('getConnection', () => {
    it('should retrieve an ELD connection by ID', async () => {
      const connectionId = 'conn123';
      const mockConnection: EldConnection = {
        connection_id: connectionId,
        driver_id: 'driver123',
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);

      const connection = await eldService.getConnection(connectionId);

      expect(connection).toEqual(mockConnection);
      expect(mockDb.where).toHaveBeenCalledWith('connection_id', connectionId);
    });

    it('should throw an error if the connection does not exist', async () => {
      const connectionId = 'conn123';

      mockDb.where.mockResolvedValue([]);
      mockDb.first.mockResolvedValue(null);

      await expect(eldService.getConnection(connectionId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the connection ID is missing', async () => {
      await expect(eldService.getConnection(''))
        .rejects.toThrow(AppError);
    });
  });

  describe('getConnectionByDriverId', () => {
    it('should retrieve an ELD connection by driver ID', async () => {
      const driverId = 'driver123';
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);

      const connection = await eldService.getConnectionByDriverId(driverId);

      expect(connection).toEqual(mockConnection);
      expect(mockDb.where).toHaveBeenCalledWith('driver_id', driverId);
    });

    it('should throw an error if the connection does not exist', async () => {
      const driverId = 'driver123';

      mockDb.where.mockResolvedValue([]);
      mockDb.first.mockResolvedValue(null);

      await expect(eldService.getConnectionByDriverId(driverId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the driver ID is missing', async () => {
      await expect(eldService.getConnectionByDriverId(''))
        .rejects.toThrow(AppError);
    });
  });

  describe('deleteConnection', () => {
    it('should delete an ELD connection', async () => {
      const connectionId = 'conn123';

      mockDb.where.mockResolvedValue([{ connection_id: connectionId }]);
      mockDb.del.mockResolvedValue(1);

      const result = await eldService.deleteConnection(connectionId);

      expect(result).toBe(true);
      expect(mockDb.del).toHaveBeenCalled();
    });

    it('should throw an error if the connection does not exist', async () => {
      const connectionId = 'conn123';

      mockDb.where.mockResolvedValue([]);
      mockDb.del.mockResolvedValue(0);

      await expect(eldService.deleteConnection(connectionId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the connection ID is missing', async () => {
      await expect(eldService.deleteConnection(''))
        .rejects.toThrow(AppError);
    });
  });

  describe('getDriverHOS', () => {
    it('should retrieve driver HOS data', async () => {
      const driverId = 'driver123';
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockHosData: DriverHOS = {
        hos_id: 'hos123',
        driver_id: driverId,
        status: HOSStatus.DRIVING,
        status_since: new Date(),
        driving_minutes_remaining: 480,
        duty_minutes_remaining: 720,
        cycle_minutes_remaining: 3600,
        location: { latitude: 34.0522, longitude: -118.2437 },
        vehicle_id: 'truck456',
        eld_log_id: 'log789',
        recorded_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);
      (eldService['keeptruckinProvider'].getDriverHOS as jest.Mock).mockResolvedValue(mockHosData);

      const hosData = await eldService.getDriverHOS(driverId);

      expect(hosData).toEqual(mockHosData);
      expect(eldService['keeptruckinProvider'].getDriverHOS).toHaveBeenCalledWith(driverId, 'test_access_token');
    });

    it('should throw an error if the connection is not active', async () => {
      const driverId = 'driver123';
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ERROR,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);

      await expect(eldService.getDriverHOS(driverId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the driver ID is missing', async () => {
      await expect(eldService.getDriverHOS(''))
        .rejects.toThrow(AppError);
    });
  });

  describe('getDriverHOSLogs', () => {
    it('should retrieve driver HOS logs', async () => {
      const driverId = 'driver123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockHosLogs: DriverHOS[] = [{
        hos_id: 'hos123',
        driver_id: driverId,
        status: HOSStatus.DRIVING,
        status_since: new Date(),
        driving_minutes_remaining: 480,
        duty_minutes_remaining: 720,
        cycle_minutes_remaining: 3600,
        location: { latitude: 34.0522, longitude: -118.2437 },
        vehicle_id: 'truck456',
        eld_log_id: 'log789',
        recorded_at: new Date(),
      }];

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);
      (eldService['keeptruckinProvider'].getDriverHOSLogs as jest.Mock).mockResolvedValue(mockHosLogs);

      const hosLogs = await eldService.getDriverHOSLogs(driverId, startDate, endDate);

      expect(hosLogs).toEqual(mockHosLogs);
      expect(eldService['keeptruckinProvider'].getDriverHOSLogs).toHaveBeenCalledWith(driverId, 'test_access_token', startDate, endDate);
    });

    it('should throw an error if the connection is not active', async () => {
      const driverId = 'driver123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ERROR,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);

      await expect(eldService.getDriverHOSLogs(driverId, startDate, endDate))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if required parameters are missing', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');
      await expect(eldService.getDriverHOSLogs('', startDate, endDate))
        .rejects.toThrow(AppError);
      await expect(eldService.getDriverHOSLogs('driver', null, endDate))
        .rejects.toThrow(AppError);
      await expect(eldService.getDriverHOSLogs('driver', startDate, null))
        .rejects.toThrow(AppError);
    });
  });

  describe('getDriverLocation', () => {
    it('should retrieve driver location', async () => {
      const driverId = 'driver123';
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockLocation: Position = {
        latitude: 34.0522,
        longitude: -118.2437,
        heading: 90,
        speed: 65,
        accuracy: 5,
        source: 'eld' as any,
        timestamp: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);
      (eldService['keeptruckinProvider'].getDriverLocation as jest.Mock).mockResolvedValue(mockLocation);

      const location = await eldService.getDriverLocation(driverId);

      expect(location).toEqual(mockLocation);
      expect(eldService['keeptruckinProvider'].getDriverLocation).toHaveBeenCalledWith(driverId, 'test_access_token');
    });

    it('should throw an error if the connection is not active', async () => {
      const driverId = 'driver123';
      const mockConnection: EldConnection = {
        connection_id: 'conn123',
        driver_id: driverId,
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ERROR,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);

      await expect(eldService.getDriverLocation(driverId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the driver ID is missing', async () => {
      await expect(eldService.getDriverLocation(''))
        .rejects.toThrow(AppError);
    });
  });

  describe('validateConnection', () => {
    it('should validate an ELD connection', async () => {
      const connectionId = 'conn123';
      const mockConnection: EldConnection = {
        connection_id: connectionId,
        driver_id: 'driver123',
        provider_type: EldProviderType.KEEPTRUCKIN,
        provider_account_id: 'kt_account123',
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        token_expires_at: new Date(),
        status: EldConnectionStatus.ACTIVE,
        last_sync_at: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.where.mockResolvedValue([mockConnection]);
      mockDb.first.mockResolvedValue(mockConnection);
      (eldService['keeptruckinProvider'].validateConnection as jest.Mock).mockResolvedValue(true);

      const isValid = await eldService.validateConnection(connectionId);

      expect(isValid).toBe(true);
      expect(eldService['keeptruckinProvider'].validateConnection).toHaveBeenCalledWith('test_access_token');
    });

    it('should throw an error if the connection does not exist', async () => {
      const connectionId = 'conn123';

      mockDb.where.mockResolvedValue([]);
      mockDb.first.mockResolvedValue(null);

      await expect(eldService.validateConnection(connectionId))
        .rejects.toThrow(AppError);
    });

    it('should throw an error if the connection ID is missing', async () => {
      await expect(eldService.validateConnection(''))
        .rejects.toThrow(AppError);
    });
  });
});