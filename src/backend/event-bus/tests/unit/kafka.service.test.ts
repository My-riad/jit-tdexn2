import { KafkaService } from '../../src/services/kafka.service';
import SchemaRegistryService from '../../src/services/schema-registry.service';
import { Event } from '../../../common/interfaces/event.interface';
import { EventTypes, EventCategories } from '../../../common/constants/event-types';
import { Topics } from '../../src/config';
import { ConsumerGroups } from '../../src/config';
import logger from '../../../common/utils/logger';
import { v4 as uuidv4 } from 'uuid'; // uuid@9.0.0
import { Kafka, Producer, Consumer, Admin, EachMessagePayload } from 'kafkajs'; // kafkajs@2.2.4

// Mock the kafkajs module
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdmin = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    listTopics: jest.fn().mockResolvedValue([]),
    createTopics: jest.fn().mockResolvedValue(undefined),
  };

  const Kafka = jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue(mockProducer),
    consumer: jest.fn().mockReturnValue(mockConsumer),
    admin: jest.fn().mockReturnValue(mockAdmin),
  }));

  return {
    Kafka,
    // Exporting the mock objects so that we can spy on them in the tests
    Kafka: Kafka,
    Producer: jest.fn().mockImplementation(() => mockProducer),
    Consumer: jest.fn().mockImplementation(() => mockConsumer),
    Admin: jest.fn().mockImplementation(() => mockAdmin),
  };
});

// Mock the SchemaRegistryService
jest.mock('../../src/services/schema-registry.service', () => {
  return jest.fn().mockImplementation(() => ({
    validateEvent: jest.fn().mockResolvedValue(true),
    getSchema: jest.fn().mockReturnValue({}),
  }));
});

// Mock the logger
jest.mock('../../../common/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Helper function to create a mock event
const createMockEvent = (eventType: EventTypes, category: EventCategories, payload: any): Event => {
  const event: Event = {
    metadata: {
      event_id: uuidv4(),
      event_type: eventType,
      event_version: '1.0',
      event_time: new Date().toISOString(),
      producer: 'test-producer',
      correlation_id: uuidv4(),
      category: category,
    },
    payload: payload || {},
  };
  return event;
};

describe('KafkaService', () => {
  let kafkaService: KafkaService;
  let schemaRegistry: SchemaRegistryService;
  const mockKafka = new Kafka({}) as jest.Mocked<Kafka>; // Explicitly cast to jest.Mocked<Kafka>
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdmin = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    listTopics: jest.fn().mockResolvedValue([]),
    createTopics: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    schemaRegistry = new SchemaRegistryService();
    kafkaService = new KafkaService(schemaRegistry);
  });

  it('should initialize correctly', async () => {
    const ensureTopicsExistSpy = jest.spyOn(kafkaService as any, 'ensureTopicsExist');
    (kafkaService as any).kafka.producer = jest.fn().mockReturnValue(mockProducer);
    (kafkaService as any).kafka.admin = jest.fn().mockReturnValue(mockAdmin);

    await kafkaService.initialize();

    expect(mockKafka.producer).toHaveBeenCalled();
    expect(mockProducer.connect).toHaveBeenCalled();
    expect(mockKafka.admin).toHaveBeenCalled();
    expect(mockAdmin.connect).toHaveBeenCalled();
    expect(ensureTopicsExistSpy).toHaveBeenCalled();
    expect((kafkaService as any).isInitialized).toBe(true);
  });

  it('should ensure topics exist', async () => {
    (kafkaService as any).admin = mockAdmin;
    mockAdmin.listTopics.mockResolvedValue(['existing-topic']);
    mockAdmin.createTopics.mockResolvedValue(undefined);

    await kafkaService.ensureTopicsExist();

    expect(mockAdmin.listTopics).toHaveBeenCalled();
    expect(mockAdmin.createTopics).toHaveBeenCalledWith({
      topics: expect.arrayContaining([
        expect.objectContaining({
          topic: expect.any(String),
        }),
      ]),
    });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully created topics'));
  });

  it('should skip topic creation when auto-creation is disabled', async () => {
    const originalEnv = process.env.TOPIC_AUTO_CREATION_ENABLED;
    process.env.TOPIC_AUTO_CREATION_ENABLED = 'false';
    (kafkaService as any).admin = mockAdmin;

    await kafkaService.ensureTopicsExist();

    expect(mockAdmin.listTopics).not.toHaveBeenCalled();
    expect(mockAdmin.createTopics).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Topic auto-creation is disabled'));
    process.env.TOPIC_AUTO_CREATION_ENABLED = originalEnv;
  });

  it('should produce an event successfully', async () => {
    (kafkaService as any).isInitialized = true;
    (kafkaService as any).producer = mockProducer;
    mockProducer.send.mockResolvedValue(undefined);
    const event = createMockEvent(EventTypes.DRIVER_CREATED, EventCategories.DRIVER, { driverId: '123' });

    await kafkaService.produceEvent(event);

    expect(schemaRegistry.validateEvent).toHaveBeenCalledWith(event);
    expect(mockProducer.send).toHaveBeenCalledWith({
      topic: expect.any(String),
      messages: [
        {
          key: event.metadata.event_id,
          value: JSON.stringify(event),
        },
      ],
    });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Produced event to topic'));
  });

  it('should throw error when producing event if not initialized', async () => {
    (kafkaService as any).isInitialized = false;
    const event = createMockEvent(EventTypes.DRIVER_CREATED, EventCategories.DRIVER, { driverId: '123' });

    await expect(kafkaService.produceEvent(event)).rejects.toThrow('Kafka service is not initialized.');
  });

  it('should consume events successfully', async () => {
    (kafkaService as any).isInitialized = true;
    (kafkaService as any).consumer = mockConsumer;
    mockConsumer.connect.mockResolvedValue(undefined);
    mockConsumer.subscribe.mockResolvedValue(undefined);
    mockConsumer.run.mockResolvedValue(undefined);
    const topics = ['test-topic'];
    const groupId = 'test-group';
    const handlers = {
      [EventTypes.DRIVER_CREATED]: jest.fn(),
    };

    await kafkaService.consumeEvents(topics, groupId, handlers);

    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topics, fromBeginning: false });
    expect(mockConsumer.run).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Consumer started for topics'));
  });

  it('should handle messages correctly', async () => {
    (kafkaService as any).isInitialized = true;
    (kafkaService as any).consumer = mockConsumer;
    const eventHandler = jest.fn().mockResolvedValue(undefined);
    (kafkaService as any).eventHandlers.set(EventTypes.DRIVER_CREATED, eventHandler);
    const event = createMockEvent(EventTypes.DRIVER_CREATED, EventCategories.DRIVER, { driverId: '123' });
    const messagePayload: EachMessagePayload = {
      topic: 'test-topic',
      partition: 0,
      message: {
        offset: '1',
        value: Buffer.from(JSON.stringify(event)),
        key: 'test-key',
        headers: {},
        timestamp: '1234567890',
      },
      heartbeat: jest.fn(),
    };

    await (kafkaService as any).handleMessage(messagePayload);

    expect(schemaRegistry.validateEvent).toHaveBeenCalledWith(event);
    expect(eventHandler).toHaveBeenCalledWith(event);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Successfully processed message'));
  });

  it('should handle message processing errors', async () => {
    (kafkaService as any).isInitialized = true;
    (kafkaService as any).consumer = mockConsumer;
    const eventHandler = jest.fn().mockRejectedValue(new Error('Test error'));
    (kafkaService as any).eventHandlers.set(EventTypes.DRIVER_CREATED, eventHandler);
    const sendToDeadLetterQueueSpy = jest.spyOn(kafkaService as any, 'sendToDeadLetterQueue');
    const event = createMockEvent(EventTypes.DRIVER_CREATED, EventCategories.DRIVER, { driverId: '123' });
    const messagePayload: EachMessagePayload = {
      topic: 'test-topic',
      partition: 0,
      message: {
        offset: '1',
        value: Buffer.from(JSON.stringify(event)),
        key: 'test-key',
        headers: {},
        timestamp: '1234567890',
      },
      heartbeat: jest.fn(),
    };

    await (kafkaService as any).handleMessage(messagePayload);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error processing message'));
    expect(sendToDeadLetterQueueSpy).toHaveBeenCalled();
  });

  it('should create dead letter queue', async () => {
    (kafkaService as any).admin = mockAdmin;
    mockAdmin.listTopics.mockResolvedValue([]);
    mockAdmin.createTopics.mockResolvedValue(undefined);
    const sourceTopic = 'test-topic';

    const dlqTopic = await kafkaService.createDeadLetterQueue(sourceTopic);

    expect(mockAdmin.listTopics).toHaveBeenCalled();
    expect(mockAdmin.createTopics).toHaveBeenCalledWith({
      topics: [expect.objectContaining({ topic: `${sourceTopic}-dlq` })],
    });
    expect(dlqTopic).toBe(`${sourceTopic}-dlq`);
  });

  it('should send failed messages to dead letter queue', async () => {
    (kafkaService as any).producer = mockProducer;
    const createDeadLetterQueueSpy = jest.spyOn(kafkaService as any, 'createDeadLetterQueue').mockResolvedValue('test-topic-dlq');
    mockProducer.send.mockResolvedValue(undefined);
    const sourceTopic = 'test-topic';
    const message = {
      key: 'test-key',
      value: Buffer.from('test-value'),
      offset: '1',
      headers: {},
      timestamp: '1234567890',
    };
    const error = new Error('Test error');

    await (kafkaService as any).sendToDeadLetterQueue(sourceTopic, message, error);

    expect(createDeadLetterQueueSpy).toHaveBeenCalledWith(sourceTopic);
    expect(mockProducer.send).toHaveBeenCalledWith({
      topic: 'test-topic-dlq',
      messages: [
        {
          key: 'test-key',
          value: Buffer.from('test-value'),
          headers: {
            'original-topic': 'test-topic',
            'error-message': 'Test error',
            'error-stack': error.stack,
          },
        },
      ],
    });
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Sent message to dead letter queue'));
  });

  it('should shut down gracefully', async () => {
    (kafkaService as any).isInitialized = true;
    (kafkaService as any).consumer = mockConsumer;
    (kafkaService as any).producer = mockProducer;
    (kafkaService as any).admin = mockAdmin;
    mockConsumer.disconnect.mockResolvedValue(undefined);
    mockProducer.disconnect.mockResolvedValue(undefined);
    mockAdmin.disconnect.mockResolvedValue(undefined);

    await kafkaService.shutdown();

    expect(mockConsumer.disconnect).toHaveBeenCalled();
    expect(mockProducer.disconnect).toHaveBeenCalled();
    expect(mockAdmin.disconnect).toHaveBeenCalled();
    expect((kafkaService as any).isInitialized).toBe(false);
    expect((kafkaService as any).isConnected).toBe(false);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Kafka service shut down successfully.'));
  });
});