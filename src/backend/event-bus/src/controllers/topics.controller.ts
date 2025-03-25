import { Request, Response, NextFunction } from 'express'; // express@4.17.1
import { Topics } from '../config/topics';
import { ConsumerGroups } from '../config/consumer-groups';
import { getTopicConfig } from '../config';
import logger from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/error-handler';

/**
 * Interface for Kafka topic configuration options
 */
interface TopicConfig {
  numPartitions?: number;
  replicationFactor?: number;
  retentionMs?: number;
  cleanupPolicy?: string;
}

/**
 * Interface for detailed topic information
 */
interface TopicDetails {
  name: string;
  partitions: number;
  replicationFactor: number;
  config: Record<string, string>;
  offsets: Record<number, number>;
}

/**
 * Interface for detailed consumer group information
 */
interface ConsumerGroupDetails {
  groupId: string;
  state: string;
  members: any[];
  offsets: Record<string, Record<number, number>>;
  lag: Record<string, Record<number, number>>;
}

/**
 * Lists all Kafka topics in the cluster
 */
export const listTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Listing Kafka topics');
    const kafkaService = req.app.locals.kafkaService;
    
    if (!kafkaService) {
      throw new AppError('Kafka service not available', { 
        code: 'SRV_DEPENDENCY_FAILURE',
        statusCode: 500
      });
    }

    const admin = kafkaService.admin;
    const { topics } = await admin.listTopics();
    
    logger.info(`Successfully listed ${topics.length} Kafka topics`);
    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    logger.error('Failed to list Kafka topics', { error });
    next(error);
  }
};

/**
 * Gets detailed information about a specific Kafka topic
 */
export const getTopicDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topicName } = req.params;
    logger.info(`Getting details for topic ${topicName}`);
    
    const kafkaService = req.app.locals.kafkaService;
    
    if (!kafkaService) {
      throw new AppError('Kafka service not available', { 
        code: 'SRV_DEPENDENCY_FAILURE',
        statusCode: 500
      });
    }

    const admin = kafkaService.admin;
    
    // Get topic metadata
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
    if (!metadata.topics.length || metadata.topics[0].name !== topicName) {
      throw new AppError(`Topic ${topicName} not found`, {
        code: 'RES_ROUTE_NOT_FOUND',
        statusCode: 404
      });
    }
    
    const topicMetadata = metadata.topics[0];
    
    // Get topic configuration
    const configResources = [
      {
        type: 2, // Type 2 is for TOPIC
        name: topicName,
        configNames: [] // Empty array to fetch all configs
      }
    ];
    
    const configResponse = await admin.describeConfigs({ resources: configResources });
    const topicConfig = configResponse.resources[0].configEntries.reduce((acc, config) => {
      acc[config.name] = config.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Get topic offsets
    const topicOffsets = await admin.fetchTopicOffsets(topicName);
    const offsets = topicOffsets.reduce((acc, partition) => {
      acc[partition.partition] = parseInt(partition.high, 10);
      return acc;
    }, {} as Record<number, number>);
    
    // Combine all information
    const topicDetails: TopicDetails = {
      name: topicName,
      partitions: topicMetadata.partitions.length,
      replicationFactor: topicMetadata.partitions[0]?.replicas?.length || 0,
      config: topicConfig,
      offsets
    };
    
    logger.info(`Successfully retrieved details for topic ${topicName}`);
    res.status(200).json({
      success: true,
      data: topicDetails
    });
  } catch (error) {
    logger.error(`Failed to get details for topic ${req.params.topicName}`, { error });
    next(error);
  }
};

/**
 * Creates a new Kafka topic with the specified configuration
 */
export const createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topicName, config } = req.body;
    logger.info(`Creating new topic ${topicName}`, { config });
    
    if (!topicName) {
      throw new AppError('Topic name is required', {
        code: 'VAL_MISSING_FIELD',
        statusCode: 400
      });
    }
    
    const kafkaService = req.app.locals.kafkaService;
    
    if (!kafkaService) {
      throw new AppError('Kafka service not available', { 
        code: 'SRV_DEPENDENCY_FAILURE',
        statusCode: 500
      });
    }
    
    const admin = kafkaService.admin;
    
    // Check if topic already exists
    const { topics } = await admin.listTopics();
    if (topics.includes(topicName)) {
      throw new AppError(`Topic ${topicName} already exists`, {
        code: 'CONF_ALREADY_EXISTS',
        statusCode: 409
      });
    }
    
    // Configure topic with provided config or defaults
    const numPartitions = config?.numPartitions;
    const replicationFactor = config?.replicationFactor;
    
    // Get topic configuration with either provided values or defaults
    const topicConfig = getTopicConfig(
      topicName,
      numPartitions,
      replicationFactor
    );
    
    // Add additional config entries if provided
    if (config?.retentionMs) {
      const retentionEntry = topicConfig.configEntries?.find(entry => entry.name === 'retention.ms');
      if (retentionEntry) {
        retentionEntry.value = config.retentionMs.toString();
      } else if (topicConfig.configEntries) {
        topicConfig.configEntries.push({
          name: 'retention.ms',
          value: config.retentionMs.toString()
        });
      }
    }
    
    if (config?.cleanupPolicy) {
      const cleanupEntry = topicConfig.configEntries?.find(entry => entry.name === 'cleanup.policy');
      if (cleanupEntry) {
        cleanupEntry.value = config.cleanupPolicy;
      } else if (topicConfig.configEntries) {
        topicConfig.configEntries.push({
          name: 'cleanup.policy',
          value: config.cleanupPolicy
        });
      }
    }
    
    // Create the topic
    await admin.createTopics({
      topics: [topicConfig]
    });
    
    logger.info(`Successfully created topic ${topicName}`);
    res.status(201).json({
      success: true,
      message: `Topic ${topicName} created successfully`,
      data: {
        topicName,
        config: topicConfig
      }
    });
  } catch (error) {
    logger.error(`Failed to create topic ${req.body.topicName}`, { error });
    next(error);
  }
};

/**
 * Gets all consumer groups that are consuming from a specific topic
 */
export const getTopicConsumerGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topicName } = req.params;
    logger.info(`Getting consumer groups for topic ${topicName}`);
    
    const kafkaService = req.app.locals.kafkaService;
    
    if (!kafkaService) {
      throw new AppError('Kafka service not available', { 
        code: 'SRV_DEPENDENCY_FAILURE',
        statusCode: 500
      });
    }
    
    const admin = kafkaService.admin;
    
    // Verify topic exists
    const { topics } = await admin.listTopics();
    if (!topics.includes(topicName)) {
      throw new AppError(`Topic ${topicName} not found`, {
        code: 'RES_ROUTE_NOT_FOUND',
        statusCode: 404
      });
    }
    
    // List all consumer groups
    const { groups } = await admin.listGroups();
    
    // For each group, get the list of topics it's consuming from
    const groupsWithTopics = await Promise.all(
      groups.map(async (group) => {
        try {
          const offsets = await admin.fetchOffsets({ groupId: group.groupId, topics: [topicName] });
          // If the group is consuming from this topic, it will have offset data
          if (offsets.length > 0) {
            return {
              groupId: group.groupId,
              protocolType: group.protocolType,
              state: 'active' // We don't get actual state from listGroups, need describeGroups for that
            };
          }
          return null;
        } catch (error) {
          logger.warn(`Error fetching offsets for group ${group.groupId}`, { error });
          return null;
        }
      })
    );
    
    // Filter out nulls (groups not consuming from this topic)
    const topicConsumerGroups = groupsWithTopics.filter(Boolean);
    
    logger.info(`Found ${topicConsumerGroups.length} consumer groups for topic ${topicName}`);
    res.status(200).json({
      success: true,
      count: topicConsumerGroups.length,
      data: topicConsumerGroups
    });
  } catch (error) {
    logger.error(`Failed to get consumer groups for topic ${req.params.topicName}`, { error });
    next(error);
  }
};

/**
 * Gets detailed information about a specific consumer group
 */
export const getConsumerGroupDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    logger.info(`Getting details for consumer group ${groupId}`);
    
    const kafkaService = req.app.locals.kafkaService;
    
    if (!kafkaService) {
      throw new AppError('Kafka service not available', { 
        code: 'SRV_DEPENDENCY_FAILURE',
        statusCode: 500
      });
    }
    
    const admin = kafkaService.admin;
    
    // Get group description
    const groupDescription = await admin.describeGroups([groupId]);
    if (!groupDescription.groups.length || groupDescription.groups[0].groupId !== groupId) {
      throw new AppError(`Consumer group ${groupId} not found`, {
        code: 'RES_ROUTE_NOT_FOUND',
        statusCode: 404
      });
    }
    
    const group = groupDescription.groups[0];
    
    // Get the topics this group is consuming
    const members = group.members || [];
    const topics = new Set<string>();
    
    members.forEach(member => {
      try {
        const assignment = JSON.parse(member.memberAssignment);
        if (assignment && assignment.topics) {
          Object.keys(assignment.topics).forEach(topic => topics.add(topic));
        }
      } catch (error) {
        logger.warn(`Could not parse member assignment for ${member.memberId}`, { error });
      }
    });
    
    // Get the offsets for each topic
    const topicsArray = Array.from(topics);
    const consumerOffsets = await admin.fetchOffsets({ groupId, topics: topicsArray });
    
    // For each topic, get the latest offsets to calculate lag
    const topicOffsets = await Promise.all(
      topicsArray.map(topic => admin.fetchTopicOffsets(topic))
    );
    
    // Organize offsets and lag by topic and partition
    const offsets: Record<string, Record<number, number>> = {};
    const lag: Record<string, Record<number, number>> = {};
    
    // Initialize the structures
    topicsArray.forEach(topic => {
      offsets[topic] = {};
      lag[topic] = {};
    });
    
    // Fill consumer offsets
    consumerOffsets.forEach(topicOffsets => {
      const topic = topicOffsets.topic;
      topicOffsets.partitions.forEach(partition => {
        offsets[topic][partition.partition] = parseInt(partition.offset, 10);
      });
    });
    
    // Calculate lag
    topicOffsets.forEach((partitionOffsets, index) => {
      const topic = topicsArray[index];
      partitionOffsets.forEach(partition => {
        const highOffset = parseInt(partition.high, 10);
        const consumerOffset = offsets[topic][partition.partition] || 0;
        lag[topic][partition.partition] = Math.max(0, highOffset - consumerOffset);
      });
    });
    
    // Build response
    const groupDetails: ConsumerGroupDetails = {
      groupId: group.groupId,
      state: group.state,
      members: members.map(member => ({
        memberId: member.memberId,
        clientId: member.clientId,
        clientHost: member.clientHost
      })),
      offsets,
      lag
    };
    
    logger.info(`Successfully retrieved details for consumer group ${groupId}`);
    res.status(200).json({
      success: true,
      data: groupDetails
    });
  } catch (error) {
    logger.error(`Failed to get details for consumer group ${req.params.groupId}`, { error });
    next(error);
  }
};

/**
 * Gets all system-defined topics from the Topics enum
 */
export const getSystemTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info('Getting system-defined topics');
    
    // Get all topic names from the Topics enum
    const systemTopics = Object.values(Topics);
    
    logger.info(`Retrieved ${systemTopics.length} system-defined topics`);
    res.status(200).json({
      success: true,
      count: systemTopics.length,
      data: systemTopics
    });
  } catch (error) {
    logger.error('Failed to get system-defined topics', { error });
    next(error);
  }
};