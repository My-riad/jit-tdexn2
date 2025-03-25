import Redis from 'ioredis'; // ioredis@5.3.2
import RedisService, { initializeConnection, getConnection, closeConnection } from '../../src/services/redis.service';
import { getRedisConfig } from '../../../common/config/redis.config';
import logger from '../../../common/utils/logger';

// Mock Redis client
jest.mock('ioredis');

// Mock logger
jest.mock('../../../common/utils/logger');

// Mock Redis config
jest.mock('../../../common/config/redis.config');

describe('RedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis constructor
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => {
      const mockRedisClient = {
        status: 'ready',
        get: jest.fn(),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        ttl: jest.fn().mockResolvedValue(100),
        mget: jest.fn(),
        mset: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
        incrby: jest.fn().mockResolvedValue(5),
        decr: jest.fn().mockResolvedValue(0),
        decrby: jest.fn().mockResolvedValue(0),
        hget: jest.fn(),
        hset: jest.fn().mockResolvedValue(1),
        hdel: jest.fn().mockResolvedValue(1),
        hgetall: jest.fn(),
        zadd: jest.fn().mockResolvedValue(1),
        zrange: jest.fn(),
        zrevrange: jest.fn(),
        zrem: jest.fn().mockResolvedValue(1),
        keys: jest.fn(),
        scan: jest.fn(),
        publish: jest.fn().mockResolvedValue(1),
        subscribe: jest.fn().mockResolvedValue(undefined),
        unsubscribe: jest.fn().mockResolvedValue(undefined),
        call: jest.fn(),
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
        disconnect: jest.fn(),
      } as unknown as Redis;
      
      return mockRedisClient;
    });
    
    // Mock logger methods
    (logger.info as jest.Mock).mockImplementation(() => {});
    (logger.error as jest.Mock).mockImplementation(() => {});
    
    // Mock Redis config
    (getRedisConfig as jest.Mock).mockReturnValue({
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0,
      tls: false,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryTimeout: 5000
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should initialize a new instance', () => {
    const service = new RedisService();
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(RedisService);
  });

  test('should connect to Redis', async () => {
    const service = new RedisService();
    
    // Mock getConnection to return a mock Redis client
    (getConnection as jest.Mock).mockResolvedValue({} as Redis);
    
    await service.connect();
    
    expect(getConnection).toHaveBeenCalled();
    expect(service['client']).toBeDefined();
    expect(logger.debug).toHaveBeenCalledWith('RedisService connected to Redis');
  });

  test('should disconnect from Redis', async () => {
    const service = new RedisService();
    service['client'] = {} as Redis;
    
    await service.disconnect();
    
    expect(closeConnection).toHaveBeenCalled();
    expect(service['client']).toBeNull();
    expect(logger.debug).toHaveBeenCalledWith('RedisService disconnected from Redis');
  });

  test('should check if connected', () => {
    const service = new RedisService();
    
    // Not connected
    service['client'] = null;
    expect(service.isConnected()).toBe(false);
    
    // Connected
    service['client'] = { status: 'ready' } as Redis;
    expect(service.isConnected()).toBe(true);
  });

  test('should get client and connect if needed', async () => {
    const service = new RedisService();
    const connectSpy = jest.spyOn(service, 'connect').mockResolvedValue();
    
    // Client is null, should connect
    service['client'] = null;
    await service.getClient();
    expect(connectSpy).toHaveBeenCalled();
    
    // Reset and test when client exists
    connectSpy.mockClear();
    service['client'] = { status: 'ready' } as Redis;
    const client = await service.getClient();
    expect(client).toBe(service['client']);
    expect(connectSpy).not.toHaveBeenCalled();
  });

  test('should get a value from Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      get: jest.fn().mockResolvedValue('testValue')
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.get('testKey');
    
    expect(mockClient.get).toHaveBeenCalledWith('testKey');
    expect(result).toBe('testValue');
  });

  test('should set a value in Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK')
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    // Test set without TTL
    let result = await service.set('testKey', 'testValue');
    expect(mockClient.set).toHaveBeenCalledWith('testKey', 'testValue');
    expect(result).toBe(true);
    
    // Test set with TTL
    result = await service.set('testKey', 'testValue', 60);
    expect(mockClient.setex).toHaveBeenCalledWith('testKey', 60, 'testValue');
    expect(result).toBe(true);
  });

  test('should delete a key from Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      del: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.del('testKey');
    
    expect(mockClient.del).toHaveBeenCalledWith('testKey');
    expect(result).toBe(true);
  });

  test('should check if a key exists in Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      exists: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.exists('testKey');
    
    expect(mockClient.exists).toHaveBeenCalledWith('testKey');
    expect(result).toBe(true);
  });

  test('should set an expiration time on a key', async () => {
    const service = new RedisService();
    const mockClient = {
      expire: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.expire('testKey', 60);
    
    expect(mockClient.expire).toHaveBeenCalledWith('testKey', 60);
    expect(result).toBe(true);
  });

  test('should get the TTL of a key', async () => {
    const service = new RedisService();
    const mockClient = {
      ttl: jest.fn().mockResolvedValue(60)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.ttl('testKey');
    
    expect(mockClient.ttl).toHaveBeenCalledWith('testKey');
    expect(result).toBe(60);
  });

  test('should get multiple values from Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      mget: jest.fn().mockResolvedValue(['value1', 'value2'])
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.mget(['key1', 'key2']);
    
    expect(mockClient.mget).toHaveBeenCalledWith(['key1', 'key2']);
    expect(result).toEqual(['value1', 'value2']);
  });

  test('should set multiple key-value pairs in Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      mset: jest.fn().mockResolvedValue('OK')
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.mset({ key1: 'value1', key2: 'value2' });
    
    expect(mockClient.mset).toHaveBeenCalledWith(['key1', 'value1', 'key2', 'value2']);
    expect(result).toBe(true);
  });

  test('should increment a value in Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      incr: jest.fn().mockResolvedValue(6)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.incr('testKey');
    
    expect(mockClient.incr).toHaveBeenCalledWith('testKey');
    expect(result).toBe(6);
  });

  test('should increment a value by a specific amount', async () => {
    const service = new RedisService();
    const mockClient = {
      incrby: jest.fn().mockResolvedValue(10)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.incrby('testKey', 5);
    
    expect(mockClient.incrby).toHaveBeenCalledWith('testKey', 5);
    expect(result).toBe(10);
  });

  test('should decrement a value in Redis', async () => {
    const service = new RedisService();
    const mockClient = {
      decr: jest.fn().mockResolvedValue(4)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.decr('testKey');
    
    expect(mockClient.decr).toHaveBeenCalledWith('testKey');
    expect(result).toBe(4);
  });

  test('should decrement a value by a specific amount', async () => {
    const service = new RedisService();
    const mockClient = {
      decrby: jest.fn().mockResolvedValue(0)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.decrby('testKey', 5);
    
    expect(mockClient.decrby).toHaveBeenCalledWith('testKey', 5);
    expect(result).toBe(0);
  });

  test('should get a field from a hash', async () => {
    const service = new RedisService();
    const mockClient = {
      hget: jest.fn().mockResolvedValue('fieldValue')
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.hget('testKey', 'testField');
    
    expect(mockClient.hget).toHaveBeenCalledWith('testKey', 'testField');
    expect(result).toBe('fieldValue');
  });

  test('should set a field in a hash', async () => {
    const service = new RedisService();
    const mockClient = {
      hset: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.hset('testKey', 'testField', 'testValue');
    
    expect(mockClient.hset).toHaveBeenCalledWith('testKey', 'testField', 'testValue');
    expect(result).toBe(true);
  });

  test('should delete a field from a hash', async () => {
    const service = new RedisService();
    const mockClient = {
      hdel: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.hdel('testKey', 'testField');
    
    expect(mockClient.hdel).toHaveBeenCalledWith('testKey', 'testField');
    expect(result).toBe(true);
  });

  test('should get all fields from a hash', async () => {
    const service = new RedisService();
    const mockClient = {
      hgetall: jest.fn().mockResolvedValue({ field1: 'value1', field2: 'value2' })
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.hgetall('testKey');
    
    expect(mockClient.hgetall).toHaveBeenCalledWith('testKey');
    expect(result).toEqual({ field1: 'value1', field2: 'value2' });
  });

  test('should add a member to a sorted set', async () => {
    const service = new RedisService();
    const mockClient = {
      zadd: jest.fn().mockResolvedValue(1)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.zadd('testKey', 1.5, 'testMember');
    
    expect(mockClient.zadd).toHaveBeenCalledWith('testKey', 1.5, 'testMember');
    expect(result).toBe(1);
  });

  test('should get a range from a sorted set', async () => {
    const service = new RedisService();
    
    // Test without scores
    const mockClient1 = {
      zrange: jest.fn().mockResolvedValue(['member1', 'member2'])
    } as unknown as Redis;
    
    service['client'] = mockClient1;
    
    let result = await service.zrange('testKey', 0, -1);
    
    expect(mockClient1.zrange).toHaveBeenCalledWith('testKey', 0, -1);
    expect(result).toEqual(['member1', 'member2']);
    
    // Test with scores
    const mockClient2 = {
      zrange: jest.fn().mockResolvedValue(['member1', '1.5', 'member2', '2.5'])
    } as unknown as Redis;
    
    service['client'] = mockClient2;
    
    result = await service.zrange('testKey', 0, -1, true);
    
    expect(mockClient2.zrange).toHaveBeenCalledWith('testKey', 0, -1, 'WITHSCORES');
    expect(result).toEqual([['member1', '1.5'], ['member2', '2.5']]);
  });

  test('should get a reverse range from a sorted set', async () => {
    const service = new RedisService();
    
    // Test without scores
    const mockClient1 = {
      zrevrange: jest.fn().mockResolvedValue(['member2', 'member1'])
    } as unknown as Redis;
    
    service['client'] = mockClient1;
    
    let result = await service.zrevrange('testKey', 0, -1);
    
    expect(mockClient1.zrevrange).toHaveBeenCalledWith('testKey', 0, -1);
    expect(result).toEqual(['member2', 'member1']);
    
    // Test with scores
    const mockClient2 = {
      zrevrange: jest.fn().mockResolvedValue(['member2', '2.5', 'member1', '1.5'])
    } as unknown as Redis;
    
    service['client'] = mockClient2;
    
    result = await service.zrevrange('testKey', 0, -1, true);
    
    expect(mockClient2.zrevrange).toHaveBeenCalledWith('testKey', 0, -1, 'WITHSCORES');
    expect(result).toEqual([['member2', '2.5'], ['member1', '1.5']]);
  });

  test('should remove members from a sorted set', async () => {
    const service = new RedisService();
    const mockClient = {
      zrem: jest.fn().mockResolvedValue(2)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.zrem('testKey', ['member1', 'member2']);
    
    expect(mockClient.zrem).toHaveBeenCalledWith('testKey', 'member1', 'member2');
    expect(result).toBe(2);
  });

  test('should find keys matching a pattern', async () => {
    const service = new RedisService();
    const mockClient = {
      keys: jest.fn().mockResolvedValue(['key1', 'key2'])
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.keys('test*');
    
    expect(mockClient.keys).toHaveBeenCalledWith('test*');
    expect(result).toEqual(['key1', 'key2']);
  });

  test('should scan for keys matching a pattern', async () => {
    const service = new RedisService();
    const mockClient = {
      scan: jest.fn()
        .mockResolvedValueOnce(['1', ['key1', 'key2']])
        .mockResolvedValueOnce(['0', ['key3']])
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.scan('test*', 100);
    
    expect(mockClient.scan).toHaveBeenCalledWith('0', 'MATCH', 'test*', 'COUNT', 100);
    expect(mockClient.scan).toHaveBeenCalledWith('1', 'MATCH', 'test*', 'COUNT', 100);
    expect(result).toEqual(['key1', 'key2', 'key3']);
  });

  test('should flush keys by pattern', async () => {
    const service = new RedisService();
    
    // Mock the scan method to return keys
    jest.spyOn(service, 'scan').mockResolvedValue(['key1', 'key2']);
    
    const mockClient = {
      del: jest.fn().mockResolvedValue(2)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.flushByPattern('test*');
    
    expect(service.scan).toHaveBeenCalledWith('test*');
    expect(mockClient.del).toHaveBeenCalledWith('key1', 'key2');
    expect(result).toBe(2);
  });

  test('should publish a message to a channel', async () => {
    const service = new RedisService();
    const mockClient = {
      publish: jest.fn().mockResolvedValue(2)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.publish('testChannel', 'testMessage');
    
    expect(mockClient.publish).toHaveBeenCalledWith('testChannel', 'testMessage');
    expect(result).toBe(2);
  });

  test('should subscribe to a channel', async () => {
    const service = new RedisService();
    const mockClient = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const callback = jest.fn();
    await service.subscribe('testChannel', callback);
    
    expect(mockClient.subscribe).toHaveBeenCalledWith('testChannel');
    expect(mockClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    
    // Test that the callback is executed when the message event is triggered
    const messageHandler = mockClient.on.mock.calls[0][1];
    messageHandler('testChannel', 'testMessage');
    expect(callback).toHaveBeenCalledWith('testChannel', 'testMessage');
  });

  test('should unsubscribe from a channel', async () => {
    const service = new RedisService();
    const mockClient = {
      unsubscribe: jest.fn().mockResolvedValue(undefined)
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    await service.unsubscribe('testChannel');
    
    expect(mockClient.unsubscribe).toHaveBeenCalledWith('testChannel');
  });

  test('should execute a raw Redis command', async () => {
    const service = new RedisService();
    const mockClient = {
      call: jest.fn().mockResolvedValue('commandResult')
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    const result = await service.executeCommand('PING', 'arg1', 'arg2');
    
    expect(mockClient.call).toHaveBeenCalledWith('PING', 'arg1', 'arg2');
    expect(result).toBe('commandResult');
  });

  test('should handle errors gracefully', async () => {
    const service = new RedisService();
    const mockClient = {
      get: jest.fn().mockRejectedValue(new Error('Redis error')),
      set: jest.fn().mockRejectedValue(new Error('Redis error')),
      del: jest.fn().mockRejectedValue(new Error('Redis error'))
    } as unknown as Redis;
    
    service['client'] = mockClient;
    
    // Test error in get method
    await expect(service.get('testKey')).rejects.toThrow('Redis error');
    expect(logger.error).toHaveBeenCalled();
    
    // Test error in set method
    await expect(service.set('testKey', 'testValue')).rejects.toThrow('Redis error');
    expect(logger.error).toHaveBeenCalled();
    
    // Test error in del method
    await expect(service.del('testKey')).rejects.toThrow('Redis error');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Connection Management Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis constructor
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => {
      return {
        on: jest.fn(),
        status: 'ready',
        quit: jest.fn().mockResolvedValue('OK')
      } as unknown as Redis;
    });
    
    // Mock Redis config
    (getRedisConfig as jest.Mock).mockReturnValue({
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0,
      tls: false,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryTimeout: 5000
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initializeConnection should create a new Redis client', async () => {
    // Mock Redis config
    (getRedisConfig as jest.Mock).mockReturnValue({
      host: 'testhost',
      port: 6379,
      password: 'testpassword',
      db: 0,
      tls: true,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryTimeout: 5000
    });

    const mockRedisClient = {
      on: jest.fn()
    } as unknown as Redis;
    
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedisClient);
    
    const result = await initializeConnection();
    
    expect(Redis).toHaveBeenCalledWith(expect.objectContaining({
      host: 'testhost',
      port: 6379,
      password: 'testpassword',
      db: 0,
      tls: {},
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryStrategy: expect.any(Function)
    }));
    
    expect(result).toBe(mockRedisClient);
    
    // Verify event handlers are registered
    expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockRedisClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
  });

  test('getConnection should return existing client or initialize new one', async () => {
    // Mock initializeConnection
    const mockRedisClient = {} as Redis;
    const initSpy = jest.spyOn(require('../../src/services/redis.service'), 'initializeConnection')
                     .mockResolvedValue(mockRedisClient);
    
    // First call should initialize a new client
    const result1 = await getConnection();
    expect(initSpy).toHaveBeenCalled();
    expect(result1).toBe(mockRedisClient);
    
    // Reset mock to verify it's not called again
    initSpy.mockClear();
    
    // Second call should return the existing client
    const result2 = await getConnection();
    expect(initSpy).not.toHaveBeenCalled();
    expect(result2).toBe(mockRedisClient);
  });

  test('closeConnection should safely close Redis client', async () => {
    // Create a mock client
    const mockRedisClient = {
      quit: jest.fn().mockResolvedValue('OK')
    } as unknown as Redis;
    
    // Set up module to contain a client
    const getConnectionSpy = jest.spyOn(require('../../src/services/redis.service'), 'getConnection')
                              .mockResolvedValue(mockRedisClient);
    
    // Call getConnection to set up the client
    await getConnection();
    
    // Now close the connection
    await closeConnection();
    
    expect(mockRedisClient.quit).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Redis connection closed');
    
    // Verify the redisClient was set to null by checking getConnection again
    getConnectionSpy.mockClear();
    const initSpy = jest.spyOn(require('../../src/services/redis.service'), 'initializeConnection')
                     .mockResolvedValue({} as Redis);
                     
    await getConnection();
    expect(initSpy).toHaveBeenCalled(); // Should initialize a new client since the old one was closed
    
    // Test closeConnection with no client
    (logger.info as jest.Mock).mockClear();
    (logger.debug as jest.Mock).mockClear();
    
    // Reset everything
    jest.resetModules();
    jest.clearAllMocks();
    
    // Import the module again
    const { closeConnection: testCloseConnection } = require('../../src/services/redis.service');
    
    // Test closeConnection with no client
    await testCloseConnection();
    expect(logger.debug).toHaveBeenCalledWith('No Redis connection to close');
  });
});